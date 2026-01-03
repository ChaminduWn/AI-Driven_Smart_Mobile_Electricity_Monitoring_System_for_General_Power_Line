import apiClient from './api';

const MEMBER2_BASE = '/api/member2';

export const member2Service = {


  // Outage Reporting
  reportOutage: (data) => apiClient.post(`${MEMBER2_BASE}/outages/report`, data),
  getOutages: () => apiClient.get(`${MEMBER2_BASE}/outages`),
  updateOutageStatus: (id, status) => apiClient.patch(`${MEMBER2_BASE}/outages/${id}`, { status }),
  
  // Technician Management
  getTechnicians: () => apiClient.get(`${MEMBER2_BASE}/technicians`),
  getNearestTechnician: (location) => apiClient.post(`${MEMBER2_BASE}/technicians/nearest`, location),
  updateTechnicianStatus: (id, status) => apiClient.patch(`${MEMBER2_BASE}/technicians/${id}/status`, { status }),
  
  // Technician Assignment
  assignTechnician: (outageId, technicianId) => 
    apiClient.post(`${MEMBER2_BASE}/outages/${outageId}/assign`, { technicianId }),
  
  // Location Tracking
  updateLocation: (data) => apiClient.post(`${MEMBER2_BASE}/location/update`, data),
  
  // Voice Commands
  processVoiceCommand: (audioData) => apiClient.post(`${MEMBER2_BASE}/voice/process`, audioData),
};