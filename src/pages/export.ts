import { getPemasukan, getPengeluaran } from '../services/transaksiService';
import { exportToPDF } from '../utils/export';
import { formatDate, formatRupiah } from '../utils/formatter';

export const renderExport = () => `
    <div class="container-fluid fade-in px-2 py-3">
      <div class="mb-4">
        <h3 class="fw-bold mb-1" style="color: #1b4933; font-family: serif;">Export Laporan PDF</h3>
        <p class="text-muted">Unduh laporan keuangan dalam format PDF</p>
      </div>

      <div class="row g-4">
        <!-- Card 1: Laporan Pemasukan -->
        <div class="col-md-4">
          <div class="card h-100 shadow-sm border-0 rounded-4 text-center p-4">
            <div class="mb-3">
              <div class="rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 70px; height: 70px; background-color: #eaf3ed;">
                <i class="bi bi-graph-up-arrow fs-2" style="color: #288d57;"></i>
              </div>
            </div>
            <h5 class="fw-bold">Laporan Pemasukan</h5>
            <p class="text-muted small">Unduh semua data pemasukan kas desa</p>
            <button class="btn btn-success w-100 rounded-pill mt-auto" id="btnExpPemasukan">
              <i class="bi bi-download me-2"></i> Download PDF
            </button>
          </div>
        </div>

        <!-- Card 2: Laporan Pengeluaran -->
        <div class="col-md-4">
          <div class="card h-100 shadow-sm border-0 rounded-4 text-center p-4">
            <div class="mb-3">
              <div class="rounded-circle d-inline-flex align-items-center justify-content-center" style="width: 70px; height: 70px; background-color: #fdf2f2;">
                <i class="bi bi-graph-down-arrow fs-2" style="color: #dc3545;"></i>
              </div>
            </div>
            <h5 class="fw-bold">Laporan Pengeluaran</h5>
            <p class="text-muted small">Unduh semua data pengeluaran kas desa</p>
            <button class="btn btn-outline-danger w-100 rounded-pill mt-auto" id="btnExpPengeluaran">
              <i class="bi bi-download me-2"></i> Download PDF
            </button>
          </div>
        </div>

        <!-- Card 3: Laporan Lengkap -->
        <div class="col-md-4">
          <div class="card h-100 shadow-sm border-0 rounded-4 text-center p-4" style="background: linear-gradient(135deg, #1b4933, #387f5f); color: white;">
            <div class="mb-3">
              <div class="rounded-circle d-inline-flex align-items-center justify-content-center bg-white">
                <i class="bi bi-file-earmark-pdf fs-2" style="color: #1b4933; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border-radius: 50%;"></i>
              </div>
            </div>
            <h5 class="fw-bold text-white">Laporan Lengkap</h5>
            <p class="opacity-75 small">Rekapitulasi seluruh transaksi kas desa</p>
            <button class="btn btn-light w-100 rounded-pill mt-auto fw-bold" id="btnExpLengkap" style="color: #1b4933;">
              <i class="bi bi-file-earmark-check me-2"></i> Download Laporan
            </button>
          </div>
        </div>
      </div>

      <div class="mt-5 p-4 bg-white rounded-4 shadow-sm border-0">
        <h6 class="fw-bold" style="color: #1b4933;"><i class="bi bi-info-circle me-2"></i> Informasi Export</h6>
        <p class="text-muted mb-0 small">
          Seluruh file yang diunduh akan otomatis menyertakan tanda tangan Kepala Desa dan format resmi SIKADES. 
          Pastikan browser Anda tidak memblokir jendela pop-up untuk kelancaran pengunduhan.
        </p>
      </div>
    </div>
  `;

export const initExport = async () => {
  // Pemasukan Export
  document.getElementById('btnExpPemasukan')?.addEventListener('click', async () => {
    const { data } = await getPemasukan();
    if (data) {
      const columns = [
        { header: 'Tanggal', dataKey: 'tanggal' },
        { header: 'Sumber', dataKey: 'sumber' },
        { header: 'Keterangan', dataKey: 'keterangan' },
        { header: 'Jumlah (Rp)', dataKey: 'jumlah' },
      ];
      const exportData = data.map((item: any) => ({
        tanggal: formatDate(item.tanggal),
        sumber: item.sumber,
        keterangan: item.keterangan,
        jumlah: formatRupiah(item.jumlah),
      }));
      exportToPDF('Laporan Pemasukan Kas Desa', columns, exportData, 'Laporan_Pemasukan_SIKADES');
    }
  });

  // Pengeluaran Export
  document.getElementById('btnExpPengeluaran')?.addEventListener('click', async () => {
    const { data } = await getPengeluaran();
    if (data) {
      const columns = [
        { header: 'Tanggal', dataKey: 'tanggal' },
        { header: 'Tujuan', dataKey: 'tujuan' },
        { header: 'Keterangan', dataKey: 'keterangan' },
        { header: 'Jumlah (Rp)', dataKey: 'jumlah' },
      ];
      const exportData = data.map((item: any) => ({
        tanggal: formatDate(item.tanggal),
        tujuan: item.tujuan,
        keterangan: item.keterangan,
        jumlah: formatRupiah(item.jumlah),
      }));
      exportToPDF('Laporan Pengeluaran Kas Desa', columns, exportData, 'Laporan_Pengeluaran_SIKADES');
    }
  });

  // Lengkap Export
  document.getElementById('btnExpLengkap')?.addEventListener('click', async () => {
    const [resIn, resOut] = await Promise.all([getPemasukan(), getPengeluaran()]);
    if (resIn.data && resOut.data) {
      const merged = [
        ...resIn.data.map((i: any) => ({ ...i, tipe: 'Pemasukan' })),
        ...resOut.data.map((i: any) => ({ ...i, tipe: 'Pengeluaran' })),
      ].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

      const columns = [
        { header: 'No', dataKey: 'no' },
        { header: 'Tanggal', dataKey: 'tanggal' },
        { header: 'Jenis', dataKey: 'tipe' },
        { header: 'Uraian', dataKey: 'uraian' },
        { header: 'Masuk (Rp)', dataKey: 'in' },
        { header: 'Keluar (Rp)', dataKey: 'out' },
      ];
      const exportData = merged.map((item, i) => {
        const isIn = item.tipe === 'Pemasukan';
        return {
          no: (i + 1).toString(),
          tanggal: formatDate(item.tanggal),
          tipe: item.tipe,
          uraian: isIn ? `${item.sumber} - ${item.keterangan}` : `${item.tujuan} - ${item.keterangan}`,
          in: isIn ? formatRupiah(item.jumlah) : '-',
          out: !isIn ? formatRupiah(item.jumlah) : '-',
        };
      });
      exportToPDF('Buku Kas Umum Desa - Laporan Lengkap', columns, exportData, 'Laporan_Lengkap_SIKADES');
    }
  });
};
