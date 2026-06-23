import {
  getPemasukan,
  createPemasukan,
  deletePemasukan,
  updatePemasukan,
  EventBus,
  debounce,
} from '../services/transaksiService';
import { formatRupiah, formatDate } from '../utils/formatter';
import { exportToPDF } from '../utils/export';
import type { Pemasukan } from '../interfaces';


export const renderPemasukan = () => {
  return `
    <div class="container-fluid fade-in px-2 py-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <h3 class="fw-bold mb-0" style="color: #1b4933; font-family: serif;">Pemasukan Kas Desa</h3>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success rounded-pill px-3 shadow-sm" id="btnExportPemasukan" style="color: #387f5f; border-color: #387f5f;">
            <i class="bi bi-file-pdf me-1"></i> Export PDF
          </button>
          <button class="btn btn-success rounded-pill px-4 shadow-sm" id="btnTambahPemasukan" data-bs-toggle="modal" data-bs-target="#modalPemasukan" style="background-color: #387f5f; border-color: #387f5f;">
            <i class="bi bi-plus-lg me-2"></i> Tambah Pemasukan
          </button>
        </div>
      </div>
      <p class="text-muted mb-4">Kelola data pemasukan kas desa</p>

      <!-- Search Card -->
      <div class="card shadow-sm border-0 rounded-4 mb-4" style="background-color: #fcfdfc;">
        <div class="card-body p-3">
          <div class="input-group" style="background-color: #eaf3ed; border-radius: 12px; overflow: hidden;">
            <span class="input-group-text border-0 bg-transparent ps-3"><i class="bi bi-search text-muted"></i></span>
            <input type="text" class="form-control border-0 bg-transparent shadow-none py-2" id="searchInput" placeholder="Cari berdasarkan sumber atau keterangan...">
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
                  <th class="text-secondary fw-normal border-0 py-3">Sumber Pemasukan</th>
                  <th class="text-secondary fw-normal border-0 py-3 text-center">Jumlah</th>
                  <th class="text-secondary fw-normal border-0 py-3">Keterangan</th>
                  <th class="text-secondary fw-normal border-0 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="tablePemasukanBody" style="border-top: none;">
                <tr><td colspan="5" class="text-center py-4 border-0"><span class="spinner-border spinner-border-sm" role="status"></span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div class="modal fade" id="modalPemasukan" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bold" style="color: #1b4933;" id="modalPemasukanTitle">Tambah Pemasukan</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <form id="formPemasukan">
              <input type="hidden" id="formIdPemasukan">
              <div class="mb-3">
                <label class="form-label text-secondary small fw-bold">Tanggal</label>
                <input type="date" class="form-control border-0 rounded-3 shadow-sm py-2" id="formTanggal" required style="background-color: #f8f9fa;">
              </div>
              <div class="mb-3">
                <label class="form-label text-secondary small fw-bold">Sumber Dana</label>
                <input type="text" class="form-control border-0 rounded-3 shadow-sm py-2" id="formSumber" required placeholder="Contoh: Dana Desa" style="background-color: #f8f9fa;">
              </div>
              <div class="mb-3">
                <label class="form-label text-secondary small fw-bold">Jumlah (Rp)</label>
                <input type="number" class="form-control border-0 rounded-3 shadow-sm py-2" id="formJumlah" min="0" required placeholder="0" style="background-color: #f8f9fa;">
              </div>
              <div class="mb-4">
                <label class="form-label text-secondary small fw-bold">Keterangan</label>
                <textarea class="form-control border-0 rounded-3 shadow-sm py-2" id="formKeterangan" rows="3" required placeholder="Catatan opsional..." style="background-color: #f8f9fa;"></textarea>
              </div>
              <button type="submit" class="btn btn-success w-100 rounded-3 py-2 fw-bold" id="btnSubmitPemasukan" style="background-color: #387f5f; border-color: #387f5f;">Simpan Pemasukan</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const initPemasukan = async () => {
  let allData: Pemasukan[] = [];
  let filteredData: Pemasukan[] = [];
  
  // Guard agar setup listener (search/export) tidak dobel (sementara belum dipakai)
  // let isSetupSearch = false;
  // let isSetupExport = false;

  
  const setupRealtime = () => {
    const debouncedLoad = debounce(loadData, 300);
    const cleanup = EventBus.on('data:changed', (payload: any) => {
      if (!payload) return;
      if (payload.source !== 'pemasukan') return;
      // Hanya refresh bila ada perubahan yang relevan
      debouncedLoad();
    });
    return cleanup;
  };

  const renderTable = (data: Pemasukan[]) => {
    filteredData = data; // Track currently visible data
    const tbody = document.getElementById('tablePemasukanBody');
    if (!tbody) return;
    
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4 border-0">Data tidak ditemukan</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map((item) => `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td class="border-0 text-muted" style="font-size: 0.95rem;">${formatDate(item.tanggal)}</td>
        <td class="border-0 fw-medium" style="color: #1b4933; font-size: 0.95rem;">${item.sumber}</td>
        <td class="border-0 text-center fw-bold" style="color: #288d57; font-size: 0.95rem;">
          ${formatRupiah(item.jumlah)}
        </td>
        <td class="border-0 text-muted small" style="font-size: 0.9rem;">${item.keterangan}</td>
        <td class="border-0 text-center">
          <div class="d-flex justify-content-center gap-2">
            <button class="btn btn-sm btn-outline-success border-0 p-1 btn-edit-in" data-id="${item.id}">
              <i class="bi bi-pencil-square" style="font-size: 1.1rem;"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger border-0 p-1 btn-delete-in" data-id="${item.id}">
              <i class="bi bi-trash" style="font-size: 1.1rem;"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Re-attach delete listeners
    document.querySelectorAll('.btn-delete-in').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset.id;
        if (id && confirm('Yakin ingin menghapus data pemasukan ini?')) {
          await deletePemasukan(id);
          await loadData();
        }
      });
    });

    // Re-attach edit listeners
    document.querySelectorAll('.btn-edit-in').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset.id;
        const item = allData.find(d => d.id === id);
        if (item) {
          showEditModal(item);
        }
      });
    });
  };

  const showEditModal = (item: Pemasukan) => {
    const modalTitle = document.getElementById('modalPemasukanTitle');
    const formId = document.getElementById('formIdPemasukan') as HTMLInputElement;
    const formTanggal = document.getElementById('formTanggal') as HTMLInputElement;
    const formSumber = document.getElementById('formSumber') as HTMLInputElement;
    const formJumlah = document.getElementById('formJumlah') as HTMLInputElement;
    const formKeterangan = document.getElementById('formKeterangan') as HTMLTextAreaElement;
    const btnSubmit = document.getElementById('btnSubmitPemasukan');

    if (modalTitle) modalTitle.textContent = 'Edit Pemasukan';
    if (formId) formId.value = item.id || '';
    if (formTanggal) formTanggal.value = item.tanggal;
    if (formSumber) formSumber.value = item.sumber;
    if (formJumlah) formJumlah.value = item.jumlah.toString();
    if (formKeterangan) formKeterangan.value = item.keterangan;
    if (btnSubmit) btnSubmit.textContent = 'Update Pemasukan';

    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalPemasukan'));
    modal.show();
  };

  const loadData = async () => {
    const { data, error } = await getPemasukan();

    if (error || !data) {
      const tbody = document.getElementById('tablePemasukanBody');
      if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4 border-0">Gagal memuat data</td></tr>`;
      return;
    }
    allData = data;
    renderTable(allData);
    
    // Setup Search
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        const filtered = allData.filter(item => 
          item.sumber.toLowerCase().includes(query) || 
          item.keterangan.toLowerCase().includes(query)
        );
        renderTable(filtered);
      });
    }

    // Setup Export
    const btnExport = document.getElementById('btnExportPemasukan');
    if (btnExport) {
      btnExport.onclick = () => {
        const columns = [
          { header: 'Tanggal', dataKey: 'tanggal' },
          { header: 'Sumber', dataKey: 'sumber' },
          { header: 'Keterangan', dataKey: 'keterangan' },
          { header: 'Jumlah (Rp)', dataKey: 'jumlah' }
        ];
        const exportData = filteredData.map(item => ({
          tanggal: formatDate(item.tanggal),
          sumber: item.sumber,
          keterangan: item.keterangan,
          jumlah: formatRupiah(item.jumlah),
        }));

        exportToPDF('Laporan Pemasukan Kas Desa', columns, exportData, 'Rekap_Pemasukan_SIKADES');
      };
    }
  };

  await loadData();

  // Setup realtime refresh
  const cleanupRealtime = setupRealtime();

  // Cleanup saat navigasi ke halaman lain
  const cleanup = () => {
    try {
      if (typeof cleanupRealtime === 'function') cleanupRealtime();
    } catch {}
  };
  (window as any).__cleanupPemasukan = cleanup;

  // Reset modal on "Tambah" click
  const btnTambah = document.getElementById('btnTambahPemasukan');
  btnTambah?.addEventListener('click', () => {
    const modalTitle = document.getElementById('modalPemasukanTitle');
    const form = document.getElementById('formPemasukan') as HTMLFormElement;
    const formId = document.getElementById('formIdPemasukan') as HTMLInputElement;
    const btnSubmit = document.getElementById('btnSubmitPemasukan');

    if (modalTitle) modalTitle.textContent = 'Tambah Pemasukan';
    if (form) form.reset();
    if (formId) formId.value = '';
    if (btnSubmit) btnSubmit.textContent = 'Simpan Pemasukan';
  });

  const form = document.getElementById('formPemasukan');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = (document.getElementById('formIdPemasukan') as HTMLInputElement).value;
    const formData: Pemasukan = {
      tanggal: (document.getElementById('formTanggal') as HTMLInputElement).value,
      sumber: (document.getElementById('formSumber') as HTMLInputElement).value,
      jumlah: Number((document.getElementById('formJumlah') as HTMLInputElement).value),
      keterangan: (document.getElementById('formKeterangan') as HTMLInputElement).value,
    };

    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (submitBtn) submitBtn.disabled = true;

    let res;
    if (id) {
      res = await updatePemasukan(id, formData);
    } else {
      res = await createPemasukan(formData);
    }
    
    if (submitBtn) submitBtn.disabled = false;

    if (!res.error) {
      (window as any).Swal?.fire({
        icon: 'success',
        title: 'Berhasil',
        text: id ? 'Data pemasukan berhasil diperbarui.' : 'Data pemasukan berhasil disimpan.' ,
        timer: 1500,
        showConfirmButton: false,
      });

      const modalEl = document.getElementById('modalPemasukan');
      const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      // Force remove backdrop if it gets stuck
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(b => b.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';

      await loadData();
    } else {
      (window as any).Swal?.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menyimpan data: ' + (res.error?.message || 'Terjadi kesalahan'),
      });
    }
  });
};
