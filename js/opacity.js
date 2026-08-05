// ==========================================
// OPACITY.JS - KONTROL TRANSPARANSI SMOOTH V1.2
// ==========================================

/**
 * Mengubah tingkat transparansi (opacity) overlay layer GeoJSON
 * @param {string|number} val - Nilai persentase dari slider (0 hingga 100)
 */
function updateOpacity(val) {
    // 1. Ambil nilai persen bulat (0 - 100)
    let percent = parseInt(val, 10);
    if (isNaN(percent)) percent = 65;

    // 2. Konversi persen ke desimal Leaflet (0.00 - 1.00)
    let decimalOpacity = percent / 100;

    // 3. Update teks indikator persen di UI
    let opacityLabel = document.getElementById('opacityVal');
    if (opacityLabel) {
        opacityLabel.innerText = percent + '%';
    }

    // 4. Simpan ke variabel global jika ada
    if (typeof currentOpacity !== 'undefined') {
        currentOpacity = decimalOpacity;
    }

    // 5. Terapkan transparansi ke layer GeoJSON yang sedang aktif
    if (typeof activeOverlayLayer !== 'undefined' && activeOverlayLayer) {
        // Terapkan ke LayerGroup / GeoJSON Layer
        if (typeof activeOverlayLayer.setStyle === 'function') {
            activeOverlayLayer.setStyle({
                fillOpacity: decimalOpacity,
                opacity: Math.min(decimalOpacity + 0.2, 1) // Outline tetap sedikit lebih tegas
            });
        } 
        // Jika berupa TileLayer / Raster
        else if (typeof activeOverlayLayer.setOpacity === 'function') {
            activeOverlayLayer.setOpacity(decimalOpacity);
        }
    }
}
