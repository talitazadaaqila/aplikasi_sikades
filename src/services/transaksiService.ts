/**
 * transaksiService.ts
 *
 * Service layer untuk operasi CRUD pemasukan & pengeluaran.
 *
 * [PERUBAHAN TANGGAL 14-05-2026 — REAL-TIME SYSTEM v2]
 * ======================================================
 * 1. EventBus singleton — export instance untuk komunikasi antar halaman
 * 2. setupRealtimeSubscriptions() — Supabase Realtime listener
 * 3. startDataPolling() — fallback polling untuk mode mock
 * 4. Semua CRUD mutation mempublish event agar dashboard auto-refresh
 * 5. Export debounce, isUsingDummy, safeSum untuk digunakan halaman lain
 *
 * [FIXED] Sebelumnya (v1):
 * - Duplicate identifier 'EventBus' (class vs const sama)
 * - safeSum, debounce, isUsingDummy tidak diekspor
 *
 * Best Practice:
 * - 1 deklarasi per fungsi (tidak duplikat)
 * - async/await dengan try-catch di setiap fungsi
 * - Return { data, error } agar konsisten di seluruh service
 * - Validasi NaN pada operasi angka
 * - Cleanup subscription saat tidak dibutuhkan
 * ======================================================
 */

import { supabase } from '../config/supabaseClient';
import type { Pemasukan, Pengeluaran } from '../interfaces';

// ========================
// KONFIGURASI & HELPER LOKAL
// ========================

/** Cek apakah sedang mode mock (development tanpa Supabase) */
export const isUsingDummy = (import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co')
  === 'https://dummy.supabase.co';

const KEY_PEMASUKAN = 'mock_pemasukan';
const KEY_PENGELUARAN = 'mock_pengeluaran';

/** Interval polling untuk mode mock (ms) — default 5 detik */
const POLLING_INTERVAL_MS = 5000;

/** Generate ID acak untuk mock data */
const generateId = (): string => Math.random().toString(36).substring(2, 11);

/**
 * Baca data dari localStorage dengan safe parse.
 * Kembalikan array kosong jika error atau belum ada data.
 */
const getMockData = (key: string): any[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn(`[getMockData] Gagal parse localStorage key: "${key}"`);
    return [];
  }
};

/** Simpan data ke localStorage */
const saveMockData = (key: string, data: any[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`[saveMockData] Gagal menyimpan key "${key}":`, err);
  }
};

// ========================
// EVENT BUS — SISTEM PUB/SUB
// ========================

/**
 * EventBusClass — class internal, nama tidak diekspor.
 *
 * Mengapa butuh EventBus?
 * - Aplikasi ini menggunakan SPA routing vanilla (bukan React)
 * - Tidak ada React Context atau State Management library
 * - Dashboard, Pemasukan, dan Pengeluaran harus saling berkomunikasi
 * - Setelah CRUD di satu halaman, halaman lain harus tahu
 *
 * Cara pakai:
 *   // Subscribe
 *   const unsub = EventBus.on('data:changed', () => { ... });
 *
 *   // Publish
 *   EventBus.publish('data:changed', { source: 'pemasukan' });
 *
 *   // Unsubscribe saat cleanup
 *   unsub();
 */
class EventBusClass {
  private listeners: Map<string, Set<(..._args: unknown[]) => void>> = new Map();

  /**
   * Subscribe ke event
   * @returns Function untuk unsubscribe
   */
  on(event: string, callback: (..._args: unknown[]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const wrappedCallback = (..._args: unknown[]) => callback(..._args);
    this.listeners.get(event)!.add(wrappedCallback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(wrappedCallback);
    };
  }

  /** Publish event ke semua subscriber */
  publish(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Iterasi snapshot untuk menghindari issue jika callback unsubscribe saat iterasi
      [...eventListeners].forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`[EventBus] Error in "${event}" listener:`, err);
        }
      });
    }
  }

  /** Hapus semua listeners untuk event tertentu */
  off(event: string): void {
    this.listeners.delete(event);
  }

  /** Hapus SEMUA listeners (digunakan saat cleanup) */
  clear(): void {
    this.listeners.clear();
  }
}

/** Singleton instance — export sebagai object, bukan class */
export const EventBus = new EventBusClass();

// ========================
// DEBOUNCE HELPER
// ========================

/**
 * Debounce function — mencegah pemanggilan berlebihan.
 * Berguna saat banyak event datang dalam waktu singkat.
 *
 * @param func - Fungsi yang akan di-debounce
 * @param wait - Waktu tunggu dalam milidetik
 * @returns Fungsi debounced
 */
export const debounce = <T extends (..._args: any[]) => void>(
  func: T,
  wait: number,
): ((..._args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (..._args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(..._args);
      timeout = null;
    }, wait);
  };
};

// ========================
// SEED DUMMY DATA (DEV ONLY)
// ========================

/**
 * Otomatis membuat data dummy untuk development/testing.
 * Hanya berjalan jika localStorage KOSONG dan mode mock aktif.
 */
export const seedDummyData = (): void => {
  const months = [
    '01', '02', '03', '04', '05', '06',
    '07', '08', '09', '10', '11', '12',
  ];
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

  // ── SEED PEMASUKAN ─────────────────────────────────
  if (getMockData(KEY_PEMASUKAN).length === 0) {
    const dummyPemasukan: Pemasukan[] = months.map((m, i) => {
      const year = m <= currentMonth ? currentYear : currentYear - 1;
      const day = String(Math.min(15 + i, 28)).padStart(2, '0');
      return {
        id: generateId(),
        tanggal: `${year}-${m}-${day}`,
        sumber: `Iuran Warga - ${monthNames[i]} ${year}`,
        jumlah: 50000 + Math.floor(Math.random() * 100000),
        keterangan: `Pembayaran iuran rutin bulan ${monthNames[i]}`,
      };
    });

    dummyPemasukan.push({
      id: generateId(),
      tanggal: `${currentYear}-${currentMonth}-05`,
      sumber: 'Donasi Warga - Pak Ahmad',
      jumlah: 250000,
      keterangan: 'Donasi pembangunan musholla',
    });
    dummyPemasukan.push({
      id: generateId(),
      tanggal: `${currentYear}-${currentMonth}-12`,
      sumber: 'Sumbangan BUMDes',
      jumlah: 175000,
      keterangan: 'Bagi hasil BUMDes bulan ini',
    });

    saveMockData(KEY_PEMASUKAN, dummyPemasukan);
    console.log(`[Seed] Pemasukan dummy dibuat: ${dummyPemasukan.length} item`);
  }

  // ── SEED PENGELUARAN ───────────────────────────────
  if (getMockData(KEY_PENGELUARAN).length === 0) {
    const dummyPengeluaran: Pengeluaran[] = months.map((m, i) => {
      const year = m <= currentMonth ? currentYear : currentYear - 1;
      const day = String(Math.min(20 + i, 27)).padStart(2, '0');
      return {
        id: generateId(),
        tanggal: `${year}-${m}-${day}`,
        tujuan: `Operasional Kantor - ${monthNames[i]}`,
        jumlah: 30000 + Math.floor(Math.random() * 80000),
        keterangan: `Biaya operasional rutin bulan ${monthNames[i]}`,
      };
    });

    dummyPengeluaran.push({
      id: generateId(),
      tanggal: `${currentYear}-${currentMonth}-08`,
      tujuan: 'Perbaikan Infrastruktur',
      jumlah: 1500000,
      keterangan: 'Perbaikan jalan desa RT 03-05',
    });
    dummyPengeluaran.push({
      id: generateId(),
      tanggal: `${currentYear}-${currentMonth}-15`,
      tujuan: 'Honor Petugas Kebersihan',
      jumlah: 500000,
      keterangan: `Gaji bulan ${monthNames[now.getMonth()]}`,
    });

    saveMockData(KEY_PENGELUARAN, dummyPengeluaran);
    console.log(`[Seed] Pengeluaran dummy dibuat: ${dummyPengeluaran.length} item`);
  }
};

// Jalankan seed otomatis saat modul dimuat (hanya mode mock)
if (isUsingDummy) {
  seedDummyData();
}

// ========================
// HELPER: Supabase Result Handler
// ========================

const handleSupabaseResult = async <T>(
  promise: any,
): Promise<{ data: T | null; error: any }> => {
  try {
    const result = await promise;
    if (result?.error) {
      console.error('[Supabase]', result.error.message || result.error);
    }
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga';
    console.error('[Supabase] Unexpected error:', msg);
    return { data: null, error: { message: msg } };
  }
};

// ========================
// HELPER: Safe Sum (anti-NaN)
// ========================

/**
 * Menjumlahkan field numerik dari array item dengan proteksi NaN.
 * DIEKSPOR agar bisa digunakan dari halaman lain.
 */
export const safeSum = (items: any[], field: string): number => items.reduce((sum: number, item: any): number => {
  const val = Number(item?.[field]);
  return sum + (Number.isNaN(val) ? 0 : val);
}, 0);

// ========================
// PEMASUKAN — CRUD
// ========================

export const getPemasukan = async (): Promise<{
  data: Pemasukan[] | null;
  error: any;
}> => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PEMASUKAN).sort(
      (a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
    );
    return { data, error: null };
  }
  return handleSupabaseResult(() => supabase.from('pemasukan').select('*').order('tanggal', { ascending: false }));
};

export const createPemasukan = async (
  pemasukan: Pemasukan,
): Promise<{ data: any; error: any }> => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PEMASUKAN);
    const newData = { ...pemasukan, id: generateId() };
    data.push(newData);
    saveMockData(KEY_PEMASUKAN, data);
    EventBus.publish('data:changed', { source: 'pemasukan', action: 'create', data: newData });
    return { data: [newData], error: null };
  }
  const { id: _id, ...insertData } = pemasukan;
  void _id;
  const result = await handleSupabaseResult(
    supabase.from('pemasukan').insert([insertData]).select(),
  );
  if (!result.error) {
    EventBus.publish('data:changed', { source: 'pemasukan', action: 'create', data: result.data });
  }
  return result;
};

export const deletePemasukan = async (id: string): Promise<{
  data: any;
  error: any;
}> => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PEMASUKAN).filter((item: any) => item.id !== id);
    saveMockData(KEY_PEMASUKAN, data);
    EventBus.publish('data:changed', { source: 'pemasukan', action: 'delete', id });
    return { data: null, error: null };
  }
  const result = await handleSupabaseResult(
    supabase.from('pemasukan').delete().eq('id', id),
  );
  if (!result.error) {
    EventBus.publish('data:changed', { source: 'pemasukan', action: 'delete', id });
  }
  return result;
};

export const updatePemasukan = async (
  id: string,
  pemasukan: Partial<Pemasukan>,
): Promise<{ data: any; error: any }> => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PEMASUKAN);
    const index = data.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...pemasukan };
      saveMockData(KEY_PEMASUKAN, data);
      EventBus.publish('data:changed', { source: 'pemasukan', action: 'update', id });
      return { data: [data[index]], error: null };
    }
    return { data: null, error: { message: 'Data pemasukan tidak ditemukan' } };
  }
  const { id: _id, ...updateData } = pemasukan as any;
  void _id;
  const result = await handleSupabaseResult(
    supabase.from('pemasukan').update(updateData).eq('id', id).select(),
  );
  if (!result.error) {
    EventBus.publish('data:changed', { source: 'pemasukan', action: 'update', id });
  }
  return result;
};

// ========================
// PENGELUARAN — CRUD
// ========================

export const getPengeluaran = async (): Promise<{
  data: Pengeluaran[] | null;
  error: any;
}> => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PENGELUARAN).sort(
      (a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
    );
    return { data, error: null };
  }
  return handleSupabaseResult(() => supabase.from('pengeluaran').select('*').order('tanggal', { ascending: false }));
};

export const createPengeluaran = async (
  pengeluaran: Pengeluaran,
): Promise<{ data: any; error: any }> => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PENGELUARAN);
    const newData = { ...pengeluaran, id: generateId() };
    data.push(newData);
    saveMockData(KEY_PENGELUARAN, data);
    EventBus.publish('data:changed', { source: 'pengeluaran', action: 'create', data: newData });
    return { data: [newData], error: null };
  }
  const { id: _id, ...insertData } = pengeluaran;
  void _id;
  const result = await handleSupabaseResult(
    supabase.from('pengeluaran').insert([insertData]).select(),
  );
  if (!result.error) {
    EventBus.publish('data:changed', { source: 'pengeluaran', action: 'create', data: result.data });
  }
  return result;
};

export const deletePengeluaran = async (id: string): Promise<{
  data: any;
  error: any;
}> => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PENGELUARAN).filter((item: any) => item.id !== id);
    saveMockData(KEY_PENGELUARAN, data);
    EventBus.publish('data:changed', { source: 'pengeluaran', action: 'delete', id });
    return { data: null, error: null };
  }
  const result = await handleSupabaseResult(
    supabase.from('pengeluaran').delete().eq('id', id),
  );
  if (!result.error) {
    EventBus.publish('data:changed', { source: 'pengeluaran', action: 'delete', id });
  }
  return result;
};

export const updatePengeluaran = async (
  id: string,
  pengeluaran: Partial<Pengeluaran>,
): Promise<{ data: any; error: any }> => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PENGELUARAN);
    const index = data.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...pengeluaran };
      saveMockData(KEY_PENGELUARAN, data);
      EventBus.publish('data:changed', { source: 'pengeluaran', action: 'update', id });
      return { data: [data[index]], error: null };
    }
    return { data: null, error: { message: 'Data pengeluaran tidak ditemukan' } };
  }
  const { id: _id, ...updateData } = pengeluaran as any;
  void _id;
  const result = await handleSupabaseResult(
    supabase.from('pengeluaran').update(updateData).eq('id', id).select(),
  );
  if (!result.error) {
    EventBus.publish('data:changed', { source: 'pengeluaran', action: 'update', id });
  }
  return result;
};

// ========================
// DASHBOARD — AGGREGATE STATISTICS
// ========================

export const getDashboardData = async (): Promise<{
  data?: {
    totalPemasukan: number;
    totalPengeluaran: number;
    saldo: number;
    pemasukanList: Pemasukan[];
    pengeluaranList: Pengeluaran[];
  };
  error?: { message: string };
}> => {
  try {
    const [resPemasukan, resPengeluaran] = await Promise.all([
      getPemasukan(),
      getPengeluaran(),
    ]);

    if (resPemasukan.error) {
      console.error('getPemasukan error:', resPemasukan.error);
      return { error: resPemasukan.error as { message: string } };
    }
    if (resPengeluaran.error) {
      console.error('getPengeluaran error:', resPengeluaran.error);
      return { error: resPengeluaran.error as { message: string } };
    }

    const pemasukanList = resPemasukan.data || [];
    const pengeluaranList = resPengeluaran.data || [];

    const totalPemasukan = safeSum(pemasukanList, 'jumlah');
    const totalPengeluaran = safeSum(pengeluaranList, 'jumlah');
    const saldo = totalPemasukan - totalPengeluaran;

    return {
      data: {
        totalPemasukan,
        totalPengeluaran,
        saldo,
        pemasukanList,
        pengeluaranList,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga';
    console.error('getDashboardData unexpected error:', err);
    return {
      error: {
        message: `Gagal mengambil data dashboard: ${msg}`,
      },
    };
  }
};

// ========================
// REAL-TIME SUBSCRIPTIONS
// ========================

let pemasukanChannel: any = null;
let pengeluaranChannel: any = null;

/**
 * Menyiapkan Supabase Realtime Subscription.
 * Hanya aktif di production (bukan mode mock).
 *
 * @returns Function untuk unsubscribe semua channel
 */
export const setupRealtimeSubscriptions = (): (() => void) => {
  if (isUsingDummy) {
    console.log('[Realtime] Mode mock — tidak perlu Supabase Realtime');
    return () => {};
  }

  console.log('[Realtime] Menyiapkan Supabase Realtime subscriptions...');

  // Subscribe perubahan pemasukan — SEMUA event (INSERT, UPDATE, DELETE)
  pemasukanChannel = supabase
    .channel('pemasukan-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pemasukan' },
      (payload: any) => {
        console.log('[Realtime] Pemasukan berubah:', payload.eventType);
        EventBus.publish('data:changed', {
          source: 'pemasukan',
          action: payload.eventType,
          data: payload.new,
        });
      },
    )
    .subscribe();

  // Subscribe perubahan pengeluaran — SEMUA event
  pengeluaranChannel = supabase
    .channel('pengeluaran-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pengeluaran' },
      (payload: any) => {
        console.log('[Realtime] Pengeluaran berubah:', payload.eventType);
        EventBus.publish('data:changed', {
          source: 'pengeluaran',
          action: payload.eventType,
          data: payload.new,
        });
      },
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    console.log('[Realtime] Membersihkan subscriptions...');
    if (pemasukanChannel) {
      supabase.removeChannel(pemasukanChannel);
      pemasukanChannel = null;
    }
    if (pengeluaranChannel) {
      supabase.removeChannel(pengeluaranChannel);
      pengeluaranChannel = null;
    }
  };
};

// ========================
// POLLING (FALLBACK UNTUK MODE MOCK)
// ========================

let pollingTimer: ReturnType<typeof setInterval> | null = null;
let lastPemasukanChecksum = '';
let lastPengeluaranChecksum = '';

const computeChecksum = (data: any[]): string => {
  try {
    const json = JSON.stringify(
      data.map((item: any) => ({
        id: item.id,
        jumlah: item.jumlah,
        tanggal: item.tanggal,
      })),
    );
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash;
    }
    return hash.toString();
  } catch {
    return '';
  }
};

/**
 * Sistem polling untuk mode mock/localStorage.
 * Membandingkan data terakhir dengan data saat ini setiap X detik.
 * Jika ada perubahan, publish event ke EventBus.
 *
 * @returns Function untuk menghentikan polling
 */
export const startDataPolling = (): (() => void) => {
  console.log(`[Polling] Memulai polling setiap ${POLLING_INTERVAL_MS / 1000} detik...`);

  lastPemasukanChecksum = computeChecksum(getMockData(KEY_PEMASUKAN));
  lastPengeluaranChecksum = computeChecksum(getMockData(KEY_PENGELUARAN));

  pollingTimer = setInterval(() => {
    const currentPemasukanChecksum = computeChecksum(getMockData(KEY_PEMASUKAN));
    const currentPengeluaranChecksum = computeChecksum(getMockData(KEY_PENGELUARAN));

    if (currentPemasukanChecksum !== lastPemasukanChecksum) {
      console.log('[Polling] Deteksi perubahan data pemasukan!');
      lastPemasukanChecksum = currentPemasukanChecksum;
      EventBus.publish('data:changed', { source: 'pemasukan', action: 'polling_update' });
    }

    if (currentPengeluaranChecksum !== lastPengeluaranChecksum) {
      console.log('[Polling] Deteksi perubahan data pengeluaran!');
      lastPengeluaranChecksum = currentPengeluaranChecksum;
      EventBus.publish('data:changed', { source: 'pengeluaran', action: 'polling_update' });
    }
  }, POLLING_INTERVAL_MS);

  return () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
      console.log('[Polling] Dihentikan.');
    }
  };
};

/**
 * Dapatkan timestamp terakhir sinkronisasi.
 */
export const getLastSyncTime = (): string => new Date().toLocaleTimeString('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});
