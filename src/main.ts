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

   // Update navbar with current user info
   const sessionResult = await checkSession();
   if (sessionResult.session?.user) {
     const navbarEl = document.getElementById('navbar-user-info');
     if (navbarEl) {
       const u = sessionResult.session.user;
       const displayName = u.email || role;
       navbarEl.innerHTML = `
         <div class="d-flex flex-column text-end me-3">
           <span class="fw-bold mb-0" style="color: #1b4933; font-size: 0.9rem; line-height: 1.2;">${displayName}</span>
           <span class="text-muted" style="font-size: 0.75rem; line-height: 1.2;">${role === 'admin' ? 'Administrator' : 'User'}</span>
         </div>
       `;
     }
   }

// Setup sidebar navigation (remove old listeners first)
  const oldLinks = document.querySelectorAll('.menu-link[data-nav-listener]');
  oldLinks.forEach(link => {
    const newLink = link.cloneNode(true) as HTMLElement;
    link.parentNode?.replaceChild(newLink, link);
  });

  document.querySelectorAll('.menu-link').forEach(link => {
    link.setAttribute('data-nav-listener', 'true');
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

  // Setup logout (remove old listener first)
  const oldLogout = document.querySelector('#btnLogout[data-logout-listener]');
  if (oldLogout) {
    const newBtn = oldLogout.cloneNode(true) as HTMLElement;
    oldLogout.parentNode?.replaceChild(newBtn, oldLogout);
  }

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.setAttribute('data-logout-listener', 'true');
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
