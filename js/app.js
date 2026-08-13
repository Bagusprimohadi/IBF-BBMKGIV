// ==========================================
// APP.JS - ENTRY POINT UTAMA APLIKASI V1.2.5
// - Hanya memuat Shaded PNG Overlay (Sesuai Permintaan)
// - Integrasi fungsi loadDay(i) untuk Navigasi Tanggal H0 s/d H+6
// - Bebas crash & terisolasi penuh dari kategori Hazard/Risiko
// ==========================================

// State Global Aplikasi (Attached to Window)
window.currentCategory = window.currentCategory || 'hazard';
window.currentProductKey = window.currentProductKey || 'angin';
window.currentDayIndex = window.currentDayIndex || 0;

// Layer Handlers
window.currentGeoJsonLayer = window.currentGeoJsonLayer || null;
window.currentShadedOverlay = window.currentShadedOverlay || null;

// ==========================================
// FUNGSI KONTROL UI GLOBAL
// ==========================================

function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (dropdown) {
        const allDropdowns = document.querySelectorAll('.dropdown-wrapper');
        allDropdowns.forEach(dw => {
            if (dw.id !== id) dw.classList.remove('active');
        });
        dropdown.classList.toggle('active');
    }
}

function closeAllDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-wrapper');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}

window.addEventListener('click', function (e) {
    if (!e.target.matches('.dropdown-btn') && !e.target.closest('.dropdown-btn')) {
        closeAllDropdowns();
    }
});

function toggleMobilePanel() {
    const panel = document.getElementById('mobilePanel');
    if (panel) {
        panel.classList.toggle('collapsed');
    }
}

// ==========================================
// MANAGEMENT SWITCH PRODUCT & LOAD DATA
// ==========================================

function switchProduct(category, productKey) {
    closeAllDropdowns();

    if (!CONFIG || !CONFIG.products || !CONFIG.products[category] || !CONFIG.products[category][productKey]) {
        console.error(`❌ Produk tidak ditemukan: category=${category}, key=${productKey}`);
        return;
    }

    window.currentCategory = category;
    window.currentProductKey = productKey;

    const productCfg = CONFIG.products[category][productKey];

    if (typeof updateHeaderInfo === 'function') updateHeaderInfo(productCfg.title, productCfg.subtitle);
    if (typeof renderDayButtons === 'function') renderDayButtons(productCfg.days || 7);
    if (typeof renderLegend === 'function') renderLegend(productCfg);

    // Muat data untuk hari saat ini
    loadProductData(window.currentDayIndex);

    if (typeof UrlState !== 'undefined' && typeof UrlState.updateUrl === 'function') {
        UrlState.updateUrl(category, productKey, window.currentDayIndex);
    }
}

function clearAllMapLayers() {
    if (!window.map) return;

    if (window.currentGeoJsonLayer) {
        window.map.removeLayer(window.currentGeoJsonLayer);
        window.currentGeoJsonLayer = null;
    }

    if (window.currentShadedOverlay) {
        window.map.removeLayer(window.currentShadedOverlay);
        window.currentShadedOverlay = null;
    }
}

/**
 * PUSAT NAVIGASI TANGGAL (Dipanggil oleh Tombol H0-H6 & Playback)
 */
function loadDay(dayIndex) {
    loadProductData(dayIndex);
}
// Bridge ke objek window agar playback.js / timeline.js bisa memanggil fungsi ini
window.loadDay = loadDay;

function loadProductData(dayIndex) {
    window.currentDayIndex = dayIndex;
    const productCfg = CONFIG.products[window.currentCategory][window.currentProductKey];

    if (typeof showLoader === 'function') showLoader();
    clearAllMapLayers();

    if (productCfg.type === 'image_overlay') {
        loadShadedImageOverlay(productCfg, dayIndex);
    } else {
        loadGeoJsonVector(productCfg, dayIndex);
    }
}

/**
 * LOADER KHUSUS PNG HARIAN (Murni HANYA Shaded PNG)
 */
function loadShadedImageOverlay(productCfg, dayIndex) {
    const jsonPath = `${productCfg.folder}${productCfg.prefix}${dayIndex}.json`;
    const shadedPngPath = `${productCfg.folder}${productCfg.prefix}${dayIndex}_shaded.png`;

    fetch(jsonPath)
        .then(response => {
            if (!response.ok) throw new Error(`Gagal membaca metadata JSON: ${jsonPath}`);
            return response.json();
        })
        .then(metaData => {
            if (!window.map) return;

            // Ambil Leaflet Bounds dari Metadata JSON
            let bounds = metaData.bounds?.leaflet_bounds || [[-11.0, 94.0], [6.0, 141.0]];
            const opacityInput = document.getElementById('opacityRange');
            const currentOpacity = opacityInput ? parseFloat(opacityInput.value) / 100 : 0.65;

            // Tempelkan Peta Shaded PNG ke Leaflet
            window.currentShadedOverlay = L.imageOverlay(shadedPngPath, bounds, {
                opacity: currentOpacity,
                interactive: false // Mematikan interaksi klik agar tidak memicu popup
            }).addTo(window.map);

            // Update Tanggal Validitas
            if (metaData.valid_time) {
                updateValidDateTextWithDateStr(metaData.valid_time, dayIndex);
            } else {
                updateValidDateText(dayIndex);
            }
        })
        .catch(err => {
            console.warn(`⚠️ Warning: Layer Shaded PNG Harian tidak ditemukan: ${shadedPngPath}`, err);
            updateValidDateText(dayIndex);
        })
        .finally(() => {
            if (typeof hideLoader === 'function') hideLoader();
        });
}

/**
 * LOADER KHUSUS GEOJSON (Hazard & Risiko)
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

            window.currentGeoJsonLayer = L.geoJSON(data, {
                style: function (feature) {
                    const level = feature.properties ? (feature.properties.status || feature.properties.level) : 'normal';
                    const legendItem = productCfg.legends ? productCfg.legends.find(l => l.level === level) : null;
                    const color = legendItem ? legendItem.color : 'transparent';
                    return { fillColor: color, fillOpacity: color === 'transparent' ? 0 : 0.65, weight: 1, color: '#475569', opacity: 0.5 };
                },
                onEachFeature: function (feature, layer) {
                    if (typeof bindHoverEffect === 'function') bindHoverEffect(layer);
                    layer.on('click', function (e) {
                        if (typeof showCustomPopup === 'function') showCustomPopup(e, feature, layer, productCfg, window.currentCategory, window.currentProductKey, window.currentDayIndex);
                    });
                }
            }).addTo(window.map);

            const rangeInput = document.getElementById('opacityRange');
            if (rangeInput && typeof updateOpacity === 'function') updateOpacity(rangeInput.value);
            updateValidDateText(dayIndex);
        })
        .catch(err => console.warn(`⚠️ Gagal memuat data GeoJSON`, err))
        .finally(() => { if (typeof hideLoader === 'function') hideLoader(); });
}

function updateOpacity(val) {
    const opacityVal = parseFloat(val) / 100;
    const labelEl = document.getElementById('opacityVal');
    if (labelEl) labelEl.innerText = `${val}%`;

    if (window.currentShadedOverlay) window.currentShadedOverlay.setOpacity(opacityVal);
    if (window.currentGeoJsonLayer) window.currentGeoJsonLayer.setStyle({ fillOpacity: opacityVal, opacity: Math.min(opacityVal + 0.2, 1.0) });
}

function updateHeaderInfo(title, subtitle) {
    const titleEl = document.getElementById('hazardTitle');
    const subEl = document.getElementById('systemSubtitle');
    if (titleEl) titleEl.innerText = title || "Prediksi IBF BBMKG IV";
    if (subEl) subEl.innerText = subtitle || "BMKG Command Center";
}

function updateValidDateText(dayIndex) {
    const dateEl = document.getElementById('validDateText');
    if (!dateEl) return;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dayIndex);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.innerText = `Valid: ${targetDate.toLocaleDateString('id-ID', options)} (Hari H+${dayIndex})`;
}

function updateValidDateTextWithDateStr(dateStrRaw, dayIndex) {
    const dateEl = document.getElementById('validDateText');
    if (!dateEl) return;
    if (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') {
        dateEl.innerText = `Valid: ${Utils.formatTanggal(dateStrRaw)} (Hari H+${dayIndex})`;
    } else {
        dateEl.innerText = `Valid: ${dateStrRaw} (Hari H+${dayIndex})`;
    }
}

// ==========================================
// INISIALISASI SISTEM SAAT DOM SIAP
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Menginisialisasi IBF WebGIS Operational System V1.2.5 - BBMKG IV...");

    if (typeof showLoader === 'function') showLoader();
    else if (typeof Loader !== 'undefined' && typeof Loader.show === 'function') Loader.show("Menyiapkan Command Center WebGIS...");

    if (typeof initMap === 'function') initMap();
    if (typeof initBasemaps === 'function') initBasemaps();
    else if (typeof initBasemap === 'function') initBasemap();

    if (typeof initScaleBar === 'function') initScaleBar();
    if (typeof initSearchControl === 'function') initSearchControl();

    if (typeof UrlState !== 'undefined' && typeof UrlState.applyInitialState === 'function') {
        UrlState.applyInitialState();
    } else {
        if (typeof switchProduct === 'function') switchProduct('hazard', 'angin');
    }

    if (window.innerWidth <= 767) {
        const panel = document.getElementById('mobilePanel');
        if (panel) panel.classList.add('collapsed');
    }

    setTimeout(() => {
        if (typeof hideLoader === 'function') hideLoader();
        else if (typeof Loader !== 'undefined' && typeof Loader.hide === 'function') Loader.hide();
        console.log("✅ IBF WebGIS V1.2.5 Berhasil Dimuat.");
    }, 800);
});
