import apiClient from './apiClient';

export const notificationsAPI = {
    getAll: (unreadOnly = false) =>
        apiClient.get('/notifications/', { params: { unread_only: unreadOnly } }),

    markRead: (notificationId) =>
        apiClient.put(`/notifications/${notificationId}/read`),

    markAllRead: () =>
        apiClient.put('/notifications/mark-all-read'),
};
