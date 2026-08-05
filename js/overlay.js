// ==========================================
// OVERLAY.JS - MANAJEMEN LAYER GEOJSON & VEKTOR V1.3
// - Support Full 7-Days Timeline
// - Specific Offset Labeling for Banjir & Longsor (H-1 to H+5)
// - Graceful Fallback & Error Handling
// ==========================================

let currentCategory = 'hazard'; 
let currentProductKey = 'angin'; 
let currentOpacity = 0.65; 
let activeOverlayLayer = null; 

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

    if (activeOverlayLayer) {
        map.removeLayer(activeOverlayLayer);
        activeOverlayLayer = null;
    }

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
                // Indeks 0 = H-1, Indeks 1 = H0, Indeks 2 = H+1, ..., Indeks 6 = H+5
                if (i === 0) {
                    btn.innerText = 'H-1';
                } else if (i === 1) {
                    btn.innerText = 'H0';
                } else {
                    btn.innerText = `H+${i - 1}`;
                }
            } else {
                // Normal: Indeks 0 = H0, Indeks 1 = H+1, ..., Indeks 6 = H+6
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

function loadDay(index) {
    window.currentIndex = index;
    let productConfig = CONFIG.products[currentCategory][currentProductKey];
    let uniqueInit = new Date().getTime();

    let filePath = `${productConfig.folder}${productConfig.prefix}${index}${productConfig.extension}?v=${uniqueInit}`;

    let dateTextEl = document.getElementById('validDateText');
    if (dateTextEl) dateTextEl.innerText = `Valid: Memuat Hari ke-${index + 1}...`;

    if (activeOverlayLayer) {
        map.removeLayer(activeOverlayLayer);
        activeOverlayLayer = null;
    }

    if (typeof showLoader === 'function') showLoader();

    fetch(filePath)
        .then(res => {
            if (!res.ok) throw new Error(`File ${productConfig.prefix}${index}${productConfig.extension} tidak ditemukan`);
            return res.json();
        })
        .then(geojsonData => {
            if (geojsonData.features && geojsonData.features.length > 0) {
                let firstProps = geojsonData.features[0].properties;
                let polyDate = firstProps.date || firstProps.tanggal || firstProps.validity || firstProps.valid_date;

                if (polyDate && dateTextEl && typeof Utils !== 'undefined') {
                    dateTextEl.innerText = `Valid: ${Utils.formatTanggal(polyDate)}`;
                } else if (window.validDates && window.validDates[index] && dateTextEl) {
                    dateTextEl.innerText = `Valid: ${window.validDates[index]}`;
                } else if (dateTextEl) {
                    dateTextEl.innerText = `Valid: Prediksi Hari ke-${index + 1}`;
                }
            } else {
                if (dateTextEl) dateTextEl.innerText = `Valid: Hari ke-${index + 1} (Data Kosong)`;
            }

            activeOverlayLayer = L.geoJSON(geojsonData, {
                style: function (feature) {
                    let fillColor = getFeatureColor(feature, productConfig);
                    return {
                        fillColor: fillColor,
                        stroke: false, // OFF-kan borderline poligon hazard
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

            // Layer maritim ditaruh di paling belakang (di bawah daratan)
            if (currentProductKey.includes('snorkling') || currentProductKey.includes('diving')) {
                activeOverlayLayer.bringToBack();
            }
            
            keepAdminBoundariesOnTop();

            // Update status tombol aktif di UI
            let totalDays = productConfig.days || 7;
            for (let i = 0; i < totalDays; i++) {
                let btn = document.getElementById('day-btn-' + i);
                if (btn) {
                    btn.classList.toggle('active', i === index);
                }
            }

            if (typeof hideLoader === 'function') hideLoader();
        })
        .catch(err => {
            console.warn("Peringatan pemuatan GeoJSON:", err.message);
            
            if (dateTextEl) {
                if (window.validDates && window.validDates[index]) {
                    dateTextEl.innerText = `Valid: ${window.validDates[index]} (Data Belum Tersedia)`;
                } else {
                    dateTextEl.innerText = `⚠️ Data Hari ke-${index + 1} Belum Tersedia`;
                }
            }

            // Tetap tandai tombol aktif di UI
            let totalDays = productConfig.days || 7;
            for (let i = 0; i < totalDays; i++) {
                let btn = document.getElementById('day-btn-' + i);
                if (btn) {
                    btn.classList.toggle('active', i === index);
                }
            }

            if (typeof hideLoader === 'function') hideLoader();
        });
}
