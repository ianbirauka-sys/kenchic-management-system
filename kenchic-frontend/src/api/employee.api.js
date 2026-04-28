import api from './axios';

export const getAllOrders = () => api.get('/employee/orders');
export const updateOrderStatus = (id, status) => api.patch(`/employee/orders/${id}/status`, { status });
export const getStock = () => api.get('/employee/stock');
export const updateStock = (id, quantity) => api.patch(`/employee/stock/${id}`, { quantity });
export const getDeliveries = () => api.get('/employee/deliveries');
export const createDelivery = (data) => api.post('/employee/deliveries', data);
export const getReports = () => api.get('/employee/reports');