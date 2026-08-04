// ==========================================
// PLAYBACK.JS - ANIMASI & KONTROL NAVIGASI HARI V1.4
// Penanganan Otomatis Urutan Hari Tanpa Celah (H0 s/d H+n)
// ==========================================

let playInterval = null;
let isPlaying = false;
let playbackSpeed = 1500; // Kecepatan perpindahan (1500ms per frame)

/**
 * Mendapatkan total hari prediksi aktif dari CONFIG produk atau window.validDates
 */
function getTotalDays() {
    if (typeof currentCategory !== 'undefined' && typeof currentProductKey !== 'undefined') {
        let productConfig = CONFIG?.products?.[currentCategory]?.[currentProductKey];
        if (productConfig && productConfig.days) {
            return productConfig.days;
        }
    }
    return (window.validDates && window.validDates.length > 0) ? window.validDates.length : 7;
}

/**
 * Merender ulang tombol-tombol navigasi hari secara lengkap dan berurutan
 * Memastikan tidak ada tombol yang bolong (misal: H0, H+1, H+2, dst.)
 */
function renderDayButtons() {
    const container = document.getElementById('dayButtonsContainer');
    if (!container) return;

    container.innerHTML = '';
    let total = getTotalDays();
    window.validDates = [];

    let today = new Date();

    for (let i = 0; i < total; i++) {
        let btn = document.createElement('button');
        let label = `H${i === 0 ? '0' : '+' + i}`;

        // Hitung tanggal riil untuk sinkronisasi metadata tampilan
        let validDate = new Date(today);
        validDate.setDate(today.getDate() + i);
        let dateISO = validDate.toISOString().split('T')[0];
        window.validDates.push(dateISO);

        btn.className = 'time-btn' + (i === (window.currentIndex || 0) ? ' active' : '');
        btn.id = 'day-btn-' + i;
        btn.innerText = label;
        btn.title = `Valid: ${dateISO}`;

        btn.onclick = function () {
            if (typeof stopPlay === 'function') stopPlay();
            if (typeof loadDay === 'function') loadDay(i);
        };

        container.appendChild(btn);
    }
}

/**
 * Pindah ke langkah hari berikutnya (looping kembali ke H0 setelah hari terakhir)
 */
function nextStep() {
    let total = getTotalDays();
    if (total > 0) {
        let curr = (typeof currentIndex !== 'undefined') ? currentIndex : 0;
        let nextIndex = (curr + 1) % total;
        if (typeof loadDay === 'function') loadDay(nextIndex);
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
        if (typeof loadDay === 'function') loadDay(prevIndex);
    }
}

/**
 * Toggle tombol Play / Pause
 */
function togglePlay() {
    let total = getTotalDays();
    if (total <= 1) return; // Tidak diputar jika hanya ada 1 hari data
    
    if (isPlaying) {
        stopPlay();
    } else {
        startPlay();
    }
}

/**
 * Menjalankan animasi pemutaran otomatis siklus hari (H0 -> H+1 -> H+2 ...)
 */
function startPlay() {
    if (isPlaying) return;
    isPlaying = true;

    let btn = document.getElementById('playBtn');
    if (btn) {
        btn.innerHTML = '❚❚ Pause';
        btn.classList.add('playing');
    }

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
