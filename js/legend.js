// ==========================================
// LEGEND.JS - PENGATUR KOTAK LEGENDA DINAMIS V1.1
// ==========================================

/**
 * Merender daftar legenda berdasarkan konfigurasi produk aktif
 * @param {Object} productConfig (Konfigurasi dari CONFIG.products)
 */
function renderLegend(productConfig) {
    let legendBox = document.getElementById('legendBox');
    if (!legendBox) return;

    legendBox.innerHTML = "";

    if (!productConfig || !productConfig.legend || productConfig.legend.length === 0) {
        legendBox.innerHTML = "<div style='font-size:11px; color:#94a3b8;'>Legenda tidak tersedia.</div>";
        return;
    }

    // Susun item legenda berdasarkan array warna dan label pada config produk
    productConfig.legend.forEach(item => {
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
