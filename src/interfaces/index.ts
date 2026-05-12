export interface Pemasukan {
  id?: string;
  tanggal: string;
  sumber: string;
  jumlah: number;
  keterangan: string;
}

export interface Pengeluaran {
  id?: string;
  tanggal: string;
  tujuan: string;
  jumlah: number;
  keterangan: string;
}

export interface Rumah {
  id?: string;
  kepala_keluarga: string;
  alamat: string;
}

export interface AnggotaKeluarga {
  id?: string;
  rumah_id: string;
  nama: string;
  hubungan: string;
}

export interface Iuran {
  id?: string;
  rumah_id: string;
  tanggal: string;
  jumlah: number;
  bulan: string;
  tahun: string;
  keterangan: string;
}
