// ==========================================
// CONFIGURASI TERPUSAT WEBGIS IBF V1.1
// Sesuai Struktur Direktori & Perbedaan Produk Hazard vs Risiko
// ==========================================

const CONFIG = {
    map: {
        defaultZoom: 5,
        defaultCenter: [-1.75, 125.25],
        defaultBounds: [[-8.505, 114.995], [5.005, 135.505]]
    },

    paths: {
        adminProvinsi: "data/admin/provinsi.geojson",
        adminKabupaten: "data/admin/kabupaten.geojson",
        manifest: "data/manifest.json"
    },

    // Definisi Produk Berdasarkan Kategori (Hazard & Risiko)
    // Masing-masing memiliki folder dan karakteristik produk sendiri
    products: {
        // --- KATEGORI HAZARD (POTENSI BAHAYA) ---
        hazard: {
            "angin": {
                name: "Angin Kencang",
                folder: "data/hazard/Angin Kencang/",
                imageFolder: "images/hazard/angin/",
                subtitle: "IBF SWAF : Severe Wind Alert Forecast",
                title: "Prediksi Bahaya Angin Kencang Indonesia",
                metaFile: "metadata_angin.json",
                prefix: "angin_day_",
                hasSpecialClasses: true, // Spesial 9 Kelas
                legends: [
                    { color: "#E0B0FF", label: "Waspada Dampak Angin Cuaca Badai", level: "Waspada" },
                    { color: "#BA55D3", label: "Siaga Dampak Angin Cuaca Badai", level: "Siaga" },
                    { color: "#800080", label: "Awas Dampak Angin Cuaca Badai", level: "Awas" },
                    { color: "#87CEFA", label: "Waspada Dampak Angin Cuaca Cerah", level: "Waspada" },
                    { color: "#1E90FF", label: "Siaga Dampak Angin Cuaca Cerah", level: "Siaga" },
                    { color: "#00008B", label: "Awas Dampak Angin Cuaca Cerah", level: "Awas" },
                    { color: "#DEB887", label: "Waspada Dampak Angin Cuaca Hybrid", level: "Waspada" },
                    { color: "#A0522D", label: "Siaga Dampak Angin Cuaca Hybrid", level: "Siaga" },
                    { color: "#5C4033", label: "Awas Dampak Angin Cuaca Hybrid", level: "Awas" }
                ]
            },
            "banjir": {
                name: "Banjir (Hazard)",
                folder: "data/hazard/Banjir/",
                imageFolder: "images/hazard/banjir/",
                subtitle: "IBF InaFLEWS : Indonesia Flood Landslide Early Warning System",
                title: "Prediksi Potensi Bahaya Banjir Indonesia",
                metaFile: "metadata_banjir.json",
                prefix: "banjir_day_",
                hasSpecialClasses: false,
                legends: [
                    { color: "transparent", label: "Aman / Normal", level: "Normal" },
                    { color: "#FFFF00", label: "Waspada Potensi Banjir", level: "Waspada" },
                    { color: "#FFA500", label: "Siaga Potensi Banjir", level: "Siaga" },
                    { color: "#FF0000", label: "Awas Potensi Banjir", level: "Awas" }
                ]
            },
            "longsor": {
                name: "Longsor (Hazard)",
                folder: "data/hazard/Longsor/",
                imageFolder: "images/hazard/longsor/",
                subtitle: "IBF InaFLEWS : Indonesia Flood Early Warning System",
                title: "Prediksi Potensi Bahaya Longsor Indonesia",
                metaFile: "metadata_longsor.json",
                prefix: "longsor_day_",
                hasSpecialClasses: false,
                legends: [
                    { color: "transparent", label: "Aman / Normal", level: "Normal" },
                    { color: "#FFFF00", label: "Waspada Potensi Longsor", level: "Waspada" },
                    { color: "#FFA500", label: "Siaga Potensi Longsor", level: "Siaga" },
                    { color: "#FF0000", label: "Awas Potensi Longsor", level: "Awas" }
                ]
            },
            "suhu": {
                name: "Udara Panas (Heat Stress)",
                folder: "data/hazard/Udara Panas HeatStress/",
                imageFolder: "images/hazard/suhu/",
                subtitle: "IBF HELIOS : Heat Extreme Level Indicator System",
                title: "Prediksi Potensi Udara Panas HeatStres Indonesia",
                metaFile: "metadata_at_disc.json",
                prefix: "at_disc_day_",
                hasSpecialClasses: false,
                legends: [
                    { color: "transparent", label: "Nyaman / Tidak Ada Potensi", level: "Normal" },
                    { color: "#FFFF00", label: "Waspada Udara Panas", level: "Waspada" },
                    { color: "#FFA500", label: "Siaga Udara Panas", level: "Siaga" },
                    { color: "#FF0000", label: "Awas Udara Panas", level: "Awas" }
                ]
            },
            "snorkling": {
                name: "Aktivitas Snorkling (Hazard)",
                folder: "data/hazard/Snorkling/",
                imageFolder: "images/hazard/snorkling/",
                subtitle: "Marine Weather Early Warning System",
                title: "Prediksi Kondisi Keamanan Snorkling Indonesia",
                metaFile: "metadata_snorkling.json",
                prefix: "snorkling_day_",
                hasSpecialClasses: false,
                legends: [
                    { color: "#00FF00", label: "Aman untuk Snorkling", level: "Normal" },
                    { color: "#FFFF00", label: "Waspada Aktivitas Snorkling", level: "Waspada" },
                    { color: "#FFA500", label: "Siaga Aktivitas Snorkling", level: "Siaga" },
                    { color: "#FF0000", label: "Berbahaya / Awas", level: "Awas" }
                ]
            },
            "diving": {
                name: "Aktivitas Diving (Hazard)",
                folder: "data/hazard/Diving/",
                imageFolder: "images/hazard/diving/",
                subtitle: "Marine Weather Early Warning System",
                title: "Prediksi Kondisi Keamanan Diving Indonesia",
                metaFile: "metadata_diving.json",
                prefix: "diving_day_",
                hasSpecialClasses: false,
                legends: [
                    { color: "#00FF00", label: "Aman untuk Diving", level: "Normal" },
                    { color: "#FFFF00", label: "Waspada Aktivitas Diving", level: "Waspada" },
                    { color: "#FFA500", label: "Siaga Aktivitas Diving", level: "Siaga" },
                    { color: "#FF0000", label: "Berbahaya / Awas", level: "Awas" }
                ]
            }
        },

        // --- KATEGORI RISIKO (DAMPAK RISIKO BENCANA) ---
        risiko: {
            "risiko_banjir": {
                name: "Risiko Dampak Banjir",
                folder: "data/risiko/Banjir/",
                imageFolder: "images/risiko/banjir/",
                subtitle: "IBF InaFLEWS : Impact-Based Forecasting",
                title: "Prediksi Risiko Dampak Banjir Indonesia",
                metaFile: "metadata_risiko_banjir.json",
                prefix: "risiko_banjir_day_",
                hasSpecialClasses: false,
                legends: [
                    { color: "transparent", label: "Risiko Rendah", level: "Normal" },
                    { color: "#FFFF00", label: "Risiko Sedang (Waspada)", level: "Waspada" },
                    { color: "#FFA500", label: "Risiko Tinggi (Siaga)", level: "Siaga" },
                    { color: "#FF0000", label: "Risiko Sangat Tinggi (Awas)", level: "Awas" }
                ]
            },
            "risiko_longsor": {
                name: "Risiko Dampak Longsor",
                folder: "data/risiko/Longsor/",
                imageFolder: "images/risiko/longsor/",
                subtitle: "IBF InaFLEWS : Impact-Based Forecasting",
                title: "Prediksi Risiko Dampak Longsor Indonesia",
                metaFile: "metadata_risiko_longsor.json",
                prefix: "risiko_longsor_day_",
                hasSpecialClasses: false,
                legends: [
                    { color: "transparent", label: "Risiko Rendah", level: "Normal" },
                    { color: "#FFFF00", label: "Risiko Sedang (Waspada)", level: "Waspada" },
                    { color: "#FFA500", label: "Risiko Tinggi (Siaga)", level: "Siaga" },
                    { color: "#FF0000", label: "Risiko Sangat Tinggi (Awas)", level: "Awas" }
                ]
            },
            "risiko_snorkling": {
                name: "Risiko Keamanan Snorkling",
                folder: "data/risiko/Snorkling/",
                imageFolder: "images/risiko/snorkling/",
                subtitle: "Marine Impact-Based Forecasting",
                title: "Prediksi Risiko Keamanan Snorkling Indonesia",
                metaFile: "metadata_risiko_snorkling.json",
                prefix: "risiko_snorkling_day_",
                hasSpecialClasses: false,
                legends: [
                    { color: "#00FF00", label: "Risiko Rendah", level: "Normal" },
                    { color: "#FFFF00", label: "Risiko Sedang", level: "Waspada" },
                    { color: "#FFA500", label: "Risiko Tinggi", level: "Siaga" },
                    { color: "#FF0000", label: "Risiko Sangat Tinggi", level: "Awas" }
                ]
            },
            "risiko_diving": {
                name: "Risiko Keamanan Diving",
                folder: "data/risiko/Diving/",
                imageFolder: "images/risiko/diving/",
                subtitle: "Marine Impact-Based Forecasting",
                title: "Prediksi Risiko Keamanan Diving Indonesia",
                metaFile: "metadata_risiko_diving.json",
                prefix: "risiko_diving_day_",
                hasSpecialClasses: false,
                legends: [
                    { color: "#00FF00", label: "Risiko Rendah", level: "Normal" },
                    { color: "#FFFF00", label: "Risiko Sedang", level: "Waspada" },
                    { color: "#FFA500", label: "Risiko Tinggi", level: "Siaga" },
                    { color: "#FF0000", label: "Risiko Sangat Tinggi", level: "Awas" }
                ]
            }
        }
    }
};
