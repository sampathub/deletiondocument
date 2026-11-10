import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, Check, AlertCircle, X, ArrowDown } from 'lucide-react';
import { DeletionDocument } from '../types/document';
import { parseExcelFile, downloadSampleExcelTemplate } from '../utils/excelUtils';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newDocs: DeletionDocument[], mode: 'merge' | 'replace') => void;
  existingDocs: DeletionDocument[];
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingDocs,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedDocs, setParsedDocs] = useState<DeletionDocument[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [unmappedCols, setUnmappedCols] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setErrorMsg('');
    setIsProcessing(true);
    setFileName(file.name);

    try {
      const result = await parseExcelFile(file);

      if (result.documents.length === 0) {
        setErrorMsg('No valid document rows found in this file. Please verify column headers.');
        setParsedDocs([]);
      } else {
        // Count duplicates by contractNo
        const existingContracts = new Set(
          existingDocs.map((d) => (d.contractNo || '').trim().toUpperCase())
        );
        const dupes = result.documents.filter((d) =>
          d.contractNo && existingContracts.has(d.contractNo.trim().toUpperCase())
        ).length;

        setParsedDocs(result.documents);
        setDuplicateCount(dupes);
        setUnmappedCols(result.unmappedColumns);
      }
    } catch (err: any) {
      console.error('File read error:', err);
      setErrorMsg('Failed to read Excel file. Please ensure it is a valid .xlsx, .xls, or .csv file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedDocs.length === 0) return;
    onImport(parsedDocs, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Daily Excel Document Import (දිනපතා ලේඛන ඇතුලත් කිරීම)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload Head Office / LAD Excel (.xlsx, .xls, .csv). Documents auto-sort chronologically into the branch ledger.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Action bar for template */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Need the official 16-column Excel template?
              </span>
            </div>
            <button
              type="button"
              onClick={downloadSampleExcelTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download Template (.xlsx)
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
            />
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 rounded-full text-indigo-600 dark:text-indigo-400 mb-3">
              <UploadCloud className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {fileName ? fileName : 'Click to select or drag & drop daily Excel file here'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Supports .xlsx, .xls, and .csv formats with automatic header detection
            </p>
          </div>

          {isProcessing && (
            <div className="py-6 flex flex-col items-center justify-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
              Parsing spreadsheet columns and normalizing dates...
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedDocs.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Found {parsedDocs.length} document records in file
                  </span>
                  {duplicateCount > 0 && (
                    <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      ({duplicateCount} existing contract numbers matched)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-indigo-600"
                    />
                    Merge & Update
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-indigo-600"
                    />
                    Replace All
                  </label>
                </div>
              </div>

              {/* Table preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-semibold">No</th>
                      <th className="px-3 py-2 font-semibold">Contract No</th>
                      <th className="px-3 py-2 font-semibold">Client Name</th>
                      <th className="px-3 py-2 font-semibold">NIC</th>
                      <th className="px-3 py-2 font-semibold">Reg No</th>
                      <th className="px-3 py-2 font-semibold">Recived Date</th>
                      <th className="px-3 py-2 font-semibold">Officer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                    {parsedDocs.slice(0, 10).map((d, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-1.5 font-bold">{d.no}</td>
                        <td className="px-3 py-1.5 text-indigo-600 dark:text-indigo-400 font-medium">{d.contractNo}</td>
                        <td className="px-3 py-1.5 font-sans font-medium text-slate-800 dark:text-slate-200">{d.clientName}</td>
                        <td className="px-3 py-1.5">{d.clientNic}</td>
                        <td className="px-3 py-1.5">{d.regNo}</td>
                        <td className="px-3 py-1.5">{d.receivedBranchDate}</td>
                        <td className="px-3 py-1.5">{d.receivedOfficerBranch}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedDocs.length > 10 && (
                <p className="text-[11px] text-slate-400 text-center">
                  Showing first 10 of {parsedDocs.length} records. All records will be imported and chronologically sorted.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={parsedDocs.length === 0}
            onClick={handleConfirmImport}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
          >
            <Check className="w-4 h-4" /> Import {parsedDocs.length} Records to Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
