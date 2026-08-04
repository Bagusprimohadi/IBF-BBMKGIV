// ==========================================
// OVERLAY.JS - MANAJEMEN LAYER GEOJSON & VEKTOR V1.3 (PURE GEOJSON)
// ==========================================

let currentCategory = 'hazard'; // Default kategori awal ('hazard' atau 'risiko')
let currentProductKey = 'angin'; // Default produk awal
let currentOpacity = 0.65; // Default transparan area poligon (65%)
let activeOverlayLayer = null; // Menyimpan layer GeoJSON aktif di peta

/**
 * Fungsi utama untuk mengganti produk dari menu tombol terpisah (Bahaya / Risiko)
 * @param {string} category ('hazard' atau 'risiko')
 * @param {string} productKey (kunci produk dari CONFIG.products)
 */
function switchProduct(category, productKey) {
    if (typeof stopPlay === 'function') stopPlay();
    
    currentCategory = category;
    currentProductKey = productKey;
    
    // Tutup semua dropdown terbuka
    if (typeof closeAllDropdowns === 'function') {
        closeAllDropdowns();
    } else if (typeof toggleDropdown === 'function') {
        document.querySelectorAll('.dropdown-wrapper').forEach(el => el.classList.remove('active'));
    }

    // Ambil konfigurasi dari CONFIG (config.js)
    let productConfig = CONFIG.products[category]?.[productKey];
    if (!productConfig) {
        console.error("Konfigurasi produk tidak ditemukan untuk:", category, productKey);
        return;
    }

    // 1. Update Judul di Header Utama secara Dinamis
    let subtitleEl = document.getElementById('systemSubtitle');
    let titleEl = document.getElementById('hazardTitle');
    if (subtitleEl) subtitleEl.innerText = productConfig.subtitle || '';
    if (titleEl) titleEl.innerText = productConfig.title || productConfig.name || '';

    // 2. Render Legenda Sesuai Produk Aktif
    if (typeof renderLegend === 'function') {
        renderLegend(productConfig);
    }

    // 3. Bersihkan Layer GeoJSON Sebelumnya dari Peta
    if (activeOverlayLayer) {
        map.removeLayer(activeOverlayLayer);
        activeOverlayLayer = null;
    }

    // 4. Muat Struktur Hari / Timeline Otomatis
    loadProductTimeline(category, productKey);
}

/**
 * Menyiapkan tombol navigasi waktu (Hari) untuk produk GeoJSON (H0, H+1, H+2, dst.)
 */
function loadProductTimeline(category, productKey) {
    let productConfig = CONFIG.products[category][productKey];
    let dateTextEl = document.getElementById('validDateText');
    if (dateTextEl) dateTextEl.innerText = "Valid: Memuat data...";

    const btnContainer = document.getElementById('dayButtonsContainer');
    if (btnContainer) {
        btnContainer.innerHTML = "";
    }

    // Ambil jumlah hari prediksi dari CONFIG (default 3 hari jika tidak ditentukan)
    let totalDays = productConfig.days || 3;
    window.validDates = Array.from({ length: totalDays }, (_, i) => `Hari ke-${i + 1}`); 
    window.imageLayers = []; // Kompatibilitas fungsi playback/timeline eksternal

    for (let i = 0; i < totalDays; i++) {
        if (btnContainer) {
            let btn = document.createElement('button');
            btn.className = 'time-btn';
            btn.id = 'day-btn-' + i;
            btn.innerText = `H${i === 0 ? '0' : '+' + i}`; 
            btn.onclick = function() {    
                if (typeof stopPlay === 'function') stopPlay();    
                loadDay(i);    
            };
            btnContainer.appendChild(btn);
        }
    }

    // Muat hari pertama (H0 / index 0) sebagai tampilan awal
    loadDay(0);
}

/**
 * Mendapatkan warna visual fitur dari atribut 'color' atau memetakan dari 'legends' config.js
 */
function getFeatureColor(feature, productConfig) {
    let props = feature.properties || {};
    
    // 1. Jika Python mengirimkan warna HEX langsung
    if (props.color) return props.color;

    // 2. Fallback: Cari dari daftar legends di config.js berdasarkan level/kategori
    if (productConfig && productConfig.legends && Array.isArray(productConfig.legends)) {
        let valKey = String(props.level || props.kategori || props.code || '').toLowerCase();
        let matched = productConfig.legends.find(l => 
            String(l.level || l.label || l.code || '').toLowerCase() === valKey
        );
        if (matched && matched.color) return matched.color;
    }

    // 3. Default fallback warna cyan futuristik
    return "#38bdf8";
}

/**
 * Memuat dan menampilkan file GeoJSON berdasarkan indeks hari (0, 1, 2)
 */
function loadDay(index) {
    window.currentIndex = index;
    let productConfig = CONFIG.products[currentCategory][currentProductKey];
    let uniqueInit = new Date().getTime(); // Mencegah cache browser

    // Susun path file GeoJSON (contoh: data/hazard/angin/angin_day_0.geojson)
    let filePath = `${productConfig.folder}${productConfig.prefix}${index}${productConfig.extension}?v=${uniqueInit}`;

    let dateTextEl = document.getElementById('validDateText');
    if (dateTextEl) dateTextEl.innerText = `Valid: Memuat Hari ke-${index + 1}...`;

    // Hapus layer aktif sebelumnya
    if (activeOverlayLayer) {
        map.removeLayer(activeOverlayLayer);
        activeOverlayLayer = null;
    }

    if (typeof showLoader === 'function') showLoader();

    fetch(filePath)
        .then(res => {
            if (!res.ok) throw new Error("File GeoJSON tidak ditemukan");
            return res.json();
        })
        .then(geojsonData => {
            // Tangkap tanggal valid dari properti fitur pertama jika ada
            if (geojsonData.features && geojsonData.features.length > 0) {
                let firstProps = geojsonData.features[0].properties;
                if (firstProps.date && dateTextEl && typeof Utils !== 'undefined') {
                    dateTextEl.innerText = `Valid: ${Utils.formatTanggal(firstProps.date)}`;
                } else if (dateTextEl) {
                    dateTextEl.innerText = `Valid: Prediksi Hari ke-${index + 1}`;
                }
            }

            // Render GeoJSON ke Peta Leaflet
            activeOverlayLayer = L.geoJSON(geojsonData, {
                style: function (feature) {
                    let fillColor = getFeatureColor(feature, productConfig);
                    return {
                        fillColor: fillColor,
                        weight: 1.5,
                        opacity: 0.9,
                        color: "rgba(255, 255, 255, 0.5)", // Garis batas terang futuristik
                        fillOpacity: currentOpacity // Mengikuti slider opacity aktif
                    };
                },
                // Penanganan khusus jika data geometri bertipe Point / Titik
                pointToLayer: function (feature, latlng) {
                    let fillColor = getFeatureColor(feature, productConfig);
                    return L.circleMarker(latlng, {
                        radius: 7,
                        fillColor: fillColor,
                        color: "#ffffff",
                        weight: 1.5,
                        opacity: 1,
                        fillOpacity: currentOpacity
                    });
                },
                onEachFeature: function (feature, layer) {
                    // Event Sorot Mouseover & Klik
                    layer.on({
                        mouseover: function (e) {
                            let l = e.target;
                            l.setStyle({
                                weight: 3,
                                color: "#38bdf8"
                            });
                            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                                l.bringToFront();
                            }
                        },
                        mouseout: function (e) {
                            if (activeOverlayLayer) {
                                activeOverlayLayer.resetStyle(e.target);
                            }
                        },
                        click: function (e) {
                            // Hentikan propagasi agar tidak bentrok dengan event klik peta dasar
                            L.DomEvent.stopPropagation(e);
                            
                            // Panggil popup interaktif dan teruskan objek event e (latlng)
                            if (typeof bindFeaturePopup === 'function') {
                                bindFeaturePopup(feature, layer, productConfig, e);
                            } else if (typeof generateGlobalPopup === 'function') {
                                generateGlobalPopup(e, feature);
                            }
                        }
                    });
                }
            }).addTo(map);

            // Update status tombol aktif di UI
            let totalDays = productConfig.days || 3;
            for (let i = 0; i < totalDays; i++) {
                let btn = document.getElementById('day-btn-' + i);
                if (btn) {
                    btn.classList.toggle('active', i === index);
                }
            }

            if (typeof hideLoader === 'function') hideLoader();
        })
        .catch(err => {
            console.warn("Gagal memuat GeoJSON:", err);
            if (dateTextEl) dateTextEl.innerText = "⚠️ Data Hari Ini Belum Tersedia";
            if (typeof hideLoader === 'function') hideLoader();
        });
}
