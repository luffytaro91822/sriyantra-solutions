import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Invoice, InvoiceStatus } from '../types';
import * as invoiceService from '../services/invoiceService';
import ConfirmationModal from './ConfirmationModal';

interface DashboardProps {
  onAddNew: () => void;
  onEdit: (id: string) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const formatDate = (dateStr: string): string => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr || 'N/A';
    }
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch (e) {
      console.error("Failed to format date:", dateStr, e);
      return dateStr; // Fallback to the original string
    }
};

const StatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
    const baseClasses = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    const statusClasses = {
        Paid: 'bg-green-100 text-green-800 dark:bg-green-800/50 dark:text-green-200',
        Unpaid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200',
        Overdue: 'bg-red-100 text-red-800 dark:bg-red-800/50 dark:text-red-200',
        Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-600/50 dark:text-gray-200',
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};


const Dashboard: React.FC<DashboardProps> = ({ onAddNew, onEdit }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
    const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

    const loadInvoices = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await invoiceService.getInvoices();
            setInvoices(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred while fetching invoices.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInvoices();
    }, [loadInvoices]);

    const handleConfirmDelete = async () => {
        if (!deletingInvoiceId) return;
        try {
            await invoiceService.deleteInvoice(deletingInvoiceId);
            loadInvoices(); // Refresh the list
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to delete invoice.";
            alert(message);
        } finally {
            setDeletingInvoiceId(null);
        }
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            const matchesSearch =
                invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [invoices, searchTerm, statusFilter]);

    const summaryStats = useMemo(() => {
        const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.total_amount, 0);
        const totalPaid = invoices.filter(inv => inv.status === 'Paid').reduce((acc, inv) => acc + inv.total_amount, 0);
        const outstanding = totalInvoiced - totalPaid;
        return { totalInvoiced, totalPaid, outstanding };
    }, [invoices]);

    const handleExportCsv = () => {
        const headers = ['Invoice #', 'Client Name', 'Invoice Date', 'Due Date', 'Total Amount', 'Status'];
        
        const escapeCsvCell = (cellData: string | number | null | undefined): string => {
            const cellStr = String(cellData ?? '');
            if (cellStr.includes('"') || cellStr.includes(',') || cellStr.includes('\n')) {
                const escapedStr = cellStr.replace(/"/g, '""');
                return `"${escapedStr}"`;
            }
            return cellStr;
        };

        const rows = filteredInvoices.map(inv => [
            escapeCsvCell(inv.invoice_number),
            escapeCsvCell(inv.customer.name),
            escapeCsvCell(formatDate(inv.invoice_date)),
            escapeCsvCell(formatDate(inv.due_date)),
            escapeCsvCell(inv.total_amount),
            escapeCsvCell(inv.status)
        ].join(','));
        
        // Add BOM for better Excel compatibility
        const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\n');
        
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "invoices.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

  return (
    <>
    <div className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Invoiced</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(summaryStats.totalInvoiced)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Outstanding</h3>
                <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(summaryStats.outstanding)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Collected</h3>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summaryStats.totalPaid)}</p>
            </div>
        </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex-grow w-full md:w-auto">
          <input 
            type="text"
            placeholder="Search by Invoice # or Client Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                className="w-full md:w-auto px-4 py-2 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-gray-700"
            >
                <option value="all">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Overdue">Overdue</option>
                <option value="Draft">Draft</option>
            </select>
            <button onClick={handleExportCsv} disabled={filteredInvoices.length === 0} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md shadow-lg transition duration-300 disabled:opacity-50">
                Export CSV
            </button>
            <button onClick={onAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-lg transition duration-300 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                <span>New Invoice</span>
            </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-16">Loading invoices...</div>
      ) : error ? (
        <div className="text-center py-16 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h3 className="font-bold">An Error Occurred</h3>
            <p>{error}</p>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">This may be due to a database schema mismatch or missing permissions. Please run the setup script in README.md to ensure your database is correctly configured.</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold">No invoices yet</h3>
            <p className="text-gray-500 mt-2">Click "New Invoice" to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredInvoices.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{invoice.invoice_number}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{invoice.customer.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(invoice.total_amount)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(invoice.invoice_date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatDate(invoice.due_date)}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={invoice.status} /></td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                <button onClick={() => onEdit(invoice.id)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 font-semibold">Edit</button>
                                <button onClick={() => setDeletingInvoiceId(invoice.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 font-semibold">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    <ConfirmationModal
        isOpen={!!deletingInvoiceId}
        onClose={() => setDeletingInvoiceId(null)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
    />
    </>
  );
};

export default Dashboard;