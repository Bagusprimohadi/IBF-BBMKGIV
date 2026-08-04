// ==========================================
// TIMELINE.JS - MANAJEMEN WAKTU & STATE HARI V1.1
// ==========================================

const Timeline = {
    currentIndex: 0,
    validDates: [],

    /**
     * Inisialisasi timeline berdasarkan data tanggal dari metadata
     * @param {Array} dates 
     */
    init(dates) {
        this.validDates = dates || [];
        this.currentIndex = 0;
        this.renderButtons();
    },

    /**
     * Merender tombol-tombol pilihan hari (H-1, H+0, H+1, dst) secara dinamis
     */
    renderButtons() {
        const btnContainer = document.getElementById('dayButtonsContainer');
        if (!btnContainer) return;

        btnContainer.innerHTML = "";

        for (let i = 0; i < this.validDates.length; i++) {
            let btn = document.createElement('button');
            btn.className = 'time-btn';
            btn.id = 'day-btn-' + i;
            // Label otomatis H-1 untuk indeks 0, dan H+0, H+1, dst untuk berikutnya
            btn.innerText = `H${i === 0 ? '-1' : '+' + (i - 1)}`; 
            
            btn.onclick = () => {
                if (typeof stopPlay === 'function') stopPlay();
                this.setDay(i);
            };
            
            btnContainer.appendChild(btn);
        }
    },

    /**
     * Mengatur hari aktif dan memperbarui tampilan peta & teks tanggal
     * @param {number} index 
     */
    setDay(index) {
        if (this.validDates.length === 0) return;
        this.currentIndex = index;

        // Panggil fungsi loadDay dari overlay jika tersedia
        if (typeof loadDay === 'function') {
            loadDay(index);
        }

        // Perbarui status kelas aktif pada tombol
        for (let i = 0; i < this.validDates.length; i++) {
            let btn = document.getElementById('day-btn-' + i);
            if (btn) {
                btn.classList.toggle('active', i === index);
            }
        }

        // Perbarui teks informasi tanggal valid di header
        let dateTextEl = document.getElementById('validDateText');
        if (dateTextEl && typeof Utils !== 'undefined') {
            dateTextEl.innerText = `Valid: ${Utils.formatTanggal(this.validDates[index])}`;
        }
    },

    /**
     * Pindah ke hari berikutnya (mendukung looping)
     */
    next() {
        if (this.validDates.length === 0) return;
        let nextIndex = (this.currentIndex + 1) % this.validDates.length;
        this.setDay(nextIndex);
    },

    /**
     * Pindah ke hari sebelumnya
     */
    prev() {
        if (this.validDates.length === 0) return;
        let prevIndex = (this.currentIndex - 1 + this.validDates.length) % this.validDates.length;
        this.setDay(prevIndex);
    }
};
