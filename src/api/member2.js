import axios from "./axiosConfig";

const BASE_URL = "http://localhost:8002";

// Outages
export const getOutages = () => axios.get(`${BASE_URL}/outages`);

// Technicians
export const getTechnicians = () => axios.get(`${BASE_URL}/technicians`);

// Assign technician
export const assignTechnician = (data) =>
  axios.post(`${BASE_URL}/assign`, data);
