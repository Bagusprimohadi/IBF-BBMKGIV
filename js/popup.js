// ==========================================
// POPUP.JS - POINT IMPACT REPORT V1.2.3
// - Membatasi Popup Khusus untuk Layer Vektor GeoJSON (Hazard & Risiko)
// - Mem-bypass Popup pada Layer Dual PNG Overlay (Info Harian)
// - Menyediakan Ekspor PDF Eksklusif Peringatan Dini Bencana
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
 * FUNGSI BANTUAN 2: Mendapatkan Nama Parameter Utama yang Konsisten Berdasarkan Produk Aktif
 */
function getCoreParameterName(productConfig) {
    let key = (typeof currentProductKey !== 'undefined') ? currentProductKey : '';
    if (key === 'suhu' || key.includes('suhu') || key.includes('heat')) return "Udara Panas";
    if (key === 'banjir' || key.includes('banjir')) return "Banjir";
    if (key === 'longsor' || key.includes('longsor')) return "Longsor";
    if (key === 'angin' || key.includes('angin')) return "Angin Kencang";
    
    if (productConfig) {
        let name = productConfig.name || productConfig.title || "";
        if (name.toLowerCase().includes('udara panas')) return "Udara Panas";
        if (name.toLowerCase().includes('banjir')) return "Banjir";
        if (name.toLowerCase().includes('longsor')) return "Longsor";
        if (name.toLowerCase().includes('angin')) return "Angin Kencang";
        return name;
    }
    return "Analisis Dampak Bencana";
}

/**
 * FUNGSI BANTUAN 3: Mencocokkan Data Poligon dengan Konfigurasi Legenda secara Akurat (Hazard/Risiko)
 */
function resolveHazardInfo(props, productConfig) {
    if (productConfig && (productConfig.type === 'image_overlay' || productConfig.type === 'continuous')) {
        return { isContinuous: true, isSafe: true };
    }

    let textKey = String(props.kategori || props.level || props.code || '').toLowerCase().trim();
    let colorKey = String(props.color || props.hex_color || '').toUpperCase().trim();
    
    let label = props.level || props.status || "Waspada";
    let color = props.color || props.hex_color || "#ef4444";
    let isSafe = false;

    if (productConfig && productConfig.legends && Array.isArray(productConfig.legends)) {
        let matched = null;
        matched = productConfig.legends.find(l => String(l.level || l.label || l.code || '').toLowerCase().trim() === textKey);
        
        if (!matched && colorKey) {
            matched = productConfig.legends.find(l => String(l.color).toUpperCase().trim() === colorKey);
        }
        
        if (matched) {
            label = matched.label || matched.level || label;
            color = matched.color || color;
        }
    }

    let lblLower = String(label).toLowerCase();
    if (lblLower.includes("aman") || lblLower.includes("nyaman") || lblLower.includes("tidak ada") || color.toLowerCase() === '#00ff00') {
        isSafe = true;
        color = "#10b981";
        label = "AMAN / NORMAL";
    }

    return { label, color, isSafe, isContinuous: false };
}

/**
 * ==========================================
 * 1. ENTRY POINT KLIK POPUP UNTUK LAYER VEKTOR (HAZARD / RISIKO)
 * ==========================================
 */
function showCustomPopup(clickEvent, feature, layer, productConfig, category, productKey, dayIndex) {
    if (!clickEvent || !feature) return;

    // KUNCI PENGAMAN: Jangan tampilkan popup jika produk bertipe PNG Overlay / Harian
    if (productConfig && (productConfig.type === 'image_overlay' || productConfig.type === 'continuous')) {
        return;
    }

    let lat = clickEvent.latlng.lat;
    let lon = clickEvent.latlng.lng;
    let props = feature.properties || {};

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

    let hazardInfo = resolveHazardInfo(props, productConfig);
    let dateVal = props.date ? ((typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') ? Utils.formatTanggal(props.date) : props.date) : "-";
    
    if (dateVal === "-" || !dateVal) {
        let targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayIndex);
        dateVal = typeof Utils !== 'undefined' ? Utils.formatTanggal(targetDate.toISOString().split('T')[0]) : targetDate.toISOString().split('T')[0];
    }

    let parameterName = getCoreParameterName(productConfig);

    // Render Popup untuk Hazard/Risiko
    renderUniversalPopup(clickEvent.latlng, rawWilayah, rawProvinsi, kodeWilayah, hazardInfo.label, parameterName, hazardInfo.color, dateVal, productConfig, lat, lon, hazardInfo.isSafe);
}

/**
 * ==========================================
 * 2. KOMPATIBILITAS (UNTUK HOVER.JS / OVERLAY.JS)
 * ==========================================
 */
function bindFeaturePopup(hazardFeature, hazardLayer, productConfig, clickEvent) {
    if (!clickEvent || !hazardFeature) return;
    showCustomPopup(clickEvent, hazardFeature, hazardLayer, productConfig, currentCategory, currentProductKey, currentDayIndex);
}

function generateGlobalPopup(e, adminFeature) {
    if (!e || !e.latlng) return;

    let productConfig = (typeof CONFIG !== 'undefined' && currentCategory && currentProductKey) ? CONFIG.products[currentCategory]?.[currentProductKey] : null;

    // KUNCI PENGAMAN: Jika layer berupa PNG Overlay (Harian), Batal Tampilkan Popup
    if (productConfig && (productConfig.type === 'image_overlay' || productConfig.type === 'continuous' || currentCategory === 'harian')) {
        return; 
    }

    let props = adminFeature && adminFeature.properties ? adminFeature.properties : {};
    if (Object.keys(props).length === 0) {
        let feat = getAdminFeatureByLatLng(e.latlng);
        if (feat && feat.properties) props = feat.properties;
    }

    let rawWilayah = props.WADMKK || props.kabupaten || props.NAME_2 || props.NAMOBJ || "Area Tidak Diketahui";
    let rawProvinsi = props.WADMPR || props.provinsi || props.NAME_1 || "Indonesia";
    let kodeWilayah = props.KODBPS || props.KAB_CODE || props.id || '-';

    let lat = e.latlng.lat;
    let lon = e.latlng.lng;
    let dateVal = "-";
    let parameterName = getCoreParameterName(productConfig);

    renderUniversalPopup(e.latlng, rawWilayah, rawProvinsi, kodeWilayah, "AMAN / NORMAL", parameterName, "#10b981", dateVal, productConfig, lat, lon, true);
}

/**
 * ==========================================
 * 3. RENDERER UTAMA (TABEL UNIFIED PERINGATAN DINI)
 * ==========================================
 */
function renderUniversalPopup(latlng, wilayah, provinsi, kodeWilayah, levelVal, parameterName, hexColor, dateVal, productConfig, lat, lon, isSafe) {
    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function') ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}` : `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
    let currentDayIdx = (typeof currentDayIndex !== 'undefined') ? currentDayIndex : 0;
    let dayLabelTag = `H${currentDayIdx === 0 ? '0' : '+' + currentDayIdx}`;
    
    let levelClass = isSafe ? 'badge-safe' : getLevelBadgeClass(levelVal);
    let headerTitle = isSafe ? '📍 INFORMASI WILAYAH' : '📍 PERINGATAN DINI';
    
    let statusBadgeHTML = `<span class="badge ${levelClass}" style="background: ${hexToRgba(hexColor, 0.2)}; color: ${hexColor}; border: 1px solid ${hexColor}; font-weight: bold; display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${levelVal.toUpperCase()}</span>`;

    let html = `
        <div class="impact-popup" style="width:100%;">
            <div class="popup-header" style="border-left: 5px solid ${hexColor};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="popup-title">${headerTitle}</div>
                    <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: bold;">${dayLabelTag}</span>
                </div>
                <div class="popup-subtitle" style="font-size: 11px; color: #64748b; margin-top: 2px;">${productConfig?.title || productConfig?.name || 'Analisis IBF'}</div>
            </div>
            
            <div class="popup-body" style="padding-top: 6px;">
                <div class="table-container">
                    <table class="impact-table" style="width: 100%; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; width: 38%; font-weight: bold; color: #475569;">Kab/Kota</td>
                                <td class="date-label" style="padding: 4px 2px; color: #0f172a;"><b>${wilayah}</b></td>
                            </tr>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; font-weight: bold; color: #475569;">Provinsi</td>
                                <td class="date-label" style="padding: 4px 2px; color: #0f172a;">${provinsi}</td>
                            </tr>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; font-weight: bold; color: #475569;">Koordinat</td>
                                <td class="date-label" style="padding: 4px 2px; color: #0f172a; font-family: monospace; font-size: 11px;">${coordText}</td>
                            </tr>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; font-weight: bold; color: #475569;">Validitas Prediksi</td>
                                <td class="date-label" style="padding: 4px 2px; color: #0f172a;">${dateVal}</td>
                            </tr>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; font-weight: bold; color: #475569;">Parameter</td>
                                <td class="date-label" style="padding: 4px 2px; color: #0f172a;">${parameterName}</td>
                            </tr>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; font-weight: bold; color: #475569;">Tingkat Status</td>
                                <td class="status-cell" style="padding: 4px 2px;">
                                    ${statusBadgeHTML}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="popup-footer" style="margin-top: 8px;">
                <button class="btn-export" onclick="exportImpactReportPDF('${wilayah}', '${kodeWilayah}', '${levelVal}', ${lat}, ${lon})" style="width: 100%; cursor: pointer;">
                    📄 Unduh Laporan (PDF)
                </button>
            </div>
        </div>
    `;

    if (window.map) {
        L.popup({ maxWidth: 380, minWidth: 300, className: 'futuristic-popup' })
            .setLatLng(latlng)
            .setContent(html)
            .openOn(window.map);
    }
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
    if (String(hex).startsWith('rgb')) return String(hex).replace(')', `, ${alpha})`).replace('rgb(', 'rgba(');
    
    let c = String(hex).replace('#','');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let num = parseInt(c, 16);
    return `rgba(${(num >> 16)&255}, ${(num >> 8)&255}, ${num&255}, ${alpha})`;
}

function exportImpactReportPDF(namaWilayah, kodeWilayah, levelVal, lat, lon) {
    if (typeof triggerPDFExport === 'function') {
        triggerPDFExport(namaWilayah, kodeWilayah, levelVal, lat, lon);
    } else {
        alert(`Mencetak Laporan PDF untuk ${namaWilayah} [Status: ${levelVal}] pada Koordinat: ${lat?.toFixed(4)}, ${lon?.toFixed(4)}...`);
    }
}
