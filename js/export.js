// ==========================================
// EXPORT.JS - GENERATOR LAPORAN PDF/PRINT V2.1 (STANDALONE SPATIAL SCANNER)
// Memperbaiki bug tanggal 2001 & deteksi spasial tanpa Turf.js
// ==========================================

/**
 * Normalisasi string nama wilayah
 */
function normalizeName(str) {
    if (!str) return "";
    return String(str).toLowerCase().replace(/^(kabupaten|kab\.|kota)\s+/gi, '').replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Fetch GeoJSON (Silently fail jika file H+x belum ada/404)
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
 * Algoritma Matematika Murni (Ray-Casting) untuk mengecek apakah titik (lat, lon) berada di dalam Poligon.
 * Bekerja 100% akurat tanpa membutuhkan library Turf.js atau nama kabupaten.
 */
function isPointInPolygonMath(lat, lon, feature) {
    if (!feature || !feature.geometry || !feature.geometry.coordinates) return false;
    
    let x = lon; // Longitude adalah sumbu X
    let y = lat; // Latitude adalah sumbu Y
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
        return checkPolygon(coords[0]); // Ambil ring terluar
    } else if (type === 'MultiPolygon') {
        for (let i = 0; i < coords.length; i++) {
            if (checkPolygon(coords[i][0])) return true;
        }
    }
    return false;
}

/**
 * Pengecekan Hibrid: Utamakan Koordinat Spasial (Ray-Casting), baru fallback ke string.
 */
function findActiveFeature(geojsonData, targetName, lat, lon) {
    if (!geojsonData || !geojsonData.features) return null;
    let normTarget = normalizeName(targetName);
    
    return geojsonData.features.find(f => {
        // 1. Pengecekan Koordinat Spasial Mutlak (Akurasi Tinggi)
        if (lat && lon && isPointInPolygonMath(lat, lon, f)) {
            return true;
        }
        
        // 2. Fallback Pengecekan Nama (Jika koordinat meleset sedikit)
        let p = f.properties || {};
        let hName = p.kabupaten || p.WADMKK || p.NAME_2 || p.NAMOBJ || "";
        if (hName && normalizeName(hName) === normTarget) return true;
        
        return false;
    });
}

/**
 * Membaca status bahaya berdasarkan Legenda Config
 */
function getStatusInfo(props, prodConfig) {
    let label = props.kategori || props.level || props.status || props.dampak || "Waspada";
    let color = props.color || props.hex_color || props.fill || "#ef4444";
    let isSafe = false;
    
    let textKey = String(label).toLowerCase().trim();
    if (prodConfig && Array.isArray(prodConfig.legends)) {
        let matched = prodConfig.legends.find(l => String(l.level || l.label || l.code || '').toLowerCase().trim() === textKey);
        if (!matched) matched = prodConfig.legends.find(l => String(l.color).toUpperCase().trim() === String(color).toUpperCase().trim());
        if (matched) {
            label = matched.label || matched.level || label;
            color = matched.color || color;
        }
    }
    
    let lblLower = String(label).toLowerCase();
    if (lblLower.includes("aman") || lblLower.includes("nyaman") || lblLower.includes("rendah") || lblLower.includes("tidak ada") || color.toLowerCase() === '#00ff00' || color === 'transparent') {
        isSafe = true;
    }
    
    return { label, isSafe, color };
}

/**
 * Generator Tanggal Bahasa Indonesia Tahan Banting (Anti-Bug 2001)
 */
function generateSafeIndonesianDate(addDays) {
    let d = new Date();
    d.setDate(d.getDate() + addDays);
    
    let days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    let months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Memicu pencetakan laporan analisis dampak (Dirombak Async)
 */
async function exportImpactReportPDF(namaWilayah, kodeWilayah, levelVal, lat, lon) {
    // Tampilkan Indikator Loading di UI
    let btn = document.querySelector('.btn-export');
    let originalBtnText = btn ? btn.innerHTML : '📄 Unduh Laporan (PDF)';
    if (btn) {
        btn.innerHTML = '⏳ Sedang Memindai Spasial (Harap Tunggu)...';
        btn.disabled = true;
    }

    // Jeda 50ms agar browser merender tombol UI dulu sebelum proses berat dimulai
    await new Promise(resolve => setTimeout(resolve, 50));

    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function') ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}` : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    let printTime = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' });
    let tableRowsHTML = '';

    // Loop 7 Hari (H0 s/d H+6)
    for (let i = 0; i < 7; i++) {
        let dayLabel = i === 0 ? 'H0' : `H+${i}`;
        let safeDateString = generateSafeIndonesianDate(i);
        
        let warningsBahaya = [];
        let warningsRisiko = [];

        // Scan Paralel Semua File Hazard di Hari (i)
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

        // Scan Paralel Semua File Risiko di Hari (i)
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

        // Format Teks Baris Tabel
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

    // Kembalikan tombol popup seperti semula
    if (btn) {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
    }

    // Build HTML & Buka Jendela Print
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
