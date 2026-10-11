import React, { useRef } from 'react';
import { Printer, Download, X, Building2, Phone, Mail, MapPin, CheckCircle, Clock } from 'lucide-react';
import { Business, Sale, Purchase } from '../types';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  sale?: Sale | null;
  purchase?: Purchase | null;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  business,
  sale,
  purchase,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || (!sale && !purchase)) return null;

  const isSale = !!sale;
  const docData = sale || purchase!;
  const currency = business.currency || '৳';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 border border-slate-200">
        {/* Modal Controls - Hidden when printed */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 font-mono text-sm font-semibold">
              {isSale ? 'SALES INVOICE' : 'PURCHASE BILL'}
            </span>
            <span className="text-slate-400 text-sm">#{docData.invoiceNo}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div ref={printRef} className="p-8 sm:p-12 text-slate-800 bg-white" id="invoice-printable">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                {business.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    className="w-12 h-12 object-contain rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                    {business.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight">{business.name}</h1>
                  <p className="text-xs text-slate-500 font-medium">{business.businessType || 'Wholesale & Retail'}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-0.5 mt-2">
                {business.address && (
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{business.address}</span>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Phone: {business.phone}</span>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{business.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="inline-block bg-slate-100 text-slate-800 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-2">
                {isSale ? 'Tax Invoice / Bill' : 'Purchase Receipt'}
              </div>
              <div className="text-sm font-semibold text-slate-900 font-mono">Invoice #{docData.invoiceNo}</div>
              <div className="text-xs text-slate-500">Date: {new Date(docData.createdAt).toLocaleDateString()}</div>
              <div className="text-xs text-slate-500">
                Payment: <span className="capitalize font-medium text-slate-700">{docData.paymentMethod}</span>
              </div>
              <div className="mt-2">
                {docData.dueAmount <= 0 ? (
                  <span className="inline-flex items-center space-x-1 text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    <span>PAID IN FULL</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-semibold">
                    <Clock className="w-3 h-3" />
                    <span>DUE: {currency}{docData.dueAmount.toLocaleString()}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Billed To / Supplier Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-100 text-xs">
            <div>
              <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-1">
                {isSale ? 'BILLED TO (CUSTOMER):' : 'SUPPLIER DETAILS:'}
              </div>
              <div className="font-bold text-sm text-slate-900">
                {isSale ? (sale?.customerName || 'Walk-in Customer') : purchase?.supplierName}
              </div>
              {isSale && sale?.customerPhone && (
                <div className="text-slate-600 mt-0.5">Phone: {sale.customerPhone}</div>
              )}
            </div>
            <div className="sm:text-right">
              <div className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider mb-1">ISSUED BY:</div>
              <div className="font-medium text-slate-800">{docData.createdBy || business.ownerName}</div>
              <div className="text-slate-500">DMS Solution Powered</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 pr-2">#</th>
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center">Unit</th>
                  <th className="py-2.5 text-right">Price</th>
                  <th className="py-2.5 text-right">Qty</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docData.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 pr-2 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 font-semibold text-slate-800">{item.productName}</td>
                    <td className="py-3 text-center text-slate-500">{item.unit || 'pcs'}</td>
                    <td className="py-3 text-right font-mono text-slate-700">
                      {currency}{('unitPrice' in item ? item.unitPrice : item.purchasePrice).toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-3 text-right font-bold font-mono text-slate-900">
                      {currency}{item.subtotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start gap-6">
            <div className="text-xs text-slate-500 max-w-xs space-y-2">
              <div>
                <span className="font-semibold text-slate-700">Notes / Terms:</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {docData.notes || 'Thank you for your business. Please keep this invoice for any warranty or return claims.'}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">{currency}{docData.subtotal.toLocaleString()}</span>
              </div>
              {docData.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span className="font-mono">-{currency}{docData.discount.toLocaleString()}</span>
                </div>
              )}
              {isSale && (sale?.tax || 0) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax / VAT:</span>
                  <span className="font-mono">+{currency}{sale?.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total:</span>
                <span className="font-mono text-base">{currency}{docData.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700 border-t border-slate-100 pt-1.5">
                <span>Amount Paid:</span>
                <span className="font-mono font-semibold text-emerald-700">{currency}{docData.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Due Balance:</span>
                <span className={`font-mono font-bold ${docData.dueAmount > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                  {currency}{docData.dueAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures & Footer */}
          <div className="mt-16 pt-8 border-t border-slate-100 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
            <div>
              <div className="border-b border-slate-300 w-36 mx-auto mb-1"></div>
              <span>Customer Signature</span>
            </div>
            <div>
              <div className="border-b border-slate-300 w-36 mx-auto mb-1"></div>
              <span>Authorized Signature</span>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
            System generated invoice by <strong>DMS Solution</strong> • Empowering Businesses
          </div>
        </div>
      </div>
    </div>
  );
};
