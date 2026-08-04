// ==========================================
// POPUP.JS - POINT IMPACT REPORT & GEOJSON EXTRACTOR V1.4 (PURE GEOJSON)
// Terintegrasi Langsung dengan Atribut Fitur Vektor GeoJSON Python & Global Admin
// ==========================================

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

    // Identifikasi Nama Wilayah & Provinsi
    let rawWilayah = props.WADMKK || props.kabupaten || props.KABUPATEN || props.NAME_2 || props.NAME || "Wilayah Terpilih";
    let rawProvinsi = props.WADMPR || props.provinsi || props.PROVINSI || props.NAME_1 || "Indonesia";
    let kodeWilayah = props.KODBPS || props.KAB_CODE || props.id || '-';

    // Pembersihan String XSS
    let namaWilayah = (typeof Utils !== 'undefined' && typeof Utils.escapeHTML === 'function') ? Utils.escapeHTML(rawWilayah) : rawWilayah;
    let namaProvinsi = (typeof Utils !== 'undefined' && typeof Utils.escapeHTML === 'function') ? Utils.escapeHTML(rawProvinsi) : rawProvinsi;

    // Format Koordinat Presisi dari Titik Klik Kursor
    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function')
        ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}`
        : `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;

    // Indikator Hari Aktif (H0, H+1, H+2, dst.)
    let currentDayIdx = (typeof window.currentIndex !== 'undefined') ? window.currentIndex : 0;
    let dayLabelTag = `H${currentDayIdx === 0 ? '0' : '+' + currentDayIdx}`;

    // Cek Status Hazard pada Wilayah Ini
    let levelVal = "Aman / Normal";
    let kategoriVal = "Tidak Ada Peringatan";
    let categoryIdVal = "0";
    let dateVal = "-";
    let hexColor = "#22c55e"; // Hijau standar aman

    // Konfigurasi Produk Aktif
    let productConfig = (typeof CONFIG !== 'undefined' && typeof currentCategory !== 'undefined' && typeof currentProductKey !== 'undefined')
        ? CONFIG.products[currentCategory]?.[currentProductKey]
        : null;

    // Pemindaian Spasial / Atribut ke Active Overlay Layer
    if (typeof activeOverlayLayer !== 'undefined' && activeOverlayLayer) {
        activeOverlayLayer.eachLayer(function (hazardLayer) {
            if (hazardLayer.feature && hazardLayer.feature.properties) {
                let hp = hazardLayer.feature.properties;
                let hName = hp.kabupaten || hp.WADMKK || hp.NAME_2 || "";

                // Cocokkan nama wilayah atau gunakan fungsi ray-casting jika geometri tersedia
                if (hName && hName.toLowerCase().trim() === namaWilayah.toLowerCase().trim()) {
                    levelVal = hp.level || "Waspada";
                    kategoriVal = hp.kategori || productConfig?.name || "Potensi Bahaya";
                    categoryIdVal = hp.category_id !== undefined ? hp.category_id : (hp.code !== undefined ? hp.code : "1");
                    dateVal = hp.date ? ((typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') ? Utils.formatTanggal(hp.date) : hp.date) : "-";
                    hexColor = hp.color || "#eab308";
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
    let lat = clickEvent ? clickEvent.latlng.lat : (layer.getBounds ? layer.getBounds().getCenter().lat : 0);
    let lon = clickEvent ? clickEvent.latlng.lng : (layer.getBounds ? layer.getBounds().getCenter().lng : 0);
    let props = feature.properties || {};

    let rawWilayah = props.kabupaten || props.WADMKK || props.NAME_2 || "Wilayah Terdampak";
    let rawProvinsi = props.provinsi || props.WADMPR || props.NAME_1 || "Indonesia";
    let kodeWilayah = props.KODBPS || props.KAB_CODE || props.id || '';

    let namaWilayah = (typeof Utils !== 'undefined' && typeof Utils.escapeHTML === 'function') ? Utils.escapeHTML(rawWilayah) : rawWilayah;
    let namaProvinsi = (typeof Utils !== 'undefined' && typeof Utils.escapeHTML === 'function') ? Utils.escapeHTML(rawProvinsi) : rawProvinsi;

    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function')
        ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}`
        : `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;

    let currentDayIdx = (typeof window.currentIndex !== 'undefined') ? window.currentIndex : 0;
    let dayLabelTag = `H${currentDayIdx === 0 ? '0' : '+' + currentDayIdx}`;

    let dateVal = props.date ? ((typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') ? Utils.formatTanggal(props.date) : props.date) : "-";
    let levelVal = props.level || "Waspada";
    let kategoriVal = props.kategori || productConfig?.name || "Informasi Potensi";
    let categoryIdVal = props.category_id !== undefined ? props.category_id : (props.code !== undefined ? props.code : "-");
    let hexColor = props.color || "#38bdf8";

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
    .setLatLng(clickEvent ? clickEvent.latlng : layer.getBounds().getCenter())
    .setContent(popupContent)
    .openOn(map);
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
 * Fungsi pemicu pencetakan PDF dengan menyertakan koordinat lat & lon
 */
function exportImpactReportPDF(namaWilayah, kodeWilayah, levelVal, lat, lon) {
    if (typeof triggerPDFExport === 'function') {
        triggerPDFExport(namaWilayah, kodeWilayah, levelVal, lat, lon);
    } else {
        alert(`Mencetak Laporan PDF untuk ${namaWilayah} [Status: ${levelVal}] pada Koordinat: ${lat?.toFixed(4)}, ${lon?.toFixed(4)}...`);
    }
}
