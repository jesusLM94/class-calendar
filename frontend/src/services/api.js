import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============= COACHES API =============

export const coachesAPI = {
  // Get all coaches
  getAll: () => api.get("/coaches"),

  // Add new coach
  create: (coach) => api.post("/coaches", coach),

  // Update coach
  update: (id, coach) => api.put(`/coaches/${id}`, coach),

  // Delete coach
  delete: (id) => api.delete(`/coaches/${id}`),

  // Get coach restrictions
  getRestrictions: (coachId) => api.get(`/coaches/${coachId}/restrictions`),

  // Add coach restriction
  addRestriction: (coachId, restriction) =>
    api.post(`/coaches/${coachId}/restrictions`, restriction),

  // Remove coach restriction
  removeRestriction: (restrictionId) =>
    api.delete(`/restrictions/${restrictionId}`),
};

// ============= SCHEDULES API =============

export const schedulesAPI = {
  // Get available schedules for a week
  getWeekSchedules: (weekStart) => api.get(`/schedules/${weekStart}`),

  // Set available schedules for a week
  setWeekSchedules: (weekStart, schedules) =>
    api.post(`/schedules/${weekStart}`, { schedules }),

  // Generate schedule for a week
  generateWeekSchedule: (weekStart) => api.post(`/generate/${weekStart}`),

  // Get generated schedule for a week
  getGeneratedSchedule: (weekStart) => api.get(`/generated/${weekStart}`),

  // Update generated schedule (after manual modifications)
  updateGeneratedSchedule: (weekStart, schedule) =>
    api.put(`/generated/${weekStart}`, { schedule }),
};

// ============= UTILITY API =============

export const utilityAPI = {
  // Get current week Monday
  getCurrentWeek: () => api.get("/current-week"),

  // Get schedule history
  getHistory: (weeks = 6) => api.get(`/history?weeks=${weeks}`),

  // Health check
  health: () => api.get("/health"),
};

// ============= HELPER FUNCTIONS =============

export const formatDate = (date) => {
  if (typeof date === "string") {
    date = new Date(date);
  }
  return date.toISOString().split("T")[0];
};

export const getMondayOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

export const getWeekDates = (mondayDate) => {
  const dates = [];
  const monday = new Date(mondayDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }

  return dates;
};

export const getDayName = (dayNumber) => {
  const days = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  return days[dayNumber];
};

export const getShortDayName = (dayNumber) => {
  const days = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
  return days[dayNumber];
};

// Error handling helper
export const handleAPIError = (
  error,
  defaultMessage = "Ha ocurrido un error"
) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

export default api;
