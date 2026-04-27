import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:3001/api', timeout: 15000 });
export default api;

export const getMovements      = p  => api.get('/movements', { params: p });
export const getMovement       = id => api.get(`/movements/${id}`);
export const createMovement    = d  => api.post('/movements', d);
export const updateMovement    = (id,d) => api.put(`/movements/${id}`, d);
export const patchStatus       = (id,s) => api.patch(`/movements/${id}/status`, { status: s });
export const deleteMovement    = id => api.delete(`/movements/${id}`);

export const getBookings       = p  => api.get('/bookings', { params: p });
export const getBooking        = id => api.get(`/bookings/${id}`);
export const createBooking     = d  => api.post('/bookings', d);
export const updateBooking     = (id,d) => api.put(`/bookings/${id}`, d);
export const deleteBooking     = id => api.delete(`/bookings/${id}`);

export const getDrivers        = () => api.get('/drivers');
export const getDriverList     = () => api.get('/drivers/list');
export const getDriver         = id => api.get(`/drivers/${id}`);
export const createDriver      = d  => api.post('/drivers', d);
export const updateDriver      = (id,d) => api.put(`/drivers/${id}`, d);
export const patchDriverLoc    = (id,l) => api.patch(`/drivers/${id}/location`, { location: l });
export const addDriverTrip     = (id,d) => api.post(`/drivers/${id}/trip`, d);
export const addDriverPayment  = (id,d) => api.post(`/drivers/${id}/payment`, d);

export const getVehicles       = () => api.get('/vehicles');
export const createVehicle     = d  => api.post('/vehicles', d);
export const updateVehicle     = (id,d) => api.put(`/vehicles/${id}`, d);
export const patchVehicleLoc   = (id,l) => api.patch(`/vehicles/${id}/location`, { location: l });

export const getSuppliers      = () => api.get('/suppliers');
export const getSupplierList   = () => api.get('/suppliers/list');
export const getSupplier       = id => api.get(`/suppliers/${id}`);
export const createSupplier    = d  => api.post('/suppliers', d);
export const updateSupplier    = (id,d) => api.put(`/suppliers/${id}`, d);
export const getSupplierDrivers= id => api.get(`/suppliers/${id}/drivers`);
export const addSupplierDriver = (id,d) => api.post(`/suppliers/${id}/drivers`, d);
export const addSupplierTrip   = (id,d) => api.post(`/suppliers/${id}/trip`, d);
export const addSupplierPayment= (id,d) => api.post(`/suppliers/${id}/payment`, d);

export const getDashboard      = () => api.get('/dashboard');
