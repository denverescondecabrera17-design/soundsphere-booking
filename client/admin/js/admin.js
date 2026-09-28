/**
 * SoundSphere - Administrator Dashboard Controller (Vanilla JavaScript)
 * Handles role-based access control (RBAC), UI updates, and logout.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------------------------------
    // 1. Role-Based Authorization Guard
    // ------------------------------------------------------------------------
    const token = SoundSphereAPI.getAuthToken();
    const user = SoundSphereAPI.getAuthUser();

    if (!token || !user) {
        showToast('Access denied. Please log in first.', 'warning');
        window.location.href = '../login.html';
        return;
    }

    // Role Enforcement: Only Administrator is authorized to view this page
    if (user.role !== 'Administrator') {
        showToast(`Forbidden. Your role '${user.role}' is not authorized to access the Admin Dashboard.`, 'error');
        
        // Redirect user to their appropriate role dashboard
        if (user.role === 'ServiceProvider') {
            window.location.href = '../provider/dashboard.html';
        } else {
            window.location.href = '../client/dashboard.html';
        }
        return;
    }

    // ------------------------------------------------------------------------
    // 2. Dynamic Profile & Greeting Display
    // ------------------------------------------------------------------------
    const adminDisplayName = document.getElementById('admin-display-name');
    const welcomeAdminName = document.getElementById('welcome-admin-name');
    const currentDateSpan = document.getElementById('current-date');

    const adminName = user.name || user.email || 'System Administrator';
    if (adminDisplayName) adminDisplayName.textContent = adminName;
    if (welcomeAdminName) welcomeAdminName.textContent = adminName;

    // Display Current Date
    if (currentDateSpan) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateSpan.textContent = new Date().toLocaleDateString('en-US', options);
    }

    // ------------------------------------------------------------------------
    // 3. Sidebar Responsive Toggle
    // ------------------------------------------------------------------------
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // ------------------------------------------------------------------------
    // 4. Logout Functionality
    // ------------------------------------------------------------------------
    const btnLogout = document.getElementById('btn-admin-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await SoundSphereAPI.logoutAPI();
            } catch (error) {
                console.warn('Logout API error:', error);
            } finally {
                SoundSphereAPI.clearAuthSession();
                window.location.href = '../login.html';
            }
        });
    }
});
