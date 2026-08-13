// ==========================================
// OPACITY.JS - KONTROL TRANSPARANSI SMOOTH V1.2.1
// - Mendukung GeoJSON Vector Layer (Hazard & Risiko)
// - Mendukung PNG Shaded Overlay (Info Cuaca / Laut Harian)
// ==========================================

/**
 * Mengubah tingkat transparansi (opacity) overlay layer aktif (GeoJSON / PNG)
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
        if (typeof activeOverlayLayer.setStyle === 'function') {
            activeOverlayLayer.setStyle({
                fillOpacity: decimalOpacity,
                opacity: Math.min(decimalOpacity + 0.2, 1) // Outline tetap sedikit lebih tegas
            });
        } else if (typeof activeOverlayLayer.setOpacity === 'function') {
            activeOverlayLayer.setOpacity(decimalOpacity);
        }
    }

    // 6. Terapkan transparansi ke PNG Image Overlay (Info Cuaca/Laut Harian) yang sedang aktif
    if (typeof activeImageOverlay !== 'undefined' && activeImageOverlay) {
        if (typeof activeImageOverlay.setOpacity === 'function') {
            activeImageOverlay.setOpacity(decimalOpacity);
        }
    }
}
