// ==========================================
// POPUP.JS - POINT IMPACT REPORT & GEOJSON EXTRACTOR V1.2 (PURE GEOJSON)
// Terintegrasi Langsung dengan Atribut Fitur Vektor GeoJSON Python
// ==========================================

/**
 * Fungsi utama yang dipanggil saat poligon GeoJSON produk atau wilayah diklik
 * @param {Object} feature - Fitur GeoJSON yang diklik
 * @param {Object} layer - Layer Leaflet terkait
 * @param {Object} productConfig - Konfigurasi produk dari CONFIG.products
 */
function bindFeaturePopup(feature, layer, productConfig) {
    layer.on('click', function (e) {
        let lat = e.latlng.lat;
        let lon = e.latlng.lng;
        let props = feature.properties || {};

        // Identifikasi Wilayah (GeoJSON Vektor atau Admin)
        let namaWilayah = props.kabupaten || props.WADMKK || props.NAME_2 || "Wilayah Terdeteksi";
        let namaProvinsi = props.provinsi || props.WADMPR || props.NAME_1 || "Indonesia";
        let kodeWilayah = props.KODBPS || props.KAB_CODE || props.id || '';

        // Format Koordinat Peta
        let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function')
            ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}`
            : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

        // Ekstrak Atribut Utama dari GeoJSON Python
        let dateVal = props.date ? (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function' ? Utils.formatTanggal(props.date) : props.date) : "-";
        let levelVal = props.level || "Normal";
        let kategoriVal = props.kategori || productConfig?.name || "Informasi Potensi";
        let codeVal = props.code !== undefined ? props.code : (props.category_id !== undefined ? props.category_id : "-");
        let hexColor = props.color || "#3b82f6";

        // Tentukan kelas CSS badge berdasarkan level
        let levelClass = getLevelBadgeClass(levelVal);

        let popupContent = `
            <div class="impact-popup">
                <div class="popup-header" style="border-left: 5px solid ${hexColor};">
                    <div class="popup-title">📍 ${namaWilayah.toUpperCase()}</div>
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
                                    <td class="day-label">Tanggal Valid</td>
                                    <td class="date-label">${dateVal}</td>
                                </tr>
                                <tr>
                                    <td class="day-label">Kategori Hazard</td>
                                    <td class="date-label">${kategoriVal}</td>
                                </tr>
                                <tr>
                                    <td class="day-label">Kode Kelas</td>
                                    <td class="date-label">Kelas ${codeVal}</td>
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
                    <button class="btn-export" onclick="exportImpactReportPDF('${namaWilayah}', '${kodeWilayah}', '${levelVal}')">
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
    });
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
    if (!hex || hex === 'transparent') return 'rgba(59, 130, 246, 0.1)';
    let c = hex.replace('#','');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let num = parseInt(c, 16);
    return `rgba(${(num >> 16)&255}, ${(num >> 8)&255}, ${num&255}, ${alpha})`;
}

/**
 * Fungsi stub untuk ekspor laporan PDF (terintegrasi dengan export.js)
 */
function exportImpactReportPDF(namaWilayah, kodeWilayah, levelVal) {
    if (typeof triggerPDFExport === 'function') {
        triggerPDFExport(namaWilayah, kodeWilayah, levelVal);
    } else {
        alert(`Mencetak Laporan PDF untuk ${namaWilayah} [Status: ${levelVal}]...`);
    }
}
