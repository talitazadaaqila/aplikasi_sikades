export const createNavbar = () => `
     <nav class="navbar navbar-expand-lg border-bottom fixed-top" style="background-color: #ffffff; z-index: 1030; padding: 10px 20px;">
       <div class="container-fluid d-flex justify-content-between align-items-center">
         <div class="d-flex align-items-center">
           <div class="text-white rounded d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px; background-color: #1b4933;">
             <i class="bi bi-wallet2" style="font-size: 1.2rem;"></i>
           </div>
           <div class="d-flex flex-column">
             <span class="navbar-brand fw-bold mb-0 p-0" style="color: #1b4933; font-family: serif; font-size: 1.2rem; line-height: 1;">SIKADES</span>
             <span class="text-muted" style="font-size: 0.75rem; line-height: 1;">Sistem Informasi Kas Desa</span>
           </div>
         </div>

         <div id="navbar-user-info">
           <div class="d-flex flex-column text-end me-3">
             <span class="fw-bold mb-0" style="color: #1b4933; font-size: 0.9rem; line-height: 1.2;">Admin Desa</span>
             <span class="text-muted" style="font-size: 0.75rem; line-height: 1.2;">Administrator</span>
           </div>
           <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width: 40px; height: 40px; background-color: #72b28c; font-size: 0.9rem;">
             AD
           </div>
         </div>
       </div>
     </nav>
   `;
