/// <reference types="vite/client" />
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000'
});

export default api;