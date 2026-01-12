import axios from 'axios';

// API base URL - uses Vite proxy in dev, direct URL in prod
const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    // Store tokens
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },
  register: async (data: { email: string; password: string; firstName: string; lastName: string; role?: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  refresh: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await api.post('/auth/refresh', { refreshToken });
    // Store new tokens
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
    }
    if (response.data.refreshToken) {
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },
  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    return { message: 'Logged out successfully' };
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};

// Scheduling API
export const schedulingAPI = {
  getAvailableSlots: async (clinicianId: string, date: string) => {
    const response = await api.get(`/scheduling/slots/available`, {
      params: { clinicianId, date },
    });
    return response.data;
  },
  createBooking: async (data: {
    patientId: string;
    clinicianId: string;
    slotId: string;
    startTime: string;
    endTime: string;
    reasonForVisit?: string;
  }) => {
    const response = await api.post('/scheduling/bookings', data);
    return response.data;
  },
  getPatientBookings: async (patientId: string) => {
    const response = await api.get(`/scheduling/bookings/patient/${patientId}`);
    return response.data;
  },
  getBooking: async (bookingId: string) => {
    const response = await api.get(`/scheduling/bookings/${bookingId}`);
    return response.data;
  },
  updateBooking: async (bookingId: string, data: { status?: string; reasonForVisit?: string }) => {
    const response = await api.patch(`/scheduling/bookings/${bookingId}`, data);
    return response.data;
  },
  cancelBooking: async (bookingId: string) => {
    const response = await api.post(`/scheduling/bookings/${bookingId}/cancel`);
    return response.data;
  },
  rescheduleBooking: async (bookingId: string, data: { newSlotId: string }) => {
    const response = await api.post(`/scheduling/bookings/${bookingId}/reschedule`, data);
    return response.data;
  },
  getClinicians: async () => {
    const response = await api.get('/scheduling/clinicians');
    return response.data;
  },
  getClinicianSchedule: async (clinicianId: string, startDate: string, endDate: string) => {
    const response = await api.get(`/scheduling/clinicians/${clinicianId}/schedule`, {
      params: { startDate, endDate },
    });
    return response.data;
  },
  // Slot management (for clinicians)
  createSlot: async (data: { clinicianId: string; startTime: string; endTime: string }) => {
    const response = await api.post('/scheduling/slots', data);
    return response.data;
  },
  getSlot: async (slotId: string) => {
    const response = await api.get(`/scheduling/slots/${slotId}`);
    return response.data;
  },
  updateSlot: async (slotId: string, data: { startTime?: string; endTime?: string; status?: string }) => {
    const response = await api.patch(`/scheduling/slots/${slotId}`, data);
    return response.data;
  },
  deleteSlot: async (slotId: string) => {
    const response = await api.delete(`/scheduling/slots/${slotId}`);
    return response.data;
  },
  blockSlot: async (slotId: string) => {
    const response = await api.post(`/scheduling/slots/${slotId}/block`);
    return response.data;
  },
  // Walk-ins (for staff)
  registerWalkIn: async (data: { patientId: string; clinicianId: string; reasonForVisit?: string }) => {
    const response = await api.post('/scheduling/walk-ins', data);
    return response.data;
  },
  getWalkIns: async (date: string) => {
    const response = await api.get('/scheduling/walk-ins', { params: { date } });
    return response.data;
  },
};

// Clinical API
export const clinicalAPI = {
  // Patient search (for clinicians)
  searchPatients: async (query: string) => {
    const response = await api.get('/clinical/patients', { params: { query } });
    return response.data;
  },
  // Chart management
  getPatientChart: async (patientId: string) => {
    const response = await api.get(`/clinical/patients/${patientId}/chart`);
    return response.data;
  },
  // Get patient encounters (fetches chart first, then encounters)
  getPatientEncounters: async (patientId: string) => {
    const chartResponse = await api.get(`/clinical/patients/${patientId}/chart`);
    const chart = chartResponse.data;
    if (!chart?.id) return [];
    const encountersResponse = await api.get(`/clinical/charts/${chart.id}/encounters`);
    return encountersResponse.data;
  },
  // Get patient prescriptions (fetches chart first, then prescriptions)
  getPatientPrescriptions: async (patientId: string) => {
    const chartResponse = await api.get(`/clinical/patients/${patientId}/chart`);
    const chart = chartResponse.data;
    if (!chart?.id) return [];
    const prescriptionsResponse = await api.get(`/clinical/charts/${chart.id}/prescriptions`);
    return prescriptionsResponse.data;
  },
  createPatientChart: async (patientId: string, data: { bloodType?: string; dob: string }) => {
    const response = await api.post(`/clinical/patients/${patientId}/chart`, data);
    return response.data;
  },
  updatePatientChart: async (patientId: string, data: { bloodType?: string; dob?: string }) => {
    const response = await api.patch(`/clinical/patients/${patientId}/chart`, data);
    return response.data;
  },
  // Allergy management
  getChartAllergies: async (chartId: string) => {
    const response = await api.get(`/clinical/charts/${chartId}/allergies`);
    return response.data;
  },
  addAllergy: async (chartId: string, data: { allergenName: string; severity: string }) => {
    const response = await api.post(`/clinical/charts/${chartId}/allergies`, data);
    return response.data;
  },
  removeAllergy: async (allergyId: string) => {
    const response = await api.delete(`/clinical/allergies/${allergyId}`);
    return response.data;
  },
  // Encounter management
  getChartEncounters: async (chartId: string) => {
    const response = await api.get(`/clinical/charts/${chartId}/encounters`);
    return response.data;
  },
  getEncounter: async (encounterId: string) => {
    const response = await api.get(`/clinical/encounters/${encounterId}`);
    return response.data;
  },
  createEncounter: async (data: { chartId: string; clinicianId?: string }) => {
    const response = await api.post('/clinical/encounters', data);
    return response.data;
  },
  updateEncounter: async (encounterId: string, data: { status: string }) => {
    const response = await api.put(`/clinical/encounters/${encounterId}`, data);
    return response.data;
  },
  // SOAP Notes
  addSoapNotes: async (encounterId: string, data: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    vitals?: Record<string, unknown>;
  }) => {
    const response = await api.post(`/clinical/encounters/${encounterId}/notes`, data);
    return response.data;
  },
  updateSoapNotes: async (encounterId: string, data: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    vitals?: Record<string, unknown>;
  }) => {
    const response = await api.patch(`/clinical/encounters/${encounterId}/notes`, data);
    return response.data;
  },
  // Prescriptions
  getChartPrescriptions: async (chartId: string) => {
    const response = await api.get(`/clinical/charts/${chartId}/prescriptions`);
    return response.data;
  },
  getEncounterPrescriptions: async (encounterId: string) => {
    const response = await api.get(`/clinical/encounters/${encounterId}/prescriptions`);
    return response.data;
  },
  createPrescription: async (encounterId: string, data: {
    medicationName: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
  }) => {
    const response = await api.post(`/clinical/encounters/${encounterId}/prescriptions`, data);
    return response.data;
  },
};

// Lab API
export const labAPI = {
  // Lab Orders
  createOrder: async (data: { encounterId: string; priority?: string }) => {
    const response = await api.post('/lab/orders', data);
    return response.data;
  },
  getOrders: async (filters?: { status?: string; encounterId?: string }) => {
    const response = await api.get('/lab/orders', { params: filters });
    return response.data;
  },
  getOrder: async (orderId: string) => {
    const response = await api.get(`/lab/orders/${orderId}`);
    return response.data;
  },
  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.patch(`/lab/orders/${orderId}/status`, { status });
    return response.data;
  },
  getOrdersByChart: async (chartId: string) => {
    const response = await api.get(`/lab/charts/${chartId}/orders`);
    return response.data;
  },
  // Test Items
  addTestItem: async (orderId: string, data: { testName: string }) => {
    const response = await api.post(`/lab/orders/${orderId}/test-items`, data);
    return response.data;
  },
  getTestItems: async (orderId: string) => {
    const response = await api.get(`/lab/orders/${orderId}/test-items`);
    return response.data;
  },
  removeTestItem: async (testItemId: string) => {
    const response = await api.delete(`/lab/test-items/${testItemId}`);
    return response.data;
  },
  // Lab Results
  uploadResult: async (testItemId: string, data: {
    resultValue: string;
    abnormalityFlag?: string;
    fileUrl?: string;
  }) => {
    const response = await api.post(`/lab/test-items/${testItemId}/results`, data);
    return response.data;
  },
  getResult: async (resultId: string) => {
    const response = await api.get(`/lab/results/${resultId}`);
    return response.data;
  },
  getOrderResults: async (orderId: string) => {
    const response = await api.get(`/lab/orders/${orderId}/results`);
    return response.data;
  },
  getResultsByChart: async (chartId: string) => {
    const response = await api.get(`/lab/charts/${chartId}/results`);
    return response.data;
  },
  getPatientResults: async (patientId: string) => {
    const response = await api.get(`/lab/patients/${patientId}/results`);
    return response.data;
  },
  // Result Verification (for clinicians)
  verifyResult: async (resultId: string) => {
    const response = await api.patch(`/lab/results/${resultId}/verify`, { isVerified: true });
    return response.data;
  },
  getUnverifiedResults: async () => {
    const response = await api.get('/lab/results/unverified');
    return response.data;
  },
  getLabStats: async () => {
    const response = await api.get('/lab/stats');
    return response.data;
  },
};

// Billing API
export const billingAPI = {
  // Invoices
  createInvoice: async (data: { patientId: string; encounterId?: string }) => {
    const response = await api.post('/billing/invoices', data);
    return response.data;
  },
  getInvoices: async (filters?: { status?: string; patientId?: string }) => {
    const response = await api.get('/billing/invoices', { params: filters });
    return response.data;
  },
  getInvoice: async (invoiceId: string) => {
    const response = await api.get(`/billing/invoices/${invoiceId}`);
    return response.data;
  },
  updateInvoice: async (invoiceId: string, data: { status: string }) => {
    const response = await api.patch(`/billing/invoices/${invoiceId}`, data);
    return response.data;
  },
  getPatientInvoices: async (patientId: string) => {
    const response = await api.get(`/billing/patients/${patientId}/invoices`);
    return response.data;
  },
  // Payments (placeholder - backend doesn't have payments endpoint yet)
  getPatientPayments: async (_patientId: string) => {
    // TODO: Implement when backend payments endpoint is ready
    return [];
  },
  // Line Items
  addLineItem: async (invoiceId: string, data: { description: string; cost: number }) => {
    const response = await api.post(`/billing/invoices/${invoiceId}/line-items`, data);
    return response.data;
  },
  removeLineItem: async (lineItemId: string) => {
    const response = await api.delete(`/billing/line-items/${lineItemId}`);
    return response.data;
  },
};

// User API (for profile management)
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  updateProfile: async (data: { firstName?: string; lastName?: string; phoneNumber?: string }) => {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },
};

export default api;
