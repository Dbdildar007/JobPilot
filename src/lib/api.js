import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ap_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  r => r.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ap_token')
      localStorage.removeItem('ap_user')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || { error: 'Network error' })
  }
)

export const auth = {
  login: (d) => api.post('/auth/login', d),
  register: (d) => api.post('/auth/register', d),
}
export const jobs = {
  list: (p) => api.get('/jobs', { params: p }),
  stats: () => api.get('/jobs/stats'),
  update: (id, d) => api.patch(`/jobs/${id}`, d),
  remove: (id) => api.delete(`/jobs/${id}`),
}
export const profile = {
  get: () => api.get('/profile'),
  update: (d) => api.put('/profile', d),
  setCredentials: (d) => api.put('/profile/credentials', d),
  setSchedule: (d) => api.put('/profile/schedule', d),
}
export const bot = {
  run: (portal) => api.post('/bot/run', { portal }),
  status: () => api.get('/bot/status'),
  sessions: () => api.get('/bot/sessions'),
  sessionLogs: (id) => api.get(`/bot/sessions/${id}/logs`),
}
export default api
