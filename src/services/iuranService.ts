import { supabase } from '../config/supabaseClient';
import type { AnggotaKeluarga, Iuran, Rumah } from '../interfaces';
import { createPemasukan } from './transaksiService';

const isUsingDummy = (import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co') === 'https://dummy.supabase.co';
let forceMock = false;

const KEY_RUMAH = 'mock_rumah';
const KEY_ANGGOTA = 'mock_anggota';
const KEY_IURAN = 'mock_iuran';

const generateId = () => Math.random().toString(36).substr(2, 9);
const getMockData = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const saveMockData = (key: string, data: any[]) => localStorage.setItem(key, JSON.stringify(data));

const handleSupabaseError = (error: any): boolean => {
  if (error) {
    console.error('Supabase Error:', error);
    console.warn('Falling back to Mock Data for this session.');
    return true;
  }
  return false;
};

// --- Rumah ---
export const getRumah = async (): Promise<{data: any; error: any}> => {
  if (isUsingDummy || forceMock) {
    return { data: getMockData(KEY_RUMAH), error: null };
  }
  const { data, error } = await supabase.from('rumah').select('*').order('kepala_keluarga');
  if (handleSupabaseError(error)) { forceMock = true; return getRumah(); }
  return { data, error };
};

export const createRumah = async (rumah: Rumah): Promise<{data: any; error: any}> => {
  if (isUsingDummy || forceMock) {
    const data = getMockData(KEY_RUMAH);
    const newData = { ...rumah, id: generateId() };
    data.push(newData);
    saveMockData(KEY_RUMAH, data);
    return { data: [newData], error: null };
  }
  const { id: _id, ...insertData } = rumah;
  void _id;
  const { data, error } = await supabase.from('rumah').insert([insertData]).select();
  if (handleSupabaseError(error)) { forceMock = true; return createRumah(rumah); }
  return { data, error };
};

export const deleteRumah = async (id: string) => {
  if (isUsingDummy || forceMock) {
    const data = getMockData(KEY_RUMAH).filter((item: any) => item.id !== id);
    const anggota = getMockData(KEY_ANGGOTA).filter((item: any) => item.rumah_id !== id);
    const iuran = getMockData(KEY_IURAN).filter((item: any) => item.rumah_id !== id);
    saveMockData(KEY_RUMAH, data);
    saveMockData(KEY_ANGGOTA, anggota);
    saveMockData(KEY_IURAN, iuran);
    return { data: null, error: null };
  }
  await supabase.from('anggota_keluarga').delete().eq('rumah_id', id);
  await supabase.from('iuran').delete().eq('rumah_id', id);
  const { data, error } = await supabase.from('rumah').delete().eq('id', id);
  return { data, error };
};

export const updateRumah = async (id: string, rumah: Partial<Rumah>): Promise<{data: any; error: any}> => {
  if (isUsingDummy || forceMock) {
    const data = getMockData(KEY_RUMAH);
    const index = data.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...rumah };
      saveMockData(KEY_RUMAH, data);
      return { data: [data[index]], error: null };
    }
    return { data: null, error: { message: 'Data tidak ditemukan' } };
  }
  const { id: _id, ...updateData } = rumah;
  void _id;
  const { data, error } = await supabase.from('rumah').update(updateData).eq('id', id).select();
  if (handleSupabaseError(error)) return updateRumah(id, rumah);
  return { data, error };
};

// --- Anggota Keluarga ---
export const getAnggotaByRumah = async (rumahId: string): Promise<{data: any; error: any}> => {
  if (isUsingDummy || forceMock) {
    const data = getMockData(KEY_ANGGOTA).filter((item: any) => item.rumah_id === rumahId);
    return { data, error: null };
  }
  const { data, error } = await supabase.from('anggota_keluarga').select('*').eq('rumah_id', rumahId);
  if (handleSupabaseError(error)) return getAnggotaByRumah(rumahId);
  return { data, error };
};

export const createAnggota = async (anggota: AnggotaKeluarga): Promise<{data: any; error: any}> => {
  if (isUsingDummy || forceMock) {
    const data = getMockData(KEY_ANGGOTA);
    const newData = { ...anggota, id: generateId() };
    data.push(newData);
    saveMockData(KEY_ANGGOTA, data);
    return { data: [newData], error: null };
  }
  const { id: _id, ...insertData } = anggota;
  void _id;
  const { data, error } = await supabase.from('anggota_keluarga').insert([insertData]).select();
  if (handleSupabaseError(error)) return createAnggota(anggota);
  return { data, error };
};

export const deleteAnggota = async (id: string) => {
  if (isUsingDummy || forceMock) {
    const data = getMockData(KEY_ANGGOTA).filter((item: any) => item.id !== id);
    saveMockData(KEY_ANGGOTA, data);
    return { data: null, error: null };
  }
  const { data, error } = await supabase.from('anggota_keluarga').delete().eq('id', id);
  return { data, error };
};

// --- Iuran ---
export const getIuran = async (): Promise<{data: any; error: any}> => {
  if (isUsingDummy || forceMock) {
    return { data: getMockData(KEY_IURAN), error: null };
  }
  const { data, error } = await supabase.from('iuran').select('*').order('tanggal', { ascending: false });
  if (handleSupabaseError(error)) return getIuran();
  return { data, error };
};

export const getIuranByRumah = async (rumahId: string): Promise<{data: any; error: any}> => {
  if (isUsingDummy || forceMock) {
    const data = getMockData(KEY_IURAN).filter((item: any) => item.rumah_id === rumahId);
    return { data, error: null };
  }
  const { data, error } = await supabase.from('iuran').select('*').eq('rumah_id', rumahId).order('tanggal', { ascending: false });
  if (handleSupabaseError(error)) return getIuranByRumah(rumahId);
  return { data, error };
};

export const payIuran = async (iuran: Iuran): Promise<{data: any; error: any}> => {
  // 1. Create Iuran Record
  let iuranRes;
  if (isUsingDummy || forceMock) {
    const data = getMockData(KEY_IURAN);
    const newData = { ...iuran, id: generateId() };
    data.push(newData);
    saveMockData(KEY_IURAN, data);
    iuranRes = { data: [newData], error: null };
  } else {
    const { id: _id, ...insertData } = iuran;
    void _id;
    iuranRes = await supabase.from('iuran').insert([insertData]).select();
    if (handleSupabaseError(iuranRes.error)) return payIuran(iuran);
  }

  // 2. Automatically Link to General Pemasukan
  if (!iuranRes.error) {
    const { data: rumahList } = await getRumah();
    const rumahData = rumahList?.find((r: any) => r.id === iuran.rumah_id);
    await createPemasukan({
      tanggal: iuran.tanggal,
      sumber: `Iuran Warga: ${rumahData?.kepala_keluarga || 'Rumah'} (${iuran.bulan}/${iuran.tahun})`,
      jumlah: iuran.jumlah,
      keterangan: iuran.keterangan || `Pembayaran iuran bulan ${iuran.bulan} ${iuran.tahun}`,
    });
  }

  return iuranRes;
};

export const unpayIuran = async (rumahId: string, bulan: string, tahun: string) => {
  const { data: rumahList } = await getRumah();
  const rumahData = rumahList?.find((r: any) => r.id === rumahId);
  const sourceString = `Iuran Warga: ${rumahData?.kepala_keluarga || 'Rumah'} (${bulan}/${tahun})`;

  if (isUsingDummy || forceMock) {
    // 1. Delete Iuran
    const iuranData = getMockData(KEY_IURAN).filter(
      (i: any) => !(i.rumah_id === rumahId && i.bulan === bulan && i.tahun === tahun),
    );
    saveMockData(KEY_IURAN, iuranData);

    // 2. Delete Pemasukan
    const { getPemasukan, deletePemasukan } = await import('./transaksiService');
    const { data: pemList } = await getPemasukan();
    const pemToDelete = pemList?.find((p: any) => p.sumber === sourceString);
    if (pemToDelete?.id) {
      await deletePemasukan(pemToDelete.id);
    }
    return { data: null, error: null };
  }

  // Supabase version
  const { data: deletedIuran, error: iError } = await supabase.from('iuran').delete().eq('rumah_id', rumahId).eq('bulan', bulan)
    .eq('tahun', tahun);

  // 2. Delete Pemasukan
  const { getPemasukan, deletePemasukan } = await import('./transaksiService');
  try {
    const { data: pemList } = await getPemasukan();
    const pemToDelete = pemList?.find((p: any) => p.sumber === sourceString);
    if (pemToDelete?.id) {
      await deletePemasukan(pemToDelete.id);
    }
  } catch (e) {
    console.warn('Gagal menghapus pemasukan terkait:', e);
  }

  return { data: deletedIuran, error: iError };
};

// --- Statistics ---
export const getIuranStats = async () => {
  const { data: rumahList } = await getRumah();
  const { data: iuranList } = await getIuran();

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const currentMonth = months[new Date().getMonth()];
  const currentYear = new Date().getFullYear().toString();

  const rumahWithStatus = (rumahList || []).map((r: any) => {
    const isPaid = (iuranList || []).some(
      (i: any) => i.rumah_id === r.id && i.bulan === currentMonth && i.tahun === currentYear,
    );
    return { ...r, isPaid };
  });

  return {
    rumahWithStatus,
    paidCount: rumahWithStatus.filter((r: any) => r.isPaid).length,
    unpaidCount: rumahWithStatus.filter((r: any) => !r.isPaid).length,
    totalRumah: rumahWithStatus.length,
  };
};
