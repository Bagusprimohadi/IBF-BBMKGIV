// ==========================================
// CONFIGURASI TERPUSAT WEBGIS IBF V1.2 (PURE GEOJSON)
// Arsitektur Root Repo & Ekstraksi Model Vektor (.geojson)
// ==========================================

const CONFIG = {
    map: {
        defaultZoom: 5,
        defaultCenter: [-1.75, 125.25],
        defaultBounds: [[-8.505, 114.995], [5.005, 135.505]]
    },

    paths: {
        adminProvinsi: "data/admin/provinsi.geojson",
        adminKabupaten: "data/admin/kabupaten.geojson"
    },

    // Definisi Produk Berdasarkan Kategori (Hazard & Risiko)
    // Setiap produk langsung memuat file vektor .geojson dari Python
    products: {
        // --- KATEGORI HAZARD (POTENSI BAHAYA) ---
        hazard: {
            "angin": {
                name: "Angin Kencang",
                folder: "data/hazard/angin/",
                subtitle: "IBF SWAF : Severe Wind Alert Forecast",
                title: "Prediksi Bahaya Angin Kencang Indonesia",
                prefix: "angin_day_",
                extension: ".geojson",
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
                legends: [
                    { color: "#00FF00", label: "Aman untuk Diving", level: "normal" },
                    { color: "#FFFF00", label: "Waspada Aktivitas Diving", level: "waspada" },
                    { color: "#FFA500", label: "Siaga Aktivitas Diving", level: "siaga" },
                    { color: "#FF0000", label: "Berbahaya / Awas", level: "awas" }
                ]
            }
        },

        // --- KATEGORI RISIKO (DAMPAK RISIKO BENCANA) ---
        risiko: {
            "risiko_banjir": {
                name: "Risiko Dampak Banjir",
                folder: "data/risiko/banjir/",
                subtitle: "IBF InaFLEWS : Indonesia Flood Landslide Early Warning System",
                title: "Prediksi Risiko Dampak Banjir Indonesia",
                prefix: "risiko_banjir_day_",
                extension: ".geojson",
                legends: [
                    { color: "transparent", label: "Risiko Rendah", level: "normal" },
                    { color: "#FFFF00", label: "Risiko Sedang (Waspada)", level: "waspada" },
                    { color: "#FFA500", label: "Risiko Tinggi (Siaga)", level: "siaga" },
                    { color: "#FF0000", label: "Risiko Sangat Tinggi (Awas)", level: "awas" }
                ]
            },
            "risiko_longsor": {
                name: "Risiko Dampak Longsor",
                folder: "data/risiko/longsor/",
                subtitle: "IBF InaFLEWS : Indonesia Flood Landslide Early Warning System",
                title: "Prediksi Risiko Dampak Longsor Indonesia",
                prefix: "risiko_longsor_day_",
                extension: ".geojson",
                legends: [
                    { color: "transparent", label: "Risiko Rendah", level: "normal" },
                    { color: "#FFFF00", label: "Risiko Sedang (Waspada)", level: "waspada" },
                    { color: "#FFA500", label: "Risiko Tinggi (Siaga)", level: "siaga" },
                    { color: "#FF0000", label: "Risiko Sangat Tinggi (Awas)", level: "awas" }
                ]
            },
            "risiko_snorkling": {
                name: "Risiko Keamanan Snorkling",
                folder: "data/risiko/snorkling/",
                subtitle: "IBF Maritim Snordiv Mariso : Snorkling & Diving Maritime Situational Outlookg",
                title: "Prediksi Risiko Keamanan Snorkling Indonesia",
                prefix: "risiko_snorkling_day_",
                extension: ".geojson",
                legends: [
                    { color: "#00FF00", label: "Risiko Rendah", level: "normal" },
                    { color: "#FFFF00", label: "Risiko Sedang", level: "waspada" },
                    { color: "#FFA500", label: "Risiko Tinggi", level: "siaga" },
                    { color: "#FF0000", label: "Risiko Sangat Tinggi", level: "awas" }
                ]
            },
            "risiko_diving": {
                name: "Risiko Keamanan Diving",
                folder: "data/risiko/diving/",
                subtitle: "IBF Maritim Snordiv Mariso : Snorkling & Diving Maritime Situational Outlook",
                title: "Prediksi Risiko Keamanan Diving Indonesia",
                prefix: "risiko_diving_day_",
                extension: ".geojson",
                legends: [
                    { color: "#00FF00", label: "Risiko Rendah", level: "normal" },
                    { color: "#FFFF00", label: "Risiko Sedang", level: "waspada" },
                    { color: "#FFA500", label: "Risiko Tinggi", level: "siaga" },
                    { color: "#FF0000", label: "Risiko Sangat Tinggi", level: "awas" }
                ]
            }
        }
    }
};
