// Use environment variable if available, otherwise fallback to the Render URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://nambutbe.onrender.com/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  ping: () => fetch(`${API_BASE}/ping`),
  
  getMe: () => fetch(`${API_BASE}/me`, { 
    headers: getAuthHeaders() 
  }).then(res => res.ok ? res.json() : Promise.reject(res)),
  
  login: (username, password) => fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(res => res.json().then(data => res.ok ? data : Promise.reject(data))),
  
  register: (username, password) => fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  }).then(res => res.json().then(data => res.ok ? data : Promise.reject(data))),
  
  getMyCards: () => fetch(`${API_BASE}/cards`, { 
    headers: getAuthHeaders() 
  }).then(res => res.ok ? res.json() : Promise.reject(res)),

  getCard: (id) => fetch(`${API_BASE}/card/${id}`).then(res => res.ok ? res.json() : Promise.reject(res)),
  
  deleteCard: (id) => fetch(`${API_BASE}/card/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(res => res.json().then(data => res.ok ? data : Promise.reject(data))),
  
  saveCard: (id, cardData) => fetch(`${API_BASE}/card/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify(cardData)
  }).then(res => res.json().then(data => res.ok ? data : Promise.reject(data))),
};
