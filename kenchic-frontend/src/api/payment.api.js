import api from './axios';

export const initiatePayment = (data) => api.post('/payments/initiate', data);
export const checkPaymentStatus = (checkoutRequestId) => api.get(`/payments/status/${checkoutRequestId}`);
