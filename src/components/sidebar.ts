export const createSidebar = (role: string = 'admin') => {
  const isAdmin = role === 'admin';
  
  return `
    <div class="p-3 vh-100 sidebar-container d-flex flex-column" style="width: 250px; position: fixed; top: 60px; left: 0; z-index: 1000; overflow-y: auto; background-color: #1b4933; color: white;">
      <ul class="nav flex-column gap-2 mt-4" id="sidebarNav" style="flex: 1;">
        <li class="nav-item">
          <a class="nav-link rounded menu-link d-flex align-items-center px-3 py-2 text-white" href="#dashboard" data-page="dashboard" style="opacity: 0.8; font-size: 0.95rem;">
            <i class="bi bi-grid-1x2 me-3" style="font-size: 1.1rem;"></i> Dashboard
          </a>
        </li>
        ${isAdmin ? `
        <li class="nav-item mt-2">
          <a class="nav-link rounded menu-link d-flex align-items-center px-3 py-2 text-white" href="#pemasukan" data-page="pemasukan" style="opacity: 0.8; font-size: 0.95rem;">
            <i class="bi bi-graph-up-arrow me-3" style="font-size: 1.1rem;"></i> Pemasukan
          </a>
        </li>
        <li class="nav-item mt-2">
          <a class="nav-link rounded menu-link d-flex align-items-center px-3 py-2 text-white" href="#pengeluaran" data-page="pengeluaran" style="opacity: 0.8; font-size: 0.95rem;">
            <i class="bi bi-graph-down-arrow me-3" style="font-size: 1.1rem;"></i> Pengeluaran
          </a>
        </li>
        ` : ''}
        <li class="nav-item mt-2">
          <a class="nav-link rounded menu-link d-flex align-items-center px-3 py-2 text-white" href="#iuran" data-page="iuran" style="opacity: 0.8; font-size: 0.95rem;">
            <i class="bi bi-people me-3" style="font-size: 1.1rem;"></i> Daftar Iuran
          </a>
        </li>
        ${isAdmin ? `
        <li class="nav-item mt-2">
          <a class="nav-link rounded menu-link d-flex align-items-center px-3 py-2 text-white" href="#laporan" data-page="laporan" style="opacity: 0.8; font-size: 0.95rem;">
            <i class="bi bi-file-earmark-text me-3" style="font-size: 1.1rem;"></i> Laporan
          </a>
        </li>
        <li class="nav-item mt-2">
          <a class="nav-link rounded menu-link d-flex align-items-center px-3 py-2 text-white" href="#export" data-page="export" style="opacity: 0.8; font-size: 0.95rem;">
            <i class="bi bi-download me-3" style="font-size: 1.1rem;"></i> Export PDF
          </a>
        </li>
        ` : ''}
      </ul>
      
      <div class="mt-auto mb-5">
        <div class="px-3 py-2 mb-2 text-white-50 small border-bottom border-secondary">Logged in as: <b class="text-white">${role}</b></div>
        <a href="#" class="nav-link rounded d-flex align-items-center px-3 py-2 text-white" id="btnLogout" style="opacity: 0.8; font-size: 0.95rem;">
          <i class="bi bi-box-arrow-right me-3" style="font-size: 1.1rem;"></i> Logout
        </a>
      </div>
    </div>
  `;
};
