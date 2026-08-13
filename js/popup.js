// ==========================================
// POPUP.JS - POINT IMPACT REPORT V1.2 (UNIFIED SINGLE TABLE LAYOUT)
// - Mendukung Data Kontinu (Angka + Satuan)
// - Mendukung Mini Sparkline SVG (Trend 7 Hari)
// - Menyembunyikan tombol ekspor PDF untuk Info Harian
// ==========================================

/**
 * FUNGSI BANTUAN 1: Mencari data kabupaten dari layer dasar jika hazard tidak punya nama wilayah
 */
function getAdminFeatureByLatLng(latlng) {
    let foundFeature = null;
    if (typeof kabupatenLayerBase !== 'undefined' && kabupatenLayerBase) {
        kabupatenLayerBase.eachLayer(function (layer) {
            if (layer.getBounds && layer.getBounds().contains(latlng)) {
                foundFeature = layer.feature;
            }
        });
    }
    return foundFeature;
}

/**
 * FUNGSI BANTUAN 2: Mendapatkan Nama Parameter Utama yang Konsisten Berdasarkan Produk Aktif
 */
function getCoreParameterName(productConfig) {
    let key = (typeof currentProductKey !== 'undefined') ? currentProductKey : '';
    if (key === 'suhu' || key.includes('suhu') || key.includes('heat')) return "Udara Panas";
    if (key === 'banjir' || key.includes('banjir')) return "Banjir";
    if (key === 'longsor' || key.includes('longsor')) return "Longsor";
    if (key === 'angin' || key.includes('angin')) return "Angin Kencang";
    
    if (productConfig) {
        let name = productConfig.name || productConfig.title || "";
        if (name.toLowerCase().includes('udara panas')) return "Udara Panas";
        if (name.toLowerCase().includes('banjir')) return "Banjir";
        if (name.toLowerCase().includes('longsor')) return "Longsor";
        if (name.toLowerCase().includes('angin')) return "Angin Kencang";
        return name;
    }
    return "Analisis Dampak Bencana";
}

/**
 * FUNGSI BANTUAN 3: Mencocokkan Data Poligon dengan Konfigurasi Legenda secara Akurat (Hazard/Risiko)
 */
function resolveHazardInfo(props, productConfig) {
    // Jika data kontinu (Fitur 1), ini tidak dipakai. Langsung return null
    if (productConfig && productConfig.type === 'continuous') {
        return { isContinuous: true, value: props.value, unit: productConfig.unit || '' };
    }

    let textKey = String(props.kategori || props.level || props.code || '').toLowerCase().trim();
    let colorKey = String(props.color || props.hex_color || '').toUpperCase().trim();
    
    let label = props.level || props.status || "Waspada";
    let color = props.color || props.hex_color || "#ef4444";
    let isSafe = false;

    if (productConfig && productConfig.legends && Array.isArray(productConfig.legends)) {
        let matched = null;
        matched = productConfig.legends.find(l => String(l.level || l.label || l.code || '').toLowerCase().trim() === textKey);
        
        if (!matched && colorKey) {
            matched = productConfig.legends.find(l => String(l.color).toUpperCase().trim() === colorKey);
        }
        
        if (matched) {
            label = matched.label || matched.level || label;
            color = matched.color || color;
        }
    }

    let lblLower = String(label).toLowerCase();
    if (lblLower.includes("aman") || lblLower.includes("nyaman") || lblLower.includes("tidak ada") || color.toLowerCase() === '#00ff00') {
        isSafe = true;
        color = "#10b981";
        label = "AMAN / NORMAL";
    }

    return { label, color, isSafe, isContinuous: false };
}

/**
 * ==========================================
 * 1. ENTRY POINT KLIK GLOBAL UNTUK SEMUA JENIS DATA (BARU)
 * ==========================================
 */
function showCustomPopup(clickEvent, feature, layer, productConfig, category, productKey, dayIndex) {
    if (!clickEvent || !feature) return;

    let lat = clickEvent.latlng.lat;
    let lon = clickEvent.latlng.lng;
    let props = feature.properties || {};

    let rawWilayah = props.kabupaten || props.WADMKK || props.NAME_2 || props.NAMOBJ || "";
    let rawProvinsi = props.provinsi || props.WADMPR || props.NAME_1 || "";
    let kodeWilayah = props.KODBPS || props.KAB_CODE || props.id || '-';

    if (!rawWilayah) {
        let adminFeat = getAdminFeatureByLatLng(clickEvent.latlng);
        if (adminFeat && adminFeat.properties) {
            rawWilayah = adminFeat.properties.WADMKK || adminFeat.properties.kabupaten || adminFeat.properties.NAME_2 || "Wilayah Terdampak";
            rawProvinsi = adminFeat.properties.WADMPR || adminFeat.properties.provinsi || adminFeat.properties.NAME_1 || "Indonesia";
            kodeWilayah = adminFeat.properties.KODBPS || adminFeat.properties.KAB_CODE || kodeWilayah;
        } else {
            rawWilayah = "Lokasi Kelautan / Daratan Terdampak";
        }
    }

    let hazardInfo = resolveHazardInfo(props, productConfig);
    let dateVal = props.date ? ((typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') ? Utils.formatTanggal(props.date) : props.date) : "-";
    
    // Jika format date kosong (misal data kontinu harian yang tidak punya atribut date), ambil dari array tanggal Harian
    if (dateVal === "-" || !dateVal) {
        let targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayIndex);
        dateVal = typeof Utils !== 'undefined' ? Utils.formatTanggal(targetDate.toISOString().split('T')[0]) : targetDate.toISOString().split('T')[0];
    }

    let parameterName = getCoreParameterName(productConfig);

    if (hazardInfo.isContinuous) {
        // Render Popup untuk Data Numerik Harian
        let valueStr = typeof props.value !== 'undefined' && props.value !== null ? parseFloat(props.value).toFixed(2) : 'N/A';
        let hexColor = typeof getColorFromRamp === 'function' && props.value !== null 
            ? getColorFromRamp(props.value, productConfig.min, productConfig.max, productConfig.colorRamp) 
            : '#38bdf8';
            
        renderUniversalPopup(clickEvent.latlng, rawWilayah, rawProvinsi, kodeWilayah, `${valueStr} ${hazardInfo.unit}`, parameterName, hexColor, dateVal, productConfig, lat, lon, false, true);

        // Tambahkan fungsi fetch sparkline (Tren 7 Hari) setelah popup terbuka
        fetchAndRenderSparkline(lat, lon, productConfig, category, productKey);
    } else {
        // Render Popup untuk Hazard/Risiko Kategorikal
        renderUniversalPopup(clickEvent.latlng, rawWilayah, rawProvinsi, kodeWilayah, hazardInfo.label, parameterName, hazardInfo.color, dateVal, productConfig, lat, lon, hazardInfo.isSafe, false);
    }
}

/**
 * ==========================================
 * 2. KOMPATIBILITAS (UNTUK HOVER.JS / OVERLAY.JS)
 * ==========================================
 */
function bindFeaturePopup(hazardFeature, hazardLayer, productConfig, clickEvent) {
    if (!clickEvent || !hazardFeature) return;
    showCustomPopup(clickEvent, hazardFeature, hazardLayer, productConfig, currentCategory, currentProductKey, currentDayIndex);
}

function generateGlobalPopup(e, adminFeature) {
    if (!e || !e.latlng) return;

    let props = adminFeature && adminFeature.properties ? adminFeature.properties : {};
    if (Object.keys(props).length === 0) {
        let feat = getAdminFeatureByLatLng(e.latlng);
        if (feat && feat.properties) props = feat.properties;
    }

    let rawWilayah = props.WADMKK || props.kabupaten || props.NAME_2 || props.NAMOBJ || "Area Tidak Diketahui";
    let rawProvinsi = props.WADMPR || props.provinsi || props.NAME_1 || "Indonesia";
    let kodeWilayah = props.KODBPS || props.KAB_CODE || props.id || '-';
    let productConfig = (typeof CONFIG !== 'undefined' && currentCategory && currentProductKey) ? CONFIG.products[currentCategory]?.[currentProductKey] : null;

    let lat = e.latlng.lat;
    let lon = e.latlng.lng;
    let dateVal = "-";
    let parameterName = getCoreParameterName(productConfig);

    if (productConfig && productConfig.type === 'continuous') {
         // Jangan render popup di area kosong jika produknya berupa Point Data Harian
         return; 
    }

    renderUniversalPopup(e.latlng, rawWilayah, rawProvinsi, kodeWilayah, "AMAN / NORMAL", parameterName, "#10b981", dateVal, productConfig, lat, lon, true, false);
}

/**
 * ==========================================
 * 3. RENDERER UTAMA (1 TABEL UNIFIED KONSISTEN)
 * ==========================================
 */
function renderUniversalPopup(latlng, wilayah, provinsi, kodeWilayah, levelVal, parameterName, hexColor, dateVal, productConfig, lat, lon, isSafe, isContinuous) {
    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function') ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}` : `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
    let currentDayIdx = (typeof currentDayIndex !== 'undefined') ? currentDayIndex : 0;
    let dayLabelTag = `H${currentDayIdx === 0 ? '0' : '+' + currentDayIdx}`;
    
    let levelClass = isSafe ? 'badge-safe' : getLevelBadgeClass(levelVal);
    let headerTitle = (isSafe || isContinuous) ? '📍 INFORMASI WILAYAH' : '📍 PERINGATAN DINI';
    
    // Status/Nilai Label Styling
    let statusBadgeHTML = isContinuous 
        ? `<span style="font-weight: bold; font-size: 13px; color: #0f172a;">${levelVal}</span>`
        : `<span class="badge ${levelClass}" style="background: ${hexToRgba(hexColor, 0.2)}; color: ${hexColor}; border: 1px solid ${hexColor}; font-weight: bold; display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${levelVal.toUpperCase()}</span>`;

    // Tombol Export PDF (Sembunyikan jika continuous / Fitur 1)
    let footerHTML = '';
    if (!isContinuous) {
        footerHTML = `
            <div class="popup-footer" style="margin-top: 8px;">
                <button class="btn-export" onclick="exportImpactReportPDF('${wilayah}', '${kodeWilayah}', '${levelVal}', ${lat}, ${lon})" style="width: 100%; cursor: pointer;">
                    📄 Unduh Laporan (PDF)
                </button>
            </div>
        `;
    }

    let html = `
        <div class="impact-popup" style="width:100%;">
            <div class="popup-header" style="border-left: 5px solid ${hexColor};">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="popup-title">${headerTitle}</div>
                    <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid #38bdf8; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: bold;">${dayLabelTag}</span>
                </div>
                <div class="popup-subtitle" style="font-size: 11px; color: #64748b; margin-top: 2px;">${productConfig?.title || productConfig?.name || 'Analisis IBF'}</div>
            </div>
            
            <div class="popup-body" style="padding-top: 6px;">
                <div class="table-container">
                    <table class="impact-table" style="width: 100%; border-collapse: collapse;">
                        <tbody>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; width: 38%; font-weight: bold; color: #475569;">Kab/Kota</td>
                                <td class="date-label" style="padding: 4px 2px; color: #0f172a;"><b>${wilayah}</b></td>
                            </tr>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; font-weight: bold; color: #475569;">Provinsi</td>
                                <td class="date-label" style="padding: 4px 2px; color: #0f172a;">${provinsi}</td>
                            </tr>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; font-weight: bold; color: #475569;">Koordinat</td>
                                <td class="date-label" style="padding: 4px 2px; color: #0f172a; font-family: monospace; font-size: 11px;">${coordText}</td>
                            </tr>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; font-weight: bold; color: #475569;">Validitas Prediksi</td>
                                <td class="date-label" style="padding: 4px 2px; color: #0f172a;">${dateVal}</td>
                            </tr>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; font-weight: bold; color: #475569;">Parameter</td>
                                <td class="date-label" style="padding: 4px 2px; color: #0f172a;">${parameterName}</td>
                            </tr>
                            <tr>
                                <td class="day-label" style="padding: 4px 2px; font-weight: bold; color: #475569;">${isContinuous ? 'Nilai Harian' : 'Tingkat Status'}</td>
                                <td class="status-cell" style="padding: 4px 2px;">
                                    ${statusBadgeHTML}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Wadah Khusus Untuk Mini Sparkline (Jika Continuous) -->
                <div id="sparklineContainer" style="width: 100%; margin-top: 10px; display: ${isContinuous ? 'block' : 'none'};">
                     <div style="font-size: 10px; color: #94a3b8; text-align: center;">Memuat tren 7 hari...</div>
                </div>
            </div>
            
            ${footerHTML}
        </div>
    `;

    L.popup({ maxWidth: 380, minWidth: 300, className: 'futuristic-popup' })
        .setLatLng(latlng)
        .setContent(html)
        .openOn(map);
}

/**
 * ==========================================
 * 4. MINI SPARKLINE SVG GENERATOR (TREN 7 HARI)
 * ==========================================
 */
function fetchAndRenderSparkline(lat, lon, productConfig, category, productKey) {
    let container = document.getElementById('sparklineContainer');
    if (!container) return;

    let fetchPromises = [];
    let days = productConfig.days || 7;

    // Radius pencarian titik terdekat (Toleransi koordinat Point)
    const TOLERANCE = 0.05; 

    // Ambil data untuk setiap hari (H0 s.d H6)
    for (let i = 0; i < days; i++) {
        let filePath = `${productConfig.folder}${productConfig.prefix}${i}${productConfig.extension}`;
        fetchPromises.push(
            fetch(filePath)
                .then(response => response.ok ? response.json() : null)
                .catch(() => null)
        );
    }

    Promise.all(fetchPromises).then(results => {
        let values = [];
        
        results.forEach(geojson => {
            let foundValue = 0;
            if (geojson && geojson.features) {
                // Cari feature Point terdekat dengan koordinat klik
                let closestFeat = geojson.features.find(f => {
                    let c = f.geometry.coordinates;
                    return (Math.abs(c[0] - lon) < TOLERANCE) && (Math.abs(c[1] - lat) < TOLERANCE);
                });
                if (closestFeat && closestFeat.properties) {
                    foundValue = parseFloat(closestFeat.properties.value || 0);
                }
            }
            values.push(foundValue);
        });

        // Gambar SVG SVG jika data berhasil terkumpul
        drawSvgSparkline(container, values, productConfig.min, productConfig.max, productConfig.unit);
    });
}

function drawSvgSparkline(container, dataPoints, minScale, maxScale, unit) {
    if (!dataPoints || dataPoints.length === 0) {
        container.innerHTML = "<div style='font-size: 10px; color: #94a3b8; text-align: center;'>Data tren tidak tersedia</div>";
        return;
    }

    // Auto-scale SVG Y-Axis (Jika nilai aktual lebih besar/kecil dari min/max setting)
    let minVal = Math.min(...dataPoints);
    let maxVal = Math.max(...dataPoints);
    if (minVal === maxVal) { maxVal += 1; minVal -= 1; }

    const width = 280;
    const height = 50;
    const paddingX = 10;
    const paddingY = 10;
    const innerWidth = width - (paddingX * 2);
    const innerHeight = height - (paddingY * 2);

    // Hitung posisi tiap titik
    let pointsStr = dataPoints.map((val, idx) => {
        let x = paddingX + (idx * (innerWidth / (dataPoints.length - 1)));
        let y = height - paddingY - (((val - minVal) / (maxVal - minVal)) * innerHeight);
        return `${x},${y}`;
    }).join(' ');

    let svgHtml = `
        <div style="font-size: 10px; font-weight: 600; color: #475569; margin-bottom: 2px;">Tren 7 Hari Kedepan (${unit})</div>
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 60px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
            <polyline points="${pointsStr}" style="fill:none; stroke:#0284c7; stroke-width:2; stroke-linecap:round; stroke-linejoin:round;" />
            ${dataPoints.map((val, idx) => {
                let x = paddingX + (idx * (innerWidth / (dataPoints.length - 1)));
                let y = height - paddingY - (((val - minVal) / (maxVal - minVal)) * innerHeight);
                return `<circle cx="${x}" cy="${y}" r="3" fill="#ffffff" stroke="#0284c7" stroke-width="1.5" />`;
            }).join('')}
        </svg>
        <div style="display:flex; justify-content:space-between; font-size:9px; color:#94a3b8; padding: 2px 4px;">
            <span>H0</span><span>H1</span><span>H2</span><span>H3</span><span>H4</span><span>H5</span><span>H6</span>
        </div>
    `;

    container.innerHTML = svgHtml;
}


// Helpers
function getLevelBadgeClass(levelText) {
    let text = String(levelText).toLowerCase();
    if (text.includes("waspada")) return "badge-waspada";
    if (text.includes("siaga")) return "badge-siaga";
    if (text.includes("awas")) return "badge-awas";
    return "badge-normal";
}

function hexToRgba(hex, alpha) {
    if (!hex || hex === 'transparent') return 'rgba(56, 189, 248, 0.1)';
    // Handle rgb/rgba string if continuous legend passes it
    if (String(hex).startsWith('rgb')) return String(hex).replace(')', `, ${alpha})`).replace('rgb(', 'rgba(');
    
    let c = String(hex).replace('#','');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    let num = parseInt(c, 16);
    return `rgba(${(num >> 16)&255}, ${(num >> 8)&255}, ${num&255}, ${alpha})`;
}

function exportImpactReportPDF(namaWilayah, kodeWilayah, levelVal, lat, lon) {
    if (typeof triggerPDFExport === 'function') {
        triggerPDFExport(namaWilayah, kodeWilayah, levelVal, lat, lon);
    } else {
        alert(`Mencetak Laporan PDF untuk ${namaWilayah} [Status: ${levelVal}] pada Koordinat: ${lat?.toFixed(4)}, ${lon?.toFixed(4)}...`);
    }
}
