import { createNavbar } from './navbar';
import { createSidebar } from './sidebar';

export const renderLayout = (contentHTML: string, role: string = 'admin') => `
    <style>
      body { background-color: #f9fbf9; }
      .menu-link.active {
          background-color: #387f5f !important;
          opacity: 1 !important;
          font-weight: 500;
      }
      .sidebar-container .nav-link:hover {
          background-color: rgba(255,255,255,0.1);
          opacity: 1 !important;
      }
    </style>
    ${createNavbar()}
    <div class="d-flex">
      ${createSidebar(role)}
      <div class="content p-4 min-vh-100" style="margin-left: 250px; margin-top: 60px; width: calc(100% - 250px); background-color: #f9fbf9;">
        ${contentHTML}
      </div>
    </div>
  `;
