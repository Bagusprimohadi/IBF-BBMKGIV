// ==========================================
// PLAYBACK.JS - ANIMASI PEMUTARAN WAKTU V1.2
// Selaras dengan H0, H+1, H+2 & Pure GeoJSON Vektor
// ==========================================

let playInterval = null;
let isPlaying = false;
let playbackSpeed = 1500; // Kecepatan perpindahan (1500ms = 1.5 detik per hari agar animasi GeoJSON halus)

/**
 * Mendapatkan total hari prediksi aktif dari CONFIG atau validDates
 */
function getTotalDays() {
    if (typeof currentCategory !== 'undefined' && typeof currentProductKey !== 'undefined') {
        let productConfig = CONFIG?.products?.[currentCategory]?.[currentProductKey];
        if (productConfig && productConfig.days) {
            return productConfig.days;
        }
    }
    return (window.validDates && window.validDates.length > 0) ? window.validDates.length : 3;
}

/**
 * Pindah ke langkah hari berikutnya (looping kembali ke H0 jika sudah di hari terakhir)
 */
function nextStep() {
    let total = getTotalDays();
    if (total > 0) {
        let curr = (typeof currentIndex !== 'undefined') ? currentIndex : 0;
        let nextIndex = (curr + 1) % total;
        loadDay(nextIndex);
    }
}

/**
 * Pindah ke langkah hari sebelumnya
 */
function prevStep() {
    let total = getTotalDays();
    if (total > 0) {
        let curr = (typeof currentIndex !== 'undefined') ? currentIndex : 0;
        let prevIndex = (curr - 1 + total) % total;
        loadDay(prevIndex);
    }
}

/**
 * Toggle tombol Play / Pause
 */
function togglePlay() {
    let total = getTotalDays();
    if (total <= 1) return; // Tidak memutar jika hanya ada 1 hari data
    
    if (isPlaying) {
        stopPlay();
    } else {
        startPlay();
    }
}

/**
 * Menjalankan animasi pemutaran otomatis siklus hari (H0 -> H+1 -> H+2)
 */
function startPlay() {
    if (isPlaying) return;
    isPlaying = true;

    let btn = document.getElementById('playBtn');
    if (btn) {
        btn.innerHTML = '❚❚ Pause';
        btn.classList.add('playing');
    }

    // Interval pemutaran otomatis
    playInterval = setInterval(() => {
        nextStep();
    }, playbackSpeed);
}

/**
 * Menghentikan animasi pemutaran
 */
function stopPlay() {
    isPlaying = false;

    let btn = document.getElementById('playBtn');
    if (btn) {
        btn.innerHTML = '► Play';
        btn.classList.remove('playing');
    }

    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
}
