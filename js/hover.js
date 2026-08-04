// ==========================================
// HOVER.JS - INTERAKSI HOVER & TOOLTIP WILAYAH V1.1
// ==========================================

/**
 * Menambahkan event listener hover pada layer poligon GeoJSON
 * @param {Object} layer - Layer Leaflet (polygon/feature)
 * @param {Object} feature - Fitur GeoJSON
 */
function bindPolygonHoverEvents(layer, feature) {
    let props = feature.properties || {};
    let namaWilayah = props.WADMKK || props.kabupaten || props.NAME_2 || "Wilayah";
    let namaProvinsi = props.WADMPR || props.provinsi || props.NAME_1 || "";

    // Tooltip instan saat kursor mendekati poligon
    layer.bindTooltip(`<b>${namaWilayah.toUpperCase()}</b>${namaProvinsi ? '<br><small>' + namaProvinsi + '</small>' : ''}`, {
        sticky: true, // Tooltip menempel mengikuti gerakan kursor
        direction: 'top',
        className: 'map-hover-tooltip'
    });

    // Efek visual saat kursor masuk (mouseover)
    layer.on('mouseover', function(e) {
        let currentLayer = e.target;
        
        // Ubah gaya garis/border poligon menjadi lebih tebal & kontras saat di-hover
        currentLayer.setStyle({
            weight: 2.5,
            color: '#38bdf8', // Biru terang ala command center
            fillOpacity: 0.15
        });

        // Bawa layer ke urutan teratas agar border tidak tertutup poligon tetangga
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            currentLayer.bringToFront();
        }
    });

    // Kembalikan gaya semula saat kursor keluar (mouseout)
    layer.on('mouseout', function(e) {
        let currentLayer = e.target;
        
        // Kembalikan ke styling dasar administrasi (diatur di map.js / basemap.js)
        if (typeof geojsonLayer !== 'undefined' && geojsonLayer.resetStyle) {
            geojsonLayer.resetStyle(currentLayer);
        } else {
            currentLayer.setStyle({
                weight: 1,
                color: '#64748b',
                fillOpacity: 0.03
            });
        }
    });
}
