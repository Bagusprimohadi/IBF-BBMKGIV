// ==========================================
// CONFIGURASI TERPUSAT WEBGIS IBF V1.2.1 (FIXED FULL DAYS H0 s/d H+6)
// Arsitektur Root Repo & Ekstraksi Model Vektor (.geojson)
// ==========================================

const CONFIG = {
    map: {
        defaultZoom: 7,
        defaultCenter: [-1.75, 120.25],
        defaultBounds: [[-8.505, 114.995], [5.005, 135.505]]
    },

    paths: {
        adminProvinsi: "data/admin/admin_provinsi.geojson",
        adminKabupaten: "data/admin/admin_kabupaten.geojson",
        manifest: "data/manifest.json"
    },

    // Definisi Produk Berdasarkan Kategori (Harian, Hazard, & Risiko)
    products: {
        // --- KATEGORI 1: INFO CUACA / LAUT HARIAN BIASA (FITUR 1 - KONTINU) ---
        harian: {
            "swh": {
                name: "Tinggi Gelombang",
                folder: "data/raw/swh/",
                subtitle: "Prakiraan Tinggi Gelombang Signifikan Harian",
                title: "Informasi Tinggi Gelombang Laut Indonesia",
                prefix: "swh_day_",
                extension: ".geojson",
                days: 7,
                type: "continuous",
                unit: "m",
                min: 0.0,
                max: 4.0,
                colorRamp: ["#0000ff", "#00ffff", "#00ff00", "#ffff00", "#ff0000"] // Biru -> Sian -> Hijau -> Kuning -> Merah
            },
            "wind_max": {
                name: "Kecepatan Angin Maksimum",
                folder: "data/raw/wind_max/",
                subtitle: "Prakiraan Kecepatan Angin Maksimum Harian",
                title: "Informasi Kecepatan Angin Maksimum Indonesia",
                prefix: "wind_max_day_",
                extension: ".geojson",
                days: 7,
                type: "continuous",
                unit: "knots",
                min: 0.0,
                max: 35.0,
                colorRamp: ["#e0f2fe", "#38bdf8", "#0284c7", "#1e3a8a", "#7e22ce"] // Gradasi Angin Cerah ke Kencang
            },
            "tp_sum": {
                name: "Akumulasi Curah Hujan",
                folder: "data/raw/tp_sum/",
                subtitle: "Prakiraan Akumulasi Curah Hujan 24 Jam",
                title: "Informasi Akumulasi Curah Hujan Indonesia",
                prefix: "tp_sum_day_",
                extension: ".geojson",
                days: 7,
                type: "continuous",
                unit: "mm",
                min: 0.0,
                max: 100.0,
                colorRamp: ["#ffffff", "#86efac", "#22c55e", "#eab308", "#ef4444", "#a855f7"] // Putih -> Hijau -> Kuning -> Merah -> Ungu
            },
            "current_speed_max": {
                name: "Kecepatan Arus Permukaan",
                folder: "data/raw/current_speed_max/",
                subtitle: "Prakiraan Kecepatan Arus Laut Permukaan",
                title: "Informasi Kecepatan Arus Permukaan Laut Indonesia",
                prefix: "current_speed_max_day_",
                extension: ".geojson",
                days: 7,
                type: "continuous",
                unit: "m/s",
                min: 0.0,
                max: 1.5,
                colorRamp: ["#f0fdf4", "#4ade80", "#0ea5e9", "#2563eb", "#1e1b4b"] // Hijau Muda -> Biru -> Biru Tua
            },
            "tmax": {
                name: "Suhu Udara Maksimum",
                folder: "data/raw/tmax/",
                subtitle: "Prakiraan Suhu Udara Maksimum Harian",
                title: "Informasi Suhu Udara Maksimum Indonesia",
                prefix: "tmax_day_",
                extension: ".geojson",
                days: 7,
                type: "continuous",
                unit: "°C",
                min: 20.0,
                max: 38.0,
                colorRamp: ["#fef08a", "#f97316", "#dc2626", "#7f1d1d"] // Kuning -> Orange -> Merah -> Merah Gelap
            },
            "tmin": {
                name: "Suhu Udara Minimum",
                folder: "data/raw/tmin/",
                subtitle: "Prakiraan Suhu Udara Minimum Harian",
                title: "Informasi Suhu Udara Minimum Indonesia",
                prefix: "tmin_day_",
                extension: ".geojson",
                days: 7,
                type: "continuous",
                unit: "°C",
                min: 16.0,
                max: 28.0,
                colorRamp: ["#38bdf8", "#818cf8", "#a855f7", "#e11d48"] // Biru Muda -> Nila -> Ungu -> Merah Muda
            }
        },

        // --- KATEGORI 2: HAZARD (POTENSI BAHAYA) ---
        hazard: {
            "angin": {
                name: "Angin Kencang",
                folder: "data/hazard/angin/",
                subtitle: "IBF SWAF : Severe Wind Alert Forecast",
                title: "Prediksi Bahaya Angin Kencang Indonesia",
                prefix: "angin_day_",
                extension: ".geojson",
                days: 7,
                type: "categorical",
                legends: [
                    { color: "#E0B0FF", label: "Waspada Dampak Angin Cuaca Badai", level: "waspada_badai" },
                    { color: "#BA55D3", label: "Siaga Dampak Angin Cuaca Badai", level: "siaga_badai" },
                    { color: "#800080", label: "Awas Dampak Angin Cuaca Badai", level: "awas_badai" },
                    { color: "#87CEFA", label: "Waspada Dampak Angin Cuaca Cerah", level: "waspada_cerah" },
                    { color: "#1E90FF", label: "Siaga Dampak Angin Cuaca Cerah", level: "siaga_cerah" },
                    { color: "#00008B", label: "Awas Dampak Angin Cuaca Cerah", level: "awas_cerah" },
                    { color: "#DEB887", label: "Waspada Dampak Angin Cuaca Hybrid", level: "waspada_hybrid" },
                    { color: "#A0522D", label: "Siaga Dampak Angin Cuaca Hybrid", level: "siaga_hybrid" },
                    { color: "#5C4033", label: "Awas Dampak Angin Cuaca Hybrid", level: "awas_hybrid" }
                ]
            },
            "banjir": {
                name: "Banjir (Hazard)",
                folder: "data/hazard/banjir/",
                subtitle: "IBF InaFLEWS : Indonesia Flood Landslide Early Warning System",
                title: "Prediksi Potensi Bahaya Banjir Indonesia",
                prefix: "banjir_day_",
                extension: ".geojson",
                days: 7,
                type: "categorical",
                legends: [
                    { color: "transparent", label: "Aman / Normal", level: "normal" },
                    { color: "#FFFF00", label: "Waspada Potensi Banjir", level: "waspada" },
                    { color: "#FFA500", label: "Siaga Potensi Banjir", level: "siaga" },
                    { color: "#FF0000", label: "Awas Potensi Banjir", level: "awas" }
                ]
            },
            "longsor": {
                name: "Longsor (Hazard)",
                folder: "data/hazard/longsor/",
                subtitle: "IBF InaFLEWS : Indonesia Flood Landslide Early Warning System",
                title: "Prediksi Potensi Bahaya Longsor Indonesia",
                prefix: "longsor_day_",
                extension: ".geojson",
                days: 7,
                type: "categorical",
                legends: [
                    { color: "transparent", label: "Aman / Normal", level: "normal" },
                    { color: "#FFFF00", label: "Waspada Potensi Longsor", level: "waspada" },
                    { color: "#FFA500", label: "Siaga Potensi Longsor", level: "siaga" },
                    { color: "#FF0000", label: "Awas Potensi Longsor", level: "awas" }
                ]
            },
            "suhu": {
                name: "Udara Panas (Heat Stress)",
                folder: "data/hazard/heatstres/",
                subtitle: "IBF HELIOS : Heat Extreme Level Indicator System",
                title: "Prediksi Potensi Udara Panas HeatStress Indonesia",
                prefix: "suhu_day_",
                extension: ".geojson",
                days: 7,
                type: "categorical",
                legends: [
                    { color: "transparent", label: "Nyaman / Tidak Ada Potensi", level: "normal" },
                    { color: "#FFFF00", label: "Waspada Udara Panas", level: "waspada" },
                    { color: "#FFA500", label: "Siaga Udara Panas", level: "siaga" },
                    { color: "#FF0000", label: "Awas Udara Panas", level: "awas" }
                ]
            },
            "snorkling": {
                name: "Aktivitas Snorkling (Hazard)",
                folder: "data/hazard/snorkling/",
                subtitle: "IBF Maritim Snordiv Mariso : Snorkling & Diving Maritime Situational Outlook",
                title: "Prediksi Kondisi Keamanan Snorkling Indonesia",
                prefix: "snorkling_day_",
                extension: ".geojson",
                days: 7,
                type: "categorical",
                legends: [
                    { color: "#00FF00", label: "Aman untuk Snorkling", level: "normal" },
                    { color: "#FFFF00", label: "Waspada Aktivitas Snorkling", level: "waspada" },
                    { color: "#FFA500", label: "Siaga Aktivitas Snorkling", level: "siaga" },
                    { color: "#FF0000", label: "Berbahaya / Awas", level: "awas" }
                ]
            },
            "diving": {
                name: "Aktivitas Diving (Hazard)",
                folder: "data/hazard/diving/",
                subtitle: "IBF Maritim Snordiv Mariso : Snorkling & Diving Maritime Situational Outlook",
                title: "Prediksi Kondisi Keamanan Diving Indonesia",
                prefix: "diving_day_",
                extension: ".geojson",
                days: 7,
                type: "categorical",
                legends: [
                    { color: "#00FF00", label: "Aman untuk Diving", level: "normal" },
                    { color: "#FFFF00", label: "Waspada Aktivitas Diving", level: "waspada" },
                    { color: "#FFA500", label: "Siaga Aktivitas Diving", level: "siaga" },
                    { color: "#FF0000", label: "Berbahaya / Awas", level: "awas" }
                ]
            }
        },

        // --- KATEGORI 3: RISIKO (DAMPAK RISIKO BENCANA) ---
        risiko: {
            "risiko_banjir": {
                name: "Risiko Dampak Banjir",
                folder: "data/risiko/banjir/",
                subtitle: "IBF InaFLEWS : Indonesia Flood Landslide Early Warning System",
                title: "Prediksi Risiko Dampak Banjir Indonesia",
                prefix: "risiko_banjir_day_",
                extension: ".geojson",
                days: 7,
                type: "categorical",
                legends: [
                    { color: "transparent", label: "Tidak Ada Risiko", level: "normal" },
                    { color: "#FFFF00", label: "Risiko Rendah (Waspada)", level: "waspada" },
                    { color: "#FFA500", label: "Risiko Sedang (Siaga)", level: "siaga" },
                    { color: "#FF0000", label: "Risiko Tinggi (Awas)", level: "awas" }
                ]
            },
            "risiko_longsor": {
                name: "Risiko Dampak Longsor",
                folder: "data/risiko/longsor/",
                subtitle: "IBF InaFLEWS : Indonesia Flood Landslide Early Warning System",
                title: "Prediksi Risiko Dampak Longsor Indonesia",
                prefix: "risiko_longsor_day_",
                extension: ".geojson",
                days: 7,
                type: "categorical",
                legends: [
                    { color: "transparent", label: "Tidak Ada Risiko", level: "normal" },
                    { color: "#FFFF00", label: "Risiko Rendah (Waspada)", level: "waspada" },
                    { color: "#FFA500", label: "Risiko Sedang (Siaga)", level: "siaga" },
                    { color: "#FF0000", label: "Risiko Tinggi (Awas)", level: "awas" }
                ]
            },
            "risiko_snorkling": {
                name: "Risiko Keamanan Snorkling",
                folder: "data/risiko/snorkling/",
                subtitle: "IBF Maritim Snordiv Mariso : Snorkling & Diving Maritime Situational Outlook",
                title: "Prediksi Risiko Keamanan Snorkling Indonesia",
                prefix: "risiko_snorkling_day_",
                extension: ".geojson",
                days: 7,
                type: "categorical",
                legends: [
                    { color: "#00FF00", label: "Tidak Ada Risiko", level: "normal" },
                    { color: "#FFFF00", label: "Risiko Rendah", level: "waspada" },
                    { color: "#FFA500", label: "Risiko Sedang", level: "siaga" },
                    { color: "#FF0000", label: "Risiko Tinggi", level: "awas" }
                ]
            },
            "risiko_diving": {
                name: "Risiko Keamanan Diving",
                folder: "data/risiko/diving/",
                subtitle: "IBF Maritim Snordiv Mariso : Snorkling & Diving Maritime Situational Outlook",
                title: "Prediksi Risiko Keamanan Diving Indonesia",
                prefix: "risiko_diving_day_",
                extension: ".geojson",
                days: 7,
                type: "categorical",
                legends: [
                    { color: "#00FF00", label: "Tidak Ada Risiko", level: "normal" },
                    { color: "#FFFF00", label: "Risiko Rendah", level: "waspada" },
                    { color: "#FFA500", label: "Risiko Sedang", level: "siaga" },
                    { color: "#FF0000", label: "Risiko Tinggi", level: "awas" }
                ]
            }
        }
    }
};
