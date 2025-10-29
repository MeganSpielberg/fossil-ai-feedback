// src/config.js
const ENV = import.meta.env.MODE || process.env.NODE_ENV || "development";

const CONFIG = {
  development: {
    API_URL: "http://192.168.178.30:8080", // Local network IP address
  },
  production: {
    API_URL: "https://your-vercel-app.vercel.app", // deployed API
  },
};

export const API_URL = CONFIG[ENV]?.API_URL || CONFIG.development.API_URL;
