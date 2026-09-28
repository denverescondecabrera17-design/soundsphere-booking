/**
 * SoundSphere - Client Dashboard Controller (Vanilla JavaScript)
 * Handles Client role-based authorization guard, UI interactions, and logout.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------------------------------
    // 1. Role-Based Authorization Guard (Client Access Only)
    // ------------------------------------------------------------------------
    const token = SoundSphereAPI.getAuthToken();
    const user = SoundSphereAPI.getAuthUser();

    if (!token || !user) {
        showToast('Access denied. Please log in first.', 'warning');
        window.location.href = '../login.html';
        return;
    }

    // Role Enforcement: Ensure authorized user is a Client
    if (user.role !== 'Client') {
        showToast(`Access Redirection. Your role '${user.role}' belongs to another dashboard portal.`, 'info');
        
        if (user.role === 'Administrator') {
            window.location.href = '../admin/dashboard.html';
        } else if (user.role === 'ServiceProvider') {
            window.location.href = '../provider/dashboard.html';
        }
        return;
    }

    // ------------------------------------------------------------------------
    // 2. Dynamic User Profile Display
    // ------------------------------------------------------------------------
    const clientDisplayName = document.getElementById('client-display-name');
    const welcomeClientName = document.getElementById('welcome-client-name');

    const clientName = user.name || user.email || 'Valued Client';
    if (clientDisplayName) clientDisplayName.textContent = clientName;
    if (welcomeClientName) welcomeClientName.textContent = clientName.split(' ')[0];

    // ------------------------------------------------------------------------
    // 3. Responsive Sidebar Toggle
    // ------------------------------------------------------------------------
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // ------------------------------------------------------------------------
    // 4. Quick Action Triggers
    // ------------------------------------------------------------------------
    const cardApplyProvider = document.getElementById('card-apply-provider');
    const menuApplyProvider = document.getElementById('menu-apply-provider');

    const triggerProviderApplication = () => {
        showToast('ℹ Service Provider Application: Submit your business details in Account Settings.', 'info');
    };

    if (cardApplyProvider) cardApplyProvider.addEventListener('click', triggerProviderApplication);
    if (menuApplyProvider) menuApplyProvider.addEventListener('click', triggerProviderApplication);

    // ------------------------------------------------------------------------
    // 5. Logout Functionality
    // ------------------------------------------------------------------------
    const btnLogout = document.getElementById('btn-client-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await SoundSphereAPI.logoutAPI();
            } catch (error) {
                console.warn('Logout API warning:', error);
            } finally {
                SoundSphereAPI.clearAuthSession();
                window.location.href = '../login.html';
            }
        });
    }
});
