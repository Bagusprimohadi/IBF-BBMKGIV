// ==========================================
// OPACITY.JS - KONTROL TRANSPARANSI LAYER V1.1
// ==========================================

/**
 * Mengubah tingkat transparansi (opacity) overlay layer GeoJSON yang aktif
 * @param {string|number} val - Nilai opacity dari slider (0.00 hingga 1.00)
 */
function updateOpacity(val) {
    // 1. Konversi nilai input ke float secara presisi
    let numericOpacity = parseFloat(val);

    // Validasi range agar selalu berada di antara 0 dan 1
    if (isNaN(numericOpacity)) numericOpacity = 0.65;
    if (numericOpacity < 0) numericOpacity = 0;
    if (numericOpacity > 1) numericOpacity = 1;

    // 2. Simpan nilai ke variabel global jika ada
    if (typeof currentOpacity !== 'undefined') {
        currentOpacity = numericOpacity;
    }

    // 3. Update teks indikator persentase UI (contoh: 0.65 -> 65%)
    let opacityLabel = document.getElementById('opacityVal');
    if (opacityLabel) {
        opacityLabel.innerText = Math.round(numericOpacity * 100) + '%';
    }

    // 4. Terapkan perubahan style transparansi ke activeOverlayLayer Leaflet
    if (typeof activeOverlayLayer !== 'undefined' && activeOverlayLayer) {
        activeOverlayLayer.setStyle({
            fillOpacity: numericOpacity
        });
    }
}
