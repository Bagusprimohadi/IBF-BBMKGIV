// ==========================================
// APP.JS - ENTRY POINT UTAMA APLIKASI V1.2
// ==========================================

// Variable State Aplikasi
let currentCategory = 'hazard';
let currentProductKey = 'angin';
let currentDayIndex = 0;
let currentGeoJsonLayer = null;

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
// LOGIKA BANTUAN DATA KONTINU (FITUR 1)
// ==========================================

/**
 * Mengonversi hex warna ke objek RGB
 */
function hexToRgb(hex) {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

/**
 * Menginterpolasi nilai numerik ke warna gradasi terikat min-max
 */
function getColorFromRamp(value, min, max, colorRamp) {
    if (value === null || value === undefined || isNaN(value)) return '#cbd5e1';
    if (value <= min) return colorRamp[0];
    if (value >= max) return colorRamp[colorRamp.length - 1];

    const norm = (value - min) / (max - min);
    const totalSegments = colorRamp.length - 1;
    const segment = Math.min(Math.floor(norm * totalSegments), totalSegments - 1);
    const segmentNorm = (norm * totalSegments) - segment;

    const c1 = hexToRgb(colorRamp[segment]);
    const c2 = hexToRgb(colorRamp[segment + 1]);

    const r = Math.round(c1.r + (c2.r - c1.r) * segmentNorm);
    const g = Math.round(c1.g + (c2.g - c1.g) * segmentNorm);
    const b = Math.round(c1.b + (c2.b - c1.b) * segmentNorm);

    return `rgb(${r}, ${g}, ${b})`;
}

// ==========================================
// MANAGEMENT SWITCH PRODUCT & LOAD DATA
// ==========================================

/**
 * Mengganti produk aktif (Harian, Hazard, atau Risiko)
 * @param {string} category - 'harian' | 'hazard' | 'risiko'
 * @param {string} productKey - Kunci produk (contoh: 'swh', 'angin', 'risiko_banjir')
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
 * Memuat file GeoJSON berdasarkan produk dan indeks hari
 * @param {number} dayIndex - Indeks hari (0 s/d 6)
 */
function loadProductData(dayIndex) {
    currentDayIndex = dayIndex;
    const productCfg = CONFIG.products[currentCategory][currentProductKey];
    const filePath = `${productCfg.folder}${productCfg.prefix}${dayIndex}${productCfg.extension}`;

    if (typeof showLoader === 'function') showLoader();

    // Hapus layer lama jika ada
    if (currentGeoJsonLayer && window.map) {
        window.map.removeLayer(currentGeoJsonLayer);
        currentGeoJsonLayer = null;
    }

    fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!window.map) return;

            const isContinuous = productCfg.type === 'continuous';

            currentGeoJsonLayer = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    if (isContinuous) {
                        const val = feature.properties ? feature.properties.value : null;
                        const fillColor = getColorFromRamp(val, productCfg.min, productCfg.max, productCfg.colorRamp);

                        return L.circleMarker(latlng, {
                            radius: 6,
                            fillColor: fillColor,
                            color: '#ffffff',
                            weight: 0.8,
                            opacity: 0.9,
                            fillOpacity: 0.85
                        });
                    }
                },
                style: function (feature) {
                    if (!isContinuous) {
                        // Logic style polygon kategorikal (Hazard / Risiko)
                        const level = feature.properties ? (feature.properties.status || feature.properties.level) : 'normal';
                        const legendItem = productCfg.legends.find(l => l.level === level);
                        const color = legendItem ? legendItem.color : 'transparent';

                        return {
                            fillColor: color,
                            fillOpacity: color === 'transparent' ? 0 : 0.65,
                            weight: 1,
                            color: '#475569',
                            opacity: 0.5
                        };
                    }
                },
                onEachFeature: function (feature, layer) {
                    // Bind Hover Effect jika tersedia
                    if (typeof bindHoverEffect === 'function') {
                        bindHoverEffect(layer);
                    }

                    // Bind Popup Interaktif
                    layer.on('click', function (e) {
                        if (typeof showCustomPopup === 'function') {
                            showCustomPopup(e, feature, layer, productCfg, currentCategory, currentProductKey, currentDayIndex);
                        }
                    });
                }
            }).addTo(window.map);

            // Terapkan transparansi slider jika ada
            if (typeof updateOpacity === 'function') {
                const rangeInput = document.getElementById('opacityRange');
                if (rangeInput) updateOpacity(rangeInput.value);
            }

            // Update Teks Tanggal Validitas Header
            updateValidDateText(dayIndex);
        })
        .catch(err => {
            console.warn(`⚠️ Gagal memuat data: ${filePath}`, err);
        })
        .finally(() => {
            if (typeof hideLoader === 'function') hideLoader();
        });
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
 * Menyesuaikan Teks Validitas Tanggal Hari Ini s/d H+6
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


// ==========================================
// INISIALISASI SISTEM SAAT DOM SIAP
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Menginisialisasi IBF WebGIS Operational System V1.2 - BBMKG IV...");

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
        console.log("✅ IBF WebGIS V1.2 Berhasil Dimuat dan Siap Digunakan.");
    }, 800);
});
