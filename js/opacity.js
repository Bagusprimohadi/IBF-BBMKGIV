// ==========================================
// OPACITY.JS - PENGATUR TRANSPARANSI LAYER GEOJSON V1.2
// ==========================================

/**
 * Fungsi yang dipanggil secara real-time saat slider opacity digeser
 * @param {number|string} val (Nilai dari 0 sampai 100)
 */
function updateOpacity(val) {
    // Ubah nilai integer (0-100) menjadi desimal (0.0 - 1.0) untuk fillOpacity Leaflet GeoJSON
    let numericVal = parseFloat(val);
    currentOpacity = numericVal / 100;

    // Update teks persentase di label HTML
    let valSpan = document.getElementById('opacityVal');
    if (valSpan) {
        valSpan.innerText = Math.round(numericVal) + '%';
    }

    // Terapkan transparansi langsung ke layer vektor GeoJSON yang sedang aktif di peta
    if (typeof activeOverlayLayer !== 'undefined' && activeOverlayLayer) {
        activeOverlayLayer.setStyle({
            fillOpacity: currentOpacity
        });
    }
}

// Event listener saat DOM selesai dimuat
document.addEventListener('DOMContentLoaded', function () {
    const slider = document.getElementById('opacitySlider');
    if (slider) {
        updateOpacity(slider.value);
    }
});
