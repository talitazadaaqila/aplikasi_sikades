import { supabase } from '../config/supabaseClient';
import type { Pemasukan, Pengeluaran } from '../interfaces';

const isUsingDummy = (import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co') === 'https://dummy.supabase.co';

const KEY_PEMASUKAN = 'mock_pemasukan';
const KEY_PENGELUARAN = 'mock_pengeluaran';

const generateId = () => Math.random().toString(36).substr(2, 9);
const getMockData = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const saveMockData = (key: string, data: any[]) => localStorage.setItem(key, JSON.stringify(data));

// --- Pemasukan ---
export const getPemasukan = async () => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PEMASUKAN);
    return { data: data.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()), error: null };
  }
  const { data, error } = await supabase
    .from('pemasukan')
    .select('*')
    .order('tanggal', { ascending: false });
  return { data, error };
};

export const createPemasukan = async (pemasukan: Pemasukan) => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PEMASUKAN);
    const newData = { ...pemasukan, id: generateId() };
    data.push(newData);
    saveMockData(KEY_PEMASUKAN, data);
    return { data: [newData], error: null };
  }
  const { id: _id, ...insertData } = pemasukan;
  void _id;
  const { data, error } = await supabase
    .from('pemasukan')
    .insert([insertData])
    .select();
  return { data, error };
};

export const deletePemasukan = async (id: string) => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PEMASUKAN).filter((item: any) => item.id !== id);
    saveMockData(KEY_PEMASUKAN, data);
    return { data: null, error: null };
  }
  const { data, error } = await supabase
    .from('pemasukan')
    .delete()
    .eq('id', id);
  return { data, error };
};

export const updatePemasukan = async (id: string, pemasukan: Partial<Pemasukan>) => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PEMASUKAN);
    const index = data.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...pemasukan };
      saveMockData(KEY_PEMASUKAN, data);
      return { data: [data[index]], error: null };
    }
    return { data: null, error: { message: 'Data tidak ditemukan' } };
  }
  const { id: _id, ...updateData } = pemasukan;
  void _id;
  const { data, error } = await supabase
    .from('pemasukan')
    .update(updateData)
    .eq('id', id)
    .select();
  return { data, error };
};

// --- Pengeluaran ---
export const getPengeluaran = async () => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PENGELUARAN);
    return { data: data.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()), error: null };
  }
  const { data, error } = await supabase
    .from('pengeluaran')
    .select('*')
    .order('tanggal', { ascending: false });
  return { data, error };
};

export const createPengeluaran = async (pengeluaran: Pengeluaran) => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PENGELUARAN);
    const newData = { ...pengeluaran, id: generateId() };
    data.push(newData);
    saveMockData(KEY_PENGELUARAN, data);
    return { data: [newData], error: null };
  }
  const { id: _id, ...insertData } = pengeluaran;
  void _id;
  const { data, error } = await supabase
    .from('pengeluaran')
    .insert([insertData])
    .select();
  return { data, error };
};

export const deletePengeluaran = async (id: string) => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PENGELUARAN).filter((item: any) => item.id !== id);
    saveMockData(KEY_PENGELUARAN, data);
    return { data: null, error: null };
  }
  const { data, error } = await supabase
    .from('pengeluaran')
    .delete()
    .eq('id', id);
  return { data, error };
};

export const updatePengeluaran = async (id: string, pengeluaran: Partial<Pengeluaran>) => {
  if (isUsingDummy) {
    const data = getMockData(KEY_PENGELUARAN);
    const index = data.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      data[index] = { ...data[index], ...pengeluaran };
      saveMockData(KEY_PENGELUARAN, data);
      return { data: [data[index]], error: null };
    }
    return { data: null, error: { message: 'Data tidak ditemukan' } };
  }
  const { id: _id, ...updateData } = pengeluaran;
  void _id;
  const { data, error } = await supabase
    .from('pengeluaran')
    .update(updateData)
    .eq('id', id)
    .select();
  return { data, error };
};

// --- Dashboard ---
export const getDashboardData = async () => {
  const [resPemasukan, resPengeluaran] = await Promise.all([
    getPemasukan(),
    getPengeluaran()
  ]);

  if (resPemasukan.error || resPengeluaran.error) {
    return { error: 'Gagal mengambil data dashboard' };
  }

  const pemasukanList = resPemasukan.data || [];
  const pengeluaranList = resPengeluaran.data || [];

  const totalPemasukan = pemasukanList.reduce((sum: number, item: any) => sum + Number(item.jumlah), 0);
  const totalPengeluaran = pengeluaranList.reduce((sum: number, item: any) => sum + Number(item.jumlah), 0);
  const saldo = totalPemasukan - totalPengeluaran;

  return {
    data: {
      totalPemasukan,
      totalPengeluaran,
      saldo,
      pemasukanList,
      pengeluaranList
    }
  };
};
