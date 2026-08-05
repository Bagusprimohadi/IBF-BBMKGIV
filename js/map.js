// ==========================================
// MAP.JS - INISIALISASI PETA UTAMA LEAFLET V1.6 (CUSTOM PANE BOUNDARIES)
// ==========================================

// Variabel Global Instance Peta
var map = null;

// Variabel Layer Administrasi
let provinsiLayer = null;
let kabupatenLayer = null;

/**
 * Inisialisasi awal instance peta Leaflet
 */
function initMap() {
    if (map !== null) return map;

    // Inisialisasi Peta
    map = L.map('map', {
        center: CONFIG.map.defaultCenter || [-1.75, 125.25],
        zoom: CONFIG.map.defaultZoom || 5,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: false 
    });

    // 1. BUAT CUSTOM PANE KHUSUS UNTUK GARIS ADMINISTRASI
    // Z-Index 650 menempatkannya di atas overlay data hazard (z-index default: 400)
    map.createPane('adminBoundariesPane');
    map.getPane('adminBoundariesPane').style.zIndex = 650;
    map.getPane('adminBoundariesPane').style.pointerEvents = 'none'; // Klik tembus 100% ke hazard di bawah

    // Tombol Zoom di Sudut Kanan Bawah
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Event Klik Global pada Peta (Terpicu jika mengklik area KOSONG / NON-HAZARD)
    map.on('click', function (e) {
        if (typeof generateGlobalPopup === 'function') {
            generateGlobalPopup(e, null);
        } else if (typeof window.handleMapClick === 'function') {
            window.handleMapClick(e, null);
        }
    });

    // Memuat layer batas administrasi
    loadAdminBoundaries();

    return map;
}

/**
 * Memuat batas administrasi (Provinsi & Kabupaten)
 * Menggunakan adminBoundariesPane agar selalu berada di paling atas tanpa menghalangi klik pop-up hazard.
 */
function loadAdminBoundaries() {
    if (!map) return;

    // 1. Muat Batas Kabupaten / Kota
    if (CONFIG.paths && CONFIG.paths.adminKabupaten) {
        fetch(CONFIG.paths.adminKabupaten)
            .then(res => {
                if (!res.ok) throw new Error("File admin kabupaten tidak ditemukan");
                return res.json();
            })
            .then(data => {
                kabupatenLayer = L.geoJSON(data, {
                    pane: 'adminBoundariesPane', // Masukkan ke Pane khusus paling atas
                    style: {
                        color: "rgba(100, 116, 139, 0.4)",        // Garis hitam murni v1.0
                        weight: 0.8,             // Ketebalan 0.8px
                        fillColor: "transparent",
                        fillOpacity: 0
                    },
                    onEachFeature: function (feature, layer) {
                        let props = feature.properties || {};
                        let namaWilayah = props.WADMKK || props.kabupaten || props.KABUPATEN || props.NAME_2 || props.NAME;

                        if (namaWilayah) {
                            layer.bindTooltip(namaWilayah, { 
                                sticky: true, 
                                className: 'map-tooltip' 
                            });
                        }
                    }
                }).addTo(map);
            })
            .catch(err => console.warn("Peringatan Admin Kabupaten:", err.message));
    }

    // 2. Muat Batas Provinsi
    if (CONFIG.paths && CONFIG.paths.adminProvinsi) {
        fetch(CONFIG.paths.adminProvinsi)
            .then(res => {
                if (!res.ok) throw new Error("File admin provinsi tidak ditemukan");
                return res.json();
            })
            .then(data => {
                provinsiLayer = L.geoJSON(data, {
                    pane: 'adminBoundariesPane', // Masukkan ke Pane khusus paling atas
                    style: {
                        color: "#0284c7",        // Garis hitam murni v1.0
                        weight: 2.0,             // Ketebalan 2.0px (lebih tebal)
                        fillColor: "transparent",
                        fillOpacity: 0
                    }
                }).addTo(map);
            })
            .catch(err => console.warn("Peringatan Admin Provinsi:", err.message));
    }
}
