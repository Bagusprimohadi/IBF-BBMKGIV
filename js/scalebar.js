// ==========================================
// SCALEBAR.JS - SKALA PETA SPASIAL V1.1
// ==========================================

/**
 * Menginisialisasi komponen skala peta Leaflet
 */
function initScaleBar() {
    if (typeof L === 'undefined' || typeof map === 'undefined') {
        console.warn("Leaflet atau objek map belum siap untuk menginisialisasi ScaleBar.");
        return;
    }

    // Tambahkan kontrol skala Leaflet di sudut kiri bawah peta
    L.control.scale({
        metric: true,      // Menggunakan satuan meter/kilometer (standar Indonesia)
        imperial: false,   // Nonaktifkan satuan mil/imperial
        position: 'bottomleft',
        maxWidth: 150
    }).addTo(map);
}

// Otomatis jalankan inisialisasi skala saat skrip dimuat (pastikan dipanggil setelah map terinisialisasi)
if (typeof map !== 'undefined') {
    initScaleBar();
} else {
    // Fallback event jika dimuat sebelum map siap
    document.addEventListener("DOMContentLoaded", function() {
        if (typeof map !== 'undefined') {
            initScaleBar();
        }
    });
}
