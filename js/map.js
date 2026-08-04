// ==========================================
// MAP.JS - INISIALISASI PETA UTAMA LEAFLET V1.2 (PURE GEOJSON)
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

    map = L.map('map', {
        center: CONFIG.map.defaultCenter || [-1.75, 125.25],
        zoom: CONFIG.map.defaultZoom || 5,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: true
    });

    // Panggil pemuatan layer administrasi wilayah
    loadAdminBoundaries();

    return map;
}

/**
 * Memuat batas administrasi (Provinsi & Kabupaten) dari folder data/admin/
 * Bertindak sebagai Base Interactive Layer untuk area non-hazard (Aman/Normal)
 */
function loadAdminBoundaries() {
    if (!map) return;

    // 1. Muat Batas Kabupaten / Kota (Interactive Base Layer)
    if (CONFIG.paths && CONFIG.paths.adminKabupaten) {
        fetch(CONFIG.paths.adminKabupaten)
            .then(res => {
                if (!res.ok) throw new Error("File admin kabupaten tidak ditemukan");
                return res.json();
            })
            .then(data => {
                kabupatenLayer = L.geoJSON(data, {
                    style: {
                        color: "rgba(255, 255, 255, 0.25)", // Garis batas tipis
                        weight: 0.8,
                        fillColor: "#ffffff",
                        fillOpacity: 0.001 // Sangat transparan tetapi tetap dapat menangkap klik kursor
                    },
                    onEachFeature: function (feature, layer) {
                        let props = feature.properties || {};
                        let namaWilayah = props.WADMKK || props.kabupaten || props.KABUPATEN || props.NAME_2 || props.NAME || "Wilayah";

                        // Tooltip nama wilayah saat kursor melintas
                        if (namaWilayah) {
                            layer.bindTooltip(namaWilayah, {
                                sticky: true,
                                className: 'map-tooltip'
                            });
                        }

                        // Event klik di area manapun (termasuk zona Aman / Tanpa Peringatan)
                        layer.on('click', function (e) {
                            // Hentikan penumpukan klik jika mengeklik poligon hazard di atasnya
                            L.DomEvent.stopPropagation(e);

                            // Utamakan panggil fungsi pemicu popup global
                            if (typeof generateGlobalPopup === 'function') {
                                generateGlobalPopup(e, feature);
                            } else if (typeof window.handleMapClick === 'function') {
                                window.handleMapClick(e, feature);
                            }
                        });
                    }
                }).addTo(map);

                // Pastikan layer kabupaten berada paling bawah dari layer hazard
                kabupatenLayer.bringToBack();
            })
            .catch(err => console.warn("Peringatan Admin Kabupaten:", err.message));
    }

    // 2. Muat Batas Provinsi (Overlay Lines Only)
    if (CONFIG.paths && CONFIG.paths.adminProvinsi) {
        fetch(CONFIG.paths.adminProvinsi)
            .then(res => {
                if (!res.ok) throw new Error("File admin provinsi tidak ditemukan");
                return res.json();
            })
            .then(data => {
                provinsiLayer = L.geoJSON(data, {
                    style: {
                        color: "#38bdf8", // Warna garis cyan futuristik
                        weight: 1.8,
                        fillColor: "transparent",
                        fillOpacity: 0,
                        interactive: false // Mencegah pemblokiran klik ke layer bawahnya
                    }
                }).addTo(map);

                provinsiLayer.bringToFront();
            })
            .catch(err => console.warn("Peringatan Admin Provinsi:", err.message));
    }
}
