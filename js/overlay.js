// ==========================================
// OVERLAY.JS - MANAJEMEN LAYER GEOJSON & PNG OVERLAY V1.2.2
// - Support Full 7-Days Timeline
// - Specific Offset Labeling for Banjir & Longsor (H-1 to H+5)
// - Support Dual-Engine: GeoJSON Vector & Shaded PNG Overlay
// - Support Real-Time Opacity Slider (GeoJSON & Image Overlay)
// - FIXED: Tampilan Tanggal Presisi & Bersih (Tanpa Teks "Data Kosong")
// ==========================================

let currentCategory = 'hazard'; 
let currentProductKey = 'angin'; 
let currentOpacity = 0.65; 
let activeOverlayLayer = null; // Container untuk Layer GeoJSON
let activeImageOverlay = null; // Container untuk Layer PNG Shaded Overlay

/**
 * Memaksa layer administrasi (Kabupaten & Provinsi) tetap berada di atas overlay hazard
 */
function keepAdminBoundariesOnTop() {
    if (typeof kabupatenLayer !== 'undefined' && kabupatenLayer && map.hasLayer(kabupatenLayer)) {
        kabupatenLayer.bringToFront();
    }
    if (typeof provinsiLayer !== 'undefined' && provinsiLayer && map.hasLayer(provinsiLayer)) {
        provinsiLayer.bringToFront();
    }
}

/**
 * Membersihkan SELURUH layer aktif (GeoJSON maupun PNG) dari peta
 */
function clearAllActiveOverlays() {
    if (!map) return;
    
    if (activeOverlayLayer) {
        map.removeLayer(activeOverlayLayer);
        activeOverlayLayer = null;
    }
    if (activeImageOverlay) {
        map.removeLayer(activeImageOverlay);
        activeImageOverlay = null;
    }
}

function switchProduct(category, productKey) {
    if (typeof stopPlay === 'function') stopPlay();
    
    currentCategory = category;
    currentProductKey = productKey;
    
    if (typeof closeAllDropdowns === 'function') {
        closeAllDropdowns();
    } else {
        document.querySelectorAll('.dropdown-wrapper').forEach(el => el.classList.remove('active'));
    }

    let productConfig = CONFIG.products[category]?.[productKey];
    if (!productConfig) {
        console.error("Konfigurasi produk tidak ditemukan untuk:", category, productKey);
        return;
    }

    let subtitleEl = document.getElementById('systemSubtitle');
    let titleEl = document.getElementById('hazardTitle');
    if (subtitleEl) subtitleEl.innerText = productConfig.subtitle || '';
    if (titleEl) titleEl.innerText = productConfig.title || productConfig.name || '';

    if (typeof renderLegend === 'function') {
        renderLegend(productConfig);
    }

    // Bersihkan peta saat ganti produk
    clearAllActiveOverlays();

    loadProductTimeline(category, productKey);
}

function loadProductTimeline(category, productKey) {
    let productConfig = CONFIG.products[category][productKey];
    let dateTextEl = document.getElementById('validDateText');
    if (dateTextEl) dateTextEl.innerText = "Valid: Memuat data...";

    const btnContainer = document.getElementById('dayButtonsContainer');
    if (btnContainer) {
        btnContainer.innerHTML = "";
    }

    // Default ke 7 hari jika config tidak terdefinisi
    let totalDays = productConfig.days || 7;
    window.validDates = Array.from({ length: totalDays }, (_, i) => `Hari ke-${i + 1}`); 

    // Cek apakah produk aktif termasuk dalam 4 parameter khusus (Banjir & Longsor)
    let isOffsetProduct = ['banjir', 'longsor', 'risiko_banjir', 'risiko_longsor'].includes(productKey);

    for (let i = 0; i < totalDays; i++) {
        if (btnContainer) {
            let btn = document.createElement('button');
            btn.className = 'time-btn';
            btn.id = 'day-btn-' + i;
            
            // LOGIKA LABEL TOMBOL:
            if (isOffsetProduct) {
                if (i === 0) {
                    btn.innerText = 'H-1';
                } else if (i === 1) {
                    btn.innerText = 'H0';
                } else {
                    btn.innerText = `H+${i - 1}`;
                }
            } else {
                btn.innerText = `H${i === 0 ? '0' : '+' + i}`; 
            }

            btn.onclick = function() {    
                if (typeof stopPlay === 'function') stopPlay();    
                loadDay(i);    
            };
            btnContainer.appendChild(btn);
        }
    }

    loadDay(0);
}

function getFeatureColor(feature, productConfig) {
    let props = feature.properties || {};
    if (props.color) return props.color;

    if (productConfig && productConfig.legends && Array.isArray(productConfig.legends)) {
        let valKey = String(props.level || props.kategori || props.code || '').toLowerCase();
        let matched = productConfig.legends.find(l => 
            String(l.level || l.label || l.code || '').toLowerCase() === valKey
        );
        if (matched && matched.color) return matched.color;
    }

    return "#38bdf8";
}

/**
 * UTAMA: MEMUAT DATA HARI KE-N (Dukungan Cabang PNG & GeoJSON)
 */
function loadDay(index) {
    window.currentIndex = index;
    let productConfig = CONFIG.products[currentCategory][currentProductKey];
    let dateTextEl = document.getElementById('validDateText');
    if (dateTextEl) dateTextEl.innerText = `Valid: Memuat Hari ke-${index + 1}...`;

    // Bersihkan seluruh layer yang ada di peta
    clearAllActiveOverlays();

    if (typeof showLoader === 'function') showLoader();

    // ==========================================
    // PERHITUNGAN OFFSET TANGGAL (Untuk Fallback)
    // ==========================================
    let isOffsetProduct = ['banjir', 'longsor', 'risiko_banjir', 'risiko_longsor'].includes(currentProductKey);
    let dayShift = isOffsetProduct ? (index - 1) : index;

    // ==========================================
    // CABANG 1: JIKA TIPE PRODUK = IMAGE_OVERLAY (PNG HARIAN)
    // ==========================================
    if (productConfig.type === 'image_overlay') {
        let jsonPath = `${productConfig.folder}${productConfig.prefix}${index}.json`;
        let shadedPath = `${productConfig.folder}${productConfig.prefix}${index}_shaded.png`;

        fetch(jsonPath)
            .then(res => {
                if (!res.ok) throw new Error(`Metadata ${productConfig.prefix}${index}.json tidak ditemukan`);
                return res.json();
            })
            .then(metaData => {
                let bounds = metaData?.bounds?.leaflet_bounds || [[-11.0, 94.0], [6.0, 141.0]];

                let opacityInput = document.getElementById('opacityRange');
                if (opacityInput) {
                    currentOpacity = parseFloat(opacityInput.value) / 100;
                }

                activeImageOverlay = L.imageOverlay(shadedPath, bounds, {
                    opacity: currentOpacity,
                    interactive: false 
                }).addTo(map);

                // Menampilkan Tanggal dengan Rapi (Tanpa Teks Data Kosong)
                if (metaData.valid_time && dateTextEl) {
                    dateTextEl.innerText = (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') 
                        ? `Valid: ${Utils.formatTanggal(metaData.valid_time)}`
                        : `Valid: ${metaData.valid_time}`;
                } else if (dateTextEl) {
                    let targetDate = new Date();
                    targetDate.setDate(targetDate.getDate() + dayShift);
                    let formattedDate = (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function')
                        ? Utils.formatTanggal(targetDate.toISOString().split('T')[0])
                        : targetDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    dateTextEl.innerText = `Valid: ${formattedDate}`;
                }

                keepAdminBoundariesOnTop();
                updateActiveDayButtonUI(productConfig, index);
                if (typeof hideLoader === 'function') hideLoader();
            })
            .catch(err => {
                console.warn("Peringatan PNG Overlay:", err.message);
                if (dateTextEl) {
                    let targetDate = new Date();
                    targetDate.setDate(targetDate.getDate() + dayShift);
                    let formattedDate = (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function')
                        ? Utils.formatTanggal(targetDate.toISOString().split('T')[0])
                        : targetDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    dateTextEl.innerText = `Valid: ${formattedDate}`;
                }
                updateActiveDayButtonUI(productConfig, index);
                if (typeof hideLoader === 'function') hideLoader();
            });

        return; // Selesai untuk PNG
    }

    // ==========================================
    // CABANG 2: JIKA TIPE PRODUK = GEOJSON (HAZARD & RISIKO)
    // ==========================================
    let uniqueInit = new Date().getTime();
    let filePath = `${productConfig.folder}${productConfig.prefix}${index}${productConfig.extension}?v=${uniqueInit}`;

    fetch(filePath)
        .then(res => {
            if (!res.ok) throw new Error(`File ${productConfig.prefix}${index}${productConfig.extension} tidak ditemukan`);
            return res.json();
        })
        .then(geojsonData => {
            let polyDate = null;
            if (geojsonData.features && geojsonData.features.length > 0) {
                let firstProps = geojsonData.features[0].properties;
                polyDate = firstProps.date || firstProps.tanggal || firstProps.validity || firstProps.valid_date;
            }

            // Menampilkan Tanggal dengan Rapi (Tanpa Teks Data Kosong)
            if (polyDate && dateTextEl && typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') {
                dateTextEl.innerText = `Valid: ${Utils.formatTanggal(polyDate)}`;
            } else if (window.validDates && window.validDates[index] && dateTextEl) {
                dateTextEl.innerText = `Valid: ${window.validDates[index]}`;
            } else if (dateTextEl) {
                let targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + dayShift);
                let formattedDate = (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function')
                    ? Utils.formatTanggal(targetDate.toISOString().split('T')[0])
                    : targetDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                dateTextEl.innerText = `Valid: ${formattedDate}`;
            }

            let opacityInput = document.getElementById('opacityRange');
            if (opacityInput) {
                currentOpacity = parseFloat(opacityInput.value) / 100;
            }

            activeOverlayLayer = L.geoJSON(geojsonData, {
                style: function (feature) {
                    let fillColor = getFeatureColor(feature, productConfig);
                    return {
                        fillColor: fillColor,
                        stroke: false, 
                        weight: 0,
                        fillOpacity: currentOpacity 
                    };
                },
                pointToLayer: function (feature, latlng) {
                    let fillColor = getFeatureColor(feature, productConfig);
                    return L.circleMarker(latlng, {
                        radius: 6,
                        fillColor: fillColor,
                        stroke: false,
                        fillOpacity: currentOpacity
                    });
                },
                onEachFeature: function (feature, layer) {
                    layer.on({
                        click: function (e) {
                            L.DomEvent.stopPropagation(e);
                            if (typeof bindFeaturePopup === 'function') {
                                bindFeaturePopup(feature, layer, productConfig, e);
                            }
                        }
                    });
                }
            }).addTo(map);

            if (currentProductKey.includes('snorkling') || currentProductKey.includes('diving')) {
                activeOverlayLayer.bringToBack();
            }
            
            keepAdminBoundariesOnTop();
            updateActiveDayButtonUI(productConfig, index);
            if (typeof hideLoader === 'function') hideLoader();
        })
        .catch(err => {
            console.warn("Peringatan pemuatan GeoJSON:", err.message);
            // Tetap merender tanggal secara bersih jika file kosong/tidak ada (404)
            if (dateTextEl) {
                let targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + dayShift);
                let formattedDate = (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function')
                    ? Utils.formatTanggal(targetDate.toISOString().split('T')[0])
                    : targetDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                dateTextEl.innerText = `Valid: ${formattedDate}`;
            }

            updateActiveDayButtonUI(productConfig, index);
            if (typeof hideLoader === 'function') hideLoader();
        });
}

/**
 * Helper untuk memperbarui status tombol aktif di UI
 */
function updateActiveDayButtonUI(productConfig, activeIndex) {
    let totalDays = productConfig.days || 7;
    for (let i = 0; i < totalDays; i++) {
        let btn = document.getElementById('day-btn-' + i);
        if (btn) {
            btn.classList.toggle('active', i === activeIndex);
        }
    }
}

/**
 * FUNGSI UTAMA PENGATUR TRANSPARANSI (Mendukung PNG Overlay & GeoJSON Vector)
 * @param {string|number} val - Nilai slider dari HTML (0 s/d 100)
 */
function updateOpacity(val) {
    currentOpacity = parseFloat(val) / 100;

    let labelEl = document.getElementById('opacityVal');
    if (labelEl) {
        labelEl.innerText = `${val}%`;
    }

    if (activeImageOverlay) {
        activeImageOverlay.setOpacity(currentOpacity);
    }

    if (activeOverlayLayer) {
        activeOverlayLayer.setStyle({
            fillOpacity: currentOpacity
        });
    }
}

window.updateOpacity = updateOpacity;
