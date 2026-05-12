import { getPengeluaran, createPengeluaran, deletePengeluaran, updatePengeluaran } from '../services/transaksiService';
import { formatRupiah, formatDate } from '../utils/formatter';
import { exportToPDF } from '../utils/export';
import type { Pengeluaran } from '../interfaces';

export const renderPengeluaran = () => {
  return `
    <div class="container-fluid fade-in px-2 py-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <h3 class="fw-bold mb-0" style="color: #1b4933; font-family: serif;">Pengeluaran Kas Desa</h3>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success rounded-pill px-3 shadow-sm" id="btnExportPengeluaran" style="color: #387f5f; border-color: #387f5f;">
            <i class="bi bi-file-pdf me-1"></i> Export PDF
          </button>
          <button class="btn btn-success rounded-pill px-4 shadow-sm" id="btnTambahPengeluaran" data-bs-toggle="modal" data-bs-target="#modalPengeluaran" style="background-color: #387f5f; border-color: #387f5f;">
            <i class="bi bi-plus-lg me-2"></i> Tambah Pengeluaran
          </button>
        </div>
      </div>
      <p class="text-muted mb-4">Kelola data pengeluaran kas desa</p>

      <!-- Summary Card -->
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="card shadow-sm border-0 rounded-4" style="background: linear-gradient(135deg, #387f5f, #2d664c); color: white;">
            <div class="card-body p-4">
              <h6 class="card-title opacity-75 mb-1">Total Pengeluaran</h6>
              <h3 class="card-text fw-bold mb-0" id="totalPengeluaranCard">Rp 0</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Search Card -->
      <div class="card shadow-sm border-0 rounded-4 mb-4" style="background-color: #fcfdfc;">
        <div class="card-body p-3">
          <div class="input-group" style="background-color: #eaf3ed; border-radius: 12px; overflow: hidden;">
            <span class="input-group-text border-0 bg-transparent ps-3"><i class="bi bi-search text-muted"></i></span>
            <input type="text" class="form-control border-0 bg-transparent shadow-none py-2" id="searchInput" placeholder="Cari berdasarkan tujuan atau keterangan...">
          </div>
        </div>
      </div>

      <!-- Table Card -->
      <div class="card shadow-sm border-0 rounded-4">
        <div class="card-body p-4">
          <div class="table-responsive">
            <table class="table table-hover align-middle border-0">
              <thead>
                <tr style="border-bottom: 2px solid #f0f0f0;">
                  <th class="text-secondary fw-normal border-0 py-3">Tanggal</th>
                  <th class="text-secondary fw-normal border-0 py-3">Tujuan Pengeluaran</th>
                  <th class="text-secondary fw-normal border-0 py-3 text-center">Jumlah</th>
                  <th class="text-secondary fw-normal border-0 py-3">Keterangan</th>
                  <th class="text-secondary fw-normal border-0 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="tablePengeluaranBody" style="border-top: none;">
                <tr><td colspan="5" class="text-center py-4 border-0"><span class="spinner-border spinner-border-sm" role="status"></span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal fade" id="modalPengeluaran" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bold" style="color: #1b4933;" id="modalPengeluaranTitle">Tambah Pengeluaran</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <form id="formPengeluaran">
              <input type="hidden" id="formId">
              <div class="mb-3">
                <label class="form-label text-secondary small fw-bold">Tanggal</label>
                <input type="date" class="form-control border-0 rounded-3 shadow-sm py-2" id="formTanggalKeluar" required style="background-color: #f8f9fa;">
              </div>
              <div class="mb-3">
                <label class="form-label text-secondary small fw-bold">Tujuan Dana</label>
                <input type="text" class="form-control border-0 rounded-3 shadow-sm py-2" id="formTujuan" required placeholder="Contoh: Perbaikan Jalan" style="background-color: #f8f9fa;">
              </div>
              <div class="mb-3">
                <label class="form-label text-secondary small fw-bold">Jumlah (Rp)</label>
                <input type="number" class="form-control border-0 rounded-3 shadow-sm py-2" id="formJumlahKeluar" min="0" required placeholder="0" style="background-color: #f8f9fa;">
              </div>
              <div class="mb-4">
                <label class="form-label text-secondary small fw-bold">Keterangan</label>
                <textarea class="form-control border-0 rounded-3 shadow-sm py-2" id="formKeteranganKeluar" rows="3" required placeholder="Catatan opsional..." style="background-color: #f8f9fa;"></textarea>
              </div>
              <button type="submit" class="btn btn-success w-100 rounded-3 py-2 fw-bold" id="btnSubmitPengeluaran" style="background-color: #387f5f; border-color: #387f5f;">Simpan Pengeluaran</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const initPengeluaran = async () => {
  let allData: Pengeluaran[] = [];
  let filteredData: Pengeluaran[] = [];
  
  const renderTable = (data: Pengeluaran[]) => {
    filteredData = data; // Track currently visible data
    const tbody = document.getElementById('tablePengeluaranBody');
    if (!tbody) return;
    
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4 border-0">Data tidak ditemukan</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map((item) => `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td class="border-0 text-muted" style="font-size: 0.95rem;">${formatDate(item.tanggal)}</td>
        <td class="border-0 fw-medium" style="color: #1b4933; font-size: 0.95rem;">${item.tujuan}</td>
        <td class="border-0 text-center fw-bold" style="color: #dc3545; font-size: 0.95rem;">
          - ${formatRupiah(item.jumlah)}
        </td>
        <td class="border-0 text-muted small" style="font-size: 0.9rem;">${item.keterangan}</td>
        <td class="border-0 text-center">
          <div class="d-flex justify-content-center gap-2">
            <button class="btn btn-sm btn-outline-success border-0 p-1 btn-edit-out" data-id="${item.id}">
              <i class="bi bi-pencil-square" style="font-size: 1.1rem;"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger border-0 p-1 btn-delete-out" data-id="${item.id}">
              <i class="bi bi-trash" style="font-size: 1.1rem;"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach Delete listeners
    document.querySelectorAll('.btn-delete-out').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset.id;
        if (id && confirm('Yakin ingin menghapus data pengeluaran ini?')) {
          await deletePengeluaran(id);
          await loadData();
        }
      });
    });

    // Attach Edit listeners
    document.querySelectorAll('.btn-edit-out').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset.id;
        const item = allData.find(d => d.id === id);
        if (item) {
          showEditModal(item);
        }
      });
    });
  };

  const showEditModal = (item: Pengeluaran) => {
    const modalTitle = document.getElementById('modalPengeluaranTitle');
    const formId = document.getElementById('formId') as HTMLInputElement;
    const formTanggal = document.getElementById('formTanggalKeluar') as HTMLInputElement;
    const formTujuan = document.getElementById('formTujuan') as HTMLInputElement;
    const formJumlah = document.getElementById('formJumlahKeluar') as HTMLInputElement;
    const formKeterangan = document.getElementById('formKeteranganKeluar') as HTMLTextAreaElement;
    const btnSubmit = document.getElementById('btnSubmitPengeluaran');

    if (modalTitle) modalTitle.textContent = 'Edit Pengeluaran';
    if (formId) formId.value = item.id || '';
    if (formTanggal) formTanggal.value = item.tanggal;
    if (formTujuan) formTujuan.value = item.tujuan;
    if (formJumlah) formJumlah.value = item.jumlah.toString();
    if (formKeterangan) formKeterangan.value = item.keterangan;
    if (btnSubmit) btnSubmit.textContent = 'Update Pengeluaran';

    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalPengeluaran'));
    modal.show();
  };

  const loadData = async () => {
    const { data, error } = await getPengeluaran();
    if (error || !data) {
      const tbody = document.getElementById('tablePengeluaranBody');
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4 border-0">Gagal memuat data</td></tr>`;
      return;
    }
    
    allData = data;
    const total = data.reduce((sum: number, item: any) => sum + Number(item.jumlah), 0);
    const elTotal = document.getElementById('totalPengeluaranCard');
    if (elTotal) elTotal.textContent = formatRupiah(total);

    renderTable(allData);
    
    // Setup Search
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        const filtered = allData.filter(item => 
          item.tujuan.toLowerCase().includes(query) || 
          item.keterangan.toLowerCase().includes(query)
        );
        renderTable(filtered);
      });
    }

    // Setup Export
    const btnExport = document.getElementById('btnExportPengeluaran');
    if (btnExport) {
      btnExport.onclick = () => {
        const columns = [
          { header: 'Tanggal', dataKey: 'tanggal' },
          { header: 'Tujuan', dataKey: 'tujuan' },
          { header: 'Keterangan', dataKey: 'keterangan' },
          { header: 'Jumlah (Rp)', dataKey: 'jumlah' }
        ];
        const exportData = filteredData.map(item => ({
          tanggal: formatDate(item.tanggal),
          tujuan: item.tujuan,
          keterangan: item.keterangan,
          jumlah: formatRupiah(item.jumlah),
        }));

        exportToPDF('Laporan Pengeluaran Kas Desa', columns, exportData, 'Rekap_Pengeluaran_SIKADES');
      };
    }
  };

  await loadData();

  // Reset modal on "Tambah" click
  const btnTambah = document.getElementById('btnTambahPengeluaran');
  btnTambah?.addEventListener('click', () => {
    const modalTitle = document.getElementById('modalPengeluaranTitle');
    const form = document.getElementById('formPengeluaran') as HTMLFormElement;
    const formId = document.getElementById('formId') as HTMLInputElement;
    const btnSubmit = document.getElementById('btnSubmitPengeluaran');

    if (modalTitle) modalTitle.textContent = 'Tambah Pengeluaran';
    if (form) form.reset();
    if (formId) formId.value = '';
    if (btnSubmit) btnSubmit.textContent = 'Simpan Pengeluaran';
  });

  const form = document.getElementById('formPengeluaran');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = (document.getElementById('formId') as HTMLInputElement).value;
    const formData: Pengeluaran = {
      tanggal: (document.getElementById('formTanggalKeluar') as HTMLInputElement).value,
      tujuan: (document.getElementById('formTujuan') as HTMLInputElement).value,
      jumlah: Number((document.getElementById('formJumlahKeluar') as HTMLInputElement).value),
      keterangan: (document.getElementById('formKeteranganKeluar') as HTMLInputElement).value,
    };

    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitBtn) submitBtn.disabled = true;

    let res;
    if (id) {
      res = await updatePengeluaran(id, formData);
    } else {
      res = await createPengeluaran(formData);
    }

    if (submitBtn) submitBtn.disabled = false;

    if (!res.error) {
      const modalEl = document.getElementById('modalPengeluaran');
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      
      // Force remove backdrop if it gets stuck
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(b => b.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';

      await loadData();
    } else {
      alert('Gagal menyimpan data: ' + res.error.message);
    }
  });
};
