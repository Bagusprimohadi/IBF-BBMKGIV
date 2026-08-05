// ==========================================
// EXPORT.JS - GENERATOR LAPORAN PDF/PRINT V2.0 (ASYNC MULTI-WARNING SCANNER)
// Rekap Cerdas Multi-Parameter (Bahaya & Risiko) Berbasis Spasial GeoJSON
// ==========================================

/**
 * Normalisasi string nama wilayah untuk pencocokan
 */
function normalizeName(str) {
    if (!str) return "";
    return String(str).toLowerCase().replace(/^(kabupaten|kab\.|kota)\s+/gi, '').replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Fetch GeoJSON dengan penanganan error (Silently fail jika file H+x belum ada/404)
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
 * Mencari apakah koordinat atau nama wilayah ada di dalam GeoJSON
 */
function findActiveFeature(geojsonData, targetName, lat, lon) {
    if (!geojsonData || !geojsonData.features) return null;
    
    let normTarget = normalizeName(targetName);
    
    return geojsonData.features.find(f => {
        let p = f.properties || {};
        let hName = p.kabupaten || p.WADMKK || p.NAME_2 || p.NAMOBJ || "";
        
        // Pencocokan Nama
        if (hName && normalizeName(hName) === normTarget) return true;
        
        // Pencocokan Spasial Bounding Box/Turf (Jika ada)
        if (typeof turf !== 'undefined' && lat && lon && f.geometry) {
            try {
                let pt = turf.point([lon, lat]);
                return turf.booleanPointInPolygon(pt, f);
            } catch(e) { }
        }
        return false;
    });
}

/**
 * Membaca status bahaya berdasarkan Legenda Config
 */
function getStatusInfo(props, prodConfig) {
    let label = props.kategori || props.level || props.status || "Waspada";
    let color = props.color || props.hex_color || "#ef4444";
    let isSafe = false;
    
    let textKey = String(label).toLowerCase().trim();
    if (prodConfig && prodConfig.legends) {
        let matched = prodConfig.legends.find(l => String(l.level || l.label || l.code || '').toLowerCase().trim() === textKey);
        if (!matched) matched = prodConfig.legends.find(l => String(l.color).toUpperCase().trim() === String(color).toUpperCase().trim());
        if (matched) label = matched.label || matched.level || label;
    }
    
    let lblLower = String(label).toLowerCase();
    if (lblLower.includes("aman") || lblLower.includes("nyaman") || lblLower.includes("tidak ada") || color.toLowerCase() === '#00ff00' || color === 'transparent') {
        isSafe = true;
    }
    
    return { label, isSafe, color };
}

/**
 * Memicu pencetakan laporan analisis dampak (Dirombak menjadi Async)
 */
async function exportImpactReportPDF(namaWilayah, kodeWilayah, levelVal, lat, lon) {
    // 1. Tampilkan Indikator Loading (Karena kita akan scan puluhan file)
    let btn = document.querySelector('.btn-export');
    let originalBtnText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.innerHTML = '⏳ Sedang Memindai Semua Parameter...';
        btn.disabled = true;
    }

    // Pastikan array validDates punya 7 hari (H0 s/d H+6), jika kosong, buat otomatis
    let datesList = window.validDates || [];
    if (datesList.length === 0) {
        let today = new Date();
        for (let i = 0; i < 7; i++) {
            let d = new Date(today);
            d.setDate(d.getDate() + i);
            datesList.push(d.toISOString().split('T')[0]);
        }
    }

    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function') ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}` : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    let printTime = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' });
    let tableRowsHTML = '';

    // 2. Loop per Hari (H0 s/d H+6)
    for (let i = 0; i < datesList.length; i++) {
        let dayLabel = i === 0 ? 'H0' : `H+${i}`;
        let formattedDate = (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function') ? Utils.formatTanggal(datesList[i]) : datesList[i];
        
        let warningsBahaya = [];
        let warningsRisiko = [];

        // 3A. Scan Paralel Semua File Hazard di Hari (i)
        if (CONFIG && CONFIG.products && CONFIG.products.hazard) {
            let hazardPromises = Object.values(CONFIG.products.hazard).map(async (prod) => {
                let url = `${prod.folder}${prod.prefix}${i}${prod.extension}`;
                let geojson = await fetchGeoJSON(url);
                let feat = findActiveFeature(geojson, namaWilayah, lat, lon);
                if (feat) {
                    let stat = getStatusInfo(feat.properties, prod);
                    if (!stat.isSafe) return `<span style="color:${stat.color}; filter: brightness(0.8); font-weight:bold;">[${prod.name}]</span> : ${stat.label}`;
                }
                return null;
            });
            let results = await Promise.all(hazardPromises);
            warningsBahaya = results.filter(r => r !== null);
        }

        // 3B. Scan Paralel Semua File Risiko di Hari (i)
        if (CONFIG && CONFIG.products && CONFIG.products.risiko) {
            let risikoPromises = Object.values(CONFIG.products.risiko).map(async (prod) => {
                let url = `${prod.folder}${prod.prefix}${i}${prod.extension}`;
                let geojson = await fetchGeoJSON(url);
                let feat = findActiveFeature(geojson, namaWilayah, lat, lon);
                if (feat) {
                    let stat = getStatusInfo(feat.properties, prod);
                    if (!stat.isSafe) return `<span style="color:${stat.color}; filter: brightness(0.8); font-weight:bold;">[${prod.name}]</span> : ${stat.label}`;
                }
                return null;
            });
            let results = await Promise.all(risikoPromises);
            warningsRisiko = results.filter(r => r !== null);
        }

        // 4. Format Teks Baris Tabel
        let textBahaya = warningsBahaya.length > 0 ? warningsBahaya.join('<br>') : '<span style="color: #10b981; font-weight: normal;">✅ Tidak Ada Peringatan</span>';
        let textRisiko = warningsRisiko.length > 0 ? warningsRisiko.join('<br>') : '<span style="color: #10b981; font-weight: normal;">✅ Risiko Rendah</span>';

        tableRowsHTML += `
            <tr>
                <td style="padding: 10px; border: 1px solid #0f172a; text-align: center; font-weight: bold; background: #f8fafc;">${dayLabel}</td>
                <td style="padding: 10px; border: 1px solid #0f172a; text-align: center;">${formattedDate}</td>
                <td style="padding: 10px; border: 1px solid #0f172a; line-height: 1.6;">${textBahaya}</td>
                <td style="padding: 10px; border: 1px solid #0f172a; line-height: 1.6;">${textRisiko}</td>
            </tr>
        `;
    }

    // Kembalikan tombol popup seperti semula
    if (btn) {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
    }

    // 5. Build HTML & Buka Jendela Print
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
