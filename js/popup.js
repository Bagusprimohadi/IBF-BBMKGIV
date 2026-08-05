// ==========================================
// POPUP.JS - POINT IMPACT REPORT & GEOJSON EXTRACTOR V1.5 (SPATIAL MATCH)
// Terintegrasi Langsung dengan Atribut Fitur Vektor GeoJSON & Global Admin
// ==========================================

/**
 * Normalisasi string nama wilayah untuk pencocokan toleran
 */
function normalizeRegionName(str) {
    if (!str) return "";
    return String(str)
        .toLowerCase()
        .replace(/^(kabupaten|kab\.|kota)\s+/gi, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

/**
 * Pengecekan apakah koordinat titik ada di dalam bounds/geometri layer
 */
function isPointInLayer(latlng, layer) {
    if (!layer || !latlng) return false;
    
    // Cek batas Bounding Box terlebih dahulu
    if (layer.getBounds && !layer.getBounds().contains(latlng)) {
        return false;
    }

    // Jika TurfJS tersedia, gunakan Ray-Casting presisi
    if (typeof turf !== 'undefined' && layer.feature) {
        try {
            let pt = turf.point([latlng.lng, latlng.lat]);
            return turf.booleanPointInPolygon(pt, layer.feature);
        } catch (err) {
            return true; 
        }
    }
    
    return true;
}

/**
 * Fungsi popup global untuk menangani klik di area manapun di peta (Zona Terdampak maupun Aman)
 * @param {Object} e - Event klik Leaflet (memuat latlng)
 * @param {Object} adminFeature - Fitur GeoJSON administrasi kabupaten yang diklik
 */
function generateGlobalPopup(e, adminFeature) {
    if (!e || !e.latlng) return;

    let lat = e.latlng.lat;
    let lon = e.latlng.lng;
    let props = (adminFeature && adminFeature.properties) ? adminFeature.properties : {};

    // 1. Ekstraksi Nama Wilayah Administrasi Utama
    let rawWilayah = props.WADMKK || props.kabupaten || props.KABUPATEN || props.NAME_2 || props.NAMOBJ || props.NAME || "Wilayah Terpilih";
    let rawProvinsi = props.WADMPR || props.provinsi || props.PROVINSI || props.NAME_1 || "Indonesia";
    let kodeWilayah = props.KODBPS || props.KAB_CODE || props.id || '-';

    let normAdminName = normalizeRegionName(rawWilayah);

    // Pembersihan String XSS
    let namaWilayah = (typeof Utils !== 'undefined' && typeof Utils.escapeHTML === 'function') ? Utils.escapeHTML(rawWilayah) : rawWilayah;
    let namaProvinsi = (typeof Utils !== 'undefined' && typeof Utils.escapeHTML === 'function') ? Utils.escapeHTML(rawProvinsi) : rawProvinsi;

    // Format Koordinat Presisi
    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function')
        ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}`
        : `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;

    // Indikator Hari Aktif
    let currentDayIdx = (typeof window.currentIndex !== 'undefined') ? window.currentIndex : 0;
    let dayLabelTag = `H${currentDayIdx === 0 ? '0' : '+' + currentDayIdx}`;

    // Status Default (Jika Aman / Tidak Terdampak)
    let levelVal = "Aman / Normal";
    let kategoriVal = "Tidak Ada Peringatan";
    let categoryIdVal = "0";
    let dateVal = "-";
    let hexColor = "#22c55e"; // Hijau standar aman

    // Konfigurasi Produk Aktif
    let productConfig = (typeof CONFIG !== 'undefined' && typeof currentCategory !== 'undefined' && typeof currentProductKey !== 'undefined')
        ? CONFIG.products[currentCategory]?.[currentProductKey]
        : null;

    // 2. PEMINDAIAN SPASIAL HYBRID (Pencocokan Koordinat + Toleransi Nama String)
    if (typeof activeOverlayLayer !== 'undefined' && activeOverlayLayer) {
        activeOverlayLayer.eachLayer(function (hazardLayer) {
            if (hazardLayer.feature && hazardLayer.feature.properties) {
                let hp = hazardLayer.feature.properties;
                let hName = hp.kabupaten || hp.WADMKK || hp.KABUPATEN || hp.NAME_2 || "";
                let normHazardName = normalizeRegionName(hName);

                // Cek 1: Apakah titik kursor berada di dalam poligon hazard?
                let isInside = isPointInLayer(e.latlng, hazardLayer);

                // Cek 2: Apakah nama kabupaten cocok secara string?
                let isNameMatch = (normHazardName && normAdminName && (normHazardName === normAdminName || normAdminName.includes(normHazardName) || normHazardName.includes(normAdminName)));

                if (isInside || isNameMatch) {
                    levelVal = hp.level || hp.status || "Waspada";
                    kategoriVal = hp.kategori || hp.dampak || productConfig?.name || "Potensi Bahaya";
                    categoryIdVal = hp.category_id !== undefined ? hp.category_id : (hp.code !== undefined ? hp.code : "1");
                    dateVal = hp.date ? ((typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') ? Utils.formatTanggal(hp.date) : hp.date) : "-";
                    hexColor = hp.color || hp.hex_color || "#eab308";
                }
            }
        });
    }

    let levelClass = getLevelBadgeClass(levelVal);

    let popupContent = `
        <div class="impact-popup">
            <div class="popup-header" style="border-left: 5px solid ${hexColor};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="popup-title">📍 ${namaWilayah.toUpperCase()}</div>
                    <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: bold;">${dayLabelTag}</span>
                </div>
                <div class="popup-subtitle">${namaProvinsi}</div>
                <div class="popup-coords">${coordText}</div>
            </div>
            
            <div class="popup-body">
                <div class="product-info">
                    <span class="info-label">Produk Analisis:</span> 
                    <span class="info-value">${productConfig?.title || productConfig?.name || 'Analisis IBF'}</span>
                </div>
                
                <div class="table-container">
                    <table class="impact-table">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Detail Informasi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="day-label">Validitas Prediksi</td>
                                <td class="date-label">${dateVal}</td>
                            </tr>
                            <tr>
                                <td class="day-label">Kategori / Parameter</td>
                                <td class="date-label">${kategoriVal}</td>
                            </tr>
                            <tr>
                                <td class="day-label">ID Kategori</td>
                                <td class="date-label">ID #${categoryIdVal}</td>
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
                <button class="btn-export" onclick="exportImpactReportPDF('${namaWilayah}', '${kodeWilayah}', '${levelVal}', ${lat}, ${lon})">
                    📄 Unduh Laporan (PDF)
                </button>
            </div>
        </div>
    `;

    L.popup({
        maxWidth: 380,
        minWidth: 300,
        className: 'futuristic-popup'
    })
    .setLatLng(e.latlng)
    .setContent(popupContent)
    .openOn(map);
}

/**
 * Fungsi pemicu saat poligon GeoJSON hazard diklik secara langsung
 */
function bindFeaturePopup(feature, layer, productConfig, clickEvent) {
    if (!clickEvent) return;

    // Ambil fitur administrasi dasar dari titik koordinat klik jika ada
    let adminFeature = null;
    if (typeof kabupatenLayerBase !== 'undefined' && kabupatenLayerBase) {
        kabupatenLayerBase.eachLayer(function (baseLayer) {
            if (isPointInLayer(clickEvent.latlng, baseLayer)) {
                adminFeature = baseLayer.feature;
            }
        });
    }

    // Jika atribut nama kabupaten hilang di GeoJSON hazard, gabungkan dengan data administrasi dasar
    if (adminFeature && adminFeature.properties) {
        feature.properties = Object.assign({}, adminFeature.properties, feature.properties);
    }

    // Alihkan rendering ke generateGlobalPopup agar format konsisten
    generateGlobalPopup(clickEvent, feature);
}

/**
 * Menentukan kelas badge status peringatan
 */
function getLevelBadgeClass(levelText) {
    let text = String(levelText).toLowerCase();
    if (text.includes("waspada")) return "badge-waspada";
    if (text.includes("siaga")) return "badge-siaga";
    if (text.includes("awas")) return "badge-awas";
    return "badge-normal";
}

/**
 * Konversi warna HEX ke RGBA untuk latar belakang badge transparan
 */
function hexToRgba(hex, alpha) {
    if (!hex || hex === 'transparent') return 'rgba(56, 189, 248, 0.1)';
    let c = hex.replace('#','');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let num = parseInt(c, 16);
    return `rgba(${(num >> 16)&255}, ${(num >> 8)&255}, ${num&255}, ${alpha})`;
}

/**
 * Fungsi pemicu pencetakan PDF
 */
function exportImpactReportPDF(namaWilayah, kodeWilayah, levelVal, lat, lon) {
    if (typeof triggerPDFExport === 'function') {
        triggerPDFExport(namaWilayah, kodeWilayah, levelVal, lat, lon);
    } else {
        alert(`Mencetak Laporan PDF untuk ${namaWilayah} [Status: ${levelVal}] pada Koordinat: ${lat?.toFixed(4)}, ${lon?.toFixed(4)}...`);
    }
}
