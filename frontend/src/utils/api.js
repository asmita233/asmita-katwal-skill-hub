const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 
  || 'http://localhost:5000';

export default API_BASE_URL;
console.log('API_BASE_URL used:', API_BASE_URL);   // ← add this temporary log