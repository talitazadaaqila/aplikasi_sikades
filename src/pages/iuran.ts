import * as bootstrap from 'bootstrap';
import { createRumah, deleteRumah, getAnggotaByRumah, createAnggota, deleteAnggota, getIuranByRumah, payIuran, getIuranStats } from '../services/iuranService';
import { getDashboardData } from '../services/transaksiService';
import { formatRupiah, formatDate } from '../utils/formatter';
import type { Rumah, AnggotaKeluarga, Iuran } from '../interfaces';

export const renderIuran = (role: string = 'admin') => {
  return `
    <div class="container-fluid fade-in px-2 py-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <h3 class="fw-bold mb-0" style="color: #1b4933; font-family: serif;">Daftar Iuran Warga</h3>
        <div class="d-flex gap-2">
          ${role === 'admin' ? `
          <button class="btn btn-success rounded-pill px-4 shadow-sm" id="btnTambahRumah" data-bs-toggle="modal" data-bs-target="#modalRumah" style="background-color: #387f5f; border-color: #387f5f;">
            <i class="bi bi-house-add me-2"></i> Tambah Rumah / KK
          </button>
          ` : ''}
        </div>
      </div>
      <p class="text-muted mb-4">Kelola data iuran dan anggota keluarga per rumah</p>

      <!-- Stats Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card shadow-sm border-0 rounded-4 p-3 h-100" style="background-color: #eaf3ed;">
            <h6 class="text-secondary small fw-bold mb-1">Total Rumah</h6>
            <h3 class="fw-bold mb-0" id="statTotalRumah">0</h3>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card shadow-sm border-0 rounded-4 p-3 h-100" style="background-color: #d1e7dd;">
            <h6 class="text-success small fw-bold mb-1">Sudah Bayar (Bulan Ini)</h6>
            <h3 class="fw-bold mb-0 text-success" id="statSudahBayar">0</h3>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card shadow-sm border-0 rounded-4 p-3 h-100" style="background-color: #f8d7da;">
            <h6 class="text-danger small fw-bold mb-1">Belum Bayar</h6>
            <h3 class="fw-bold mb-0 text-danger" id="statBelumBayar">0</h3>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card shadow-sm border-0 rounded-4 p-3 h-100" style="background: linear-gradient(135deg, #1b4933, #387f5f); color: white;">
            <h6 class="opacity-75 small fw-bold mb-1">Saldo Kas Desa</h6>
            <h3 class="fw-bold mb-0" id="statSaldoKas">Rp 0</h3>
          </div>
        </div>
      </div>

      <!-- Search & Table -->
      <div class="card shadow-sm border-0 rounded-4">
        <div class="card-body p-4">
          <div class="input-group mb-4" style="background-color: #f8f9fa; border-radius: 12px; overflow: hidden;">
            <span class="input-group-text border-0 bg-transparent ps-3"><i class="bi bi-search text-muted"></i></span>
            <input type="text" class="form-control border-0 bg-transparent shadow-none py-2" id="searchRumah" placeholder="Cari nama kepala keluarga atau alamat...">
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle border-0">
              <thead>
                <tr style="border-bottom: 2px solid #f0f0f0;">
                  <th class="text-secondary fw-normal border-0 py-3">Kepala Keluarga</th>
                  <th class="text-secondary fw-normal border-0 py-3">Alamat</th>
                  <th class="text-secondary fw-normal border-0 py-3 text-center">Status Bayar</th>
                  ${role === 'admin' ? '<th class="text-secondary fw-normal border-0 py-3 text-center">Aksi</th>' : ''}
                </tr>
              </thead>
              <tbody id="tableRumahBody">
                <tr><td colspan="${role === 'admin' ? 4 : 3}" class="text-center py-4 border-0"><span class="spinner-border spinner-border-sm" role="status"></span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Rumah -->
    <div class="modal fade" id="modalRumah" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-bottom-0">
            <h5 class="modal-title fw-bold" id="modalRumahTitle">Data Rumah / KK</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <form id="formRumah">
              <input type="hidden" id="rumahId">
              <div class="mb-3">
                <label class="form-label text-secondary small fw-bold">Nama Kepala Keluarga</label>
                <input type="text" class="form-control border-0 bg-light rounded-3 shadow-none py-2" id="kepalaKeluarga" required placeholder="Nama Lengkap">
              </div>
              <div class="mb-4">
                <label class="form-label text-secondary small fw-bold">Alamat / Nomor Rumah</label>
                <textarea class="form-control border-0 bg-light rounded-3 shadow-none py-2" id="alamat" rows="2" required placeholder="Contoh: RT 03 RW 01 No. 45"></textarea>
              </div>
              <button type="submit" class="btn btn-success w-100 rounded-3 py-2 fw-bold" style="background-color: #387f5f;">Simpan Data Rumah</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detail Rumah -->
    <div class="modal fade" id="modalDetailRumah" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bold" id="detailTitle">Detail Rumah</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-4">
              <!-- Family Members -->
              <div class="col-md-6">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="fw-bold mb-0">Anggota Keluarga</h6>
                  <button class="btn btn-sm btn-outline-success border-0" id="btnAddAnggota"><i class="bi bi-plus-circle"></i> Tambah</button>
                </div>
                <div id="listAnggota" class="list-group list-group-flush rounded-3 border">
                  <div class="list-group-item text-center py-3 text-muted">Memuat...</div>
                </div>
              </div>
              <!-- Payment History -->
              <div class="col-md-6">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="fw-bold mb-0">Riwayat Pembayaran</h6>
                  <button class="btn btn-sm btn-success px-3" id="btnPayIuran">Bayar Iuran</button>
                </div>
                <div id="listIuran" class="list-group list-group-flush rounded-3 border">
                  <div class="list-group-item text-center py-3 text-muted">Memuat...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form Anggota -->
    <div class="modal fade" id="modalAnggota" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-body p-4">
            <h6 class="fw-bold mb-3">Tambah Anggota Keluarga</h6>
            <form id="formAnggota">
              <input type="hidden" id="anggotaRumahId">
              <div class="mb-3">
                <input type="text" class="form-control border-0 bg-light rounded-3 shadow-none py-2" id="namaAnggota" required placeholder="Nama Anggota">
              </div>
              <div class="mb-4">
                <select class="form-select border-0 bg-light rounded-3 shadow-none py-2" id="hubunganAnggota" required>
                  <option value="" disabled selected>Hubungan...</option>
                  <option value="Istri">Istri</option>
                  <option value="Anak">Anak</option>
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <button type="submit" class="btn btn-success w-100 rounded-3 py-2 fw-bold">Tambah Anggota</button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Bayar Iuran -->
    <div class="modal fade" id="modalPayIuran" tabindex="-1">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content rounded-4 border-0 shadow">
          <div class="modal-body p-4">
            <h6 class="fw-bold mb-3">Pembayaran Iuran</h6>
            <form id="formPayIuran">
              <input type="hidden" id="payRumahId">
              <div class="mb-3">
                <label class="small text-secondary fw-bold">Bulan / Tahun</label>
                <div class="d-flex gap-2">
                  <select class="form-select border-0 bg-light rounded-3 shadow-none" id="payBulan" required>
                    <option value="Januari">Januari</option>
                    <option value="Februari">Februari</option>
                    <option value="Maret">Maret</option>
                    <option value="April">April</option>
                    <option value="Mei">Mei</option>
                    <option value="Juni">Juni</option>
                    <option value="Juli">Juli</option>
                    <option value="Agustus">Agustus</option>
                    <option value="September">September</option>
                    <option value="Oktober">Oktober</option>
                    <option value="November">November</option>
                    <option value="Desember">Desember</option>
                  </select>
                  <input type="number" class="form-control border-0 bg-light rounded-3 shadow-none w-50" id="payTahun" value="${new Date().getFullYear()}" required>
                </div>
              </div>
              <div class="mb-3">
                <label class="small text-secondary fw-bold">Jumlah (Rp)</label>
                <input type="number" class="form-control border-0 bg-light rounded-3 shadow-none" id="payJumlah" value="20000" required>
              </div>
              <button type="submit" class="btn btn-success w-100 rounded-3 py-2 fw-bold">Konfirmasi Bayar</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const initIuran = async (role: string = 'admin') => {
  let allRumah: Rumah[] = [];
  let currentDetailRumahId = '';

  const loadStats = async () => {
    const { saldo } = (await getDashboardData()).data || { totalPemasukan: 0, totalPengeluaran: 0, saldo: 0 };
    const { totalRumah, paidCount, unpaidCount } = await getIuranStats();

    const elTotal = document.getElementById('statTotalRumah');
    const elPaid = document.getElementById('statSudahBayar');
    const elUnpaid = document.getElementById('statBelumBayar');
    const elSaldo = document.getElementById('statSaldoKas');

    if (elTotal) elTotal.textContent = totalRumah.toString();
    if (elPaid) elPaid.textContent = paidCount.toString();
    if (elUnpaid) elUnpaid.textContent = unpaidCount.toString();
    if (elSaldo) elSaldo.textContent = formatRupiah(saldo);
  };

  const renderTable = (data: any[]) => {
    const tbody = document.getElementById('tableRumahBody');
    if (!tbody) return;

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 border-0 text-muted">Belum ada data rumah</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(r => `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td class="border-0">
          <div class="fw-bold" style="color: #1b4933;">${r.kepala_keluarga}</div>
        </td>
        <td class="border-0 text-muted small">${r.alamat}</td>
        <td class="border-0 text-center">
          ${role === 'admin' ? `
          <button class="btn btn-sm rounded-pill btn-status-bayar border-0 shadow-none py-1 px-3 ${r.isPaid ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}" 
                  data-id="${r.id}" data-paid="${r.isPaid}" 
                  style="transition: all 0.2s ease;">
            ${r.isPaid ? '<i class="bi bi-check-circle-fill me-1"></i> Sudah Bayar' : '<i class="bi bi-x-circle me-1"></i> Belum Bayar'}
          </button>
          ` : `
          <span class="badge rounded-pill px-3 py-2 ${r.isPaid ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'}">
            ${r.isPaid ? '<i class="bi bi-check-circle-fill me-1"></i> Sudah Bayar' : '<i class="bi bi-x-circle me-1"></i> Belum Bayar'}
          </span>
          `}
        </td>
        ${role === 'admin' ? `
        <td class="border-0 text-center">
          <div class="d-flex justify-content-center gap-2">
            <button class="btn btn-sm btn-light border p-1 px-2 btn-detail" data-id="${r.id}" title="Detail"><i class="bi bi-eye text-primary"></i></button>
            <button class="btn btn-sm btn-light border p-1 px-2 btn-edit-rumah" data-id="${r.id}" title="Edit"><i class="bi bi-pencil text-success"></i></button>
            <button class="btn btn-sm btn-light border p-1 px-2 btn-delete-rumah" data-id="${r.id}" title="Hapus"><i class="bi bi-trash text-danger"></i></button>
          </div>
        </td>
        ` : ''}
      </tr>
    `).join('');

    // Attach listeners
    document.querySelectorAll('.btn-detail').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset.id;
        if (id) {
          currentDetailRumahId = id;
          openDetailModal(id);
        }
      });
    });

    document.querySelectorAll('.btn-edit-rumah').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset.id;
        const rumah = allRumah.find(r => r.id === id);
        if (rumah) {
          (document.getElementById('modalRumahTitle') as HTMLElement).textContent = 'Edit Data Rumah';
          (document.getElementById('rumahId') as HTMLInputElement).value = rumah.id || '';
          (document.getElementById('kepalaKeluarga') as HTMLInputElement).value = rumah.kepala_keluarga;
          (document.getElementById('alamat') as HTMLTextAreaElement).value = rumah.alamat;
          bootstrap.Modal.getOrCreateInstance(document.getElementById('modalRumah')!).show();
        }
      });
    });

    document.querySelectorAll('.btn-delete-rumah').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = (e.currentTarget as HTMLButtonElement).dataset.id;
        if (id && confirm('Hapus data rumah ini? Seluruh data anggota dan iuran juga akan terhapus.')) {
          await deleteRumah(id);
          refreshAll();
        }
      });
    });

    document.querySelectorAll('.btn-status-bayar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const target = e.currentTarget as HTMLButtonElement;
        const id = target.dataset.id;
        const isPaid = target.dataset.paid === 'true';
        
        if (!id) return;

        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const currentMonth = months[new Date().getMonth()];
        const currentYear = new Date().getFullYear().toString();

        if (isPaid) {
          const confirm = await (window as any).Swal?.fire({
            title: 'Batalkan Pembayaran?',
            text: `Hapus catatan iuran bulan ${currentMonth} ${currentYear}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
          });

          if (confirm?.isConfirmed) {
            const { unpayIuran } = await import('../services/iuranService');
            await unpayIuran(id, currentMonth, currentYear);
            refreshAll();
          }
        } else {
          const newData: Iuran = {
            rumah_id: id,
            tanggal: new Date().toISOString().split('T')[0],
            bulan: currentMonth,
            tahun: currentYear,
            jumlah: 20000,
            keterangan: `Iuran Bulanan ${currentMonth}`
          };
          await payIuran(newData);
          refreshAll();
        }
      });
    });
  };

  const openDetailModal = async (rumahId: string) => {
    const rumah = allRumah.find(r => r.id === rumahId);
    if (!rumah) return;

    document.getElementById('detailTitle')!.textContent = `Rumah: ${rumah.kepala_keluarga}`;
    
    const modal = new (window as any).bootstrap.Modal(document.getElementById('modalDetailRumah'));
    modal.show();

    refreshDetailLists(rumahId);
  };

  const refreshDetailLists = async (rumahId: string) => {
    const listAnggota = document.getElementById('listAnggota');
    const listIuran = document.getElementById('listIuran');

    // Load Anggota
    const { data: anggota } = await getAnggotaByRumah(rumahId);
    if (listAnggota) {
      if (anggota && anggota.length > 0) {
        listAnggota.innerHTML = anggota.map((a: any) => `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-bold small">${a.nama}</div>
              <div class="text-muted" style="font-size: 0.75rem;">${a.hubungan}</div>
            </div>
            <button class="btn btn-sm text-danger btn-delete-anggota p-0" data-id="${a.id}"><i class="bi bi-x-circle"></i></button>
          </div>
        `).join('');
        document.querySelectorAll('.btn-delete-anggota').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = (e.currentTarget as HTMLButtonElement).dataset.id;
            if (id) {
              await deleteAnggota(id);
              refreshDetailLists(rumahId);
            }
          });
        });
      } else {
        listAnggota.innerHTML = '<div class="list-group-item text-center py-3 text-muted small">Belum ada anggota</div>';
      }
    }

    // Load Iuran
    const { data: iuran } = await getIuranByRumah(rumahId);
    if (listIuran) {
      if (iuran && iuran.length > 0) {
        listIuran.innerHTML = iuran.map((i: any) => `
          <div class="list-group-item">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="badge bg-light text-dark border small">${i.bulan} ${i.tahun}</span>
              <span class="fw-bold text-success small">${formatRupiah(i.jumlah)}</span>
            </div>
            <div class="text-muted" style="font-size: 0.7rem;">Dibayar pada: ${formatDate(i.tanggal)}</div>
          </div>
        `).join('');
      } else {
        listIuran.innerHTML = '<div class="list-group-item text-center py-3 text-muted small text-danger">Belum ada riwayat bayar</div>';
      }
    }
  };

  const refreshAll = async () => {
    const { rumahWithStatus } = await getIuranStats();
    allRumah = rumahWithStatus;
    renderTable(allRumah);
    loadStats();
  };

  await refreshAll();

  // Search logic
  document.getElementById('searchRumah')?.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.toLowerCase();
    const filtered = allRumah.filter(r => 
      r.kepala_keluarga.toLowerCase().includes(query) || 
      r.alamat.toLowerCase().includes(query)
    );
    renderTable(filtered);
  });

  // Form Rumah Submit
  document.getElementById('formRumah')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = (e.target as HTMLFormElement).querySelector('button[type="submit"]');
    if (btn) (btn as HTMLButtonElement).disabled = true;

    const id = (document.getElementById('rumahId') as HTMLInputElement).value;
    const newData: Partial<Rumah> = {
      kepala_keluarga: (document.getElementById('kepalaKeluarga') as HTMLInputElement).value,
      alamat: (document.getElementById('alamat') as HTMLTextAreaElement).value
    };
    
    let res;
    if (id) {
      res = await (await import('../services/iuranService')).updateRumah(id, newData);
    } else {
      res = await createRumah(newData as Rumah);
    }
    
    if (btn) (btn as HTMLButtonElement).disabled = false;

    if (!res.error) {
      (e.target as HTMLFormElement).reset();
      const modalEl = document.getElementById('modalRumah');
      if (modalEl) {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      }
      (window as any).Swal?.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Data rumah berhasil disimpan.',
        timer: 1500,
        showConfirmButton: false
      });
      refreshAll();
    } else {
      (window as any).Swal?.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Gagal menyimpan data rumah: ' + (res.error as any).message
      });
    }
  });

  // Reset modal on open
  document.getElementById('btnTambahRumah')?.addEventListener('click', () => {
    (document.getElementById('modalRumahTitle') as HTMLElement).textContent = 'Tambah Rumah / KK';
    (document.getElementById('rumahId') as HTMLInputElement).value = '';
    (document.getElementById('formRumah') as HTMLFormElement).reset();
  });

  // Add Anggota Button
  document.getElementById('btnAddAnggota')?.addEventListener('click', () => {
    (document.getElementById('anggotaRumahId') as HTMLInputElement).value = currentDetailRumahId;
    const modalEl = document.getElementById('modalAnggota');
    if (modalEl) {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  });

  // Form Anggota Submit
  document.getElementById('formAnggota')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newData: AnggotaKeluarga = {
      rumah_id: (document.getElementById('anggotaRumahId') as HTMLInputElement).value,
      nama: (document.getElementById('namaAnggota') as HTMLInputElement).value,
      hubungan: (document.getElementById('hubunganAnggota') as HTMLSelectElement).value
    };
    const { error } = await createAnggota(newData);
    if (!error) {
      (e.target as HTMLFormElement).reset();
      const modalEl = document.getElementById('modalAnggota');
      if (modalEl) {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      }
      refreshDetailLists(currentDetailRumahId);
    }
  });

  // Pay Iuran Button
  document.getElementById('btnPayIuran')?.addEventListener('click', () => {
    (document.getElementById('payRumahId') as HTMLInputElement).value = currentDetailRumahId;
    const now = new Date();
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const payBulan = document.getElementById('payBulan') as HTMLSelectElement;
    const payTahun = document.getElementById('payTahun') as HTMLInputElement;
    payBulan.value = months[now.getMonth()];
    payTahun.value = now.getFullYear().toString();
    const modalEl = document.getElementById('modalPayIuran');
    if (modalEl) {
      bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
  });

  // Form Pay Iuran Submit
  document.getElementById('formPayIuran')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payBulan = document.getElementById('payBulan') as HTMLSelectElement;
    const payTahun = document.getElementById('payTahun') as HTMLInputElement;
    const payJumlah = document.getElementById('payJumlah') as HTMLInputElement;
    const keterangan = payBulan.value;
    const newData: Iuran = {
      rumah_id: (document.getElementById('payRumahId') as HTMLInputElement).value,
      tanggal: new Date().toISOString().split('T')[0],
      bulan: payBulan.value,
      tahun: payTahun.value,
      jumlah: Number(payJumlah.value),
      keterangan: `Iuran Bulanan ${keterangan}`
    };
    const { error } = await payIuran(newData);
    if (!error) {
      const modalEl = document.getElementById('modalPayIuran');
      if (modalEl) {
        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      }
      (window as any).Swal?.fire({
        icon: 'success',
        title: 'Pembayaran Berhasil',
        text: 'Data iuran telah tercatat.',
        timer: 1500,
        showConfirmButton: false
      });
      refreshDetailLists(currentDetailRumahId);
      refreshAll();
    }
  });
};
