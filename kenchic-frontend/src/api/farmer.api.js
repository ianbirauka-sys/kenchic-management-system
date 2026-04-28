import api from './axios';

export const getChicks = () => api.get('/farmer/chicks');
export const placeChickOrder = (data) => api.post('/farmer/orders', data);
export const getFarmerOrders = () => api.get('/farmer/orders');
export const getResources = () => api.get('/farmer/resources');