const axios = require('axios');

const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const url = process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  const res = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  return res.data.access_token;
};

const getTimestamp = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
};

const getPassword = (timestamp) => {
  const raw = `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`;
  return Buffer.from(raw).toString('base64');
};

const formatPhone = (phone) => {
  // Convert 07XX to 2547XX
  const cleaned = phone.replace(/\s+/g, '').replace(/^0/, '254');
  return cleaned;
};

module.exports = { getAccessToken, getTimestamp, getPassword, formatPhone };
