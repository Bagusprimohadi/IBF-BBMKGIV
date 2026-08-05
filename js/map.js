// ==========================================
// MAP.JS - INISIALISASI PETA UTAMA LEAFLET V1.5 (PRECISION POPUP FIX)
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
        center: CONFIG.map.defaultCenter || [-1.75, 100.25],
        zoom: CONFIG.map.defaultZoom || 5,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: false 
    });

    // Tombol Zoom di Sudut Kanan Bawah
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Event Klik Global pada Peta (Hanya terpicu jika menglik area KOSONG / NON-HAZARD)
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
 * Dibuat interactive: false agar TIDAK MEMBLOKIR klik ke layer hazard di bawahnya,
 * tetapi garis batas hitam v1.0 tetap dipaksa di depan (bringToFront) agar terlihat jelas.
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
                        color: "#rgba(100, 116, 139, 0.4)",        // Garis hitam murni v1.0
                        weight: 0.8,             // Ketebalan 0.8px
                        fillColor: "transparent",
                        fillOpacity: 0,
                        interactive: false       // KUNCI: Biarkan klik tembus ke poligon hazard di bawahnya secara presisi
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
                        weight: 2.0,             // Ketebalan 2.0px
                        fillColor: "transparent",
                        fillOpacity: 0,
                        interactive: false       // Non-interaktif agar tidak memblokir klik
                    }
                }).addTo(map);

                if (provinsiLayer) provinsiLayer.bringToFront();
            })
            .catch(err => console.warn("Peringatan Admin Provinsi:", err.message));
    }
}
