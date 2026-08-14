// ==========================================
// CONFIGURASI TERPUSAT WEBGIS IBF V1.2.4 (DUAL PNG OVERLAY + EXACT BMKG COLORMAPS)
// - Updated parameter keys: wind_mean & current_speed_mean
// - Updated exact BMKG HEX Color Palette & Levels
// - Added Parameter: Potensi Bahaya Hipotermia (IBF SEMERU)
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
        // --- KATEGORI 1: INFO CUACA / LAUT HARIAN BIASA (FITUR 1 - DUAL PNG OVERLAY) ---
        harian: {
            "swh": {
                name: "Tinggi Gelombang",
                folder: "data/raw/swh/",
                subtitle: "Prakiraan Tinggi Gelombang Signifikan Harian",
                title: "Informasi Tinggi Gelombang Laut Indonesia",
                prefix: "swh_day_",
                days: 7,
                type: "image_overlay",
                unit: "m",
                levels: [0.0, 1.25, 2.5, 4.0, 6.0, 9.0],
                colorRamp: ["#87CEEB", "#FFFF00", "#FFA500", "#FF0000", "#800080"],
                labels: ["0.0 - 1.25 m", "1.25 - 2.5 m", "2.5 - 4.0 m", "4.0 - 6.0 m", "6.0 - 9.0 m"]
            },
            "wind_mean": {
                name: "Kecepatan Angin Rata-Rata",
                folder: "data/raw/wind_mean/",
                subtitle: "Prakiraan Kecepatan Angin Rata-Rata Harian",
                title: "Informasi Kecepatan Angin Rata-Rata Indonesia",
                prefix: "wind_mean_day_",
                days: 7,
                type: "image_overlay",
                unit: "knots",
                levels: [0, 5, 10, 15, 20, 25, 34, 48, 64, 100],
                colorRamp: ["#ADD8E6", "#0000FF", "#90EE90", "#008000", "#FFFFE0", "#FFD700", "#FFA500", "#FF4500", "#8B0000"],
                labels: ["0 - 5 kt", "5 - 10 kt", "10 - 15 kt", "15 - 20 kt", "20 - 25 kt", "25 - 34 kt", "34 - 48 kt", "48 - 64 kt", "> 64 kt"]
            },
            "tp_sum": {
                name: "Akumulasi Curah Hujan",
                folder: "data/raw/tp_sum/",
                subtitle: "Prakiraan Akumulasi Curah Hujan 24 Jam",
                title: "Informasi Akumulasi Curah Hujan Indonesia",
                prefix: "tp_sum_day_",
                days: 7,
                type: "image_overlay",
                unit: "mm",
                levels: [0, 3, 20, 50, 100, 150],
                colorRamp: ["#E0E0E0", "#00FF00", "#FFFF00", "#FFA500", "#FF0000"],
                labels: ["0 - 3 mm", "3 - 20 mm", "20 - 50 mm", "50 - 100 mm", "100 - 150 mm"]
            },
            "current_speed_mean": {
                name: "Kecepatan Arus Permukaan",
                folder: "data/raw/current_speed_mean/",
                subtitle: "Prakiraan Kecepatan Arus Laut Permukaan",
                title: "Informasi Kecepatan Arus Permukaan Laut Indonesia",
                prefix: "current_speed_mean_day_",
                days: 7,
                type: "image_overlay",
                unit: "m/s",
                levels: [0.0, 0.25, 0.5, 1.0, 1.5, 2.0, 3.0],
                colorRamp: ["#00FF00", "#80FF00", "#FFFF00", "#FF8000", "#FF0000", "#800000"],
                labels: ["0.0 - 0.25 m/s", "0.25 - 0.5 m/s", "0.5 - 1.0 m/s", "1.0 - 1.5 m/s", "1.5 - 2.0 m/s", "2.0 - 3.0 m/s"]
            },
            "tmax": {
                name: "Suhu Udara Maksimum",
                folder: "data/raw/tmax/",
                subtitle: "Prakiraan Suhu Udara Maksimum Harian",
                title: "Informasi Suhu Udara Maksimum Indonesia",
                prefix: "tmax_day_",
                days: 7,
                type: "image_overlay",
                unit: "°C",
                levels: [20, 24, 28, 30, 32, 34, 36, 38, 40],
                colorRamp: ["#FFFF00", "#FFD700", "#FFA500", "#FF7F00", "#FF4500", "#FF0000", "#C71585", "#8B4513"],
                labels: ["20 - 24 °C", "24 - 28 °C", "28 - 30 °C", "30 - 32 °C", "32 - 34 °C", "36 - 38 °C", "38 - 40 °C"]
            },
            "tmin": {
                name: "Suhu Udara Minimum",
                folder: "data/raw/tmin/",
                subtitle: "Prakiraan Suhu Udara Minimum Harian",
                title: "Informasi Suhu Udara Minimum Indonesia",
                prefix: "tmin_day_",
                days: 7,
                type: "image_overlay",
                unit: "°C",
                levels: [10, 14, 18, 20, 22, 24, 26, 28, 30],
                colorRamp: ["#00008B", "#0080FF", "#40E0D0", "#80E8A0", "#FFFF00", "#FFC000", "#FFA500", "#FF4500"],
                labels: ["10 - 14 °C", "14 - 18 °C", "18 - 20 °C", "20 - 22 °C", "22 - 24 °C", "24 - 26 °C", "26 - 28 °C", "28 - 30 °C"]
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
            },
            // TAMBAHAN BARU: POTENSI BAHAYA HIPOTERMIA (IBF SEMERU)
            "hypo": {
                name: "Hipotermia Pegunungan",
                folder: "data/hazard/hypo/",
                subtitle: "IBF SEMERU : Safety & Early Warning for Mountain Environment Risk Update",
                title: "Prediksi Potensi Bahaya Hipotermia Indonesia",
                prefix: "hipo_day_",
                extension: ".geojson",
                days: 7,
                type: "categorical",
                legends: [
                    { color: "#8B008B", label: "Bahaya (Potensi Hipotermia Tinggi)", level: "bahaya" },
                    { color: "#FF0000", label: "Siaga (Potensi Hipotermia Menengah)", level: "siaga" },
                    { color: "#FFA500", label: "Waspada (Potensi Hipotermia Rendah)", level: "waspada" },
                    { color: "#FFFFFF", label: "Aman (Tidak Ada Risiko Signifikan)", level: "aman" }
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
