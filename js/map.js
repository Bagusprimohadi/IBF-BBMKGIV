// ==========================================
// MAP.JS - INISIALISASI PETA UTAMA LEAFLET V2.0 (FINAL PERFECT FIX)
// ==========================================

// Variabel Global Instance Peta
var map = null;

// Variabel Layer Administrasi
let provinsiLayer = null;
let kabupatenLayerVisual = null;
let kabupatenLayerBase = null;

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

    // 1. PANE BAWAH (Z-Index 390: Di bawah overlay Hazard)
    map.createPane('paneKabupatenBase');
    map.getPane('paneKabupatenBase').style.zIndex = 390;

    // 2. PANE ATAS (Z-Index 601 & 602: Di atas overlay Hazard)
    map.createPane('paneKabupatenTop');
    map.getPane('paneKabupatenTop').style.zIndex = 601;
    map.getPane('paneKabupatenTop').style.pointerEvents = 'none'; // Kunci agar klik tembus ke bawah

    map.createPane('paneProvinsiTop');
    map.getPane('paneProvinsiTop').style.zIndex = 602;
    map.getPane('paneProvinsiTop').style.pointerEvents = 'none'; // Kunci agar klik tembus ke bawah

    // Tombol Zoom di Kanan Bawah
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Event Klik Global Peta (Untuk area kosong/luar poligon)
    map.on('click', function (e) {
        let foundAdmin = null;
        
        // Cari kabupaten di koordinat klik
        if (kabupatenLayerBase) {
            kabupatenLayerBase.eachLayer(function (layer) {
                if (layer.getBounds && layer.getBounds().contains(e.latlng)) {
                    foundAdmin = layer.feature;
                }
            });
        }

        if (typeof generateGlobalPopup === 'function') {
            generateGlobalPopup(e, foundAdmin);
        }
    });

    // Memuat layer batas administrasi
    loadAdminBoundaries();

    return map;
}

/**
 * Memuat batas administrasi dengan teknik Layer Ganda
 */
function loadAdminBoundaries() {
    if (!map) return;

    // 1. Muat GeoJSON Kabupaten / Kota
    if (CONFIG.paths && CONFIG.paths.adminKabupaten) {
        fetch(CONFIG.paths.adminKabupaten)
            .then(res => {
                if (!res.ok) throw new Error("File admin kabupaten tidak ditemukan");
                return res.json();
            })
            .then(data => {
                // LAYER A: BASE INTERAKTIF (Tersembunyi di bawah Hazard untuk pembacaan nama wilayah)
                kabupatenLayerBase = L.geoJSON(data, {
                    pane: 'paneKabupatenBase',
                    style: {
                        weight: 0,
                        fillColor: "#ffffff",
                        fillOpacity: 0.001,
                        color: "transparent"
                    },
                    onEachFeature: function (feature, layer) {
                        let props = feature.properties || {};
                        let namaWilayah = props.WADMKK || props.kabupaten || props.KABUPATEN || props.NAME_2 || props.NAME;

                        // Tooltip Hover Nama Kabupaten
                        if (namaWilayah) {
                            layer.bindTooltip(namaWilayah, { 
                                sticky: true, 
                                className: 'map-tooltip' 
                            });
                        }

                        // Event Klik Area Kosong/Aman
                        layer.on('click', function (e) {
                            L.DomEvent.stopPropagation(e);
                            if (typeof generateGlobalPopup === 'function') {
                                generateGlobalPopup(e, feature);
                            }
                        });
                    }
                }).addTo(map);

                // LAYER B: VISUAL GARIS ATAS (Hitam Murni Sesuai versi 1.0)
                kabupatenLayerVisual = L.geoJSON(data, {
                    pane: 'paneKabupatenTop',
                    style: {
                        color: "rgba(100, 116, 139, 0.4)",        // Garis hitam murni mutlak v1.0
                        weight: 0.8,             // Ketebalan 0.8px Sesuai v1.0
                        opacity: 1,
                        fill: false
                    }
                }).addTo(map);
            })
            .catch(err => console.warn("Peringatan Admin Kabupaten:", err.message));
    }

    // 2. Muat GeoJSON Provinsi (Hitam Murni Sesuai versi 1.0)
    if (CONFIG.paths && CONFIG.paths.adminProvinsi) {
        fetch(CONFIG.paths.adminProvinsi)
            .then(res => {
                if (!res.ok) throw new Error("File admin provinsi tidak ditemukan");
                return res.json();
            })
            .then(data => {
                provinsiLayer = L.geoJSON(data, {
                    pane: 'paneProvinsiTop',
                    style: {
                        color: "#0284c7",        // Garis hitam murni mutlak v1.0
                        weight: 2.0,             // Ketebalan 2.0px Sesuai v1.0
                        opacity: 1,
                        fill: false
                    }
                }).addTo(map);
            })
            .catch(err => console.warn("Peringatan Admin Provinsi:", err.message));
    }
}
