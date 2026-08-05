// ==========================================
// MAP.JS - INISIALISASI PETA UTAMA LEAFLET V1.7 (ADMIN BOUNDARIES ALWAYS VISIBLE)
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

    // 1. BUAT CUSTOM PANE KHUSUS UNTUK GARIS ADMINISTRASI (Paling Atas)
    // Z-Index 650 menempatkannya jauh di atas layer hazard (z-index 400) & tile layer
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
                    pane: 'adminBoundariesPane', // Render di Pane khusus z-index 650
                    style: {
                        color: "rgba(100, 116, 139, 0.4)",        // Warna garis hitam murni
                        weight: 1.2,             // Dinaikkan ke 1.2px agar terlihat lebih kontras & jelas
                        opacity: 0.85,           // Opasitas garis 85%
                        fill: false,             // Matikan fill total
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
                    pane: 'adminBoundariesPane', // Render di Pane khusus z-index 650
                    style: {
                        color: "#0284c7",        // Warna garis hitam murni
                        weight: 2.2,             // Garis provinsi lebih tebal (2.2px)
                        opacity: 1.0,            // Opasitas 100%
                        fill: false,             // Matikan fill total
                        fillOpacity: 0
                    }
                }).addTo(map);
            })
            .catch(err => console.warn("Peringatan Admin Provinsi:", err.message));
    }
}
