// ==========================================
// MAP.JS - INISIALISASI PETA UTAMA LEAFLET V1.3 (FULL REVISED)
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
                        color: "rgba(100, 116, 139, 0.4)",        // Garis hitam murni v1.0
                        weight: 0.8,             // Ketebalan garis 0.8px
                        fillColor: "#ffffff",
                        fillOpacity: 0.001       // Sangat transparan untuk penangkapan klik kursor
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

                        // Penanganan Klik Pintar (Smart Propagation)
                        layer.on('click', function (e) {
                            let hasHazardUnderneath = false;

                            // Cek apakah ada layer hazard/risiko yang aktif tepat di bawah koordinat klik
                            if (typeof activeOverlayLayer !== 'undefined' && activeOverlayLayer) {
                                if (typeof activeOverlayLayer.eachLayer === 'function') {
                                    activeOverlayLayer.eachLayer(function (hazardSubLayer) {
                                        if (hazardSubLayer.getBounds && hazardSubLayer.getBounds().contains(e.latlng)) {
                                            hasHazardUnderneath = true;
                                        }
                                    });
                                }
                            }

                            // Jika ada poligon hazard di bawah kursor, serahkan event klik ke layer hazard
                            if (hasHazardUnderneath) {
                                return;
                            }

                            // Jika berada di zona aman/luar hazard, tampilkan pop-up wilayah normal
                            L.DomEvent.stopPropagation(e);
                            if (typeof generateGlobalPopup === 'function') {
                                generateGlobalPopup(e, feature);
                            } else if (typeof window.handleMapClick === 'function') {
                                window.handleMapClick(e, feature);
                            }
                        });
                    }
                }).addTo(map);

                // Paksa batas kabupaten selalu berada di atas layer hazard
                if (kabupatenLayer) kabupatenLayer.bringToFront();
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
                        color: "#0284c7",        // Garis hitam murni v1.0
                        weight: 2.0,             // Ketebalan garis 2.0px (lebih tebal)
                        fillColor: "transparent",
                        fillOpacity: 0,
                        interactive: false       // Mencegah pemblokiran klik ke layer bawahnya
                    }
                }).addTo(map);

                // Paksa batas provinsi selalu berada di paling depan
                if (provinsiLayer) provinsiLayer.bringToFront();
            })
            .catch(err => console.warn("Peringatan Admin Provinsi:", err.message));
    }
}
