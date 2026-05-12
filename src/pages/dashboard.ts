import { getDashboardData } from '../services/transaksiService';
import { formatRupiah } from '../utils/formatter';
import Chart from 'chart.js/auto';

let chartInstance: Chart | null = null;
let comparisonChartInstance: Chart | null = null;

export const renderDashboard = (_role: string = 'admin') => {
  return `
    <div class="container-fluid fade-in px-2 py-3">
      <h3 class="fw-bold mb-1" style="color: #1b4933; font-family: serif;">Dashboard</h3>
      <p class="text-muted mb-4" style="font-size: 0.95rem;">Ringkasan keuangan kas desa</p>
      
      <div class="row mb-5 g-4">
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
              <h3 class="fw-bold mb-0" id="dashPemasukan" style="color: #288d57;"><span class="spinner-border spinner-border-sm" role="status"></span></h3>
            </div>
          </div>
        </div>
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
              <h3 class="fw-bold mb-0" id="dashPengeluaran" style="color: #d54b4b;"><span class="spinner-border spinner-border-sm" role="status"></span></h3>
            </div>
          </div>
        </div>
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
              <h3 class="fw-bold mb-0" id="dashSaldo" style="color: #1b4933;"><span class="spinner-border spinner-border-sm" role="status"></span></h3>
            </div>
          </div>
        </div>
      </div>

      <div class="row mb-4 g-4">
        <div class="col-md-12 mb-2 d-flex justify-content-end">
          <select id="filterPeriode" class="form-select form-select-sm shadow-sm border-0" style="width: 150px; background-color: #eaf3ed; color: #1b4933; font-weight: bold;">
            <option value="bulanan" selected>Per Bulan</option>
            <option value="mingguan">Per Minggu</option>
          </select>
        </div>
        <div class="col-md-6 mt-0">
          <div class="card shadow-sm border-0 rounded-4 h-100">
            <div class="card-body p-4 d-flex flex-column">
              <h6 class="card-title fw-bold mb-4" style="color: #1b4933; font-family: serif;">Tren Keuangan</h6>
              <div style="position: relative; height: 260px; width: 100%; flex-grow: 1;">
                <canvas id="financeChart"></canvas>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6 mt-0">
          <div class="card shadow-sm border-0 rounded-4 h-100">
            <div class="card-body p-4 d-flex flex-column">
              <h6 class="card-title fw-bold mb-4" style="color: #1b4933; font-family: serif;">Perbandingan Pemasukan vs Pengeluaran</h6>
              <div style="position: relative; height: 260px; width: 100%; flex-grow: 1;">
                <canvas id="comparisonChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <div class="card shadow-sm border-0 rounded-4">
            <div class="card-body p-4">
              <h6 class="card-title fw-bold mb-4" style="color: #1b4933; font-family: serif;">Transaksi Terbaru</h6>
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
                  <tbody id="recentTransactions" style="border-top: none;">
                    <tr><td colspan="4" class="text-center border-0"><span class="spinner-border spinner-border-sm" role="status"></span> Memuat...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const initDashboard = async (_role: string = 'admin') => {
  const { data, error } = await getDashboardData();
  if (error || !data) {
    console.error(error);
    return;
  }

  const elSaldo = document.getElementById('dashSaldo');
  const elPemasukan = document.getElementById('dashPemasukan');
  const elPengeluaran = document.getElementById('dashPengeluaran');

  if (elSaldo) elSaldo.textContent = formatRupiah(data.saldo);
  if (elPemasukan) elPemasukan.textContent = formatRupiah(data.totalPemasukan);
  if (elPengeluaran) elPengeluaran.textContent = formatRupiah(data.totalPengeluaran);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  
  const renderCharts = (periode: 'bulanan' | 'mingguan') => {
    const dataMap = new Map<string, { in: number, out: number }>();
    
    const processList = (list: any[], type: 'in' | 'out') => {
      list.forEach(item => {
        let key = '';
        if (periode === 'bulanan') {
          const m = item.tanggal.substring(0, 7); // YYYY-MM
          const [y, month] = m.split('-');
          key = `${monthNames[parseInt(month) - 1]} ${y.substring(2)}`; // e.g. "Apr 26"
        } else {
          // Mingguan
          const d = new Date(item.tanggal);
          const monthStr = monthNames[d.getMonth()];
          const week = Math.ceil(d.getDate() / 7);
          key = `${monthStr} W${week}`; // e.g. "Apr W1"
        }
        
        const curr = dataMap.get(key) || { in: 0, out: 0 };
        curr[type] += Number(item.jumlah);
        dataMap.set(key, curr);
      });
    };

    processList(data.pemasukanList || [], 'in');
    processList(data.pengeluaranList || [], 'out');

    // To ensure correct sorting for weeks and months, we can rely on chronological insertion if we sorted the original data, but Maps iterate in insertion order. Let's pre-sort the data chronologically first before processList.
    
    const sortedKeys = Array.from(dataMap.keys()); // Simplified sorting
    const dsIn = sortedKeys.map(k => dataMap.get(k)!.in);
    const dsOut = sortedKeys.map(k => dataMap.get(k)!.out);

    const ctx = document.getElementById('financeChart') as HTMLCanvasElement;
    if (ctx) {
      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: sortedKeys,
          datasets: [{
            label: 'Keuangan',
            data: dsIn,
            fill: true,
            backgroundColor: 'rgba(40, 141, 87, 0.2)',
            borderColor: '#288d57',
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: '#288d57'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 600, easing: 'easeOutQuart' },
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { }, border: { display: false } },
            x: { grid: { display: false }, border: { display: false } }
          }
        }
      });
    }

    const compCtx = document.getElementById('comparisonChart') as HTMLCanvasElement;
    if (compCtx) {
      if (comparisonChartInstance) comparisonChartInstance.destroy();
      comparisonChartInstance = new Chart(compCtx, {
        type: 'bar',
        data: {
          labels: sortedKeys,
          datasets: [
            { label: 'pemasukan', data: dsIn, backgroundColor: '#288d57', borderRadius: 4 },
            { label: 'pengeluaran', data: dsOut, backgroundColor: '#d54b4b', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 600, easing: 'easeOutQuart' },
          plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } }
          },
          scales: {
            y: { beginAtZero: true, grid: { }, border: { display: false } },
            x: { grid: { display: false }, border: { display: false } }
          }
        }
      });
    }
  };

  // Pre-sort all transactions chronologically so that the Map keys are inserted in order
  if (data.pemasukanList) data.pemasukanList.sort((a: any, b: any) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  if (data.pengeluaranList) data.pengeluaranList.sort((a: any, b: any) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  // Initial render
  renderCharts('bulanan');

  const filterPeriode = document.getElementById('filterPeriode') as HTMLSelectElement;
  if (filterPeriode) {
    filterPeriode.addEventListener('change', (e) => {
      const val = (e.target as HTMLSelectElement).value as 'bulanan' | 'mingguan';
      renderCharts(val);
    });
  }

  // Recent Transactions
  const recentTbody = document.getElementById('recentTransactions');
  if (recentTbody) {
    const allTransactions = [
      ...(data.pemasukanList || []).map((item: any) => ({ ...item, type: 'Pemasukan' })),
      ...(data.pengeluaranList || []).map((item: any) => ({ ...item, type: 'Pengeluaran' }))
    ];
    
    allTransactions.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    const recent = allTransactions.slice(0, 5);

    if (recent.length === 0) {
      recentTbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted border-0">Belum ada transaksi</td></tr>';
    } else {
      recentTbody.innerHTML = recent.map(item => `
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td class="border-0 text-muted" style="font-size: 0.95rem;">${item.tanggal}</td>
          <td class="border-0">
            <span class="badge rounded-pill" style="background-color: ${item.type === 'Pemasukan' ? '#eaf3ed' : '#fceeee'}; color: ${item.type === 'Pemasukan' ? '#288d57' : '#d54b4b'}; font-weight: 500; padding: 6px 12px; font-size: 0.85rem;">
              <i class="bi ${item.type === 'Pemasukan' ? 'bi-arrow-up-short' : 'bi-arrow-down-short'}"></i> ${item.type}
            </span>
          </td>
          <td class="border-0 text-muted" style="font-size: 0.95rem;">${item.keterangan}</td>
          <td class="border-0 text-end fw-medium" style="color: ${item.type === 'Pemasukan' ? '#288d57' : '#d54b4b'}; font-size: 0.95rem;">
            ${formatRupiah(item.jumlah)}
          </td>
        </tr>
      `).join('');
    }
  }
};
