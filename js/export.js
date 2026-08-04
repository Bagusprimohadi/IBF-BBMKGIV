// ==========================================
// EXPORT.JS - GENERATOR LAPORAN PDF/PRINT V1.2
// Rekap Multi-Warning (Bahaya & Risiko)
// ==========================================

/**
 * Memicu pencetakan laporan analisis dampak
 * @param {string} namaWilayah 
 * @param {string} namaProvinsi
 * @param {number} lat 
 * @param {number} lon 
 * @param {string} kodeWilayah 
 */
function exportImpactReportPDF(namaWilayah, namaProvinsi, lat, lon, kodeWilayah) {
    let datesList = window.validDates || [];
    if (datesList.length === 0) {
        alert("Data tanggal valid belum siap untuk dicetak.");
        return;
    }

    // Format koordinat
    let coordText = (typeof Utils !== 'undefined' && typeof Utils.formatKoordinat === 'function')
        ? `${Utils.formatKoordinat(lat, 'lat')}, ${Utils.formatKoordinat(lon, 'lon')}`
        : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

    let printTime = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' });

    // Fungsi pembantu untuk memformat multiline jika ada >1 warning dari backend
    const formatWarning = (data) => {
        if (!data || data === "" || data === "Aman / Normal") return "-";
        if (Array.isArray(data)) return data.join('<br>'); // Jika backend mengirim array
        return String(data).replace(/,/g, '<br>'); // Jika dipisah koma
    };

    // Susun baris tabel untuk laporan
    let tableRowsHTML = '';
    datesList.forEach((dateStr, index) => {
        let dayLabel = index === 0 ? 'H-1' : `H+${index - 1}`;
        let formattedDate = (typeof Utils !== 'undefined' && typeof Utils.formatTanggal === 'function')
            ? Utils.formatTanggal(dateStr)
            : dateStr;

        let warningBahaya = "-";
        let warningRisiko = "-";

        if (window.backendImpactData) {
            let regionData = window.backendImpactData[kodeWilayah]
                          || window.backendImpactData[namaWilayah]
                          || window.backendImpactData[namaWilayah.toUpperCase()]
                          || window.backendImpactData[namaWilayah.toLowerCase()];

            if (regionData) {
                // Skema JSON Backend diharapkan memiliki key seperti: bahaya_day_0, risiko_day_0
                let bData = regionData[`bahaya_day_${index}`] || regionData[`hazard_day_${index}`] || regionData[`day_${index}`];
                let rData = regionData[`risiko_day_${index}`] || regionData[`risk_day_${index}`];

                warningBahaya = formatWarning(bData);
                warningRisiko = formatWarning(rData);
            }
        }

        tableRowsHTML += `
            <tr>
                <td style="padding: 10px; border: 1px solid #0f172a; text-align: center; font-weight: bold;">${dayLabel}</td>
                <td style="padding: 10px; border: 1px solid #0f172a;">${formattedDate}</td>
                <td style="padding: 10px; border: 1px solid #0f172a; font-weight: bold; color: #b91c1c;">
                    ${warningBahaya}
                </td>
                <td style="padding: 10px; border: 1px solid #0f172a; font-weight: bold; color: #b91c1c;">
                    ${warningRisiko}
                </td>
            </tr>
        `;
    });

    // Buat jendela cetak temporer
    let printWindow = window.open('', '_blank', 'width=850,height=900');
    
    let htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Laporan IBF - ${namaWilayah}</title>
            <style>
                body {
                    font-family: 'Times New Roman', Times, serif;
                    color: #000;
                    margin: 0;
                    padding: 40px;
                    background: #fff;
                }
                .kop-surat {
                    display: flex;
                    align-items: center;
                    border-bottom: 4px double #000;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                    text-align: center;
                }
                .logo {
                    width: 80px;
                    height: auto;
                    position: absolute;
                    left: 40px;
                }
                .kop-text {
                    flex: 1;
                }
                .kop-text h2 { margin: 0; font-size: 16px; text-transform: uppercase; }
                .kop-text h1 { margin: 5px 0; font-size: 20px; font-weight: bold; }
                .kop-text p { margin: 0; font-size: 13px; }
                .doc-title {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .doc-title h3 { margin: 0; font-size: 16px; text-decoration: underline; text-transform: uppercase; }
                
                .meta-box {
                    margin-bottom: 25px;
                    font-size: 14px;
                    line-height: 1.8;
                }
                .meta-item span {
                    display: inline-block;
                    width: 200px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                    font-size: 13px;
                }
                th {
                    background: #f1f5f9;
                    color: #000;
                    padding: 10px;
                    border: 1px solid #000;
                    text-transform: uppercase;
                }
                .footer-sign {
                    margin-top: 50px;
                    float: right;
                    text-align: center;
                    font-size: 14px;
                }
                .footer-sign .space {
                    height: 70px;
                }
                @media print {
                    body { padding: 20px; }
                    th { background-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="kop-surat">
                <!-- Pastikan path logo sesuai dengan struktur folder Anda -->
                <img src="assets/logo.png" class="logo" alt="Logo BMKG" onerror="this.style.display='none'">
                <div class="kop-text">
                    <h2>BADAN METEOROLOGI, KLIMATOLOGI, DAN GEOFISIKA</h2>
                    <h1>BALAI BESAR MKG WILAYAH IV - MAKASSAR</h1>
                    <p>Sistem Operasional Impact-Based Forecasting (IBF) WebGIS</p>
                </div>
            </div>

            <div class="doc-title">
                <h3>LAPORAN RINGKAS POTENSI RISIKO DAMPAK WILAYAH</h3>
            </div>

            <div class="meta-box">
                <div class="meta-item"><span>Koordinat</span> : ${coordText}</div>
                <div class="meta-item"><span>Wilayah Kabupaten/Kota</span> : ${namaWilayah.toUpperCase()}</div>
                <div class="meta-item"><span>Wilayah Provinsi</span> : ${namaProvinsi.toUpperCase()}</div>
                <div class="meta-item"><span>Waktu Cetak</span> : ${printTime}</div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 10%;">Periode</th>
                        <th style="width: 25%;">Tanggal</th>
                        <th style="width: 32.5%;">Warning Bahaya</th>
                        <th style="width: 32.5%;">Warning Risiko</th>
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
                // Membuka jendela print otomatis saat halaman dimuat
                window.onload = function() { window.print(); };
            </script>
        </body>
        </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
