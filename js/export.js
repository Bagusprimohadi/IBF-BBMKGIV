// ==========================================
// EXPORT.JS - GENERATOR LAPORAN PDF/PRINT V2.5 (UNIVERSAL SCANNER & FULL IMAGE LETTERHEAD)
// - Kop Surat Full Image (KOPSURAT.png)
// - Universal Scanner (Menyapu seluruh kategori hazard, risiko, & oseano tanpa terkecuali)
// - Ekstraksi Tanggal Langsung dari Fitur Poligon GeoJSON / Window ValidDates
// - Color-First Matching & Severity Sort untuk overlap polygon
// ==========================================

/**
 * Fetch GeoJSON dengan penanganan error
 */
async function fetchGeoJSON(url) {
    try {
        let res = await fetch(url);
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

/**
 * Algoritma Matematika Murni (Ray-Casting) untuk mengecek posisi kursor
 */
function isPointInPolygonMath(lat, lon, feature) {
    if (!feature || !feature.geometry || !feature.geometry.coordinates) return false;
    
    let x = lon;
    let y = lat;
    let type = feature.geometry.type;
    let coords = feature.geometry.coordinates;

    function checkPolygon(poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            let xi = poly[i][0], yi = poly[i][1];
            let xj = poly[j][0], yj = poly[j][1];
            let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    if (type === 'Polygon') {
        return checkPolygon(coords[0]);
    } else if (type === 'MultiPolygon') {
        for (let i = 0; i < coords.length; i++) {
            if (checkPolygon(coords[i][0])) return true;
        }
    }
    return false;
}

/**
 * Membaca status bahaya: Cocokkan WARNA dahulu, baru fallback ke Teks
 */
function getStatusInfo(props, prodConfig) {
    let label = props.level || props.status || props.kategori || props.dampak || "Waspada";
    let color = props.color || props.hex_color || props.fill || "#ef4444";
    let isSafe = false;
    
    let textKey = String(label).toLowerCase().trim();
    let colorKey = String(color).toUpperCase().trim();
    
    if (prodConfig && Array.isArray(prodConfig.legends)) {
        let matched = null;
        matched = prodConfig.legends.find(l => String(l.color).toUpperCase().trim() === colorKey);
        
        if (!matched) {
            matched = prodConfig.legends.find(l => String(l.level || l.label || l.code || '').toLowerCase().trim() === textKey);
        }
        
        if (matched) {
            label = matched.label || matched.level || label;
            color = matched.color || color;
        }
    }
    
    let lblLower = String(label).toLowerCase();
    if (lblLower.includes("aman") || lblLower.includes("nyaman") || lblLower.includes("rendah") || lblLower.includes("tidak ada") || color.toLowerCase() === '#00ff00' || color.toLowerCase() === '#10b981' || color === 'transparent') {
        isSafe = true;
    }
    
    return { label, isSafe, color };
}

/**
 * Pengecekan Spasial & Severity Sorting (Mencegah salah baca jika poligon tumpang tindih)
 */
function findActiveFeature(geojsonData, lat, lon, prodConfig) {
    if (!geojsonData || !geojsonData.features) return null;
    
    let intersectingFeatures = geojsonData.features.filter(f => isPointInPolygonMath(lat, lon, f));
    
    if (intersectingFeatures.length === 0) return null;
    if (intersectingFeatures.length === 1) return intersectingFeatures[0];
    
    if (prodConfig && prodConfig.legends) {
        intersectingFeatures.sort((a, b) => {
            let sA = getStatusInfo(a.properties, prodConfig);
            let sB = getStatusInfo(b.properties, prodConfig);
            let idxA = prodConfig.legends.findIndex(l => (l.label || l.level) === sA.label);
            let idxB = prodConfig.legends.findIndex(l => (l.label || l.level) === sB.label);
            return idxB - idxA; 
        });
    }
    
    return intersectingFeatures[0];
}

/**
 * Ekstraktor Tanggal Cadangan (Fallback jika metadata/poligon kosong)
 */
function getFallbackDateString(dayIndex) {
    let baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + dayIndex);

    let days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    let months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    return `${days[baseDate.getDay()]}, ${baseDate.getDate()} ${months[baseDate.getMonth()]} ${baseDate.getFullYear()}`;
}

/**
 * Memicu pencetakan laporan analisis dampak
 */
async function exportImpactReportPDF(namaWilayah, kodeWilayah, levelVal, lat, lon) {
    let btn = document.querySelector('.btn-export');
    let originalBtnText = btn ? btn.innerHTML : '📄 Unduh Laporan (PDF)';
    if (btn) {
        btn.innerHTML = '⏳ Sedang Memindai Spasial (Harap Tunggu)...';
        btn.disabled = true;
    }

    await new Promise(resolve => setTimeout(resolve, 50));

    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function') ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}` : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    let printTime = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' });
    let tableRowsHTML = '';

    for (let i = 0; i < 7; i++) {
        let dayLabel = i === 0 ? 'H0' : `H+${i}`;
        
        let warningsBahaya = [];
        let warningsRisiko = [];
        let rawDateFromPolygon = null; // Menampung tanggal asli dari atribut poligon GeoJSON

        // Fungsi Universal untuk Menscan Seluruh Kategori Produk di CONFIG.products (Bahaya & Risiko/Oseano)
        async function scanAllConfigCategories(targetGroup) {
            let collected = [];
            if (!CONFIG || !CONFIG.products) return collected;

            for (let catKey of Object.keys(CONFIG.products)) {
                let categoryObj = CONFIG.products[catKey];
                if (!categoryObj) continue;

                for (let prodKey of Object.keys(categoryObj)) {
                    let prod = categoryObj[prodKey];
                    if (!prod || !prod.folder || !prod.prefix) continue;

                    // Klasifikasi apakah produk ini termasuk kategori risiko/dampak atau bahaya murni
                    let isRisikoItem = prodKey.toLowerCase().includes('risiko') || catKey.toLowerCase().includes('risiko') || prodKey.toLowerCase().includes('impact');
                    
                    if (targetGroup === 'bahaya' && isRisikoItem) continue;
                    if (targetGroup === 'risiko' && !isRisikoItem) continue;

                    let url = `${prod.folder}${prod.prefix}${i}${prod.extension}`;
                    let geojson = await fetchGeoJSON(url);
                    if (!geojson) continue;

                    let feat = findActiveFeature(geojson, lat, lon, prod);
                    if (feat) {
                        if (!rawDateFromPolygon && feat.properties) {
                            rawDateFromPolygon = feat.properties.date || feat.properties.tanggal || feat.properties.validity || feat.properties.valid_date;
                        }
                        let stat = getStatusInfo(feat.properties, prod);
                        if (!stat.isSafe) {
                            let formattedWarning = `<span style="color:${stat.color}; filter: brightness(0.8); font-weight:bold;">[${prod.name}]</span> : ${stat.label}`;
                            if (!collected.includes(formattedWarning)) {
                                collected.push(formattedWarning);
                            }
                        }
                    }
                }
            }
            return collected;
        }

        // 1. Scan Semua Parameter Bahaya secara Universal
        warningsBahaya = await scanAllConfigCategories('bahaya');

        // 2. Scan Semua Parameter Risiko / Maritim / Oseanografi secara Universal
        warningsRisiko = await scanAllConfigCategories('risiko');

        // 3. Penentuan Tanggal Validitas yang Akurat
        let displayDate = "-";
        if (rawDateFromPolygon) {
            displayDate = (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') 
                ? Utils.formatTanggal(rawDateFromPolygon) 
                : rawDateFromPolygon;
        } else if (window.validDates && window.validDates[i]) {
            let vDate = window.validDates[i];
            displayDate = (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') 
                ? Utils.formatTanggal(vDate) 
                : vDate;
        } else {
            displayDate = getFallbackDateString(i);
        }

        let textBahaya = warningsBahaya.length > 0 ? warningsBahaya.join('<br>') : '<span style="color: #10b981; font-weight: normal;">✅ Tidak Ada Peringatan</span>';
        let textRisiko = warningsRisiko.length > 0 ? warningsRisiko.join('<br>') : '<span style="color: #10b981; font-weight: normal;">✅ Risiko Rendah</span>';

        tableRowsHTML += `
            <tr>
                <td style="padding: 10px; border: 1px solid #0f172a; text-align: center; font-weight: bold; background: #f8fafc;">${dayLabel}</td>
                <td style="padding: 10px; border: 1px solid #0f172a; text-align: center;">${displayDate}</td>
                <td style="padding: 10px; border: 1px solid #0f172a; line-height: 1.6;">${textBahaya}</td>
                <td style="padding: 10px; border: 1px solid #0f172a; line-height: 1.6;">${textRisiko}</td>
            </tr>
        `;
    }

    if (btn) {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
    }

    let printWindow = window.open('', '_blank', 'width=1000,height=900');
    
    let htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Laporan Komprehensif IBF - ${namaWilayah}</title>
            <style>
                body { font-family: 'Times New Roman', Times, serif; color: #000; margin: 0; padding: 40px; background: #fff; }
                
                /* Layout Kop Surat Full Gambar */
                .kop-surat-img { 
                    width: 100%; 
                    max-width: 100%; 
                    height: auto; 
                    display: block; 
                    margin: 0 auto 25px auto;
                }
                
                .doc-title { text-align: center; margin-bottom: 30px; }
                .doc-title h3 { margin: 0; font-size: 16px; text-decoration: underline; text-transform: uppercase; }
                .meta-box { margin-bottom: 25px; font-size: 14px; line-height: 1.8; }
                .meta-item span { display: inline-block; width: 200px; font-weight: bold;}
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
                th { background: #f1f5f9; color: #000; padding: 12px 10px; border: 1px solid #000; text-transform: uppercase; font-weight: bold;}
                .footer-sign { margin-top: 50px; float: right; text-align: center; font-size: 14px; }
                .footer-sign .space { height: 70px; }
                
                @media print { 
                    body { padding: 15px; } 
                    th { background-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; color-adjust: exact; } 
                    td span { -webkit-print-color-adjust: exact; color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <!-- KOP SURAT GAMBAR PENUH -->
            <img src="assets/KOPSURAT.png" class="kop-surat-img" alt="Kop Surat BMKG" onerror="this.style.display='none'; alert('Gambar KOPSURAT.png tidak ditemukan di folder assets!');">

            <div class="doc-title">
                <h3>LAPORAN PERINGATAN DINI POTENSI BAHAYA & RISIKO WILAYAH</h3>
            </div>

            <div class="meta-box">
                <div class="meta-item"><span>Titik Koordinat</span> : ${coordText}</div>
                <div class="meta-item"><span>Wilayah Terdampak</span> : ${namaWilayah.toUpperCase()}</div>
                <div class="meta-item"><span>Waktu Rekapitulasi</span> : ${printTime}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 8%;">Hari</th>
                        <th style="width: 20%;">Tanggal Validitas</th>
                        <th style="width: 36%;">Multi-Parameter Bahaya (Hazard)</th>
                        <th style="width: 36%;">Multi-Parameter Risiko (Impact)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHTML}
                </tbody>
            </table>

            <div class="footer-sign">
                <p>Makassar, ${printTime.split(',')[0]}<br>Tim Forecaster / Operasional BBMKG IV</p>
                <div class="space"></div>
                <p><b>( Forecaster IBF BBMKG IV )</b></p>
            </div>

            <script>
                window.onload = function() { 
                    setTimeout(() => window.print(), 800); 
                };
            </script>
        </body>
        </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
