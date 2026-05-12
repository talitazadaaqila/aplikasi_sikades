import './style.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { checkSession, logout } from './auth/auth';
import { renderLogin, initLogin } from './pages/login';
import { renderLayout } from './components/layout';
import { renderDashboard, initDashboard } from './pages/dashboard';
import { renderPemasukan, initPemasukan } from './pages/pemasukan';
import { renderPengeluaran, initPengeluaran } from './pages/pengeluaran';
import { renderLaporan, initLaporan } from './pages/laporan';
import { renderExport, initExport } from './pages/export';
import { renderIuran, initIuran } from './pages/iuran';

const app = document.getElementById('app')!;

const navigateTo = async (page: string) => {
  const { session } = await checkSession();
  
  if (!session) {
    app.innerHTML = renderLogin();
    initLogin(() => navigateTo('dashboard'));
    return;
  }

  const role = (session.user as any).role || 'admin';

  // Restriction for 'user' role
  const restrictedPages = ['pemasukan', 'pengeluaran', 'laporan', 'export'];
  if (role === 'user' && restrictedPages.includes(page)) {
    navigateTo('dashboard');
    return;
  }

  let content = '';
  let initFn: ((role?: string) => Promise<void> | void) | null = null;

  switch (page) {
    case 'dashboard':
      content = renderDashboard(role);
      initFn = initDashboard;
      break;
    case 'pemasukan':
      content = renderPemasukan();
      initFn = initPemasukan;
      break;
    case 'pengeluaran':
      content = renderPengeluaran();
      initFn = initPengeluaran;
      break;
    case 'laporan':
      content = renderLaporan();
      initFn = initLaporan;
      break;
    case 'export':
      content = renderExport();
      initFn = initExport;
      break;
    case 'iuran':
      content = renderIuran(role);
      initFn = initIuran;
      break;
    default:
      content = renderDashboard(role);
      initFn = initDashboard;
      break;
  }

  app.innerHTML = renderLayout(content, role);

  // Setup sidebar navigation
  document.querySelectorAll('.menu-link').forEach(link => {
    link.classList.remove('active');
    if ((link as HTMLElement).dataset.page === page) {
      link.classList.add('active');
    }
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = (e.currentTarget as HTMLElement).dataset.page;
      if (targetPage) navigateTo(targetPage);
    });
  });

  // Setup logout
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      await logout();
      navigateTo('login');
    });
  }

  // Hide any open modals backdrop if leftover
  const backdrop = document.querySelector('.modal-backdrop');
  if (backdrop) backdrop.remove();
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';

  if (initFn) {
    await initFn(role);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  navigateTo('dashboard');
});
