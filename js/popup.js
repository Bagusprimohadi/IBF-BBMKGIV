// ==========================================
// POPUP.JS - POINT IMPACT REPORT & GEOJSON EXTRACTOR V1.6 (STRICT SEPARATION FIX)
// ==========================================

/**
 * FUNGSI BANTUAN: Mencari nama kabupaten dari layer dasar jika hazard tidak punya nama
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
 * 1. POPUP KHUSUS AREA BAHAYA (HAZARD)
 * Terpicu LANGSUNG oleh klik pada poligon warna. Menggunakan data spesifik dari poligon tersebut (Bebas bocor).
 */
function bindFeaturePopup(hazardFeature, hazardLayer, productConfig, clickEvent) {
    if (!clickEvent || !hazardFeature) return;

    let lat = clickEvent.latlng.lat;
    let lon = clickEvent.latlng.lng;
    let props = hazardFeature.properties || {};

    // Ambil properti nama dari data hazard (jika ada)
    let rawWilayah = props.kabupaten || props.WADMKK || props.NAME_2 || props.NAMOBJ || "";
    let rawProvinsi = props.provinsi || props.WADMPR || props.NAME_1 || "";
    let kodeWilayah = props.KODBPS || props.KAB_CODE || props.id || '-';

    // JIKA hazard tidak punya nama kabupaten, pinjam diam-diam dari layer administrasi dasar
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

    // Ambil parameter spesifik HANYA dari poligon ini
    let levelVal = props.level || props.status || props.risk_level || "Waspada";
    let kategoriVal = props.kategori || props.dampak || productConfig?.name || "Potensi Bahaya";
    let categoryIdVal = props.category_id !== undefined ? props.category_id : (props.code !== undefined ? props.code : "-");
    let hexColor = props.color || props.hex_color || "#ef4444";
    let dateVal = props.date ? ((typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') ? Utils.formatTanggal(props.date) : props.date) : "-";
    
    let levelClass = getLevelBadgeClass(levelVal);
    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function') ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}` : `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
    let currentDayIdx = (typeof window.currentIndex !== 'undefined') ? window.currentIndex : 0;
    let dayLabelTag = `H${currentDayIdx === 0 ? '0' : '+' + currentDayIdx}`;

    let popupContent = `
        <div class="impact-popup">
            <div class="popup-header" style="border-left: 5px solid ${hexColor};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="popup-title">📍 ${rawWilayah.toUpperCase()}</div>
                    <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: bold;">${dayLabelTag}</span>
                </div>
                <div class="popup-subtitle">${rawProvinsi}</div>
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
                                <td class="day-label">Validitas</td>
                                <td class="date-label">${dateVal}</td>
                            </tr>
                            <tr>
                                <td class="day-label">Parameter</td>
                                <td class="date-label">${kategoriVal}</td>
                            </tr>
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
                <button class="btn-export" onclick="exportImpactReportPDF('${rawWilayah}', '${kodeWilayah}', '${levelVal}', ${lat}, ${lon})">
                    📄 Unduh Laporan (PDF)
                </button>
            </div>
        </div>
    `;

    L.popup({ maxWidth: 380, minWidth: 300, className: 'futuristic-popup' })
        .setLatLng(clickEvent.latlng)
        .setContent(popupContent)
        .openOn(map);
}

/**
 * 2. POPUP KHUSUS AREA AMAN (KOSONG)
 * Terpicu saat klik area yang TIDAK ADA poligon warnanya.
 */
function generateGlobalPopup(e, adminFeature) {
    if (!e || !e.latlng) return;

    let lat = e.latlng.lat;
    let lon = e.latlng.lng;
    
    // Ambil properti dari wilayah admin
    let props = {};
    if (adminFeature && adminFeature.properties) {
        props = adminFeature.properties;
    } else {
        let feat = getAdminFeatureByLatLng(e.latlng);
        if (feat && feat.properties) props = feat.properties;
    }

    let rawWilayah = props.WADMKK || props.kabupaten || props.KABUPATEN || props.NAME_2 || props.NAME || props.NAMOBJ || "Area Tidak Diketahui";
    let rawProvinsi = props.WADMPR || props.provinsi || props.PROVINSI || props.NAME_1 || "Indonesia";
    let kodeWilayah = props.KODBPS || props.KAB_CODE || props.id || '-';

    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function') ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}` : `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
    let currentDayIdx = (typeof window.currentIndex !== 'undefined') ? window.currentIndex : 0;
    let dayLabelTag = `H${currentDayIdx === 0 ? '0' : '+' + currentDayIdx}`;
    
    let hexColor = "#10b981"; // Hijau Aman
    let productConfig = (typeof CONFIG !== 'undefined' && typeof currentCategory !== 'undefined' && typeof currentProductKey !== 'undefined') ? CONFIG.products[currentCategory]?.[currentProductKey] : null;

    let popupContent = `
        <div class="impact-popup">
            <div class="popup-header" style="border-left: 5px solid ${hexColor};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="popup-title">📍 ${rawWilayah.toUpperCase()}</div>
                    <span style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: bold;">${dayLabelTag}</span>
                </div>
                <div class="popup-subtitle">${rawProvinsi}</div>
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
                                        ✅ AMAN / TIDAK ADA POTENSI
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
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);
}

// Helper Functions
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
        alert(`Mencetak Laporan PDF untuk ${namaWilayah} [Status: ${levelVal}] pada Koordinat: ${lat?.toFixed(4)}, ${lon?.toFixed(4)}...`);
    }
}
