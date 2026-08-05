// ==========================================
// EXPORT.JS - GENERATOR LAPORAN PDF/PRINT V2.2 (ULTIMATE ACCURACY FIX)
// - Integrasi Tanggal Validitas dari Metadata (Sinkron dengan H0)
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
 * Membaca status bahaya: 
 * Prioritas 1 = Cocokkan WARNA (Karena visual warna tidak pernah bohong)
 */
function getStatusInfo(props, prodConfig) {
    let label = props.level || props.status || props.kategori || props.dampak || "Waspada";
    let color = props.color || props.hex_color || props.fill || "#ef4444";
    let isSafe = false;
    
    let textKey = String(label).toLowerCase().trim();
    let colorKey = String(color).toUpperCase().trim();
    
    if (prodConfig && Array.isArray(prodConfig.legends)) {
        let matched = null;
        
        // 1. PRIORITAS UTAMA: Cocokkan Warna
        matched = prodConfig.legends.find(l => String(l.color).toUpperCase().trim() === colorKey);
        
        // 2. Jika warna tidak ada/gagal, baru cocokkan Teks
        if (!matched) {
            matched = prodConfig.legends.find(l => String(l.level || l.label || l.code || '').toLowerCase().trim() === textKey);
        }
        
        // 3. Timpa nilai dengan label resmi dari Legends
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
    
    // Cari SEMUA poligon yang beririsan dengan klik kursor
    let intersectingFeatures = geojsonData.features.filter(f => isPointInPolygonMath(lat, lon, f));
    
    if (intersectingFeatures.length === 0) return null;
    if (intersectingFeatures.length === 1) return intersectingFeatures[0];
    
    // Jika ada >1 poligon bertumpuk (misal Siaga di atas Waspada), pilih level yang paling parah (berdasarkan urutan legenda)
    if (prodConfig && prodConfig.legends) {
        intersectingFeatures.sort((a, b) => {
            let sA = getStatusInfo(a.properties, prodConfig);
            let sB = getStatusInfo(b.properties, prodConfig);
            let idxA = prodConfig.legends.findIndex(l => (l.label || l.level) === sA.label);
            let idxB = prodConfig.legends.findIndex(l => (l.label || l.level) === sB.label);
            return idxB - idxA; // Semakin ke bawah di legenda, makin parah (Waspada -> Siaga -> Awas)
        });
    }
    
    return intersectingFeatures[0];
}

/**
 * Sinkronisasi Tanggal dengan Data window.validDates dari metadata.geojson
 */
function getValidDateString(dayIndex) {
    let baseDate = new Date(); // Fallback
    
    if (window.validDates && window.validDates.length > 0) {
        let dStr = window.validDates[dayIndex];
        if (!dStr) dStr = window.validDates[window.validDates.length - 1]; // Fallback ke hari terakhir jika habis
        
        // Memaksa parsing format YYYY-MM-DD secara mutlak tanpa terpengaruh Zona Waktu
        let parts = dStr.split('-');
        if (parts.length === 3) {
            baseDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
            baseDate = new Date(dStr);
        }
    } else {
        // Jika data config kosong, baru hitung manual dari hari ini
        baseDate.setDate(baseDate.getDate() + dayIndex);
    }

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
        let safeDateString = getValidDateString(i);
        
        let warningsBahaya = [];
        let warningsRisiko = [];

        if (CONFIG && CONFIG.products && CONFIG.products.hazard) {
            let hazardPromises = Object.values(CONFIG.products.hazard).map(async (prod) => {
                let url = `${prod.folder}${prod.prefix}${i}${prod.extension}`;
                let geojson = await fetchGeoJSON(url);
                let feat = findActiveFeature(geojson, lat, lon, prod);
                if (feat) {
                    let stat = getStatusInfo(feat.properties, prod);
                    if (!stat.isSafe) return `<span style="color:${stat.color}; filter: brightness(0.8); font-weight:bold;">[${prod.name}]</span> : ${stat.label}`;
                }
                return null;
            });
            let results = await Promise.all(hazardPromises);
            warningsBahaya = results.filter(r => r !== null);
        }

        if (CONFIG && CONFIG.products && CONFIG.products.risiko) {
            let risikoPromises = Object.values(CONFIG.products.risiko).map(async (prod) => {
                let url = `${prod.folder}${prod.prefix}${i}${prod.extension}`;
                let geojson = await fetchGeoJSON(url);
                let feat = findActiveFeature(geojson, lat, lon, prod);
                if (feat) {
                    let stat = getStatusInfo(feat.properties, prod);
                    if (!stat.isSafe) return `<span style="color:${stat.color}; filter: brightness(0.8); font-weight:bold;">[${prod.name}]</span> : ${stat.label}`;
                }
                return null;
            });
            let results = await Promise.all(risikoPromises);
            warningsRisiko = results.filter(r => r !== null);
        }

        let textBahaya = warningsBahaya.length > 0 ? warningsBahaya.join('<br>') : '<span style="color: #10b981; font-weight: normal;">✅ Tidak Ada Peringatan</span>';
        let textRisiko = warningsRisiko.length > 0 ? warningsRisiko.join('<br>') : '<span style="color: #10b981; font-weight: normal;">✅ Risiko Rendah</span>';

        tableRowsHTML += `
            <tr>
                <td style="padding: 10px; border: 1px solid #0f172a; text-align: center; font-weight: bold; background: #f8fafc;">${dayLabel}</td>
                <td style="padding: 10px; border: 1px solid #0f172a; text-align: center;">${safeDateString}</td>
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
                .kop-surat { display: flex; align-items: center; border-bottom: 4px double #000; padding-bottom: 15px; margin-bottom: 25px; text-align: center; }
                .logo { width: 80px; height: auto; position: absolute; left: 40px; }
                .kop-text { flex: 1; }
                .kop-text h2 { margin: 0; font-size: 16px; text-transform: uppercase; }
                .kop-text h1 { margin: 5px 0; font-size: 20px; font-weight: bold; }
                .kop-text p { margin: 0; font-size: 13px; }
                .doc-title { text-align: center; margin-bottom: 30px; }
                .doc-title h3 { margin: 0; font-size: 16px; text-decoration: underline; text-transform: uppercase; }
                .meta-box { margin-bottom: 25px; font-size: 14px; line-height: 1.8; }
                .meta-item span { display: inline-block; width: 200px; font-weight: bold;}
                table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
                th { background: #f1f5f9; color: #000; padding: 12px 10px; border: 1px solid #000; text-transform: uppercase; font-weight: bold;}
                .footer-sign { margin-top: 50px; float: right; text-align: center; font-size: 14px; }
                .footer-sign .space { height: 70px; }
                @media print { 
                    body { padding: 20px; } 
                    th { background-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; color-adjust: exact; } 
                    td span { -webkit-print-color-adjust: exact; color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="kop-surat">
                <img src="assets/logo.png" class="logo" alt="Logo BMKG" onerror="this.style.display='none'">
                <div class="kop-text">
                    <h2>BADAN METEOROLOGI, KLIMATOLOGI, DAN GEOFISIKA</h2>
                    <h1>BALAI BESAR MKG WILAYAH IV - MAKASSAR</h1>
                    <p>Sistem Operasional Impact-Based Forecasting (IBF) WebGIS</p>
                </div>
            </div>

            <div class="doc-title">
                <h3>LAPORAN KOMPREHENSIF POTENSI BAHAYA & RISIKO WILAYAH</h3>
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
                <p><b>( Pusat Pengendalian Operasional IBF )</b></p>
            </div>

            <script>
                window.onload = function() { 
                    setTimeout(() => window.print(), 500); 
                };
            </script>
        </body>
        </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
