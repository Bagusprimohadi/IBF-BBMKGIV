// ==========================================
// LEGEND.JS - PENGATUR KOTAK LEGENDA DINAMIS & COLLAPSIBLE V1.3
// - Support Dynamic Time-Range Tagging (H-1 to H+5 vs H0 to H+6)
// - Seamless Collapsible Integration & Transparent Filtering
// ==========================================

/**
 * Merender daftar legenda berdasarkan konfigurasi produk aktif (GeoJSON)
 * @param {Object} productConfig - Konfigurasi produk dari CONFIG.products
 */
function renderLegend(productConfig) {
    let legendBox = document.getElementById('legendBox') || document.querySelector('.legend-container');
    if (!legendBox) return;

    legendBox.innerHTML = "";

    // Membaca array legends dari CONFIG (dukungan fallback ke productConfig.legend)
    const legendData = productConfig?.legends || productConfig?.legend;

    if (!legendData || !Array.isArray(legendData) || legendData.length === 0) {
        legendBox.innerHTML = "<div style='font-size:11px; color:#94a3b8;'>Legenda tidak tersedia.</div>";
        return;
    }

    // Cek apakah produk aktif termasuk dalam 4 parameter khusus (Banjir & Longsor)
    let prodKey = typeof currentProductKey !== 'undefined' ? currentProductKey : '';
    let isOffsetProduct = ['banjir', 'longsor', 'risiko_banjir', 'risiko_longsor'].includes(prodKey);
    let timeRangeText = isOffsetProduct ? "(H-1 s/d H+5)" : "(H0 s/d H+6)";

    // Buat elemen Header Legenda dengan Indikator Rentang Waktu
    let headerDiv = document.createElement('div');
    headerDiv.className = 'legend-header-info';
    headerDiv.style.cssText = 'font-size: 11px; font-weight: bold; margin-bottom: 8px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center;';
    
    headerDiv.innerHTML = `
        <span>Kategori: ${productConfig.name || 'Produk'}</span>
        <span style="color: #3b82f6; font-size: 10px; background: #eff6ff; padding: 2px 6px; border-radius: 4px;">${timeRangeText}</span>
    `;
    legendBox.appendChild(headerDiv);

    // Susun item legenda berdasarkan array warna dan label
    legendData.forEach(item => {
        // Abaikan warna transparent agar panel legenda tetap bersih
        if (item.color === 'transparent') return;

        let itemDiv = document.createElement('div');
        itemDiv.className = 'legend-item';

        let colorBox = document.createElement('div');
        colorBox.className = 'legend-color';
        colorBox.style.backgroundColor = item.color;

        let labelSpan = document.createElement('span');
        labelSpan.innerText = item.label;

        itemDiv.appendChild(colorBox);
        itemDiv.appendChild(labelSpan);
        legendBox.appendChild(itemDiv);
    });
}

/**
 * Fitur Toggle Sembunyikan / Buka Panel Legenda
 */
function toggleLegend() {
    const legendWrapper = document.getElementById('legendPanelWrapper') || document.querySelector('.legend-wrapper');
    const legendToggleBtn = document.getElementById('legendToggleBtn');

    if (legendWrapper) {
        legendWrapper.classList.toggle('collapsed');
        
        // Ubah teks/ikon indikator tombol jika tombol tersedia
        if (legendToggleBtn) {
            const isCollapsed = legendWrapper.classList.contains('collapsed');
            legendToggleBtn.innerHTML = isCollapsed ? '🎨 Legenda ▶' : '🎨 Legenda ◄';
            legendToggleBtn.setAttribute('title', isCollapsed ? 'Buka Legenda' : 'Sembunyikan Legenda');
        }
    }
}

// Inisialisasi event listener tombol toggle saat DOM dimuat
document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.getElementById('legendToggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleLegend);
    }
});
