// ==========================================
// MAP.JS - INISIALISASI PETA UTAMA LEAFLET V1.2 (CLEAN THEME)
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

    // Inisialisasi Peta (Matikan zoomControl default agar bisa dipindah ke kanan bawah)
    map = L.map('map', {
        center: CONFIG.map.defaultCenter || [-1.75, 125.25],
        zoom: CONFIG.map.defaultZoom || 5,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: false 
    });

    // Pindahkan Tombol Zoom In / Zoom Out ke Sudut Kanan Bawah
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Panggil pemuatan layer administrasi wilayah
    loadAdminBoundaries();

    return map;
}

/**
 * Memuat batas administrasi (Provinsi & Kabupaten) dari folder data/admin/
 * Bertindak sebagai Base Interactive Layer untuk area non-hazard (Aman/Normal)
 */
// ==========================================
// KODE UPDATE PADA js/map.js
// ==========================================

function loadAdminBoundaries() {
    if (!map) return;

    // 1. Muat Batas Kabupaten / Kota (Garis Hitam v1.0)
    if (CONFIG.paths && CONFIG.paths.adminKabupaten) {
        fetch(CONFIG.paths.adminKabupaten)
            .then(res => res.json())
            .then(data => {
                kabupatenLayer = L.geoJSON(data, {
                    style: {
                        color: "rgba(100, 116, 139, 0.4)",       // Hitam tegas murni sesuai v1.0
                        weight: 0.8,            // Ketebalan garis 0.8px
                        fillColor: "transparent",
                        fillOpacity: 0
                    },
                    onEachFeature: function (feature, layer) {
                        let props = feature.properties || {};
                        let namaWilayah = props.WADMKK || props.kabupaten || props.KABUPATEN || props.NAME_2 || "Wilayah";

                        if (namaWilayah) {
                            layer.bindTooltip(namaWilayah, { sticky: true, className: 'map-tooltip' });
                        }

                        layer.on('click', function (e) {
                            L.DomEvent.stopPropagation(e);
                            if (typeof generateGlobalPopup === 'function') {
                                generateGlobalPopup(e, feature);
                            }
                        });
                    }
                }).addTo(map);

                // Paksa batas kabupaten selalu di depan
                if (kabupatenLayer) kabupatenLayer.bringToFront();
            })
            .catch(err => console.warn("Admin Kabupaten:", err.message));
    }

    // 2. Muat Batas Provinsi (Garis Hitam Tebal v1.0)
    if (CONFIG.paths && CONFIG.paths.adminProvinsi) {
        fetch(CONFIG.paths.adminProvinsi)
            .then(res => res.json())
            .then(data => {
                provinsiLayer = L.geoJSON(data, {
                    style: {
                        color: "#0284c7",       // Biru 
                        weight: 2.0,            // Ketebalan garis 2.0px (lebih tebal)
                        fillColor: "transparent",
                        fillOpacity: 0,
                        interactive: false
                    }
                }).addTo(map);

                // Paksa batas provinsi selalu di paling depan
                if (provinsiLayer) provinsiLayer.bringToFront();
            })
            .catch(err => console.warn("Admin Provinsi:", err.message));
    }
}
