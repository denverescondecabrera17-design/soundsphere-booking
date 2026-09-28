const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Required Target Folders
const targetDirs = [
    path.join(rootDir, 'database'),
    path.join(rootDir, 'database/seeds'),
    path.join(rootDir, 'database/migrations'),
    path.join(rootDir, 'scripts'),
    path.join(rootDir, 'scripts/admin-tools'),
    path.join(rootDir, 'scripts/debug'),
    path.join(rootDir, 'tests'),
    path.join(rootDir, 'tests/integration'),
    path.join(rootDir, 'tests/unit')
];

targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// File Classification Map
const fileMapping = {
    // Category A: Build & Asset Sync Utilities -> /scripts
    'sync_package_photos_feature.js': 'scripts/build-sync.js',
    'sync_marketplace_html.js': 'scripts/sync-marketplace.js',
    'sync_provider_dashboard.js': 'scripts/sync-provider-dashboard.js',
    'sync_provider_detail.js': 'scripts/sync-provider-detail.js',
    'sync_profile_modal.js': 'scripts/sync-profile-modal.js',
    'sync_unified_package_module.js': 'scripts/sync-package-module.js',

    // Category B & C: Database Schema Initialization & Migrations -> /database
    'restore_full_schema.js': 'database/schema-backup.js',
    'check_activity_logs_table.js': 'database/migrations/001_check_activity_logs.js',
    'fix_db_contactnumber.js': 'database/migrations/002_add_contact_number.js',
    'fix_email_verified.js': 'database/migrations/003_add_email_verified.js',
    'check_provider_columns.js': 'database/migrations/004_verify_provider_schema.js',

    // Category D: Integration & Unit Tests -> /tests
    'test_marketplace_all_offers.js': 'tests/integration/marketplace_offers.test.js',
    'test_search_filters_logic.js': 'tests/unit/search_filters.test.js',
    'test_package_photos_lifecycle.js': 'tests/integration/package_photos.test.js',
    'test_complete_profile_persistence.js': 'tests/integration/provider_profile.test.js',
    'test_messaging_flow.js': 'tests/integration/messaging_flow.test.js',
    'test_admin_notifications.js': 'tests/integration/admin_notifications.test.js',
    'test_admin_sidebar_views.js': 'tests/integration/admin_views.test.js',
    'test_complete_storefront.js': 'tests/integration/storefront_view.test.js',
    'test_identity_display_flow.js': 'tests/integration/user_identity.test.js',
    'test_marketplace_provider_photos.js': 'tests/integration/gallery_thumbnails.test.js',
    'test_marketplace_providers_display.js': 'tests/integration/provider_list.test.js',
    'test_provider_buttons_interactive.js': 'tests/integration/provider_buttons.test.js',
    'test_provider_detail_page.js': 'tests/integration/provider_detail.test.js',
    'test_provider_dom_clicks.js': 'tests/integration/dom_clicks.test.js',
    'test_provider_notif_click.js': 'tests/integration/provider_notif.test.js',
    'test_provider_packages_deduplication.js': 'tests/integration/packages_dedup.test.js',
    'test_provider_portal_flow.js': 'tests/integration/provider_portal.test.js',
    'test_provider_profile_photo.js': 'tests/integration/profile_photo.test.js',
    'test_provider_profile_save.js': 'tests/integration/profile_save.test.js',
    'test_real_email_dispatch.js': 'tests/integration/email_dispatch.test.js',
    'test_separated_photo_flow.js': 'tests/integration/separated_photos.test.js',
    'test_storefront_flow.js': 'tests/integration/storefront_nav.test.js',
    'test_token_expiry.js': 'tests/unit/token_expiry.test.js',
    'test_unified_package_module.js': 'tests/unit/package_module.test.js',
    'test_5min_token_flow.js': 'tests/unit/short_token.test.js',
    'test_admin_profile_dropdown.js': 'tests/integration/admin_dropdown.test.js',
    'test_clean_header.js': 'tests/unit/header_component.test.js',
    'test_different_email.js': 'tests/unit/email_collision.test.js',
    'test_email.js': 'tests/unit/smtp_helper.test.js',
    'test_profile_tag.js': 'tests/unit/profile_tag.test.js',
    'test_real_client_email.js': 'tests/integration/client_email.test.js',
    'test_save_provider_profile.js': 'tests/unit/profile_mutation.test.js',
    'test_target_emails.js': 'tests/unit/target_emails.test.js',

    // Category E: Diagnostic & Inspection Utilities -> /scripts/debug
    'inspect_api_providers.js': 'scripts/debug/inspect_api_providers.js',
    'inspect_all_approved_providers.js': 'scripts/debug/inspect_approved_providers.js',
    'inspect_client_identity.js': 'scripts/debug/inspect_client_identity.js',
    'inspect_notifications_table.js': 'scripts/debug/inspect_notifications.js',
    'inspect_provider_packages_services.js': 'scripts/debug/inspect_packages.js',
    'inspect_user13_provider_status.js': 'scripts/debug/inspect_user13.js',
    'check_db_data.js': 'scripts/debug/check_db_data.js',
    'check_db_tables.js': 'scripts/debug/check_db_tables.js',
    'check_db_users.js': 'scripts/debug/check_db_users.js',
    'check_roles_table.js': 'scripts/debug/check_roles.js',
    'count_users.js': 'scripts/debug/count_users.js',
    'audit_provider_dashboard.js': 'scripts/debug/audit_dashboard.js',

    // Category F: Data Seeders -> /database/seeds
    'seed_approved_providers.js': 'database/seeds/seed_approved_providers.js',
    'seed_provider_data.js': 'database/seeds/seed_provider_data.js',
    'create_fresh_provider.js': 'database/seeds/create_provider_helper.js',
    'create_test_approved_provider.js': 'database/seeds/create_approved_helper.js',

    // Category G: Administrative Maintenance Tools -> /scripts/admin-tools
    'delete_all_providers.js': 'scripts/admin-tools/reset_providers.js',
    'purge_all_providers_completely.js': 'scripts/admin-tools/purge_providers.js',
    'purge_all_conversations.js': 'scripts/admin-tools/purge_conversations.js',
    'purge_batangas_dummy_provider.js': 'scripts/admin-tools/purge_dummy_provider.js',
    'purge_demo_data.js': 'scripts/admin-tools/purge_demo_data.js',
    'clean_all_test_provider_data.js': 'scripts/admin-tools/clean_test_providers.js',
    'clean_duplicate_apps.js': 'scripts/admin-tools/clean_duplicate_apps.js',
    'clean_test_emails.js': 'scripts/admin-tools/clean_test_emails.js',
    'cleanup_test_providers.js': 'scripts/admin-tools/cleanup_test_providers.js',
    'deduplicate_db_records.js': 'scripts/admin-tools/deduplicate_records.js',
    'delete_dummy_services.js': 'scripts/admin-tools/delete_dummy_services.js',
    'delete_provider_interface.js': 'scripts/admin-tools/delete_provider_profile.js',
    'reset_user_roles.js': 'scripts/admin-tools/reset_user_roles.js',
    'wipe_messages.js': 'scripts/admin-tools/wipe_messages.js',
    'check_and_remove_dummy_services.js': 'scripts/admin-tools/check_dummy_services.js',
    'fix_admin_pass.js': 'scripts/admin-tools/reset_admin_password.js',
    'fix_client_pass.js': 'scripts/admin-tools/reset_client_password.js',
    'set_user13_password.js': 'scripts/admin-tools/reset_provider_password.js',
    'update_user_password.js': 'scripts/admin-tools/update_password.js'
};

const scratchDir = path.join(rootDir, 'scratch');
let movedCount = 0;

Object.keys(fileMapping).forEach(file => {
    const src = path.join(scratchDir, file);
    const destRel = fileMapping[file];
    const dest = path.join(rootDir, destRel);

    if (fs.existsSync(src)) {
        const destFolder = path.dirname(dest);
        if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });
        
        // Copy file to target location
        fs.copyFileSync(src, dest);
        movedCount++;
        console.log(`Copied ${file} -> ${destRel}`);
    }
});

console.log(`\nReorganization completed! Total files classified and moved: ${movedCount}`);
