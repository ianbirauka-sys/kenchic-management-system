const axios = require('axios');
const db = require('../config/db');
const { getAccessToken, getTimestamp, getPassword, formatPhone } = require('../utils/mpesa.utils');
const { sendSuccess, sendError } = require('../utils/response.utils');

// Initiate STK Push
const initiatePayment = async (req, res) => {
  try {
    const { order_id, phone_number } = req.body;

    if (!order_id || !phone_number) {
      return sendError(res, 'order_id and phone_number are required');
    }

    // Get the order
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [order_id, req.user.id]);
    if (orders.length === 0) {
      return sendError(res, 'Order not found', 404);
    }

    const order = orders[0];

    if (order.payment_status === 'paid') {
      return sendError(res, 'This order has already been paid');
    }

    const amount = Math.ceil(order.total_amount); // M-Pesa requires whole numbers
    const phone = formatPhone(phone_number);
    const timestamp = getTimestamp();
    const password = getPassword(timestamp);

    const accessToken = await getAccessToken();

    const stkUrl = process.env.MPESA_ENVIRONMENT === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const stkBody = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: `Order#${order_id}`,
      TransactionDesc: `Payment for Kenchic Order #${order_id}`,
    };

    const stkRes = await axios.post(stkUrl, stkBody, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { MerchantRequestID, CheckoutRequestID, ResponseCode, ResponseDescription } = stkRes.data;

    if (ResponseCode !== '0') {
      return sendError(res, ResponseDescription || 'Failed to initiate payment');
    }

    // Save payment record
    await db.query(
      `INSERT INTO payments 
        (order_id, user_id, phone_number, amount, merchant_request_id, checkout_request_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [order_id, req.user.id, phone, amount, MerchantRequestID, CheckoutRequestID]
    );

    // Update order payment status to pending
    await db.query('UPDATE orders SET payment_status = ? WHERE id = ?', ['pending', order_id]);

    return sendSuccess(res, {
      checkout_request_id: CheckoutRequestID,
      message: 'STK push sent. Please check your phone and enter your M-Pesa PIN.',
    }, 'Payment initiated successfully');

  } catch (err) {
    console.error('STK Push error:', err.response?.data || err.message);
    return sendError(res, 'Failed to initiate payment. Please try again.', 500);
  }
};

// M-Pesa Callback (called by Safaricom after payment)
const mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;

    // Find the payment record
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE checkout_request_id = ?',
      [CheckoutRequestID]
    );

    if (payments.length === 0) {
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const payment = payments[0];

    if (ResultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata?.Item || [];
      const getMeta = (name) => callbackMetadata.find(i => i.Name === name)?.Value || null;

      const mpesaReceiptNumber = getMeta('MpesaReceiptNumber');
      const transactionDate = getMeta('TransactionDate');

      // Update payment record
      await db.query(
        `UPDATE payments SET 
          status = 'completed', 
          mpesa_receipt_number = ?,
          result_code = ?,
          result_desc = ?,
          completed_at = NOW()
         WHERE checkout_request_id = ?`,
        [mpesaReceiptNumber, String(ResultCode), ResultDesc, CheckoutRequestID]
      );

      // Update order payment status to paid
      await db.query(
        'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
        ['paid', 'confirmed', payment.order_id]
      );

    } else {
      // Payment failed or cancelled
      await db.query(
        `UPDATE payments SET 
          status = 'failed',
          result_code = ?,
          result_desc = ?
         WHERE checkout_request_id = ?`,
        [String(ResultCode), ResultDesc, CheckoutRequestID]
      );

      // Reset order payment status
      await db.query(
        'UPDATE orders SET payment_status = ? WHERE id = ?',
        ['failed', payment.order_id]
      );
    }

    // Always respond with success to Safaricom
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (err) {
    console.error('M-Pesa callback error:', err.message);
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

// Check payment status (polled by frontend)
const checkPaymentStatus = async (req, res) => {
  try {
    const { checkout_request_id } = req.params;

    const [payments] = await db.query(
      'SELECT * FROM payments WHERE checkout_request_id = ?',
      [checkout_request_id]
    );

    if (payments.length === 0) {
      return sendError(res, 'Payment not found', 404);
    }

    const payment = payments[0];
    return sendSuccess(res, {
      status: payment.status,
      mpesa_receipt_number: payment.mpesa_receipt_number,
      amount: payment.amount,
      result_desc: payment.result_desc,
    });

  } catch (err) {
    return sendError(res, 'Failed to check payment status', 500);
  }
};

module.exports = { initiatePayment, mpesaCallback, checkPaymentStatus };
