// ==========================================
// LEGEND.JS - PENGATUR KOTAK LEGENDA DINAMIS & COLLAPSIBLE V1.2.3
// - Support Dual PNG Overlay Class Intervals (BMKG Standard Palette)
// - Support Categorical Legend (Hazard & Risiko)
// - Support Dynamic Time-Range Tagging (H-1 to H+5 vs H0 to H+6)
// ==========================================

/**
 * Merender daftar legenda berdasarkan konfigurasi produk aktif
 * @param {Object} productConfig - Konfigurasi produk dari CONFIG.products
 */
function renderLegend(productConfig) {
    let legendBox = document.getElementById('legendBox') || document.querySelector('.legend-container');
    if (!legendBox) return;

    legendBox.innerHTML = "";

    if (!productConfig) {
        legendBox.innerHTML = "<div style='font-size:11px; color:#94a3b8;'>Legenda tidak tersedia.</div>";
        return;
    }

    // Cek jenis layer (image_overlay untuk harian, categorical untuk hazard/risiko)
    const isImageOverlay = productConfig.type === 'image_overlay' || productConfig.type === 'continuous';

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

    // --- RENDER LEGENDA INTERVAL BMKG (FITUR 1: DUAL PNG OVERLAY) ---
    if (isImageOverlay) {
        let colorRamp = productConfig.colorRamp || ["#87CEEB", "#FFFF00", "#FFA500", "#FF0000", "#800080"];
        let labels = productConfig.labels || [];
        let levels = productConfig.levels || [];
        let unit = productConfig.unit || '';

        // 1. Tampilkan Bar Gradasi Visual di Atas
        let gradientBar = document.createElement('div');
        gradientBar.style.cssText = `
            width: 100%;
            height: 10px;
            border-radius: 3px;
            background: linear-gradient(to right, ${colorRamp.join(', ')});
            border: 1px solid #cbd5e1;
            margin-bottom: 8px;
        `;
        legendBox.appendChild(gradientBar);

        // 2. Tampilkan Daftar Kotak Warna & Rentang Kelas
        let intervalContainer = document.createElement('div');
        intervalContainer.className = 'legend-interval-list';

        // Jika array labels tersedia di config
        if (labels.length > 0) {
            labels.forEach((labelStr, idx) => {
                let colorHex = colorRamp[idx] || '#cbd5e1';

                let itemDiv = document.createElement('div');
                itemDiv.className = 'legend-item';
                itemDiv.style.cssText = 'display: flex; align-items: center; margin-bottom: 4px; font-size: 11px;';

                let colorBox = document.createElement('div');
                colorBox.className = 'legend-color';
                colorBox.style.cssText = `width: 14px; height: 14px; border-radius: 2px; background-color: ${colorHex}; border: 1px solid rgba(0,0,0,0.15); margin-right: 8px; flex-shrink: 0;`;

                let labelSpan = document.createElement('span');
                labelSpan.style.color = '#334155';
                labelSpan.innerText = labelStr;

                itemDiv.appendChild(colorBox);
                itemDiv.appendChild(labelSpan);
                intervalContainer.appendChild(itemDiv);
            });
        } else if (levels.length > 1) {
            // Fallback otomatis jika labels tidak ditulis eksplisit
            for (let i = 0; i < levels.length - 1; i++) {
                let colorHex = colorRamp[i] || '#cbd5e1';
                let minLvl = levels[i];
                let maxLvl = levels[i + 1];

                let itemDiv = document.createElement('div');
                itemDiv.className = 'legend-item';
                itemDiv.style.cssText = 'display: flex; align-items: center; margin-bottom: 4px; font-size: 11px;';

                let colorBox = document.createElement('div');
                colorBox.className = 'legend-color';
                colorBox.style.cssText = `width: 14px; height: 14px; border-radius: 2px; background-color: ${colorHex}; border: 1px solid rgba(0,0,0,0.15); margin-right: 8px; flex-shrink: 0;`;

                let labelSpan = document.createElement('span');
                labelSpan.style.color = '#334155';
                labelSpan.innerText = `${minLvl} - ${maxLvl} ${unit}`;

                itemDiv.appendChild(colorBox);
                itemDiv.appendChild(labelSpan);
                intervalContainer.appendChild(itemDiv);
            }
        }

        legendBox.appendChild(intervalContainer);
        return;
    }

    // --- RENDER LEGENDA KATEGORIKAL (HAZARD / RISIKO) ---
    const legendData = productConfig?.legends || productConfig?.legend;

    if (!legendData || !Array.isArray(legendData) || legendData.length === 0) {
        legendBox.innerHTML += "<div style='font-size:11px; color:#94a3b8;'>Legenda kategori tidak tersedia.</div>";
        return;
    }

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
