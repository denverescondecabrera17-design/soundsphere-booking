/**
 * SoundSphere - Notification Engine Helper
 */
(function() {
    'use strict';
    window.SoundSphereNotifications = {
        fetchNotifications: async function(userId) {
            if (!userId) return [];
            try {
                const res = await fetch(`/api/notifications?userId=${userId}`);
                const data = await res.json();
                return data.success ? data.notifications || [] : [];
            } catch (err) {
                console.warn('Notifications fetch error:', err);
                return [];
            }
        }
    };
})();
