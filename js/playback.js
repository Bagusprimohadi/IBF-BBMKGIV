// ==========================================
// PLAYBACK.JS - ANIMASI PEMUTARAN WAKTU V1.1
// ==========================================

let playInterval = null;
let isPlaying = false;
let playbackSpeed = 1000; // Kecepatan perpindahan (1000ms = 1 detik per hari)

/**
 * Pindah ke langkah hari berikutnya (looping kembali ke hari pertama jika sudah habis)
 */
function nextStep() {
    if (window.validDates && window.validDates.length > 0) {
        let nextIndex = ((typeof currentIndex !== 'undefined' ? currentIndex : 0) + 1) % window.validDates.length;
        loadDay(nextIndex);
    }
}

/**
 * Pindah ke langkah hari sebelumnya
 */
function prevStep() {
    if (window.validDates && window.validDates.length > 0) {
        let prevIndex = ((typeof currentIndex !== 'undefined' ? currentIndex : 0) - 1 + window.validDates.length) % window.validDates.length;
        loadDay(prevIndex);
    }
}

/**
 * Toggle tombol Play / Pause
 */
function togglePlay() {
    if (!window.validDates || window.validDates.length === 0) return;
    
    if (isPlaying) {
        stopPlay();
    } else {
        startPlay();
    }
}

/**
 * Menjalankan animasi pemutaran otomatis
 */
function startPlay() {
    isPlaying = true;
    let btn = document.getElementById('playBtn');
    if (btn) {
        btn.innerText = '❚❚ Pause';
        btn.classList.add('playing');
    }

    // Jalankan perulangan otomatis setiap interval waktu tertentu
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
        btn.innerText = '► Play';
        btn.classList.remove('playing');
    }

    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
}
