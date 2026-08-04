// ==========================================
// UTILS.JS - FUNGSI BANTU / HELPER V1.2 (GEOJSON ENHANCED)
// ==========================================

const Utils = {
    /**
     * Format tanggal standar Indonesia aman dari pergeseran zona waktu UTC
     * @param {string|Date} dateStr 
     * @returns {string}
     */
    formatTanggal(dateStr) {
        if (!dateStr) return "Tanggal tidak valid";
        try {
            // Jika format YYYYMMDD dari penamaan file python (misal: 20260804)
            if (typeof dateStr === 'string' && dateStr.length === 8 && !dateStr.includes('-')) {
                const y = dateStr.substring(0, 4);
                const m = dateStr.substring(4, 6);
                const d = dateStr.substring(6, 8);
                dateStr = `${y}-${m}-${d}`;
            }

            // Ganti '-' dengan '/' untuk mencegah auto-UTC shift pada browser lama
            let cleanDate = typeof dateStr === 'string' ? dateStr.replace(/-/g, '/') : dateStr;
            let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(cleanDate).toLocaleDateString('id-ID', options);
        } catch (e) {
            return dateStr;
        }
    },

    /**
     * Format koordinat lintang/bujur agar rapi
     * @param {number} coord 
     * @param {string} type ('lat' atau 'lon')
     * @returns {string}
     */
    formatKoordinat(coord, type) {
        let num = parseFloat(coord);
        if (isNaN(num)) return "0.0000";
        let abs = Math.abs(num).toFixed(4);
        if (type === 'lat') {
            return num >= 0 ? `${abs}° LU` : `${abs}° LS`;
        } else {
            return num >= 0 ? `${abs}° BT` : `${abs}° BB`;
        }
    },

    /**
     * Mencegah XSS injection pada teks dinamis GeoJSON
     * @param {string} str 
     * @returns {string}
     */
    escapeHTML(str) {
        if (str === null || str === undefined) return "";
        return String(str).replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag)
        );
    },

    /**
     * Utilitas unduh file teks / GeoJSON ke komputer klien
     */
    downloadFile(content, filename, contentType) {
        let a = document.createElement('a');
        let file = new Blob([content], { type: contentType || 'application/json' });
        a.href = URL.createObjectURL(file);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    },

    /**
     * Algoritma Ray-Casting Point-in-Polygon (Mendukung Polygon & MultiPolygon GeoJSON)
     */
    pointInGeoJSON(lat, lon, geometry) {
        if (!geometry || !geometry.coordinates) return false;

        const isPointInPolyArr = (y, x, vs) => {
            let inside = false;
            for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                let xi = vs[i][0], yi = vs[i][1];
                let xj = vs[j][0], yj = vs[j][1];
                let intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            return inside;
        };

        if (geometry.type === 'Polygon') {
            return isPointInPolyArr(lat, lon, geometry.coordinates[0]);
        } else if (geometry.type === 'MultiPolygon') {
            return geometry.coordinates.some(poly => isPointInPolyArr(lat, lon, poly[0]));
        }
        return false;
    }
};
