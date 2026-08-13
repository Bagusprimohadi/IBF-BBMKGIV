// ==========================================
// APP.JS - ENTRY POINT UTAMA APLIKASI V1.2.3
// - Supporting Dual Image Overlay (Shaded & Contour) + JSON Metadata
// - Supporting Categorical GeoJSON Vector Layers
// ==========================================

// Variable State Global Aplikasi
let currentCategory = 'hazard';
let currentProductKey = 'angin';
let currentDayIndex = 0;

// Layer Active Handlers
let currentGeoJsonLayer = null;      // Untuk Layer Vektor GeoJSON (Hazard / Risiko)
let currentShadedOverlay = null;     // Untuk PNG Shaded Overlay (Harian)
let currentContourOverlay = null;    // Untuk PNG Contour Overlay (Harian)
let currentOverlayGroup = null;      // Group Container Dual PNG Overlay

// ==========================================
// FUNGSI KONTROL UI GLOBAL & DROPDOWN
// ==========================================

/**
 * Fungsi untuk membuka/menutup dropdown menu
 * @param {string} id - ID dari container dropdown
 */
function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (dropdown) {
        // 1. Tutup semua dropdown lain yang sedang terbuka agar tidak bertumpuk
        const allDropdowns = document.querySelectorAll('.dropdown-wrapper');
        allDropdowns.forEach(dw => {
            if (dw.id !== id) dw.classList.remove('active');
        });
        
        // 2. Buka/tutup dropdown yang sedang diklik
        dropdown.classList.toggle('active');
    }
}

/**
 * Tutup semua menu dropdown yang terbuka
 */
function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-wrapper');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}

// Event Global: Menutup menu dropdown saat pengguna mengklik area luar menu / peta
window.addEventListener('click', function (e) {
    if (!e.target.matches('.dropdown-btn') && !e.target.closest('.dropdown-btn')) {
        closeAllDropdowns();
    }
});

/**
 * Membuka atau menutup (minimize) panel kontrol di layar HP
 */
function toggleMobilePanel() {
    const panel = document.getElementById('mobilePanel');
    if (panel) {
        panel.classList.toggle('collapsed');
    }
}

// ==========================================
// MANAGEMENT SWITCH PRODUCT & LOAD DATA
// ==========================================

/**
 * Mengganti produk aktif (Harian, Hazard, atau Risiko)
 * @param {string} category - 'harian' | 'hazard' | 'risiko'
 * @param {string} productKey - Kunci produk (contoh: 'swh', 'wind_mean', 'angin')
 */
function switchProduct(category, productKey) {
    closeAllDropdowns();

    if (!CONFIG.products[category] || !CONFIG.products[category][productKey]) {
        console.error(`❌ Produk tidak ditemukan: category=${category}, key=${productKey}`);
        return;
    }

    currentCategory = category;
    currentProductKey = productKey;

    const productCfg = CONFIG.products[category][productKey];

    // Update Judul & Subtitle Header
    updateHeaderInfo(productCfg.title, productCfg.subtitle);

    // Render Ulang Tombol Hari (H0 s/d H+6)
    if (typeof renderDayButtons === 'function') {
        renderDayButtons(productCfg.days || 7);
    }

    // Render Legenda (Kategorikal / Kontinu)
    if (typeof renderLegend === 'function') {
        renderLegend(productCfg);
    }

    // Load Data Peta untuk Hari Saat Ini
    loadProductData(currentDayIndex);

    // Update URL State jika modul tersedia
    if (typeof UrlState !== 'undefined' && typeof UrlState.updateUrl === 'function') {
        UrlState.updateUrl(category, productKey, currentDayIndex);
    }
}

/**
 * Membersihkan seluruh layer aktif dari peta sebelum memuat data baru
 */
function clearAllMapLayers() {
    if (!window.map) return;

    // Hapus GeoJSON Vector Layer
    if (currentGeoJsonLayer) {
        window.map.removeLayer(currentGeoJsonLayer);
        currentGeoJsonLayer = null;
    }

    // Hapus Dual PNG Image Overlay Group
    if (currentOverlayGroup) {
        window.map.removeLayer(currentOverlayGroup);
        currentOverlayGroup = null;
        currentShadedOverlay = null;
        currentContourOverlay = null;
    }
}

/**
 * Memuat data berdasarkan tipe produk (Image Overlay Dual PNG vs GeoJSON Vector)
 * @param {number} dayIndex - Indeks hari (0 s/d 6)
 */
function loadProductData(dayIndex) {
    currentDayIndex = dayIndex;
    const productCfg = CONFIG.products[currentCategory][currentProductKey];

    if (typeof showLoader === 'function') showLoader();

    // Clear Layer Lama
    clearAllMapLayers();

    // BRANCHING ENGINE: IMAGE OVERLAY (PNG HARIAN) vs GEOJSON (HAZARD / RISIKO)
    if (productCfg.type === 'image_overlay') {
        loadDualImageOverlay(productCfg, dayIndex);
    } else {
        loadGeoJsonVector(productCfg, dayIndex);
    }
}

/**
 * ENGINE 1: Memuat Dual PNG Image Overlay (Shaded & Contour) dengan Metadata JSON
 */
function loadDualImageOverlay(productCfg, dayIndex) {
    const jsonPath = `${productCfg.folder}${productCfg.prefix}${dayIndex}.json`;
    const shadedPngPath = `${productCfg.folder}${productCfg.prefix}${dayIndex}_shaded.png`;
    const contourPngPath = `${productCfg.folder}${productCfg.prefix}${dayIndex}_contour.png`;

    fetch(jsonPath)
        .then(response => {
            if (!response.ok) throw new Error(`Gagal membaca metadata JSON: ${jsonPath}`);
            return response.json();
        })
        .then(metaData => {
            if (!window.map) return;

            // Ekstraksi Bounding Box Leaflet dari JSON Metadata
            let bounds = metaData.bounds?.leaflet_bounds;
            if (!bounds) {
                // Fallback Bounding Box Standar Indonesia jika JSON tidak punya leaflet_bounds
                bounds = [[-11.0, 94.0], [6.0, 141.0]];
            }

            // Ambil nilai transparansi saat ini dari slider
            const opacityInput = document.getElementById('opacityRange');
            const currentOpacity = opacityInput ? parseFloat(opacityInput.value) / 100 : 0.65;

            // 1. Layer Shaded (Area Warna Gradasi)
            currentShadedOverlay = L.imageOverlay(shadedPngPath, bounds, {
                opacity: currentOpacity,
                interactive: false
            });

            // 2. Layer Contour (Garis Kontur & Label Nilai)
            currentContourOverlay = L.imageOverlay(contourPngPath, bounds, {
                opacity: Math.min(currentOpacity + 0.2, 1.0), // Kontur dibuat sedikit lebih tegas
                interactive: false
            });

            // Gabungkan kedua PNG ke dalam LayerGroup
            currentOverlayGroup = L.layerGroup([currentShadedOverlay, currentContourOverlay]).addTo(window.map);

            // Update Tanggal Validitas Header
            if (metaData.valid_time) {
                updateValidDateTextWithDateStr(metaData.valid_time, dayIndex);
            } else {
                updateValidDateText(dayIndex);
            }
        })
        .catch(err => {
            console.warn(`⚠️ Gagal memuat Dual PNG Overlay: ${shadedPngPath}`, err);
        })
        .finally(() => {
            if (typeof hideLoader === 'function') hideLoader();
        });
}

/**
 * ENGINE 2: Memuat Vektor GeoJSON Kategorikal (Hazard / Risiko)
 */
function loadGeoJsonVector(productCfg, dayIndex) {
    const filePath = `${productCfg.folder}${productCfg.prefix}${dayIndex}${productCfg.extension || '.geojson'}`;

    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!window.map) return;

            currentGeoJsonLayer = L.geoJSON(data, {
                style: function (feature) {
                    const level = feature.properties ? (feature.properties.status || feature.properties.level) : 'normal';
                    const legendItem = productCfg.legends ? productCfg.legends.find(l => l.level === level) : null;
                    const color = legendItem ? legendItem.color : 'transparent';

                    return {
                        fillColor: color,
                        fillOpacity: color === 'transparent' ? 0 : 0.65,
                        weight: 1,
                        color: '#475569',
                        opacity: 0.5
                    };
                },
                onEachFeature: function (feature, layer) {
                    if (typeof bindHoverEffect === 'function') {
                        bindHoverEffect(layer);
                    }

                    layer.on('click', function (e) {
                        if (typeof showCustomPopup === 'function') {
                            showCustomPopup(e, feature, layer, productCfg, currentCategory, currentProductKey, currentDayIndex);
                        }
                    });
                }
            }).addTo(window.map);

            // Terapkan transparansi slider jika ada
            const rangeInput = document.getElementById('opacityRange');
            if (rangeInput && typeof updateOpacity === 'function') {
                updateOpacity(rangeInput.value);
            }

            // Update Teks Tanggal Validitas Header
            updateValidDateText(dayIndex);
        })
        .catch(err => {
            console.warn(`⚠️ Gagal memuat data GeoJSON: ${filePath}`, err);
        })
        .finally(() => {
            if (typeof hideLoader === 'function') hideLoader();
        });
}

/**
 * Pengontrol Transparansi Global (Mendukung PNG Overlay & GeoJSON Vector)
 */
function updateOpacity(val) {
    const opacityVal = parseFloat(val) / 100;
    const labelEl = document.getElementById('opacityVal');
    if (labelEl) labelEl.innerText = `${val}%`;

    // 1. Jika layer aktif adalah Dual PNG Overlay
    if (currentShadedOverlay) {
        currentShadedOverlay.setOpacity(opacityVal);
    }
    if (currentContourOverlay) {
        currentContourOverlay.setOpacity(Math.min(opacityVal + 0.2, 1.0));
    }

    // 2. Jika layer aktif adalah GeoJSON Vector
    if (currentGeoJsonLayer) {
        currentGeoJsonLayer.setStyle({
            fillOpacity: opacityVal,
            opacity: Math.min(opacityVal + 0.2, 1.0)
        });
    }
}

/**
 * Menyesuaikan Teks Header Utama
 */
function updateHeaderInfo(title, subtitle) {
    const titleEl = document.getElementById('hazardTitle');
    const subEl = document.getElementById('systemSubtitle');
    if (titleEl) titleEl.innerText = title || "Prediksi IBF BBMKG IV";
    if (subEl) subEl.innerText = subtitle || "BMKG Command Center";
}

/**
 * Menyesuaikan Teks Validitas Tanggal Hari Ini s/d H+6 (Berdasarkan Indeks Hari)
 */
function updateValidDateText(dayIndex) {
    const dateEl = document.getElementById('validDateText');
    if (!dateEl) return;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayIndex);

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = targetDate.toLocaleDateString('id-ID', options);

    dateEl.innerText = `Valid: ${dateStr} (Hari H+${dayIndex})`;
}

/**
 * Menyesuaikan Teks Validitas Tanggal Langsung dari Metadata JSON (`valid_time`)
 */
function updateValidDateTextWithDateStr(dateStrRaw, dayIndex) {
    const dateEl = document.getElementById('validDateText');
    if (!dateEl) return;

    if (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') {
        const formattedDate = Utils.formatTanggal(dateStrRaw);
        dateEl.innerText = `Valid: ${formattedDate} (Hari H+${dayIndex})`;
    } else {
        dateEl.innerText = `Valid: ${dateStrRaw} (Hari H+${dayIndex})`;
    }
}


// ==========================================
// INISIALISASI SISTEM SAAT DOM SIAP
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Menginisialisasi IBF WebGIS Operational System V1.2.3 - BBMKG IV...");

    // 1. Tampilkan indikator loading awal
    if (typeof showLoader === 'function') {
        showLoader();
    } else if (typeof Loader !== 'undefined' && typeof Loader.show === 'function') {
        Loader.show("Menyiapkan Command Center WebGIS...");
    }

    // 2. Inisialisasi Peta Dasar & Basemap
    if (typeof initMap === 'function') {
        initMap();
    }

    if (typeof initBasemaps === 'function') {
        initBasemaps();
    } else if (typeof initBasemap === 'function') {
        initBasemap();
    }

    // 3. Inisialisasi Kontrol Tambahan UI
    if (typeof initScaleBar === 'function') initScaleBar();
    if (typeof initSearchControl === 'function') initSearchControl();

    // 4. Tangani State awal aplikasi dari URL atau muat produk default (Harian: SWH)
    if (typeof UrlState !== 'undefined' && typeof UrlState.applyInitialState === 'function') {
        UrlState.applyInitialState();
    } else {
        switchProduct('harian', 'swh');
    }

    // Otomatis minimalkan panel jika dibuka lewat HP (layar <= 767px)
    if (window.innerWidth <= 767) {
        const panel = document.getElementById('mobilePanel');
        if (panel) {
            panel.classList.add('collapsed');
        }
    }

    // 5. Sembunyikan loader setelah inisialisasi selesai
    setTimeout(() => {
        if (typeof hideLoader === 'function') {
            hideLoader();
        } else if (typeof Loader !== 'undefined' && typeof Loader.hide === 'function') {
            Loader.hide();
        }
        console.log("✅ IBF WebGIS V1.2.3 Berhasil Dimuat dan Siap Digunakan.");
    }, 800);
});
