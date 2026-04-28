import api from './axios';

export const getProducts = () => api.get('/customer/products');
export const getProductById = (id) => api.get(`/customer/products/${id}`);
export const placeOrder = (data) => api.post('/customer/orders', data);
export const getMyOrders = () => api.get('/customer/orders');