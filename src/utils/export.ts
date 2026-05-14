import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: { finalY: number };
    autoTable: (options: UserOptions) => jsPDF;
  }
}

interface ColumnDef {
  header: string;
  dataKey: string;
}

/**
 * Export data to PDF with a professional layout and village branding
 */
export const exportToPDF = (
  title: string, 
  columns: ColumnDef[], 
  data: any[], 
  filename: string
) => {
  const Swal = (window as any).Swal;
  
  try {
    // Show loading notification if Swal is available
    if (Swal) {
      Swal.fire({
        title: 'Menyiapkan PDF...',
        text: 'Mohon tunggu sejenak.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor: [number, number, number] = [27, 73, 51]; // #1b4933 (Deep Green)
    const secondaryColor: [number, number, number] = [56, 127, 95]; // #387f5f (Medium Green)

    // Header: Village Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('PEMERINTAH KABUPATEN PEKALONGAN', 105, 15, { align: 'center' });
    doc.text('DESA GEMBONG BERINGIN', 105, 22, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('Kel. Kedungwuni Barat, Kec. Kedungwuni, Kab. Pekalongan', 105, 27, { align: 'center' });

    // Horizontal Line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(14, 32, 196, 32);
    doc.setLineWidth(0.2);
    doc.line(14, 33, 196, 33);

    // Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(33);
    doc.text('LAPORAN KEUANGAN', 105, 45, { align: 'center' });
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), 105, 51, { align: 'center' });

    // Report Meta (Date)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const printDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Tanggal Cetak: ${printDate}`, 14, 58);

    // Main Table
    doc.autoTable({
      startY: 63,
      columns: columns,
      body: data,
      theme: 'striped',
      headStyles: {
        fillColor: secondaryColor,
        textColor: 255,
        fontSize: 11,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 10,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [245, 250, 247]
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (_dataArg) => {
        // Footer: Page Number and Branding
        doc.setFontSize(9);
        doc.setTextColor(150);
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();

        // Left footer
        doc.text('SIKADES - Gembong Beringin', 14, pageHeight - 10);

        // Right footer (Page X of Y)
        const pageNumber = (doc.internal as any).getNumberOfPages();
        doc.text(`Halaman ${pageNumber}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
      }
    });

    // Signature Area
    const finalY = (doc as any).lastAutoTable.finalY || 60;
    if (finalY + 40 < 280) { // Check if space is enough
      doc.setFontSize(10);
      doc.setTextColor(33);
      doc.text('Mengetahui,', 150, finalY + 20, { align: 'center' });
      doc.text('Ketua RW', 150, finalY + 25, { align: 'center' });
      doc.text('( ____________________ )', 150, finalY + 45, { align: 'center' });
    }

    // Save PDF
    const timestamp = new Date().getTime();
    doc.save(`${filename}_${timestamp}.pdf`);

    // Show success notification
    if (Swal) {
      Swal.fire({
        icon: 'success',
        title: 'Unduhan Berhasil',
        text: 'File PDF Laporan Keuangan telah berhasil diunduh.',
        confirmButtonColor: '#1b4933'
      });
    }

  } catch (error) {
    console.error('Error exporting PDF:', error);
    if (Swal) {
      Swal.fire({
        icon: 'error',
        title: 'Ekspor Gagal',
        text: 'Terjadi kesalahan teknis saat membuat file PDF.',
        confirmButtonColor: '#e74c3c'
      });
    }
  }
};

