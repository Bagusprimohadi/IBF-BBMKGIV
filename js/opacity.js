// ==========================================
// OPACITY.JS - PENGATUR TRANSPARANSI LAYER PNG V1.1
// ==========================================

/**
 * Fungsi yang dipanggil secara real-time saat slider digeser
 * @param {number|string} val (Nilai dari 0 sampai 100)
 */
function updateOpacity(val) {
    // Ubah nilai integer (0-100) menjadi desimal (0.0 - 1.0) untuk Leaflet imageOverlay
    currentOpacity = val / 100;

    // Update teks persentase di label HTML
    let valSpan = document.getElementById('opacityVal');
    if (valSpan) {
        valSpan.innerText = val + '%';
    }

    // Terapkan transparansi langsung ke layer gambar PNG yang sedang aktif di peta
    if (typeof imageLayers !== 'undefined' && Array.isArray(imageLayers)) {
        imageLayers.forEach((layer, i) => {
            // Hanya ubah opacity untuk layer hari yang sedang aktif (currentIndex)
            if (i === (typeof currentIndex !== 'undefined' ? currentIndex : 0)) {
                layer.setOpacity(currentOpacity);
            }
        });
    }
}
