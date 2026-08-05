// ==========================================
// POPUP.JS - POINT IMPACT REPORT V1.7 (REVERSE COLOR MATCHING FIX)
// ==========================================

/**
 * FUNGSI BANTUAN 1: Mencari data kabupaten dari layer dasar jika hazard tidak punya nama wilayah
 */
function getAdminFeatureByLatLng(latlng) {
    let foundFeature = null;
    if (typeof kabupatenLayerBase !== 'undefined' && kabupatenLayerBase) {
        kabupatenLayerBase.eachLayer(function (layer) {
            if (layer.getBounds && layer.getBounds().contains(latlng)) {
                foundFeature = layer.feature;
            }
        });
    }
    return foundFeature;
}

/**
 * FUNGSI BANTUAN 2: Mencocokkan Data Poligon dengan Konfigurasi Legenda secara Akurat
 */
function resolveHazardInfo(props, productConfig) {
    // Cari kunci dari text (kategori biasanya lebih akurat dari level di BMKG)
    let textKey = String(props.kategori || props.level || props.code || '').toLowerCase().trim();
    let colorKey = String(props.color || props.hex_color || '').toUpperCase().trim();
    
    let label = props.kategori || props.level || props.status || "Waspada";
    let color = props.color || props.hex_color || "#ef4444";
    let isSafe = false;

    if (productConfig && productConfig.legends && Array.isArray(productConfig.legends)) {
        let matched = null;

        // 1. Coba cocokkan berdasarkan Teks Level/Kategori
        matched = productConfig.legends.find(l => 
            String(l.level || l.label || l.code || '').toLowerCase().trim() === textKey
        );
        
        // 2. JIKA TEKS GAGAL/SALAH, COCOKKAN BERDASARKAN WARNA POLIGON (Reverse Match)
        // Ini menjamin pop-up selalu 100% sama dengan warna poligon yang diklik
        if (!matched && colorKey) {
            matched = productConfig.legends.find(l => String(l.color).toUpperCase().trim() === colorKey);
        }
        
        // Jika ketemu di legenda, timpa dengan data resmi dari legenda
        if (matched) {
            label = matched.label || matched.level || label;
            color = matched.color || color;
        }
    }

    // 3. Deteksi otomatis jika ini sebenarnya adalah zona aman (Nyaman / Tidak Ada Potensi)
    let lblLower = String(label).toLowerCase();
    if (lblLower.includes("aman") || lblLower.includes("nyaman") || lblLower.includes("tidak ada") || color.toLowerCase() === '#00ff00') {
        isSafe = true;
        color = "#10b981"; // Kunci ke warna hijau UI
    }

    return { label, color, isSafe };
}

/**
 * ==========================================
 * 1. ENTRY POINT: KLIK POLIGON BAHAYA (HAZARD)
 * ==========================================
 */
function bindFeaturePopup(hazardFeature, hazardLayer, productConfig, clickEvent) {
    if (!clickEvent || !hazardFeature) return;

    let lat = clickEvent.latlng.lat;
    let lon = clickEvent.latlng.lng;
    let props = hazardFeature.properties || {};

    // Dapatkan Nama Wilayah
    let rawWilayah = props.kabupaten || props.WADMKK || props.NAME_2 || props.NAMOBJ || "";
    let rawProvinsi = props.provinsi || props.WADMPR || props.NAME_1 || "";
    let kodeWilayah = props.KODBPS || props.KAB_CODE || props.id || '-';

    if (!rawWilayah) {
        let adminFeat = getAdminFeatureByLatLng(clickEvent.latlng);
        if (adminFeat && adminFeat.properties) {
            rawWilayah = adminFeat.properties.WADMKK || adminFeat.properties.kabupaten || adminFeat.properties.NAME_2 || "Wilayah Terdampak";
            rawProvinsi = adminFeat.properties.WADMPR || adminFeat.properties.provinsi || adminFeat.properties.NAME_1 || "Indonesia";
            kodeWilayah = adminFeat.properties.KODBPS || adminFeat.properties.KAB_CODE || kodeWilayah;
        } else {
            rawWilayah = "Wilayah Terdampak";
        }
    }

    // Resolusi Info Hazard Akurat
    let hazardInfo = resolveHazardInfo(props, productConfig);
    let dateVal = props.date ? ((typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') ? Utils.formatTanggal(props.date) : props.date) : "-";
    let categoryIdVal = props.category_id !== undefined ? props.category_id : (props.code !== undefined ? props.code : "-");

    // Jika poligon ternyata terdeteksi "Aman", lempar ke render aman
    if (hazardInfo.isSafe) {
        renderSafePopup(clickEvent.latlng, rawWilayah, rawProvinsi, productConfig);
        return;
    }

    // Render Danger/Warning Popup
    renderDangerPopup(clickEvent.latlng, rawWilayah, rawProvinsi, kodeWilayah, hazardInfo.label, hazardInfo.label, categoryIdVal, hazardInfo.color, dateVal, productConfig, lat, lon);
}

/**
 * ==========================================
 * 2. ENTRY POINT: KLIK AREA AMAN / LAUTAN KOSONG
 * ==========================================
 */
function generateGlobalPopup(e, adminFeature) {
    if (!e || !e.latlng) return;

    let props = {};
    if (adminFeature && adminFeature.properties) {
        props = adminFeature.properties;
    } else {
        let feat = getAdminFeatureByLatLng(e.latlng);
        if (feat && feat.properties) props = feat.properties;
    }

    let rawWilayah = props.WADMKK || props.kabupaten || props.KABUPATEN || props.NAME_2 || props.NAME || props.NAMOBJ || "Area Tidak Diketahui";
    let rawProvinsi = props.WADMPR || props.provinsi || props.PROVINSI || props.NAME_1 || "Indonesia";
    let productConfig = (typeof CONFIG !== 'undefined' && typeof currentCategory !== 'undefined' && typeof currentProductKey !== 'undefined') ? CONFIG.products[currentCategory]?.[currentProductKey] : null;

    renderSafePopup(e.latlng, rawWilayah, rawProvinsi, productConfig);
}

/**
 * ==========================================
 * RENDERER: TAMPILAN POPUP BAHAYA (MERAH/KUNING/DSB)
 * ==========================================
 */
function renderDangerPopup(latlng, wilayah, provinsi, kodeWilayah, levelVal, kategoriVal, categoryIdVal, hexColor, dateVal, productConfig, lat, lon) {
    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function') ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}` : `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
    let currentDayIdx = (typeof window.currentIndex !== 'undefined') ? window.currentIndex : 0;
    let dayLabelTag = `H${currentDayIdx === 0 ? '0' : '+' + currentDayIdx}`;
    let levelClass = getLevelBadgeClass(levelVal);

    let html = `
        <div class="impact-popup">
            <div class="popup-header" style="border-left: 5px solid ${hexColor};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="popup-title">📍 ${wilayah.toUpperCase()}</div>
                    <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: bold;">${dayLabelTag}</span>
                </div>
                <div class="popup-subtitle">${provinsi}</div>
                <div class="popup-coords">${coordText}</div>
            </div>
            <div class="popup-body">
                <div class="product-info">
                    <span class="info-label">Produk Analisis:</span> 
                    <span class="info-value">${productConfig?.title || productConfig?.name || 'Analisis IBF'}</span>
                </div>
                <div class="table-container">
                    <table class="impact-table">
                        <tbody>
                            <tr><td class="day-label">Validitas</td><td class="date-label">${dateVal}</td></tr>
                            <tr><td class="day-label">Parameter</td><td class="date-label">${kategoriVal}</td></tr>
                            <tr>
                                <td class="day-label">Tingkat Status</td>
                                <td class="status-cell">
                                    <span class="badge ${levelClass}" style="background: ${hexToRgba(hexColor, 0.2)}; color: ${hexColor}; border: 1px solid ${hexColor};">
                                        ${levelVal.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="popup-footer">
                <button class="btn-export" onclick="exportImpactReportPDF('${wilayah}', '${kodeWilayah}', '${levelVal}', ${lat}, ${lon})">📄 Unduh Laporan (PDF)</button>
            </div>
        </div>
    `;

    L.popup({ maxWidth: 380, minWidth: 300, className: 'futuristic-popup' })
        .setLatLng(latlng)
        .setContent(html)
        .openOn(map);
}

/**
 * ==========================================
 * RENDERER: TAMPILAN POPUP AMAN (HIJAU)
 * ==========================================
 */
function renderSafePopup(latlng, wilayah, provinsi, productConfig) {
    let lat = latlng.lat;
    let lon = latlng.lng;
    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function') ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}` : `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
    let currentDayIdx = (typeof window.currentIndex !== 'undefined') ? window.currentIndex : 0;
    let dayLabelTag = `H${currentDayIdx === 0 ? '0' : '+' + currentDayIdx}`;
    let hexColor = "#10b981";

    let html = `
        <div class="impact-popup">
            <div class="popup-header" style="border-left: 5px solid ${hexColor};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="popup-title">📍 ${wilayah.toUpperCase()}</div>
                    <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: bold;">${dayLabelTag}</span>
                </div>
                <div class="popup-subtitle">${provinsi}</div>
                <div class="popup-coords">${coordText}</div>
            </div>
            <div class="popup-body">
                <div class="product-info">
                    <span class="info-label">Produk Analisis:</span> 
                    <span class="info-value">${productConfig?.title || productConfig?.name || 'Analisis IBF'}</span>
                </div>
                <div class="table-container">
                    <table class="impact-table">
                        <tbody>
                            <tr>
                                <td class="day-label">Tingkat Status</td>
                                <td class="status-cell">
                                    <span class="badge badge-safe" style="background: ${hexToRgba(hexColor, 0.2)}; color: #065f46; border: 1px solid ${hexColor}; font-weight: bold;">
                                        ✅ AMAN / NORMAL
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    L.popup({ maxWidth: 380, minWidth: 300, className: 'futuristic-popup' })
        .setLatLng(latlng)
        .setContent(html)
        .openOn(map);
}

// Helpers
function getLevelBadgeClass(levelText) {
    let text = String(levelText).toLowerCase();
    if (text.includes("waspada")) return "badge-waspada";
    if (text.includes("siaga")) return "badge-siaga";
    if (text.includes("awas")) return "badge-awas";
    return "badge-normal";
}

function hexToRgba(hex, alpha) {
    if (!hex || hex === 'transparent') return 'rgba(56, 189, 248, 0.1)';
    let c = hex.replace('#','');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let num = parseInt(c, 16);
    return `rgba(${(num >> 16)&255}, ${(num >> 8)&255}, ${num&255}, ${alpha})`;
}

function exportImpactReportPDF(namaWilayah, kodeWilayah, levelVal, lat, lon) {
    if (typeof triggerPDFExport === 'function') {
        triggerPDFExport(namaWilayah, kodeWilayah, levelVal, lat, lon);
    } else {
        alert(`Mencetak PDF untuk ${namaWilayah} [${levelVal}]...`);
    }
}
