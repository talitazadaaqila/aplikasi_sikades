import { getPemasukan, getPengeluaran } from '../services/transaksiService';
import { exportToPDF } from '../utils/export';
import { formatDate, formatRupiah } from '../utils/formatter';

export const renderLaporan = () => `
    <div class="container-fluid fade-in px-2 py-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <h3 class="fw-bold mb-0" style="color: #1b4933; font-family: serif;">Rekap Laporan Keuangan</h3>
        <div class="d-flex gap-2">
          <button class="btn btn-success rounded-pill px-4 shadow-sm" id="btnExportLaporanLengkap" style="background-color: #387f5f; border-color: #387f5f;">
            <i class="bi bi-file-earmark-pdf-fill me-2"></i> Download Laporan Lengkap
          </button>
        </div>
      </div>
      <p class="text-muted mb-4">Ringkasan buku kas umum desa</p>

      <!-- Summary Row -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card shadow-sm border-0 rounded-4" style="background: linear-gradient(135deg, #288d57, #1b4933); color: white;">
            <div class="card-body p-3">
              <h6 class="card-title opacity-75 mb-1 small">Sisa Saldo Kas</h6>
              <h3 class="card-text fw-bold mb-0" id="totalSaldoRekap">Rp 0</h3>
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow-sm border-0 rounded-4">
        <div class="card-body p-4">
          <div class="table-responsive">
            <table class="table table-hover align-middle border-0">
              <thead>
                <tr style="border-bottom: 2px solid #f0f0f0;">
                  <th class="text-secondary fw-normal border-0 py-3">No</th>
                  <th class="text-secondary fw-normal border-0 py-3">Tanggal</th>
                  <th class="text-secondary fw-normal border-0 py-3">Jenis</th>
                  <th class="text-secondary fw-normal border-0 py-3">Uraian / Keterangan</th>
                  <th class="text-secondary fw-normal border-0 py-3 text-center">Pemasukan</th>
                  <th class="text-secondary fw-normal border-0 py-3 text-center">Pengeluaran</th>
                </tr>
              </thead>
              <tbody id="tableLaporanBody" style="border-top: none;">
                <tr><td colspan="6" class="text-center py-4 border-0"><span class="spinner-border spinner-border-sm" role="status"></span></td></tr>
              </tbody>
              <tfoot id="tableLaporanFoot" class="fw-bold" style="background-color: #f8fcf9;">
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

export const initLaporan = async () => {
  const tbody = document.getElementById('tableLaporanBody');
  const tfoot = document.getElementById('tableLaporanFoot');
  const elSaldo = document.getElementById('totalSaldoRekap');
  if (!tbody || !tfoot) return;

  const [resIn, resOut] = await Promise.all([getPemasukan(), getPengeluaran()]);
  if (resIn.error || resOut.error) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4 border-0">Gagal memuat rekap laporan</td></tr>';
    return;
  }

  const inData = (resIn.data || []).map((i: any) => ({ ...i, tipe: 'Pemasukan' }));
  const outData = (resOut.data || []).map((i: any) => ({ ...i, tipe: 'Pengeluaran' }));

  const merged = [...inData, ...outData].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  if (merged.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4 border-0">Belum ada data transaksi</td></tr>';
    return;
  }

  let totalIn = 0;
  let totalOut = 0;

  tbody.innerHTML = merged.map((item, index) => {
    let tdIn = '-';
    let tdOut = '-';
    const label = item.tipe === 'Pemasukan' ? '<span class="badge rounded-pill" style="background-color: #eaf3ed; color: #288d57; border: 1px solid #d1e7dd;">Pemasukan</span>' : '<span class="badge rounded-pill" style="background-color: #fdf2f2; color: #dc3545; border: 1px solid #f8d7da;">Pengeluaran</span>';
    const uraian = item.tipe === 'Pemasukan' ? `<div class="fw-medium text-dark">${item.sumber}</div><div class="text-muted small">${item.keterangan}</div>` : `<div class="fw-medium text-dark">${item.tujuan}</div><div class="text-muted small">${item.keterangan}</div>`;

    if (item.tipe === 'Pemasukan') {
      totalIn += Number(item.jumlah);
      tdIn = `<span class="text-success fw-bold" style="color: #288d57 !important;">+ ${formatRupiah(item.jumlah)}</span>`;
    } else {
      totalOut += Number(item.jumlah);
      tdOut = `<span class="text-danger fw-bold" style="color: #dc3545 !important;">- ${formatRupiah(item.jumlah)}</span>`;
    }

    return `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td class="border-0 text-muted small">${index + 1}</td>
        <td class="border-0 text-muted" style="font-size: 0.9rem;">${formatDate(item.tanggal)}</td>
        <td class="border-0">${label}</td>
        <td class="border-0">${uraian}</td>
        <td class="border-0 text-center">${tdIn}</td>
        <td class="border-0 text-center">${tdOut}</td>
      </tr>
    `;
  }).join('');

  if (elSaldo) elSaldo.textContent = formatRupiah(totalIn - totalOut);

  tfoot.innerHTML = `
    <tr style="border-top: 2px solid #387f5f;">
      <td colspan="4" class="text-end border-0 py-3">TOTAL TRANSAKSI</td>
      <td class="text-center border-0 py-3" style="color: #288d57;">${formatRupiah(totalIn)}</td>
      <td class="text-center border-0 py-3" style="color: #dc3545;">${formatRupiah(totalOut)}</td>
    </tr>
    <tr style="background-color: #eaf3ed;">
      <td colspan="4" class="text-end border-0 py-3">SISA SALDO KAS TERAKHIR</td>
      <td colspan="2" class="text-center border-0 py-3 fs-5" style="color: #1b4933;">${formatRupiah(totalIn - totalOut)}</td>
    </tr>
  `;

  const btnExport = document.getElementById('btnExportLaporanLengkap');
  if (btnExport) {
    btnExport.onclick = () => {
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

      exportToPDF('Buku Kas Umum Desa - Laporan Lengkap', columns, exportData, 'Laporan_Keuangan_Lengkap_SIKADES');
    };
  }
};
