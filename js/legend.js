// ==========================================
// LEGEND.JS - PENGATUR KOTAK LEGENDA DINAMIS & COLLAPSIBLE V1.2
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
