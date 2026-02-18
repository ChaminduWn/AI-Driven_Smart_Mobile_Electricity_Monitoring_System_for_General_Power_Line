import apiClient from './apiClient';

export const householdAPI = {
  getMemberTypes: () =>
    apiClient.get('/household/member-types'),

  addMember: (data) =>
    apiClient.post('/household/members', data),

  getMembers: (accountNumber) =>
    apiClient.get(`/household/members/${accountNumber}`),

  deleteMember: (memberId) =>
    apiClient.delete(`/household/members/${memberId}`),
};