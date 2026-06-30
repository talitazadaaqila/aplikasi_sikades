# SIKADES — Sistem Informasi Keuangan Desa

Aplikasi **Single Page Application (SPA)** berbasis TypeScript untuk mengelola keuangan kas desa secara digital. Mencatat pemasukan, pengeluaran, iuran warga, dan menghasilkan laporan PDF.

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **Dashboard** | Ringkasan keuangan real-time: total pemasukan, pengeluaran, saldo, grafik tren, dan transaksi terbaru |
| **Pemasukan** | CRUD data pemasukan dengan pencarian dan ekspor PDF |
| **Pengeluaran** | CRUD data pengeluaran dengan pencarian dan ekspor PDF |
| **Iuran Warga** | Kelola rumah/KK, anggota keluarga, dan pembayaran iuran bulanan. Pembayaran otomatis tercatat sebagai pemasukan |
| **Laporan** | Laporan keuangan lengkap dengan filter tanggal, ekspor PDF |
| **Ekspor PDF** | Satu halaman khusus untuk mengunduh laporan pemasukan, pengeluaran, laporan lengkap, dan data iuran |
| **Auth & Role** | Login dengan dua peran: *admin* (akses penuh) dan *user* (dashboard + iuran saja) |
| **Real-time** | Halaman dashboard auto-refresh saat data berubah (via Supabase Realtime atau polling) |
| **Mode Mock** | Berjalan offline sepenuhnya dengan localStorage — tanpa perlu koneksi Supabase |

---

## Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| **Bahasa** | TypeScript 6 |
| **Build** | Vite 8 |
| **UI** | Bootstrap 5 + Bootstrap Icons |
| **Grafik** | Chart.js 4 |
| **PDF** | jsPDF + AutoTable |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth / Mock localStorage |
| **Linting** | ESLint + Airbnb Base + TypeScript |
| **CI/CD** | GitHub Actions (lint + build) |

---

## Prasyarat

- **Node.js** 22.x atau lebih baru
- **npm** 10.x atau lebih baru
- **Supabase** akun (hanya untuk mode production)

---

## Instalasi

```bash
# Clone repositori
git clone https://github.com/talitazadaaqila/aplikasi_sikades.git
cd aplikasi_sikades

# Install dependencies
npm install

# Jalankan dev server
npm run dev
```

Akses di `http://localhost:3000`.

---

## Konfigurasi

Buat file `.env` di root proyek (atau salin dari `.env.backup`):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Mode Mock**: Jika `VITE_SUPABASE_URL` tidak diisi atau menggunakan URL dummy, aplikasi akan otomatis berjalan dalam mode mock menggunakan localStorage.

---

## Mode Development (Mock Database)

Tanpa Supabase, aplikasi tetap berfungsi penuh:

1. Semua data CRUD disimpan di `localStorage`
2. Data dummy (12 bulan pemasukan & pengeluaran) di-generate otomatis saat pertama kali dimuat
3. Login menggunakan kredensial lokal:

   | Username | Password | Role |
   |----------|----------|------|
   | `admin` | `admin123` | Admin |
   | `user` | `user123` | User |

4. Polling setiap 5 detik mengecek perubahan data antar tab

---

## Scripts

| Script | Perintah | Keterangan |
|--------|----------|------------|
| `dev` | `npm run dev` | Jalankan dev server (port 3000) |
| `build` | `npm run build` | Type-check + build produksi ke `dist/` |
| `preview` | `npm run preview` | Pratinjau hasil build |
| `lint` | `npm run lint` | ESLint semua source file |

---

## Struktur Proyek

```
src/
├── auth/auth.ts           # Login, logout, session, role detection
├── components/
│   ├── layout.ts          # Shell halaman (navbar + sidebar + konten)
│   ├── navbar.ts          # Navigasi atas
│   └── sidebar.ts         # Menu samping (role-aware)
├── config/
│   └── supabaseClient.ts  # Inisialisasi Supabase client
├── interfaces/index.ts    # TypeScript interfaces untuk semua model data
├── pages/
│   ├── dashboard.ts       # Halaman utama (statistik, grafik, transaksi)
│   ├── login.ts           # Halaman login
│   ├── pemasukan.ts       # Manajemen pemasukan
│   ├── pengeluaran.ts     # Manajemen pengeluaran
│   ├── iuran.ts           # Manajemen iuran warga
│   ├── laporan.ts         # Laporan keuangan
│   └── export.ts          # Ekspor PDF
├── services/
│   ├── transaksiService.ts # CRUD pemasukan/pengeluaran + EventBus + realtime
│   └── iuranService.ts    # CRUD rumah/anggota/iuran
├── utils/
│   ├── export.ts           # Helper ekspor PDF
│   └── formatter.ts        # Format Rupiah, tanggal, angka
├── main.ts                 # Entry point + SPA router
└── style.css               # Global styles + CSS variables
```

---

## Skema Database (Supabase)

### `pemasukan`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | uuid | PK |
| `tanggal` | date | Tanggal transaksi |
| `sumber` | text | Sumber dana |
| `jumlah` | numeric | Jumlah (Rp) |
| `keterangan` | text | Deskripsi |

### `pengeluaran`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | uuid | PK |
| `tanggal` | date | Tanggal transaksi |
| `tujuan` | text | Tujuan pengeluaran |
| `jumlah` | numeric | Jumlah (Rp) |
| `keterangan` | text | Deskripsi |

### `rumah`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | uuid | PK |
| `kepala_keluarga` | text | Nama kepala keluarga |
| `alamat` | text | Alamat / nomor rumah |

### `anggota_keluarga`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | uuid | PK |
| `rumah_id` | uuid | FK → `rumah.id` |
| `nama` | text | Nama anggota |
| `hubungan` | text | Hubungan (Istri/Anak/Orang Tua/Lainnya) |

### `iuran`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | uuid | PK |
| `rumah_id` | uuid | FK → `rumah.id` |
| `tanggal` | date | Tanggal bayar |
| `jumlah` | numeric | Jumlah dibayar |
| `bulan` | text | Bulan (Januari–Desember) |
| `tahun` | text | Tahun |
| `keterangan` | text | Deskripsi |

---

## Autentikasi & Role

### Mode Mock (localStorage)
| User | Password | Role |
|------|----------|------|
| `admin` | `admin123` | Admin |
| `user` | `user123` | User |

### Mode Production (Supabase Auth)
Login menggunakan email & password via Supabase Authentication. Role disimpan di metadata user.

### Hak Akses
| Menu | Admin | User |
|------|-------|------|
| Dashboard | ✅ | ✅ |
| Pemasukan | ✅ | — |
| Pengeluaran | ✅ | — |
| Iuran | ✅ | ✅ (read-only) |
| Laporan | ✅ | — |
| Export | ✅ | — |

---

## CI/CD

GitHub Actions otomatis menjalankan **lint** dan **build** setiap ada push atau pull request ke branch `main`.

Workflow: `.github/workflows/ci.yml`

---

## Lisensi

Hak cipta milik Pengembang Desa Gembong Beringin, Kecamatan Kedungwuni, Kabupaten Pekalongan.
