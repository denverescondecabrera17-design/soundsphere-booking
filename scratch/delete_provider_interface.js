const fs = require('fs');
const path = require('path');

function deleteProviderInterfaceFiles() {
    console.log('=== DELETING ALL SERVICE PROVIDER INTERFACE FILES & DIRECTORIES ===\n');

    const projectRoot = path.join(__dirname, '..');

    const filesToDelete = [
        path.join(projectRoot, 'client', 'provider-detail.html'),
        path.join(projectRoot, 'public', 'provider-detail.html'),
        path.join(projectRoot, 'client', 'css', 'provider-detail.css'),
        path.join(projectRoot, 'public', 'css', 'provider-detail.css'),
        path.join(projectRoot, 'client', 'js', 'provider-detail.js'),
        path.join(projectRoot, 'public', 'js', 'provider-detail.js')
    ];

    const dirsToDelete = [
        path.join(projectRoot, 'client', 'provider'),
        path.join(projectRoot, 'public', 'provider')
    ];

    // Delete single files
    filesToDelete.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`✓ Deleted file: ${filePath}`);
            } catch (e) {
                console.error(`❌ Error deleting file ${filePath}:`, e.message);
            }
        } else {
            console.log(`ℹ File not present: ${filePath}`);
        }
    });

    // Delete directories recursively
    dirsToDelete.forEach(dirPath => {
        if (fs.existsSync(dirPath)) {
            try {
                fs.rmSync(dirPath, { recursive: true, force: true });
                console.log(`✓ Deleted directory: ${dirPath}`);
            } catch (e) {
                console.error(`❌ Error deleting directory ${dirPath}:`, e.message);
            }
        } else {
            console.log(`ℹ Directory not present: ${dirPath}`);
        }
    });

    console.log('\n=== PROVIDER INTERFACE FILES REMOVED SUCCESSFULLY ===');
}

deleteProviderInterfaceFiles();
