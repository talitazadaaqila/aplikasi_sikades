import { login } from '../auth/auth';

export const renderLogin = () => {
  return `
    <div class="d-flex align-items-center justify-content-center vh-100 w-100" style="background-color: #f2f7f4; position: absolute; top:0; left:0; z-index: 9999;">
      <div class="container d-flex flex-column flex-md-row justify-content-center align-items-stretch" style="max-width: 900px; gap: 24px; padding: 20px;">
        
        <!-- Left Side: Green Card -->
        <div class="p-5 text-white d-flex flex-column align-items-center justify-content-center" style="background-color: #387f5f; border-radius: 20px; flex: 1;">
          
          <div class="rounded-circle border border-2 border-white d-flex align-items-center justify-content-center mb-4" style="width: 80px; height: 80px;">
            <i class="bi bi-wallet2" style="font-size: 2.2rem; margin-left: 2px;"></i>
          </div>
          
          <h2 class="fw-bold mb-2" style="font-family: serif; letter-spacing: 1px;">SIKADES</h2>
          <p class="mb-5 text-center" style="font-size: 1.05rem;">Sistem Informasi Kas Desa</p>
          
          <div class="w-100 p-3 mb-3 text-start" style="background: rgba(255,255,255,0.08); border-radius: 12px; border: 1px solid rgba(255,255,255,0.15);">
            <div class="d-flex align-items-start">
               <i class="bi bi-cash-coin me-3 mt-1" style="font-size: 1.2rem;"></i>
               <div>
                 <h6 class="mb-1 fw-bold" style="font-size: 0.95rem;">Kelola Keuangan Desa</h6>
                 <p class="mb-0" style="font-size: 0.8rem; opacity: 0.85;">Manajemen pemasukan dan pengeluaran kas desa yang transparan</p>
               </div>
            </div>
          </div>
          
          <div class="w-100 p-3 text-start" style="background: rgba(255,255,255,0.08); border-radius: 12px; border: 1px solid rgba(255,255,255,0.15);">
            <div class="d-flex align-items-start">
               <i class="bi bi-journal-text me-3 mt-1" style="font-size: 1.2rem;"></i>
               <div>
                 <h6 class="mb-1 fw-bold" style="font-size: 0.95rem;">Laporan Real-time</h6>
                 <p class="mb-0" style="font-size: 0.8rem; opacity: 0.85;">Akses laporan keuangan kapan saja dengan mudah</p>
               </div>
            </div>
          </div>
          
        </div>
        
        <!-- Right Side: White Card -->
        <div class="bg-white p-5 shadow-sm d-flex flex-column justify-content-center" style="border-radius: 20px; flex: 1;">
           <h4 class="fw-bold mb-2" style="color: #1b4933;">Selamat Datang</h4>
           <p class="text-muted mb-4" style="font-size: 0.95rem;">Silakan login untuk melanjutkan</p>
           
           <form id="loginForm">
              <div class="mb-4">
                 <label class="form-label fw-medium" style="color: #444; font-size: 0.9rem;">Username</label>
                 <div class="input-group" style="background-color: #f0f4fa; border-radius: 8px; overflow: hidden;">
                    <span class="input-group-text border-0 bg-transparent ps-3"><i class="bi bi-person text-secondary"></i></span>
                    <input type="text" class="form-control border-0 bg-transparent shadow-none py-2" id="emailInput" required placeholder="admin">
                 </div>
              </div>
              
              <div class="mb-4">
                 <label class="form-label fw-medium" style="color: #444; font-size: 0.9rem;">Password</label>
                 <div class="input-group" style="background-color: #f0f4fa; border-radius: 8px; overflow: hidden;">
                    <span class="input-group-text border-0 bg-transparent ps-3"><i class="bi bi-lock text-secondary"></i></span>
                    <input type="password" class="form-control border-0 bg-transparent shadow-none py-2" id="passwordInput" required placeholder="••••••••">
                 </div>
              </div>
              
              <div id="loginError" class="alert alert-danger d-none py-2" role="alert" style="font-size: 0.85rem;"></div>
              
              <button type="submit" class="btn w-100 mb-4 fw-bold" style="background-color: #387f5f; color: white; border-radius: 8px; padding: 12px;">Login</button>
              
              <div class="text-center">
                 <a href="#" class="text-decoration-none" style="color: #387f5f; font-size: 0.9rem;">Setup Admin Baru &rarr;</a>
              </div>
           </form>
        </div>
      </div>
    </div>
  `;
};

export const initLogin = (onSuccess: () => void) => {
  const form = document.getElementById('loginForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('emailInput') as HTMLInputElement).value;
    const password = (document.getElementById('passwordInput') as HTMLInputElement).value;
    const errorEl = document.getElementById('loginError');
    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    
    if(submitBtn) submitBtn.disabled = true;
    
    const { error } = await login(email, password);
    
    if(submitBtn) submitBtn.disabled = false;

    if (error) {
      if (errorEl) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('d-none');
      }
    } else {
      if (errorEl) errorEl.classList.add('d-none');
      onSuccess();
    }
  });
};
