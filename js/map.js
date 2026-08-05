// ==========================================
// MAP.JS - INISIALISASI PETA UTAMA LEAFLET V1.4 (FIXED POP-UP & BOUNDARIES)
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

    // Inisialisasi Peta (Zoom control dipindah ke kanan bawah)
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
                    style: {
                        color: "rgba(100, 116, 139, 0.4)",        // Garis hitam murni v1.0
                        weight: 0.8,             // Ketebalan garis 0.8px
                        fillColor: "#ffffff",
                        fillOpacity: 0.001       // Sangat transparan untuk penangkapan kursor
                    },
                    onEachFeature: function (feature, layer) {
                        let props = feature.properties || {};
                        let namaWilayah = props.WADMKK || props.kabupaten || props.KABUPATEN || props.NAME_2 || props.NAME || "Wilayah";

                        if (namaWilayah) {
                            layer.bindTooltip(namaWilayah, { 
                                sticky: true, 
                                className: 'map-tooltip' 
                            });
                        }

                        // Event Klik Pintar
                        layer.on('click', function (e) {
                            let hazardClicked = false;

                            // 1. Jika ada layer Hazard yang aktif, cari fitur hazard yang berada di bawah kursor
                            if (typeof activeOverlayLayer !== 'undefined' && activeOverlayLayer && map.hasLayer(activeOverlayLayer)) {
                                if (typeof activeOverlayLayer.eachLayer === 'function') {
                                    activeOverlayLayer.eachLayer(function (hazardSubLayer) {
                                        // Pengecekan presisi titik di dalam poligon / marker hazard
                                        if (hazardSubLayer.feature && hazardSubLayer.options && hazardSubLayer.options.interactive !== false) {
                                            // Panggil penanganan klik hazard jika pengguna mengeklik poligon hazard
                                            if (typeof bindFeaturePopup === 'function' && !hazardClicked) {
                                                let productConfig = CONFIG.products[currentCategory][currentProductKey];
                                                
                                                // Cek apakah koordinat klik berada dalam fitur hazard via Leaflet Pip / Bounds
                                                if (hazardSubLayer.getBounds && hazardSubLayer.getBounds().contains(e.latlng)) {
                                                    L.DomEvent.stopPropagation(e);
                                                    bindFeaturePopup(hazardSubLayer.feature, hazardSubLayer, productConfig, e);
                                                    hazardClicked = true;
                                                }
                                            }
                                        }
                                    });
                                }
                            }

                            // 2. Jika tidak ada hazard di lokasi tersebut, panggil popup area aman (kabupaten)
                            if (!hazardClicked) {
                                L.DomEvent.stopPropagation(e);
                                if (typeof generateGlobalPopup === 'function') {
                                    generateGlobalPopup(e, feature);
                                } else if (typeof window.handleMapClick === 'function') {
                                    window.handleMapClick(e, feature);
                                }
                            }
                        });
                    }
                }).addTo(map);

                if (kabupatenLayer) kabupatenLayer.bringToFront();
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
                    style: {
                        color: "#0284c7",        // Garis hitam murni v1.0
                        weight: 2.0,             // Ketebalan garis 2.0px
                        fillColor: "transparent",
                        fillOpacity: 0,
                        interactive: false       // Klik tidak akan terhalang oleh garis provinsi
                    }
                }).addTo(map);

                if (provinsiLayer) provinsiLayer.bringToFront();
            })
            .catch(err => console.warn("Peringatan Admin Provinsi:", err.message));
    }
}
