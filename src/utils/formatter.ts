export const formatRupiah = (angka: number | string | null | undefined): string => {
  if (angka === null || angka === undefined) return 'Rp 0';

  const parsed = typeof angka === 'string' ? parseFloat(angka.replace(/[^0-9.-]+/g, '')) : Number(angka);

  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return 'Rp 0';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parsed);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatNumber = (angka: number | string | null | undefined): string => {
  if (angka === null || angka === undefined) return '0';
  const parsed = typeof angka === 'string' ? parseFloat(angka) : Number(angka);
  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return '0';
  return parsed.toLocaleString('id-ID');
};
