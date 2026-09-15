// ============================================================
// KONFIGURASI CLOUDINARY
// ============================================================
const CLOUDINARY_CLOUD_NAME = "xzvyaejr";
const CLOUDINARY_UPLOAD_PRESET = "xzvyaejr";

// URL Endpoint Resmi Cloudinary API (Tanpa API Key/Secret)
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// DOM Elements
const webcam = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const shutterInner = document.getElementById('shutterInner');
const switchBtn = document.getElementById('switchBtn');
const lastCaptured = document.getElementById('lastCaptured');
const statusToast = document.getElementById('statusToast');
const flashScreen = document.getElementById('flashScreen');

// Menu Controls
const flashBtn = document.getElementById('flashBtn');
const timerBtn = document.getElementById('timerBtn');
const timerLabel = document.getElementById('timerLabel');
const gridBtn = document.getElementById('gridBtn');
const gridOverlay = document.getElementById('gridOverlay');
const filterBtn = document.getElementById('filterBtn');
const filterBar = document.getElementById('filterBar');
const timerCountdown = document.getElementById('timerCountdown');

// Gallery Modal
const galleryBtn = document.getElementById('galleryBtn');
const galleryModal = document.getElementById('galleryModal');
const closeGallery = document.getElementById('closeGallery');
const fullImagePreview = document.getElementById('fullImagePreview');
const downloadLocalBtn = document.getElementById('downloadLocalBtn');
const driveUrlBtn = document.getElementById('driveUrlBtn');

// State Variables
let currentFacingMode = 'user';
let stream = null;
let isFlashOn = false;
let timerSeconds = 0; // 0, 3, 10
let activeFilter = 'none';
let currentMode = 'PHOTO';

// 1. Inisialisasi Kamera
async function startCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: currentFacingMode,
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });
        webcam.srcObject = stream;
    } catch (err) {
        alert("Gagal mengakses kamera: " + err.message);
    }
}

// 2. Switch Kamera Front/Back
switchBtn.addEventListener('click', () => {
    currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
    startCamera();
});

// 3. Toggle Flash (Simulasi Flash Layar)
flashBtn.addEventListener('click', () => {
    isFlashOn = !isFlashOn;
    flashBtn.innerHTML = isFlashOn 
        ? '<i class="fa-solid fa-bolt" style="color:#ffcc00"></i>' 
        : '<i class="fa-solid fa-bolt-slash"></i>';
});

// 4. Toggle Timer (Off -> 3s -> 10s)
timerBtn.addEventListener('click', () => {
    if (timerSeconds === 0) {
        timerSeconds = 3;
        timerLabel.innerText = "3s";
    } else if (timerSeconds === 3) {
        timerSeconds = 10;
        timerLabel.innerText = "10s";
    } else {
        timerSeconds = 0;
        timerLabel.innerText = "Off";
    }
});

// 5. Toggle Grid Overlay
gridBtn.addEventListener('click', () => {
    gridOverlay.classList.toggle('hidden');
    gridBtn.style.color = gridOverlay.classList.contains('hidden') ? '#fff' : '#ffcc00';
});

// 6. Toggle Bar Filter
filterBtn.addEventListener('click', () => {
    filterBar.classList.toggle('hidden');
});

function setFilter(filterName) {
    activeFilter = filterName;
    webcam.className = `filter-${filterName}`;
    document.querySelectorAll('.filter-opt').forEach(btn => btn.classList.remove('active'));
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// 7. Mode Selector Logic
function setMode(mode, element) {
    currentMode = mode;
    document.querySelectorAll('.mode-selector span').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    if (mode === 'VIDEO' || mode === 'CINEMATIC') {
        captureBtn.classList.add('recording');
    } else {
        captureBtn.classList.remove('recording');
    }
}

// 8. Capture & Shutter Action
captureBtn.addEventListener('click', () => {
    if (timerSeconds > 0) {
        runTimerAndCapture();
    } else {
        executeCapture();
    }
});

function runTimerAndCapture() {
    let count = timerSeconds;
    timerCountdown.innerText = count;
    timerCountdown.classList.remove('hidden');

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            timerCountdown.innerText = count;
        } else {
            clearInterval(interval);
            timerCountdown.classList.add('hidden');
            executeCapture();
        }
    }, 1000);
}

function executeCapture() {
    // Efek Flash
    if (isFlashOn) {
        flashScreen.classList.remove('hidden');
        setTimeout(() => flashScreen.classList.add('hidden'), 200);
    }

    // Set Canvas Size
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    const ctx = canvas.getContext('2d');

    // Flip jika kamera depan
    if (currentFacingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }

    // Terapkan Filter CSS pada Canvas
    if (activeFilter === 'mono') ctx.filter = 'grayscale(100%)';
    else if (activeFilter === 'sepia') ctx.filter = 'sepia(60%) contrast(110%)';
    else if (activeFilter === 'cool') ctx.filter = 'hue-rotate(30deg) saturate(120%)';
    else if (activeFilter === 'dramatic') ctx.filter = 'contrast(140%) brightness(90%)';

    ctx.drawImage(webcam, 0, 0, canvas.width, canvas.height);

    // Ambil Data Base64 JPG
    const imageDataBase64 = canvas.toDataURL('image/jpeg', 0.9);

    // Update UI Gallery Preview
    lastCaptured.src = imageDataBase64;
    lastCaptured.classList.remove('hidden');
    fullImagePreview.src = imageDataBase64;
    downloadLocalBtn.href = imageDataBase64;

    // Unggah ke Cloudinary
    uploadToCloudinary(imageDataBase64);
}

// 9. Kirim Data Gambar ke Cloudinary API
function uploadToCloudinary(base64Data) {
    showToast("Mengunggah ke Cloudinary...");
    driveUrlBtn.classList.add('disabled');

    const formData = new FormData();
    formData.append('file', base64Data);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'Foto_Aplikasi_Kamera');

    fetch(CLOUDINARY_API_URL, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.secure_url) {
            showToast("Tersimpan di Cloudinary!");
            driveUrlBtn.href = data.secure_url;
            driveUrlBtn.innerHTML = '<i class="fa-solid fa-cloud"></i> Buka Gambar';
            driveUrlBtn.classList.remove('disabled');
        } else {
            showToast("Gagal mengunggah gambar!");
            console.error("Cloudinary Error:", data);
        }
    })
    .catch(err => {
        console.error("Error Upload:", err);
        showToast("Terjadi kesalahan koneksi.");
    });
}

function showToast(msg) {
    statusToast.innerText = msg;
    statusToast.classList.remove('hidden');
    setTimeout(() => statusToast.classList.add('hidden'), 3500);
}

// 10. Modal Preview Controls
galleryBtn.addEventListener('click', () => {
    if (lastCaptured.src) {
        galleryModal.classList.remove('hidden');
    }
});
closeGallery.addEventListener('click', () => {
    galleryModal.classList.add('hidden');
});

// Start Kamera
startCamera();