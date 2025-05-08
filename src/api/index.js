import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000
});

const buildCRUD = (basePath) => ({
  list: () => api.get(basePath),
  get: (id) => api.get(`${basePath}/${id}`),
  create: (payload) => api.post(basePath, payload),
  update: (id, payload) => api.patch(`${basePath}/${id}`, payload),
  remove: (id) => api.delete(`${basePath}/${id}`)
});

export const customersApi = buildCRUD('/customers');

export const professionalsApi = {
  ...buildCRUD('/professionals'),
  listInsurances: () => api.get('/professionals/insurances/available'),
  getServices: (id) => api.get(`/professionals/${id}/services`)
};

export const servicesApi = buildCRUD('/services');

export const schedulesApi = {
  ...buildCRUD('/schedules'),
  getByProfessional: (id, filters = {}) => api.get(`/schedules/professional/${id}`, { params: filters }),
  updateFuture: (professionalId, scheduleId, payload) =>
    api.patch(`/schedules/professional/${professionalId}/future/${scheduleId}`, payload),
  deleteFuture: (professionalId, scheduleId) => api.delete(`/schedules/professional/${professionalId}/future/${scheduleId}`),
  block: (payload) =>
    api.post('/schedules', {
      ...payload,
      status: 'blocked'
    })
};

export const appointmentsApi = {
  ...buildCRUD('/appointments'),
  create: (payload) => api.post('/appointments', payload),
  updateStatus: (id, payload) => api.patch(`/appointments/${id}/status`, payload),
  checkAvailability: (payload) => api.post('/appointments/check-availability', payload)
};

export default api;
