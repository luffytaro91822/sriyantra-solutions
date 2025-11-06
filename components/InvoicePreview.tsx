import React from 'react';
import { Invoice, Company } from '../types';

// Fix for TypeScript errors: Declare jsPDF and html2canvas on the global window object.
// These libraries are assumed to be loaded from script tags.
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

interface InvoicePreviewProps {
  invoice: Invoice;
  company: Company;
  onClose?: () => void;
}

// Helper function to fetch an image and convert it to a base64 string
const getImageBase64 = async (url: string): Promise<string | null> => {
  try {
    // Use a proxy or ensure CORS is enabled on the server if you face issues
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Could not load company logo:", error);
    return null; // Return null on error so PDF generation can continue
  }
};


const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, company, onClose }) => {
  const handlePrint = () => {
    window.print();
  };
  
  const handleDownloadPdf = async () => {
      const { jsPDF } = window.jspdf;
      // Cast to any to access the autoTable plugin added via script tag
      const pdf = new jsPDF('p', 'mm', 'a4') as any;
      
      const logoUrl = 'https://sriyantrasolutions.wuaze.com/wp-content/uploads/2025/09/Green-and-Black-Modern-Creative-Agency-Logo.png';
      // Use a reliable CORS proxy to bypass browser cross-origin restrictions.
      const proxiedLogoUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(logoUrl)}`;
      const logoBase64 = await getImageBase64(proxiedLogoUrl);

      const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let y = 20;

      // === HEADER ===
      if (logoBase64) {
          const logoWidth = 25;
          const logoHeight = 25;
          const logoX = pageWidth - margin - logoWidth;
          const logoY = y;
          pdf.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);
      }

      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Invoice', margin, y + 8);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Invoice #: ${invoice.invoice_number}`, margin, y + 15);
      
      const companyTextY = logoBase64 ? y + 28 : y;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(company.name, pageWidth - margin, companyTextY, { align: 'right' });

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(company.address, pageWidth - margin, companyTextY + 6, { align: 'right' });
      pdf.text(company.phone, pageWidth - margin, companyTextY + 11, { align: 'right' });
      pdf.text(`GSTIN: ${company.gstin}`, pageWidth - margin, companyTextY + 16, { align: 'right' });
      
      const headerMaxY = Math.max(y + 20, companyTextY + 16);
      y = headerMaxY + 15;

      // === CLIENT INFO & DATES ===
      pdf.setDrawColor(200);
      pdf.line(margin, y - 5, pageWidth - margin, y - 5);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', margin, y);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(invoice.customer.name, margin, y + 5);
      pdf.text(invoice.customer.address, margin, y + 10);
      pdf.text(invoice.customer.phone, margin, y + 15);
      if (invoice.customer.gstin) {
        pdf.text(`GSTIN: ${invoice.customer.gstin}`, margin, y + 20);
      }
      
      const detailsX = pageWidth / 2 + 20;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Invoice Date:', detailsX, y);
      pdf.text('Due Date:', detailsX, y + 5);

      pdf.setFont('helvetica', 'normal');
      pdf.text(invoice.invoice_date, detailsX + 30, y);
      pdf.text(invoice.due_date, detailsX + 30, y + 5);

      y += 30;

      // === ITEMS TABLE ===
      const tableColumns = ["Item Description", "Quantity", "Unit Price", "Total"];
      const tableRows = invoice.items.map(item => [
          item.name,
          item.quantity,
          formatCurrency(item.unit_price).replace(/₹/g, '').trim(),
          formatCurrency(item.line_total).replace(/₹/g, '').trim(),
      ]);

      pdf.autoTable({
          startY: y,
          head: [tableColumns],
          body: tableRows,
          theme: 'grid',
          headStyles: {
              fillColor: [41, 128, 185],
              textColor: 255,
              fontStyle: 'bold',
          },
          styles: {
              font: 'helvetica',
              fontSize: 10,
              cellPadding: 2.5
          },
          columnStyles: {
              0: { cellWidth: 80 },
              1: { halign: 'center' },
              2: { halign: 'right' },
              3: { halign: 'right' }
          },
          didDrawPage: (data: any) => {
              // We can add headers/footers for multi-page invoices here if needed
          }
      });
      
      y = pdf.autoTable.previous.finalY + 10;

      // === TOTALS ===
      const totalsX = pageWidth - margin - 50;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Subtotal:', totalsX, y, { align: 'left' });
      pdf.text(formatCurrency(invoice.subtotal), pageWidth - margin, y, { align: 'right' });
      y += 6;

      pdf.text(`GST (${invoice.gst_percent}%):`, totalsX, y, { align: 'left' });
      pdf.text(formatCurrency(invoice.gst_amount), pageWidth - margin, y, { align: 'right' });
      y += 6;

      pdf.setDrawColor(100);
      pdf.line(totalsX - 2, y, pageWidth - margin, y);
      y += 4;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total (INR):', totalsX, y, { align: 'left' });
      pdf.text(formatCurrency(invoice.total_amount), pageWidth - margin, y, { align: 'right' });
      y += 15;

      // === NOTES ===
      if (invoice.notes) {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Notes:', margin, y);
          
          pdf.setFont('helvetica', 'normal');
          const splitNotes = pdf.splitTextToSize(invoice.notes, pageWidth - margin * 2);
          pdf.text(splitNotes, margin, y + 5);
      }

      // === FOOTER ===
      const footerY = pageHeight - 10;
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`Thank you for your business.`, pageWidth / 2, footerY, { align: 'center' });


      pdf.save(`invoice-${invoice.invoice_number}.pdf`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };
    
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div id="invoice-preview" className="print-container">
        <div className="flex justify-between items-start mb-8">
            <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoice</h1>
            <p className="text-gray-500 dark:text-gray-400">Invoice #: {invoice.invoice_number}</p>
            </div>
            <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{company.name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{company.address}</p>
            <p className="text-gray-500 dark:text-gray-400">{company.phone}</p>
            <p className="text-gray-500 dark:text-gray-400">GSTIN: {company.gstin}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">Bill To</h3>
            <p className="font-medium text-gray-900 dark:text-white">{invoice.customer.name}</p>
            <p className="text-gray-600 dark:text-gray-300">{invoice.customer.address}</p>
            <p className="text-gray-600 dark:text-gray-300">{invoice.customer.phone}</p>
            {invoice.customer.gstin && <p className="text-gray-600 dark:text-gray-300">GSTIN: {invoice.customer.gstin}</p>}
            </div>
            <div className="text-right">
            <p><span className="font-semibold text-gray-600 dark:text-gray-300">Invoice Date:</span> {invoice.invoice_date}</p>
            <p><span className="font-semibold text-gray-600 dark:text-gray-300">Due Date:</span> {invoice.due_date}</p>
            </div>
        </div>
        
        <div className="flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0">Item</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Quantity</th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Unit Price</th>
                                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0 text-right text-sm font-semibold text-gray-900 dark:text-white">Line Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {invoice.items.map((item, index) => (
                                <tr key={index}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">{item.name}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{item.quantity}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">{formatCurrency(item.unit_price)}</td>
                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">{formatCurrency(item.line_total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
            <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">GST ({invoice.gst_percent}%):</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.gst_amount)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.total_amount)}</span>
                </div>
            </div>
        </div>

        {invoice.notes && (
            <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Notes</h4>
            <p className="text-gray-600 dark:text-gray-300">{invoice.notes}</p>
            </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-center space-x-4 no-print">
        {onClose && (
            <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            &larr; Back to Dashboard
            </button>
        )}
        <button onClick={handlePrint} className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Print Invoice
        </button>
        <button onClick={handleDownloadPdf} className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default InvoicePreview;