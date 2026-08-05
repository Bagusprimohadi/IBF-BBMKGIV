// ==========================================
// MAP.JS - INISIALISASI PETA UTAMA LEAFLET V1.8 (DUAL CUSTOM PANES)
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

    // 1. BUAT DUA PANE TERPISAH (Z-Index di atas 400 milik layer Hazard)
    
    // Pane khusus Kabupaten (Di atas hazard)
    map.createPane('paneKabupaten');
    map.getPane('paneKabupaten').style.zIndex = 601;
    map.getPane('paneKabupaten').style.pointerEvents = 'none'; // Kunci agar klik tembus hazard

    // Pane khusus Provinsi (Paling atas)
    map.createPane('paneProvinsi');
    map.getPane('paneProvinsi').style.zIndex = 602;
    map.getPane('paneProvinsi').style.pointerEvents = 'none'; // Kunci agar klik tembus hazard

    // Tombol Zoom di Sudut Kanan Bawah
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Event Klik Global pada Peta (Terpicu jika mengklik area kosong)
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
 * Memuat batas administrasi (Provinsi & Kabupaten) secara terpisah
 */
function loadAdminBoundaries() {
    if (!map) return;

    // 1. Muat Batas Kabupaten / Kota (Masuk ke paneKabupaten)
    if (CONFIG.paths && CONFIG.paths.adminKabupaten) {
        fetch(CONFIG.paths.adminKabupaten)
            .then(res => {
                if (!res.ok) throw new Error("File admin kabupaten tidak ditemukan");
                return res.json();
            })
            .then(data => {
                kabupatenLayer = L.geoJSON(data, {
                    pane: 'paneKabupaten',   // Gunakan custom pane 601
                    style: {
                        color: "rgba(100, 116, 139, 0.4)",        // Hitam sedikit keabu-abuan agar kontras
                        weight: 1.5,             // Dipertebal menjadi 1.5px agar menembus warna solid hazard
                        opacity: 1,              // Opasitas garis penuh 100%
                        fill: false,             // Matikan fill sama sekali
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

    // 2. Muat Batas Provinsi (Masuk ke paneProvinsi)
    if (CONFIG.paths && CONFIG.paths.adminProvinsi) {
        fetch(CONFIG.paths.adminProvinsi)
            .then(res => {
                if (!res.ok) throw new Error("File admin provinsi tidak ditemukan");
                return res.json();
            })
            .then(data => {
                provinsiLayer = L.geoJSON(data, {
                    pane: 'paneProvinsi',    // Gunakan custom pane 602
                    style: {
                        color: "#0284c7",        // Hitam murni
                        weight: 2.5,             // Lebih tebal untuk provinsi
                        opacity: 1,
                        fill: false,
                        fillOpacity: 0
                    }
                }).addTo(map);
            })
            .catch(err => console.warn("Peringatan Admin Provinsi:", err.message));
    }
}
