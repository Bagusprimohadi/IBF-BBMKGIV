// ==========================================
// BASEMAP.JS - PENGATURAN PILIHAN PETA LATAR V1.1 (DIPERBANYAK)
// ==========================================

// Inisialisasi Basemap Default (Dark Matter ala Command Center)
let currentBasemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 19
}).addTo(map);

/**
 * Fungsi untuk mengganti jenis basemap secara dinamis dari menu dropdown
 * @param {string} type 
 */
function changeBasemap(type) {
    if (currentBasemap) {
        map.removeLayer(currentBasemap);
    }

    switch (type) {
        case 'dark':
            currentBasemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO', maxZoom: 19
            });
            break;
        case 'streets':
            currentBasemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap', maxZoom: 19
            });
            break;
        case 'positron':
            currentBasemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO', maxZoom: 19
            });
            break;
        case 'satellite':
            // Esri World Imagery (Citra Satelit Global)
            currentBasemap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 19
            });
            break;
        case 'topo':
            // OpenTopoMap (Peta Topografi / Kontur)
            currentBasemap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenTopoMap contributors (CC-BY-SA)',
                maxZoom: 17
            });
            break;
        case 'voyager':
            // CartoDB Voyager (Peta Bersih dengan Label Jalan yang Jelas)
            currentBasemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO', maxZoom: 19
            });
            break;
        default:
            currentBasemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; CARTO', maxZoom: 19
            });
    }

    currentBasemap.addTo(map);

    // Tutup dropdown setelah memilih
    if (typeof closeAllDropdowns === 'function') {
        closeAllDropdowns();
    }
}
