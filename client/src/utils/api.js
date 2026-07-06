import axios from 'axios';

// Automatically switch URLs based on where the app is running
const API_BASE_URL = import.meta.env.PROD 
    ? "https://mailmind-backend-hjux.onrender.com/api" // Used when deployed on Vercel
    : "http://localhost:3000/api";                     // Used when running locally

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;