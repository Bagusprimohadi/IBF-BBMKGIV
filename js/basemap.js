// ==========================================
// BASEMAP.JS - PENGELOLAAN BASEMAP PETA V1.1
// ==========================================

let activeBasemap = null;
let basemaps = {};

/**
 * Inisialisasi pilihan basemap
 */
function initBasemaps() {
    if (!map) return;

    basemaps = {
        'dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CartoDB',
            subdomains: 'abcd',
            maxZoom: 19
        }),
        'streets': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            maxZoom: 19
        }),
        'positron': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CartoDB',
            subdomains: 'abcd',
            maxZoom: 19
        }),
        'voyager': L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; CartoDB',
            subdomains: 'abcd',
            maxZoom: 19
        }),
        'satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; Esri',
            maxZoom: 18
        }),
        'topo': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenTopoMap',
            maxZoom: 17
        })
    };

    // Set default basemap ke Dark Matter
    changeBasemap('dark');
}

/**
 * Mengganti basemap aktif di peta
 * @param {string} key - Kunci basemap (dark, streets, positron, dll)
 */
function changeBasemap(key) {
    if (!map) return;

    if (!basemaps[key]) {
        console.warn("Basemap tidak ditemukan:", key);
        return;
    }

    // Hapus basemap aktif sebelumnya
    if (activeBasemap) {
        map.removeLayer(activeBasemap);
    }

    // Tambahkan basemap baru dan letakkan di paling bawah z-index
    activeBasemap = basemaps[key];
    activeBasemap.addTo(map);
    activeBasemap.bringToBack();

    // Tutup dropdown jika fungsi tersedia
    if (typeof closeAllDropdowns === 'function') {
        closeAllDropdowns();
    } else {
        document.querySelectorAll('.dropdown-wrapper').forEach(el => el.classList.remove('active'));
    }
}
