const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const jsFiles = [
    path.join(rootDir, 'public', 'provider', 'js', 'provider-dashboard.js'),
    path.join(rootDir, 'public', 'pages', 'provider', 'js', 'provider-dashboard.js'),
    path.join(rootDir, 'client', 'provider', 'js', 'provider-dashboard.js'),
    path.join(rootDir, 'client', 'pages', 'provider', 'js', 'provider-dashboard.js')
];

jsFiles.forEach(f => {
    if (!fs.existsSync(f)) return;
    let js = fs.readFileSync(f, 'utf8');

    // 1. Ensure openUploadPermitModal only opens modal
    js = js.replace(
        /window\.openUploadPermitModal = \(\) => \{[\s\S]*?modal\.classList\.remove\('hidden'\);[\s\S]*?\};/m,
        `window.openUploadPermitModal = () => {
        const modal = document.getElementById('modal-provider-upload-permit');
        if (modal) {
            modal.classList.remove('hidden');
        }
    };`
    );

    // 2. Ensure clear of both inputs and close modal in submitModalPermitUpload
    js = js.replace(
        /if \(issuedDateInput\) issuedDateInput\.value = '';\s*if \(permitNumberInput\) permitNumberInput\.value = '';/g,
        `if (issuedDateInput) issuedDateInput.value = '';
                if (expiryDateInput) expiryDateInput.value = '';`
    );

    // 3. Robust modal dropzone wiring
    const dropzonePattern = /\/\/ Modal Dropzone wiring[\s\S]*?modalDropzone\.addEventListener\('drop'[\s\S]*?\}\);?\s*\}\s*$/m;
    const robustDropzone = `// Modal Dropzone wiring
    const initModalDropzone = () => {
        const modalDropzone = document.getElementById('modal-permit-dropzone');
        if (modalDropzone) {
            modalDropzone.onclick = () => {
                const fileInput = document.getElementById('modal-input-permit-file');
                if (fileInput) fileInput.click();
            };
            modalDropzone.ondragover = (e) => {
                e.preventDefault();
                modalDropzone.style.borderColor = '#2563eb';
                modalDropzone.style.background = '#eff6ff';
            };
            modalDropzone.ondragleave = () => {
                modalDropzone.style.borderColor = '#93c5fd';
                modalDropzone.style.background = '#f8fafc';
            };
            modalDropzone.ondrop = (e) => {
                e.preventDefault();
                modalDropzone.style.borderColor = '#93c5fd';
                modalDropzone.style.background = '#f8fafc';
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                    const fileInput = document.getElementById('modal-input-permit-file');
                    if (fileInput) {
                        fileInput.files = e.dataTransfer.files;
                        window.handleModalPermitFileSelect({ target: fileInput });
                    }
                }
            };
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModalDropzone);
    } else {
        initModalDropzone();
    }`;

    if (dropzonePattern.test(js)) {
        js = js.replace(dropzonePattern, robustDropzone);
    }

    fs.writeFileSync(f, js, 'utf8');
    console.log('Polished JS:', f);
});
