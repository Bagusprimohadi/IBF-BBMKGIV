// ==========================================
// OVERLAY.JS - MANAJEMEN LAYER GEOJSON & VEKTOR V1.1
// ==========================================

let currentCategory = 'hazard'; 
let currentProductKey = 'angin'; 
let currentOpacity = 0.65; 
let activeOverlayLayer = null; 

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

    let totalDays = productConfig.days || 3;
    window.validDates = Array.from({ length: totalDays }, (_, i) => `Hari ke-${i + 1}`); 

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
            if (!res.ok) throw new Error("File GeoJSON tidak ditemukan");
            return res.json();
        })
        .then(geojsonData => {
            if (geojsonData.features && geojsonData.features.length > 0) {
                let firstProps = geojsonData.features[0].properties;
                if (firstProps.date && dateTextEl && typeof Utils !== 'undefined') {
                    dateTextEl.innerText = `Valid: ${Utils.formatTanggal(firstProps.date)}`;
                } else if (dateTextEl) {
                    dateTextEl.innerText = `Valid: Prediksi Hari ke-${index + 1}`;
                }
            }

            activeOverlayLayer = L.geoJSON(geojsonData, {
                style: function (feature) {
                    let fillColor = getFeatureColor(feature, productConfig);
                    return {
                        fillColor: fillColor,
                        stroke: false, // OFF-kan borderline poligon (seperti tampilan PNG/Raster biasa)
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
                        // Pointer mouse biasa tanpa efek hover tebal borderline
                        click: function (e) {
                            L.DomEvent.stopPropagation(e);
                            if (typeof bindFeaturePopup === 'function') {
                                bindFeaturePopup(feature, layer, productConfig, e);
                            }
                        }
                    });
                }
            }).addTo(map);

            // PENYESUAIAN HIERARKI LAYER MARITIM (POIN 2)
            // Jika produk maritim (snorkling/diving), taruh layer di paling bawah
            if (currentProductKey.includes('snorkling') || currentProductKey.includes('diving')) {
                activeOverlayLayer.bringToBack();
                if (typeof kabupatenLayer !== 'undefined' && kabupatenLayer) {
                    kabupatenLayer.bringToFront(); // Wilayah daratan & admin berada di atasnya
                }
            }

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
