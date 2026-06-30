import Chart from 'chart.js/auto';

import {
  debounce,
  EventBus,
  getDashboardData,
  getLastSyncTime,
  isUsingDummy,
  safeSum,
  setupRealtimeSubscriptions,
  startDataPolling,
} from '../services/transaksiService';
import { formatRupiah } from '../utils/formatter';

let chartInstance: Chart | null = null;
let comparisonChartInstance: Chart | null = null;
let unsubscribeRealtime: (() => void) | null = null;
let stopPolling: (() => void) | null = null;
let refreshDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// ========================
// RENDER HTML DASHBOARD
// ========================
export const renderDashboard = (_role: string = 'admin') => `
    <div class="container-fluid fade-in px-2 py-3">
      <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 class="fw-bold mb-0" style="color: #1b4933; font-family: serif;">Dashboard</h3>
          <p class="text-muted mb-0" style="font-size: 0.9rem;">Ringkasan keuangan kas desa</p>
        </div>
        <div class="d-flex align-items-center gap-2">
          <small class="text-muted d-none" id="lastUpdated" style="font-size: 0.8rem;">
            <i class="bi bi-clock me-1"></i> Terakhir: -
          </small>
          <button class="btn btn-outline-secondary btn-sm rounded-pill" id="btnRefresh" title="Refresh Data"
            style="border-color: #1b4933; color: #1b4933;">
            <i class="bi bi-arrow-clockwise" id="refreshIcon"></i>
          </button>
        </div>
      </div>

      <!-- ROW CARD STATISTIK -->
      <div class="row mb-5 g-4" id="statsRow">
        <!-- Card: Total Pemasukan -->
        <div class="col-md-4">
          <div class="card shadow-sm border-0 h-100 rounded-4 p-2" style="background-color: #ffffff;">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="rounded-circle d-flex align-items-center justify-content-center" style="width: 45px; height: 45px; background-color: #eaf3ed;">
                  <i class="bi bi-graph-up-arrow" style="color: #288d57; font-size: 1.2rem;"></i>
                </div>
                <span class="badge rounded-pill" style="background-color: #eaf3ed; color: #288d57;">2026</span>
              </div>
              <p class="text-muted mb-1" style="font-size: 0.9rem;">Total Pemasukan</p>
              <h3 class="fw-bold mb-0 d-flex align-items-center gap-2" style="color: #288d57;">
                <span id="dashPemasukan">
                  <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span class="sr-only">Memuat...</span>
                </span>
              </h3>
            </div>
          </div>
        </div>
        <!-- Card: Total Pengeluaran -->
        <div class="col-md-4">
          <div class="card shadow-sm border-0 h-100 rounded-4 p-2" style="background-color: #ffffff;">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="rounded-circle d-flex align-items-center justify-content-center" style="width: 45px; height: 45px; background-color: #fceeee;">
                  <i class="bi bi-graph-down-arrow" style="color: #d54b4b; font-size: 1.2rem;"></i>
                </div>
                <span class="badge rounded-pill" style="background-color: #fceeee; color: #d54b4b;">2026</span>
              </div>
              <p class="text-muted mb-1" style="font-size: 0.9rem;">Total Pengeluaran</p>
              <h3 class="fw-bold mb-0" id="dashPengeluaran" style="color: #d54b4b;">
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span class="sr-only">Memuat...</span>
              </h3>
            </div>
          </div>
        </div>
        <!-- Card: Saldo Kas Desa -->
        <div class="col-md-4">
          <div class="card shadow-sm border-0 h-100 rounded-4 p-2" style="background-color: #ffffff;">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="rounded-circle d-flex align-items-center justify-content-center" style="width: 45px; height: 45px; background-color: #eaf3ed;">
                  <i class="bi bi-wallet2" style="color: #1b4933; font-size: 1.2rem;"></i>
                </div>
                <span class="badge rounded-pill" style="background-color: #eaf3ed; color: #1b4933;">2026</span>
              </div>
              <p class="text-muted mb-1" style="font-size: 0.9rem;">Saldo Kas Desa</p>
              <h3 class="fw-bold mb-0" id="dashSaldo" style="color: #1b4933;">
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span class="sr-only">Memuat...</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      <!-- ROW CHART DAN TABLE -->
      <div class="row mb-4 g-4">
        <!-- Pilihan Filter -->
        <div class="col-md-12 mb-2 d-flex justify-content-end">
          <select id="filterPeriode" class="form-select form-select-sm shadow-sm border-0" style="width: 150px; background-color: #eaf3ed; color: #1b4933; font-weight: bold;">
            <option value="bulanan" selected>Per Bulan</option>
            <option value="mingguan">Per Minggu</option>
          </select>
        </div>

        <!-- Chart: Tren Keuangan -->
        <div class="col-md-6 mt-0">
          <div class="card shadow-sm border-0 rounded-4 h-100">
            <div class="card-body p-4 d-flex flex-column">
              <h6 class="card-title fw-bold mb-4" style="color: #1b4933; font-family: serif;">Tren Keuangan</h6>
              <div id="financeChartWrapper" style="position: relative; height: 260px; width: 100%; flex-grow: 1;">
                <canvas id="financeChart"></canvas>
                <div id="financeChartEmpty" class="chart-placeholder d-none text-center text-muted" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                  <i class="bi bi-chart-line" style="font-size: 2.5rem; opacity: 0.3;"></i>
                  <p class="mt-2 mb-0" style="font-size: 0.9rem;">Belum ada data keuangan</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart: Perbandingan Pemasukan vs Pengeluaran -->
        <div class="col-md-6 mt-0">
          <div class="card shadow-sm border-0 rounded-4 h-100">
            <div class="card-body p-4 d-flex flex-column">
              <h6 class="card-title fw-bold mb-4" style="color: #1b4933; font-family: serif;">Perbandingan Pemasukan vs Pengeluaran</h6>
              <div id="comparisonChartWrapper" style="position: relative; height: 260px; width: 100%; flex-grow: 1;">
                <canvas id="comparisonChart"></canvas>
                <div id="comparisonChartEmpty" class="chart-placeholder d-none text-center text-muted" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                  <i class="bi bi-bar-chart" style="font-size: 2.5rem; opacity: 0.3;"></i>
                  <p class="mt-2 mb-0" style="font-size: 0.9rem;">Belum ada data untuk dibandingkan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ROW: REAL-TIME INDICATOR -->
      <div class="row mb-3" id="realtimeIndicator" style="display: none;">
        <div class="col-12">
          <div class="alert alert-info rounded-3 py-1 px-3 mb-0 d-flex align-items-center gap-2" role="status">
            <i class="bi bi-circle-fill text-success" style="font-size: 0.5rem; animation: blink 1.5s infinite;"></i>
            <span class="mb-0" style="font-size: 0.85rem;">Data real-time aktif — otomatis diperbarui saat ada perubahan</span>
            <span class="ms-auto text-muted" style="font-size: 0.8rem;" id="syncTimestamp"></span>
          </div>
        </div>
      </div>

      <!-- ROW: ERROR / SUCCESS ALERT -->
      <div class="row mb-3" id="dashboardAlert" style="display: none;">
        <div class="col-12">
          <div id="alertBox" class="alert rounded-3 py-2 px-3 mb-0" role="alert"></div>
        </div>
      </div>

      <!-- ROW: TABLE TRANSAKSI TERKINI -->
      <div class="row">
        <div class="col-12">
          <div class="card shadow-sm border-0 rounded-4">
            <div class="card-body p-4">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h6 class="card-title fw-bold mb-0" style="color: #1b4933; font-family: serif;">Transaksi Terbaru</h6>
                <span class="badge rounded-pill text-bg-light text-muted" id="transactionsCount">0 transaksi</span>
              </div>
              <div class="table-responsive">
                <table class="table table-hover align-middle border-0">
                  <thead>
                    <tr style="border-bottom: 2px solid #f0f0f0;">
                      <th class="text-secondary fw-normal border-0">Tanggal</th>
                      <th class="text-secondary fw-normal border-0">Tipe</th>
                      <th class="text-secondary fw-normal border-0">Keterangan</th>
                      <th class="text-secondary fw-normal border-0 text-end">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody id="recentTransactions">
                    <tr>
                      <td colspan="4" class="text-center border-0 py-4">
                        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span class="ms-2">Memuat transaksi...</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

// ========================
// INIT DASHBOARD (UTAMA)
// ========================
export const initDashboard = async (_role: string = 'admin') => {
  try {
    // ---- AMBIL DATA AWAL ----
    const result = await getDashboardData();

    if (result.error) {
      showAlert('danger', `⚠️ Gagal memuat dashboard: ${result.error.message}`);
      clearAllSpinners();
      return;
    }

    const { data } = result;
    if (!data) {
      showAlert('warning', '⚠️ Data tidak tersedia. Silakan coba lagi nanti.');
      clearAllSpinners();
      return;
    }

    // ---- SIMPAN DATA KE VARIABEL LOKAL UNTUK REFRESH ----
    let currentPemasukanList = data.pemasukanList || [];
    let currentPengeluaranList = data.pengeluaranList || [];

    // ---- UPDATE CARD STATISTIK ----
    const updateCards = (pemasukan: any[], pengeluaran: any[]) => {
      const totalPemasukan = safeSum(pemasukan, 'jumlah');
      const totalPengeluaran = safeSum(pengeluaran, 'jumlah');
      const saldo = totalPemasukan - totalPengeluaran;

      const elSaldo = document.getElementById('dashSaldo');
      const elPemasukan = document.getElementById('dashPemasukan');
      const elPengeluaran = document.getElementById('dashPengeluaran');

      if (elSaldo) elSaldo.innerHTML = formatRupiah(saldo);
      if (elPemasukan) elPemasukan.innerHTML = formatRupiah(totalPemasukan);
      if (elPengeluaran) elPengeluaran.innerHTML = formatRupiah(totalPengeluaran);
    };

    // ---- UPDATE TIMESTAMP ----
    const updateSyncTimestamp = () => {
      const ts = document.getElementById('syncTimestamp');
      if (ts) ts.textContent = getLastSyncTime();
      const indicator = document.getElementById('lastUpdated');
      if (indicator) indicator.classList.remove('d-none');
    };

    // ---- ISI CARD STATISTIK ----
    updateCards(currentPemasukanList, currentPengeluaranList);

    // ---- RENDER CHART ----
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

    /** Proses data ke Map berdasarkan periode */
    const processDataByPeriod = (
      pemasukan: any[],
      pengeluaran: any[],
      periode: 'bulanan' | 'mingguan',
    ) => {
      const dataMap = new Map<string, { in: number; out: number }>();

      const getPeriodKey = (tanggal: string) => {
        if (!tanggal) return '';
        const d = new Date(tanggal);
        if (Number.isNaN(d.getTime())) return '';
        if (periode === 'bulanan') {
          const m = tanggal.substring(0, 7);
          const [y, month] = m.split('-');
          return `${monthNames[parseInt(month, 10) - 1]} ${y.substring(2)}`;
        }
        const monthStr = monthNames[d.getMonth()];
        const week = Math.ceil(d.getDate() / 7);
        return `${monthStr} W${week}`;
      };

      pemasukan.forEach(item => {
        if (!item?.tanggal) return;
        const key = getPeriodKey(item.tanggal);
        if (!key) return;
        const curr = dataMap.get(key) || { in: 0, out: 0 };
        const val = Number(item?.jumlah);
        curr.in += Number.isNaN(val) ? 0 : val;
        dataMap.set(key, curr);
      });

      pengeluaran.forEach(item => {
        if (!item?.tanggal) return;
        const key = getPeriodKey(item.tanggal);
        if (!key) return;
        const curr = dataMap.get(key) || { in: 0, out: 0 };
        const val = Number(item?.jumlah);
        curr.out += Number.isNaN(val) ? 0 : val;
        dataMap.set(key, curr);
      });

      return dataMap;
    };

    /** Render kedua chart */
    const renderCharts = (periode: 'bulanan' | 'mingguan') => {
      if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
      if (comparisonChartInstance) { comparisonChartInstance.destroy(); comparisonChartInstance = null; }

      const dataMap = processDataByPeriod(currentPemasukanList, currentPengeluaranList, periode);

      // Tampilkan placeholder jika tidak ada data
      const financeEmpty = document.getElementById('financeChartEmpty');
      const compEmpty = document.getElementById('comparisonChartEmpty');
      const financeCanvas = document.getElementById('financeChart') as HTMLCanvasElement;
      const compCanvas = document.getElementById('comparisonChart') as HTMLCanvasElement;

      if (dataMap.size === 0) {
        if (financeEmpty) financeEmpty.classList.remove('d-none');
        if (compEmpty) compEmpty.classList.remove('d-none');
        if (financeCanvas) financeCanvas.style.display = 'none';
        if (compCanvas) compCanvas.style.display = 'none';
        return;
      }

      if (financeEmpty) financeEmpty.classList.add('d-none');
      if (compEmpty) compEmpty.classList.add('d-none');
      if (financeCanvas) financeCanvas.style.display = '';
      if (compCanvas) compCanvas.style.display = '';

      // Urutkan key kronologis
      const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => {
        const parseIndex = (k: string) => {
          const [monthPart, weekOrYear] = k.split(' ');
          return monthNames.indexOf(monthPart) * 100 + parseInt(weekOrYear.replace('W', ''), 10);
        };
        return parseIndex(a) - parseIndex(b);
      });

      const dsIn = sortedKeys.map(k => dataMap.get(k)!.in);
      const dsOut = sortedKeys.map(k => dataMap.get(k)!.out);

      // Chart helper: format y-axis
      const formatYAxis = (value: string | number): string => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (num >= 1000000) return `Rp${(num / 1000000).toFixed(1)}jt`;
        if (num >= 1000) return `Rp${(num / 1000).toFixed(0)}rb`;
        return `Rp ${num}`;
      };

      // RENDER CHART 1: Tren Keuangan (Line)
      const ctx = document.getElementById('financeChart') as HTMLCanvasElement;
      if (ctx) {
        chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: sortedKeys,
            datasets: [
              {
                label: 'Pemasukan',
                data: dsIn,
                fill: true,
                backgroundColor: 'rgba(40, 141, 87, 0.15)',
                borderColor: '#288d57',
                borderWidth: 2.5,
                tension: 0.4,
                pointBackgroundColor: '#288d57',
                pointRadius: 4,
                pointHoverRadius: 6,
              },
              {
                label: 'Pengeluaran',
                data: dsOut,
                fill: true,
                backgroundColor: 'rgba(213, 75, 75, 0.1)',
                borderColor: '#d54b4b',
                borderWidth: 2.5,
                tension: 0.4,
                pointBackgroundColor: '#d54b4b',
                pointRadius: 4,
                pointHoverRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 16 } },
              tooltip: {
                callbacks: {
                  label(context: any) {
                    return ` ${context.dataset.label}: ${formatRupiah(context.parsed.y)}`;
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true, ticks: { callback: formatYAxis }, grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false },
              },
              x: { grid: { display: false }, border: { display: false } },
            },
          },
        });
      }

      // RENDER CHART 2: Perbandingan (Bar)
      const compCtx = document.getElementById('comparisonChart') as HTMLCanvasElement;
      if (compCtx) {
        comparisonChartInstance = new Chart(compCtx, {
          type: 'bar',
          data: {
            labels: sortedKeys,
            datasets: [
              {
                label: 'Pemasukan', data: dsIn, backgroundColor: 'rgba(40, 141, 87, 0.75)', borderColor: '#288d57', borderWidth: 1, borderRadius: 4,
              },
              {
                label: 'Pengeluaran', data: dsOut, backgroundColor: 'rgba(213, 75, 75, 0.75)', borderColor: '#d54b4b', borderWidth: 1, borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 600, easing: 'easeOutQuart' },
            plugins: {
              legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 16 } },
              tooltip: {
                callbacks: {
                  label(context: any) {
                    return ` ${context.dataset.label}: ${formatRupiah(context.parsed.y)}`;
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true, ticks: { callback: formatYAxis }, grid: { color: 'rgba(0,0,0,0.05)' }, border: { display: false },
              },
              x: { grid: { display: false }, border: { display: false } },
            },
          },
        });
      }
    };

    // ---- RENDER TABEL TRANSAKSI TERKINI ----
    const renderRecentTransactions = (pemasukanList: any[], pengeluaranList: any[]) => {
      const recentTbody = document.getElementById('recentTransactions');
      if (!recentTbody) return;

      const allTransactions = [
        ...(pemasukanList || []).map((item: any) => ({
          ...item,
          typeLabel: 'Pemasukan',
          color: '#288d57',
          bgColor: '#eaf3ed',
          icon: 'bi-arrow-up-short',
        })),
        ...(pengeluaranList || []).map((item: any) => ({
          ...item,
          typeLabel: 'Pengeluaran',
          color: '#d54b4b',
          bgColor: '#fceeee',
          icon: 'bi-arrow-down-short',
        })),
      ];

      allTransactions.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

      const recent = allTransactions.slice(0, 5);

      // Update count badge
      const countEl = document.getElementById('transactionsCount');
      if (countEl) countEl.textContent = `${allTransactions.length} transaksi`;

      if (recent.length === 0) {
        recentTbody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center text-muted border-0 py-4">
              <i class="bi bi-inbox" style="font-size: 1.5rem; opacity: 0.4;"></i>
              <p class="mt-2 mb-0">Belum ada transaksi</p>
              <small>Silakan tambah pemasukan atau pengeluaran terlebih dahulu.</small>
            </td>
          </tr>`;
        return;
      }

      recentTbody.innerHTML = recent
        .map((item: any) => `
          <tr style="border-bottom: 1px solid #f0f0f0;">
            <td class="border-0 text-muted" style="font-size: 0.9rem;">${item.tanggal || '-'}</td>
            <td class="border-0">
              <span class="badge rounded-pill" style="background-color: ${item.bgColor}; color: ${item.color}; font-weight: 500; padding: 6px 12px; font-size: 0.85rem;">
                <i class="bi ${item.icon}"></i> ${item.typeLabel}
              </span>
            </td>
            <td class="border-0 text-muted" style="font-size: 0.9rem;">${item.sumber || item.keterangan || item.tujuan || '-'}</td>
            <td class="border-0 text-end fw-medium" style="color: ${item.color}; font-size: 0.95rem;">
              ${formatRupiah(item.jumlah)}
            </td>
          </tr>`)
        .join('');
    };

    // ---- FUNGSI REFRESH UTAMA ----
    let isRefreshing = false;

    const refreshDashboard = async () => {
      // Debounce: jika sedang refresh, abaikan
      if (isRefreshing) return;
      isRefreshing = true;

      const refreshIcon = document.getElementById('refreshIcon');

      try {
        // Tampilkan loading spinner di tombol refresh
        if (refreshIcon) {
          refreshIcon.classList.add('fa-spin');
          refreshIcon.classList.add('fa-spinner');
        }

        // Ambil data terbaru
        const refreshResult = await getDashboardData();

        if (refreshResult.error) {
          console.error('Refresh error:', refreshResult.error);
          showAlert('warning', `⚠️ Gagal refresh: ${refreshResult.error.message}`);
          isRefreshing = false;
          if (refreshIcon) {
            refreshIcon.classList.remove('fa-spin');
            refreshIcon.classList.remove('fa-spinner');
          }
          return;
        }

        if (!refreshResult.data) {
          isRefreshing = false;
          if (refreshIcon) {
            refreshIcon.classList.remove('fa-spin');
            refreshIcon.classList.remove('fa-spinner');
          }
          return;
        }

        // Update variabel lokal
        currentPemasukanList = refreshResult.data.pemasukanList || [];
        currentPengeluaranList = refreshResult.data.pengeluaranList || [];

        // Update semua komponen UI
        updateCards(currentPemasukanList, currentPengeluaranList);
        renderCharts('bulanan');
        renderRecentTransactions(currentPemasukanList, currentPengeluaranList);
        updateSyncTimestamp();
        showAlert('success', '✅ Data berhasil diperbarui.');

        // Persist data ke localStorage untuk mode mock
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('dash_pemasukan', JSON.stringify(currentPemasukanList));
            localStorage.setItem('dash_pengeluaran', JSON.stringify(currentPengeluaranList));
          } catch { /* localStorage penuh atau tidak tersedia */ }
        }
      } finally {
        isRefreshing = false;
        if (refreshIcon) {
          refreshIcon.classList.remove('fa-spin');
          refreshIcon.classList.remove('fa-spinner');
        }
      }
    };

    // ---- RENDER AWAL ----
    renderCharts('bulanan');
    renderRecentTransactions(currentPemasukanList, currentPengeluaranList);
    updateSyncTimestamp();

    // ---- EVENT LISTENER: FILTER PERIODE ----
    const filterPeriode = document.getElementById('filterPeriode') as HTMLSelectElement;
    if (filterPeriode) {
      filterPeriode.addEventListener('change', () => {
        renderCharts(filterPeriode.value as 'bulanan' | 'mingguan');
      });
    }

    // =================================================================
    // REAL-TIME SYSTEM: EVENTBUS + SUPABASE REALTIME + POLLING
    // =================================================================

    // --- 1. Supabase Realtime (Production) ---
    unsubscribeRealtime = setupRealtimeSubscriptions();

    // --- 2. Polling Fallback (Mock / Development) ---
    if (isUsingDummy) {
      stopPolling = startDataPolling();
    }

    // --- 3. EventBus Listener: auto-refresh saat data berubah ---
    const debouncedRefresh = debounce(refreshDashboard, 500);

    const cleanupEventBus = EventBus.on('data:changed', (payload: any) => {
      console.log('[Dashboard] Event received:', payload);

      // Update indicator visibilitas
      const indicator = document.getElementById('realtimeIndicator');
      if (indicator) indicator.style.display = 'block';

      // Auto-refresh setelah jeda singkat (debounce)
      debouncedRefresh();
    });

    // --- 4. Tombol Refresh Manual ---
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        refreshDashboard();
      });
    }

    // ---- CLEANUP FUNCTION ----
    // Dipanggil saat navigasi ke halaman lain
    const cleanup = () => {
      console.log('[Dashboard] Cleaning up...');

      // Hapus EventBus listener
      cleanupEventBus();

      // Hentikan realtime subscription
      if (unsubscribeRealtime) {
        unsubscribeRealtime();
        unsubscribeRealtime = null;
      }

      // Hentikan polling
      if (stopPolling) {
        stopPolling();
        stopPolling = null;
      }

      // Clear debounce timer
      if (refreshDebounceTimer) {
        clearTimeout(refreshDebounceTimer);
        refreshDebounceTimer = null;
      }

      // Destroy chart instances
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
      if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
        comparisonChartInstance = null;
      }

      console.log('[Dashboard] Cleanup selesai.');
    };

    // Expose cleanup untuk digunakan oleh navigation system
    (window as any).__cleanupDashboard = cleanup;
  } catch (err) {
    console.error('initDashboard unexpected error:', err);
    showAlert(
      'danger',
      `⚠️ Terjadi kesalahan: ${(err as Error).message || 'Silakan coba lagi.'}`,
    );
    clearAllSpinners();
  }
};

// ========================
// HELPER FUNCTIONS
// ========================

/**
 * Tampilkan alert di area dashboard
 */
function showAlert(type: 'success' | 'danger' | 'warning', message: string) {
  const alertRow = document.getElementById('dashboardAlert');
  const alertBox = document.getElementById('alertBox');
  if (alertRow && alertBox) {
    alertRow.style.display = 'block';
    alertBox.className = `alert rounded-3 py-2 px-3 mb-0 alert-${type}`;
    alertBox.setAttribute('role', 'alert');
    alertBox.innerHTML = message;

    // Auto-hide alert sukses setelah 3 detik
    if (type === 'success') {
      setTimeout(() => {
        if (alertRow) alertRow.style.display = 'none';
      }, 3000);
    }
  }
}

/**
 * Hapus semua spinner dan tampilkan placeholder jika perlu
 */
function clearAllSpinners() {
  const ids = ['dashPemasukan', 'dashPengeluaran', 'dashSaldo'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = 'Rp 0';
    }
  });

  const tableBody = document.getElementById('recentTransactions');
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted border-0 py-4">
          <i class="bi bi-exclamation-triangle" style="font-size: 1.2rem;"></i>
          Gagal memuat transaksi. Periksa koneksi atau coba lagi nanti.
        </td>
      </tr>`;
  }
}

// ========================
// CLEANUP SAAT NAVIGASI
// ========================
// Pastikan cleanup dipanggil saat user navigasi ke halaman lain
const originalNavigateTo = (window as any).navigateTo;
if (typeof originalNavigateTo === 'function') {
  (window as any).navigateTo = function (...args: any[]) {
    const cleanup = (window as any).__cleanupDashboard;
    if (typeof cleanup === 'function') {
      cleanup();
    }
    return originalNavigateTo.apply(this, args);
  };
}
