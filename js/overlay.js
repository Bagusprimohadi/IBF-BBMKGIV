// ==========================================
// OVERLAY.JS - MANAJEMEN LAYER GEOJSON & VETOR V1.2 (PURE GEOJSON)
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

    // 4. Muat Struktur Hari / Timeline Otomatis (Default 3 Hari: day_0, day_1, day_2)
    loadProductTimeline(category, productKey);
}

/**
 * Menyiapkan tombol navigasi waktu (Hari) untuk produk GeoJSON
 */
function loadProductTimeline(category, productKey) {
    let productConfig = CONFIG.products[category][productKey];
    let dateTextEl = document.getElementById('validDateText');
    if (dateTextEl) dateTextEl.innerText = "Valid: Memuat data...";

    const btnContainer = document.getElementById('dayButtonsContainer');
    if (btnContainer) {
        btnContainer.innerHTML = "";
    }

    // Asumsi standar prediksi harian 3 hari ke depan (H-0, H+1, H+2 / index 0, 1, 2)
    // Atau bisa disesuaikan dengan jumlah file manifest jika tersedia
    window.validDates = ["Hari ke-1", "Hari ke-2", "Hari ke-3"]; 
    window.imageLayers = []; // Kompatibilitas fungsi playback/timeline eksternal jika ada

    for (let i = 0; i < 3; i++) {
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

    // Muat hari pertama sebagai default tampilan awal
    loadDay(0);
}

/**
 * Memuat dan menampilkan file GeoJSON berdasarkan indeks hari (0, 1, 2)
 */
function loadDay(index) {
    window.currentIndex = index;
    let productConfig = CONFIG.products[currentCategory][currentProductKey];
    let uniqueInit = new Date().getTime(); // Mencegah cache browser

    // Susun path file GeoJSON: contoh data/hazard/angin/angin_day_0.geojson
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
            // Tangkap tanggal valid jika disertakan dalam properti fitur pertama
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
                    // Ambil warna langsung dari kolom 'color' yang dihasilkan Python
                    let fillColor = feature.properties.color || "#FFA500";
                    return {
                        fillColor: fillColor,
                        weight: 1,
                        opacity: 0.9,
                        color: "#333333", // Warna garis batas poligon
                        fillOpacity: currentOpacity // Mengikuti slider opacity aktif
                    };
                },
                onEachFeature: function (feature, layer) {
                    // Panggil popup interaktif dari popup.js saat poligon diklik
                    if (typeof bindFeaturePopup === 'function') {
                        bindFeaturePopup(feature, layer, productConfig);
                    }
                }
            }).addTo(map);

            // Update status tombol aktif di UI
            for (let i = 0; i < 3; i++) {
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
