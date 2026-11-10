import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Plus,
  Download,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  FileText,
  UserCheck,
  Trash2,
  MessageSquare,
  Send,
  Building,
  CheckSquare,
  Square,
  Check,
  X,
  Calendar,
  Tag,
} from 'lucide-react';
import { DeletionDocument, DocumentWithSla, BranchStats } from './types/document';
import { INITIAL_RECORDS } from './data/initialRecords';
import { computeDocumentSla, sortDocuments } from './utils/dateUtils';
import { exportToExcel } from './utils/excelUtils';
import { SlaAlertBanner } from './components/SlaAlertBanner';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ReleaseDocumentModal } from './components/ReleaseDocumentModal';
import { AddDocumentModal } from './components/AddDocumentModal';
import { A4PrintRegister } from './components/A4PrintRegister';
import { A4LabelPrint } from './components/A4LabelPrint';
import { A4ReleaseReceipt } from './components/A4ReleaseReceipt';
import { A4DispatchMemo } from './components/A4DispatchMemo';
import { DispatchTransferModal } from './components/DispatchTransferModal';
import { AiAuditModal } from './components/AiAuditModal';
import { AiNoticeModal } from './components/AiNoticeModal';
import { ConfirmModal } from './components/ConfirmModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';

const STORAGE_KEY = 'branch_deletion_documents_v3';
const THEME_KEY = 'branch_theme_pref';

// Known initial demo contract numbers
const KNOWN_SAMPLE_CONTRACTS = new Set([
  'KEUV221306970',
  'KEUV231512510',
  'KEUV231890120',
  'KEUV241103445',
  'KEUV241556780',
  'KEUV241901234',
  'KEUV220994101',
]);

export function isSampleRecord(d: DeletionDocument): boolean {
  if (d.isSample) return true;
  if (typeof d.id === 'string' && (d.id.startsWith('doc_392') || d.id === 'doc_return_mc_1')) return true;
  if (d.contractNo && KNOWN_SAMPLE_CONTRACTS.has(d.contractNo.trim().toUpperCase())) return true;
  return false;
}

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [isDark]);

  // Documents state (supports empty array properly)
  const [documents, setDocuments] = useState<DeletionDocument[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed; // Can be [] if user cleared/deleted!
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored documents, using seed data:', e);
    }
    return INITIAL_RECORDS;
  });

  // Save documents to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    } catch (e) {
      console.error('Failed to store documents in localStorage:', e);
    }
  }, [documents]);

  // View state: 'LEDGER' | 'PRINT_A4' | 'PRINT_LABELS' | 'PRINT_VOUCHER' | 'PRINT_DISPATCH_MEMO'
  const [currentView, setCurrentView] = useState<'LEDGER' | 'PRINT_A4' | 'PRINT_LABELS' | 'PRINT_VOUCHER' | 'PRINT_DISPATCH_MEMO'>('LEDGER');
  const [selectedVoucherDoc, setSelectedVoucherDoc] = useState<DeletionDocument | null>(null);
  const [dispatchedMemoDocs, setDispatchedMemoDocs] = useState<DeletionDocument[]>([]);
  const [labelPrintDateFilter, setLabelPrintDateFilter] = useState<{
    mode: 'RANGE' | 'SINGLE';
    startDate?: string;
    endDate?: string;
    singleDate?: string;
  } | undefined>(undefined);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [releaseModalDoc, setReleaseModalDoc] = useState<DeletionDocument | null>(null);
  const [isAiAuditOpen, setIsAiAuditOpen] = useState(false);
  const [noticeModalDoc, setNoticeModalDoc] = useState<DocumentWithSla | null>(null);

  // Dispatch / Transfer state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [docsToDispatch, setDocsToDispatch] = useState<DocumentWithSla[]>([]);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Multi-selection state
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RELEASED' | 'WARNING_55_60' | 'CRITICAL_BREACH' | 'DISPATCHED'>('ALL');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // In-app Confirm Dialog state (no window.confirm!)
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Compute SLA and Aging for each document
  const documentsWithSla: DocumentWithSla[] = useMemo(() => {
    const computed = documents.map((doc) => computeDocumentSla(doc));
    return sortDocuments(computed, sortDirection);
  }, [documents, sortDirection]);

  // Count sample records currently present
  const sampleRecordsCount = useMemo(() => {
    return documents.filter((d) => isSampleRecord(d)).length;
  }, [documents]);

  // Statistics calculation
  const stats: BranchStats = useMemo(() => {
    let released = 0;
    let pending = 0;
    let dispatched = 0;
    let warningCount = 0;
    let breachedCount = 0;
    let normalPending = 0;

    documentsWithSla.forEach((doc) => {
      if (doc.isReleased) {
        released++;
      } else if (doc.isDispatched) {
        dispatched++;
      } else {
        pending++;
        if (doc.slaStatus === 'CRITICAL_BREACH') {
          breachedCount++;
        } else if (doc.slaStatus === 'WARNING_55_60') {
          warningCount++;
        } else {
          normalPending++;
        }
      }
    });

    return {
      total: documentsWithSla.length,
      released,
      pending,
      dispatched,
      normalPending,
      warningCount,
      breachedCount,
    };
  }, [documentsWithSla]);

  // Filtered documents list for display
  const filteredDocs = useMemo(() => {
    return documentsWithSla.filter((doc) => {
      // Status filter
      if (statusFilter === 'PENDING' && (doc.isReleased || doc.isDispatched)) return false;
      if (statusFilter === 'RELEASED' && !doc.isReleased) return false;
      if (statusFilter === 'DISPATCHED' && !doc.isDispatched) return false;
      if (statusFilter === 'WARNING_55_60' && doc.slaStatus !== 'WARNING_55_60') return false;
      if (statusFilter === 'CRITICAL_BREACH' && doc.slaStatus !== 'CRITICAL_BREACH') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesContract = (doc.contractNo || '').toLowerCase().includes(q);
        const matchesClient = (doc.clientName || '').toLowerCase().includes(q);
        const matchesNic = (doc.clientNic || '').toLowerCase().includes(q);
        const matchesReg = (doc.regNo || '').toLowerCase().includes(q);
        const matchesNo = String(doc.no || '').toLowerCase().includes(q);
        const matchesLadOfficer = (doc.sentLadOfficer || '').toLowerCase().includes(q);
        const matchesBranchOfficer = (doc.receivedOfficerBranch || '').toLowerCase().includes(q);
        const matchesCollectedBy = (doc.documentsCollectedBy || '').toLowerCase().includes(q);
        const matchesDispatchedTo = (doc.dispatchedTo || '').toLowerCase().includes(q);
        const matchesRecvdDate = (doc.receivedBranchDate || '').toLowerCase().includes(q);
        const matchesCollectedDate = (doc.collectedDate || '').toLowerCase().includes(q);

        return (
          matchesContract ||
          matchesClient ||
          matchesNic ||
          matchesReg ||
          matchesNo ||
          matchesRecvdDate ||
          matchesCollectedDate ||
          matchesLadOfficer ||
          matchesBranchOfficer ||
          matchesCollectedBy ||
          matchesDispatchedTo
        );
      }

      return true;
    });
  }, [documentsWithSla, statusFilter, searchQuery]);

  // Warning & breached doc arrays for banners (only active pending documents)
  const warningDocs = useMemo(
    () => documentsWithSla.filter((d) => !d.isReleased && !d.isDispatched && d.slaStatus === 'WARNING_55_60'),
    [documentsWithSla]
  );
  const breachedDocs = useMemo(
    () => documentsWithSla.filter((d) => !d.isReleased && !d.isDispatched && d.slaStatus === 'CRITICAL_BREACH'),
    [documentsWithSla]
  );

  // Checkbox handlers
  const handleToggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedDocIds.size === filteredDocs.length && filteredDocs.length > 0) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocs.map((d) => d.id)));
    }
  };

  // Handlers for document actions
  const handleImportExcel = (newDocs: DeletionDocument[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setDocuments(newDocs);
      showToast(`Imported ${newDocs.length} records. Ledger replaced.`);
    } else {
      const existingMap = new Map(documents.map((d) => [(d.contractNo || '').trim().toUpperCase(), d]));
      newDocs.forEach((incoming) => {
        const key = (incoming.contractNo || '').trim().toUpperCase();
        if (key && existingMap.has(key)) {
          const old = existingMap.get(key)!;
          existingMap.set(key, {
            ...old,
            ...incoming,
            documentsCollectedBy: old.documentsCollectedBy || incoming.documentsCollectedBy,
            collectedDate: old.collectedDate || incoming.collectedDate,
            collectedSignature: old.collectedSignature || incoming.collectedSignature,
            handedOverDate: old.handedOverDate || incoming.handedOverDate,
            handedOverOfficerName: old.handedOverOfficerName || incoming.handedOverOfficerName,
            dispatchStatus: old.dispatchStatus || incoming.dispatchStatus,
            dispatchedTo: old.dispatchedTo || incoming.dispatchedTo,
            updatedAt: new Date().toISOString(),
          });
        } else {
          existingMap.set(key || incoming.id, incoming);
        }
      });
      const merged = Array.from(existingMap.values());
      setDocuments(merged);
      showToast(`Imported ${newDocs.length} records into ledger.`);
    }
  };

  const handleSaveNewDoc = (doc: DeletionDocument) => {
    setDocuments((prev) => [doc, ...prev]);
    showToast(`Added document #${doc.no} (${doc.contractNo}) to ledger.`);
  };

  const handleConfirmRelease = (updatedDoc: DeletionDocument, andPrintVoucher: boolean = false) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    );
    showToast(`Contract ${updatedDoc.contractNo} marked as Released.`);

    if (andPrintVoucher) {
      setSelectedVoucherDoc(updatedDoc);
      setCurrentView('PRINT_VOUCHER');
    }
  };

  // Single Delete with in-app confirm
  const handleDeleteDoc = (id: string, contractNo: string) => {
    setConfirmModalState({
      isOpen: true,
      title: `Delete Contract ${contractNo}?`,
      message: `Are you sure you want to permanently remove contract ${contractNo} from the branch ledger? This action cannot be undone.`,
      confirmText: 'Delete Record',
      variant: 'danger',
      onConfirm: () => {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        setSelectedDocIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        showToast(`Contract ${contractNo} deleted from ledger.`);
      },
    });
  };

  // Delete Sample Data with in-app confirm
  const handleDeleteSampleData = () => {
    if (sampleRecordsCount === 0) {
      showToast('No sample records currently exist in the ledger.');
      return;
    }

    setConfirmModalState({
      isOpen: true,
      title: 'Delete Sample Data (නියැදි දත්ත ඉවත් කිරීම)?',
      message: `Are you sure you want to remove all ${sampleRecordsCount} sample test records? Your actual branch records will remain safely intact in the ledger.`,
      confirmText: `Delete ${sampleRecordsCount} Sample Records`,
      variant: 'danger',
      onConfirm: () => {
        const remaining = documents.filter((d) => !isSampleRecord(d));
        setDocuments(remaining);
        setSelectedDocIds(new Set());
        showToast(`Successfully removed ${sampleRecordsCount} sample records.`);
      },
    });
  };

  // Clear All Data with in-app confirm
  const handleClearAllData = () => {
    setConfirmModalState({
      isOpen: true,
      title: 'Clear All Ledger Data (සියලු දත්ත හිස් කිරීම)?',
      message: 'This will completely erase all document records from the branch ledger. The ledger will be empty and ready for your fresh daily Excel import.',
      confirmText: 'Clear Entire Ledger',
      variant: 'danger',
      onConfirm: () => {
        setDocuments([]);
        setSelectedDocIds(new Set());
        showToast('Ledger has been cleared.');
      },
    });
  };

  // Delete Selected Documents with in-app confirm
  const handleDeleteSelected = () => {
    if (selectedDocIds.size === 0) return;
    const count = selectedDocIds.size;

    setConfirmModalState({
      isOpen: true,
      title: `Delete ${count} Selected Records?`,
      message: `Are you sure you want to permanently delete the ${count} selected records from the branch ledger?`,
      confirmText: `Delete ${count} Records`,
      variant: 'danger',
      onConfirm: () => {
        setDocuments((prev) => prev.filter((d) => !selectedDocIds.has(d.id)));
        setSelectedDocIds(new Set());
        showToast(`Successfully deleted ${count} selected records.`);
      },
    });
  };

  // Reset to default seed with in-app confirm
  const handleResetData = () => {
    setConfirmModalState({
      isOpen: true,
      title: 'Restore Sample Records (නියැදි දත්ත නැවත ලබාගැනීම)?',
      message: 'This will reload the initial Sri Lankan branch deletion sample test records into the ledger.',
      confirmText: 'Restore Samples',
      variant: 'primary',
      onConfirm: () => {
        setDocuments(INITIAL_RECORDS);
        setSelectedDocIds(new Set());
        showToast('Sample records restored.');
      },
    });
  };

  // Dispatch / Return Modal Triggers
  const handleTriggerSingleDispatch = (doc: DocumentWithSla) => {
    setDocsToDispatch([doc]);
    setIsDispatchModalOpen(true);
  };

  const handleTriggerBulkDispatch = () => {
    const selected = documentsWithSla.filter(
      (d) => selectedDocIds.has(d.id) && !d.isReleased && !d.isDispatched
    );
    if (selected.length === 0) {
      showToast('Please select at least one pending or overdue document to dispatch.');
      return;
    }
    setDocsToDispatch(selected);
    setIsDispatchModalOpen(true);
  };

  const handleConfirmDispatch = (
    updatedDispatchedDocs: DeletionDocument[],
    _meta: any,
    printMemo: boolean = false
  ) => {
    const map = new Map(updatedDispatchedDocs.map((d) => [d.id, d]));
    setDocuments((prev) => prev.map((d) => (map.has(d.id) ? map.get(d.id)! : d)));
    setSelectedDocIds(new Set());
    showToast(`Dispatched ${updatedDispatchedDocs.length} documents.`);

    if (printMemo) {
      setDispatchedMemoDocs(updatedDispatchedDocs);
      setCurrentView('PRINT_DISPATCH_MEMO');
    }
  };

  // Next available serial number
  const nextNo = useMemo(() => {
    const max = documents.reduce((acc, curr) => {
      const num = Number(curr.no);
      return !isNaN(num) && num > acc ? num : acc;
    }, 3920);
    return max + 1;
  }, [documents]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Top Bar Contract (1 row, 3 zones) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element Brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              DL
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentView('LEDGER');
              }}
              className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
            >
              Branch Deletion Document Portal
            </a>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setCurrentView('LEDGER')}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'LEDGER' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
              }`}
            >
              Main Ledger (ප්‍රධාන ලේඛනය)
            </button>
            <button
              onClick={() => setCurrentView('PRINT_A4')}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'PRINT_A4' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
              }`}
            >
              A4 Print Center (A4 මුද්‍රණය)
            </button>
            <button
              onClick={() => setCurrentView('PRINT_LABELS')}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentView === 'PRINT_LABELS' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              Label Print (1.5cm ලේබල් පටි)
            </button>
            <button
              onClick={() => setIsAiAuditOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-indigo-600 dark:text-indigo-400"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI SLA Audit
            </button>
            <button
              onClick={() => setStatusFilter('WARNING_55_60')}
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              55–60 Day Alerts ({stats.warningCount})
            </button>
            {stats.breachedCount > 0 && (
              <button
                onClick={() => setStatusFilter('CRITICAL_BREACH')}
                className="text-rose-600 hover:text-rose-700 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 font-bold"
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                Overdue &gt;60d ({stats.breachedCount})
              </button>
            )}
            {stats.dispatched > 0 && (
              <button
                onClick={() => setStatusFilter('DISPATCHED')}
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-slate-500"
              >
                <Send className="w-3.5 h-3.5 text-blue-500" />
                Dispatched ({stats.dispatched})
              </button>
            )}
          </nav>

          {/* Zone 3: Primary Action & Utilities */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Import Daily Excel
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              New Entry
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main View Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {currentView === 'PRINT_A4' ? (
          <A4PrintRegister
            documents={documentsWithSla}
            onBack={() => setCurrentView('LEDGER')}
            onOpenLabelPrint={(filter) => {
              setLabelPrintDateFilter(filter);
              setCurrentView('PRINT_LABELS');
            }}
          />
        ) : currentView === 'PRINT_LABELS' ? (
          <A4LabelPrint
            documents={documentsWithSla}
            onBack={() => setCurrentView('LEDGER')}
            initialDateFilter={labelPrintDateFilter}
          />
        ) : currentView === 'PRINT_VOUCHER' && selectedVoucherDoc ? (
          <A4ReleaseReceipt
            document={selectedVoucherDoc}
            onBack={() => {
              setSelectedVoucherDoc(null);
              setCurrentView('LEDGER');
            }}
          />
        ) : currentView === 'PRINT_DISPATCH_MEMO' && dispatchedMemoDocs.length > 0 ? (
          <A4DispatchMemo
            documents={dispatchedMemoDocs}
            onBack={() => {
              setDispatchedMemoDocs([]);
              setCurrentView('LEDGER');
            }}
          />
        ) : (
          <>
            {/* SLA Alert Banners (55-60 days and >60 days overdue) */}
            <SlaAlertBanner
              warningDocs={warningDocs}
              breachedDocs={breachedDocs}
              activeFilter={statusFilter}
              onSelectFilter={(f) => setStatusFilter(f as any)}
            />

            {/* Branch KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
              {/* Total Documents */}
              <div
                onClick={() => setStatusFilter('ALL')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-indigo-50/60 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                  <span>Total Ledger</span>
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.total}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">All branch records</p>
              </div>

              {/* Pending at Branch */}
              <div
                onClick={() => setStatusFilter('PENDING')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  statusFilter === 'PENDING'
                    ? 'bg-indigo-50/60 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                  <span>Pending at Branch</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                  {stats.pending}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Awaiting collection</p>
              </div>

              {/* Released / Completed */}
              <div
                onClick={() => setStatusFilter('RELEASED')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  statusFilter === 'RELEASED'
                    ? 'bg-emerald-50/60 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                  <span>Handed Over</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {stats.released}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Released with signature</p>
              </div>

              {/* 55 to 60 Days Warning */}
              <div
                onClick={() => setStatusFilter('WARNING_55_60')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  statusFilter === 'WARNING_55_60'
                    ? 'bg-amber-100/60 border-amber-400 dark:bg-amber-950/60 dark:border-amber-600 ring-2 ring-amber-500/30'
                    : stats.warningCount > 0
                    ? 'bg-amber-50/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-amber-800 dark:text-amber-400 text-xs mb-1">
                  <span className="font-semibold">55–60d Alert</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                  {stats.warningCount}
                </div>
                <p className="text-[10px] text-amber-700 dark:text-amber-400/80 mt-1">Can return to HO</p>
              </div>

              {/* >60 Days Overdue Critical Breach */}
              <div
                onClick={() => setStatusFilter('CRITICAL_BREACH')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  statusFilter === 'CRITICAL_BREACH'
                    ? 'bg-rose-100/70 border-rose-400 dark:bg-rose-950/60 dark:border-rose-600 ring-2 ring-rose-500/30'
                    : stats.breachedCount > 0
                    ? 'bg-rose-50/60 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-rose-800 dark:text-rose-400 text-xs mb-1">
                  <span className="font-semibold">&gt;60d Breach</span>
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-xl font-bold font-mono tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
                  {stats.breachedCount}
                </div>
                <p className="text-[10px] text-rose-700 dark:text-rose-400/80 mt-1">Action / Return now</p>
              </div>

              {/* Dispatched to HO or Branch */}
              <div
                onClick={() => setStatusFilter('DISPATCHED')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  statusFilter === 'DISPATCHED'
                    ? 'bg-blue-100/60 border-blue-400 dark:bg-blue-950/60 dark:border-blue-600 ring-2 ring-blue-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-blue-800 dark:text-blue-400 text-xs mb-1">
                  <span className="font-semibold">Dispatched / Sent</span>
                  <Send className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-400 tabular-nums">
                  {stats.dispatched}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">To HO or Branches</p>
              </div>
            </div>

            {/* Large Prominent Search & Control Center */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5 no-print">
              {/* Large Search Input */}
              <div className="relative flex items-center">
                <div className="absolute left-4 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 pointer-events-none">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Search anything: No / Serial (e.g. 3925), Contract No, Client Name, NIC, Reg No, or Officer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-16 pr-32 text-sm sm:text-base font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner"
                />
                <div className="absolute right-3 flex items-center gap-2">
                  {searchQuery && (
                    <>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {filteredDocs.length} match{filteredDocs.length === 1 ? '' : 'es'}
                      </span>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Clear Search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Status Segmented Buttons and Action Strip */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                {/* Status Segmented Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
                  {(
                    [
                      { id: 'ALL', label: 'All' },
                      { id: 'PENDING', label: 'Pending' },
                      { id: 'RELEASED', label: 'Released' },
                      { id: 'WARNING_55_60', label: '55-60d Alert' },
                      { id: 'CRITICAL_BREACH', label: '>60d Breached' },
                      { id: 'DISPATCHED', label: 'Dispatched / Returned' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setStatusFilter(t.id)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        statusFilter === t.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                  <button
                    onClick={() => setIsPrintPreviewOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-md transition-all whitespace-nowrap cursor-pointer"
                    title="Open pure A4 print preview for current table"
                  >
                    <Printer className="w-4 h-4" />
                    Print A4 Sheet / PDF
                  </button>
                  <button
                    onClick={() => setCurrentView('PRINT_A4')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                    title="Filter by date range and print official A4 sheet"
                  >
                    <Calendar className="w-4 h-4" />
                    Date Filter Register
                  </button>
                  <button
                    onClick={() => setCurrentView('PRINT_LABELS')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors whitespace-nowrap cursor-pointer"
                    title="Print 1.5cm File Label Strips (No, Contract, Client Name & NIC, Reg No, Return to MC Date)"
                  >
                    <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    Label Print (1.5cm පටි)
                  </button>
                  <button
                    onClick={() => exportToExcel(filteredDocs)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
                    title="Export currently filtered table to standard Excel"
                  >
                    <Download className="w-4 h-4" />
                    Export XLSX
                  </button>
                </div>
              </div>
            </div>

            {/* Batch Action Strip (when rows are selected) */}
            {selectedDocIds.size > 0 && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs no-print animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-950 dark:text-indigo-200">
                    {selectedDocIds.size} Document{selectedDocIds.size > 1 ? 's' : ''} Selected
                  </span>
                  <span className="text-slate-400">·</span>
                  <button
                    onClick={() => setSelectedDocIds(new Set())}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTriggerBulkDispatch}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Dispatch / Return to HO or Branch ({selectedDocIds.size})
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Selected ({selectedDocIds.size})
                  </button>
                </div>
              </div>
            )}

            {/* Document Ledger Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Deletion Ledger (ලේඛන ලැයිස්තුව)
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">
                    Showing {filteredDocs.length} of {documents.length} records
                  </span>
                </div>

                {/* Sample Data & Management Utility Buttons */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  {sampleRecordsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteSampleData}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                      title="Permanently delete all sample demo records"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Sample Data ({sampleRecordsCount})
                    </button>
                  )}
                  <button
                    onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                    className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 font-medium px-2 py-1"
                  >
                    <span>Sort: {sortDirection === 'desc' ? 'Newest' : 'Oldest'}</span>
                  </button>
                  <button
                    onClick={handleResetData}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 px-2 py-1"
                    title="Reload default sample records"
                  >
                    <RefreshCw className="w-3 h-3" /> Restore Samples
                  </button>
                  {documents.length > 0 && (
                    <button
                      onClick={handleClearAllData}
                      className="text-slate-400 hover:text-rose-600 px-2 py-1 font-medium"
                      title="Clear everything from ledger"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {filteredDocs.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No documents found matching criteria
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {documents.length === 0
                      ? 'The ledger is empty. Import your daily Excel file or add a new entry.'
                      : 'Try adjusting your search terms or clearing the status filter.'}
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    {documents.length === 0 ? (
                      <>
                        <button
                          onClick={() => setIsImportModalOpen(true)}
                          className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Import Daily Excel File
                        </button>
                        <button
                          onClick={handleResetData}
                          className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          Load Sample Data
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px]">
                      <tr>
                        <th className="px-3 py-3 w-8 text-center">
                          <button
                            type="button"
                            onClick={handleSelectAllVisible}
                            className="text-slate-400 hover:text-slate-600"
                            title="Select / Deselect all visible"
                          >
                            {selectedDocIds.size === filteredDocs.length && filteredDocs.length > 0 ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-3 py-3 font-semibold">No</th>
                        <th className="px-3 py-3 font-semibold">Contract No</th>
                        <th className="px-3 py-3 font-semibold">Client Name & NIC</th>
                        <th className="px-3 py-3 font-semibold">Reg No</th>
                        <th className="px-3 py-3 font-semibold">LAD Sent</th>
                        <th className="px-3 py-3 font-semibold">Branch Recvd</th>
                        <th className="px-3 py-3 font-semibold">Aging & SLA Status</th>
                        <th className="px-3 py-3 font-semibold">Collection / Dispatch Status</th>
                        <th className="px-3 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                      {filteredDocs.map((doc) => {
                        const isSelected = selectedDocIds.has(doc.id);
                        const isSample = isSampleRecord(doc);

                        return (
                          <tr
                            key={doc.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                              isSelected
                                ? 'bg-indigo-50/40 dark:bg-indigo-950/30'
                                : !doc.isReleased && !doc.isDispatched && doc.slaStatus === 'CRITICAL_BREACH'
                                ? 'bg-rose-50/20'
                                : !doc.isReleased && !doc.isDispatched && doc.slaStatus === 'WARNING_55_60'
                                ? 'bg-amber-50/20'
                                : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleSelectDoc(doc.id)}
                                className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            {/* No */}
                            <td className="px-3 py-3 font-bold text-slate-700 dark:text-slate-300 font-mono">
                              #{doc.no}
                              {isSample && (
                                <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 font-sans">
                                  sample
                                </span>
                              )}
                            </td>

                            {/* Contract No */}
                            <td className="px-3 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {doc.contractNo}
                            </td>

                            {/* Client Name & NIC */}
                            <td className="px-3 py-3">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {doc.clientName}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {doc.clientNic}
                              </div>
                            </td>

                            {/* Reg No */}
                            <td className="px-3 py-3 font-semibold font-mono text-slate-800 dark:text-slate-200">
                              {doc.regNo}
                            </td>

                            {/* LAD Sent Date & Officer */}
                            <td className="px-3 py-3 text-[11px] text-slate-600 dark:text-slate-400">
                              <div>{doc.ladSentDate || '—'}</div>
                              <div className="text-[10px] text-slate-400">Off: {doc.sentLadOfficer || '—'}</div>
                            </td>

                            {/* Branch Received Date & Officer */}
                            <td className="px-3 py-3 font-mono text-[11px]">
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {doc.receivedBranchDate}
                              </div>
                              <div className="text-[10px] text-slate-400">Branch: {doc.receivedOfficerBranch || '—'}</div>
                            </td>

                            {/* Aging & SLA Status */}
                            <td className="px-3 py-3">
                              {doc.isReleased ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Released ({doc.daysAtBranch}d)
                                </div>
                              ) : doc.isDispatched ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[11px] font-semibold">
                                  <Send className="w-3.5 h-3.5" /> Dispatched / Returned
                                </div>
                              ) : doc.slaStatus === 'CRITICAL_BREACH' ? (
                                <div className="inline-flex flex-col">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[11px]">
                                    <AlertOctagon className="w-3 h-3" /> {doc.daysAtBranch} Days (Breached!)
                                  </span>
                                  <span className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 font-medium">
                                    Over 60d cutoff — Return to HO
                                  </span>
                                </div>
                              ) : doc.slaStatus === 'WARNING_55_60' ? (
                                <div className="inline-flex flex-col">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[11px]">
                                    <AlertTriangle className="w-3 h-3" /> Day {doc.daysAtBranch} (55-60d Alert)
                                  </span>
                                  <span className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 font-semibold">
                                    {doc.daysRemainingTo60} days left until cutoff
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {doc.daysAtBranch} days in branch
                                </div>
                              )}
                            </td>

                            {/* Collection / Dispatch Details */}
                            <td className="px-3 py-3 text-[11px]">
                              {doc.isReleased ? (
                                <div>
                                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                                    {doc.documentsCollectedBy}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    Date: {doc.collectedDate} · Off: {doc.handedOverOfficerName?.split(' ')[0]}
                                  </p>
                                </div>
                              ) : doc.isDispatched ? (
                                <div>
                                  <p className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {doc.dispatchedTo}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    Sent: {doc.dispatchDate} · {doc.dispatchCourierRef}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Pending at Branch Safe</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Release Button (if not released and not dispatched) */}
                                {!doc.isReleased && !doc.isDispatched && (
                                  <button
                                    onClick={() => setReleaseModalDoc(doc)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                                    title="Release document to customer & record handover"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" /> Release
                                  </button>
                                )}

                                {/* Dispatch / Return to HO or Branch */}
                                {!doc.isReleased && !doc.isDispatched && (
                                  <button
                                    onClick={() => handleTriggerSingleDispatch(doc)}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
                                    title="Return document to Head Office (LAD) or Transfer to another branch"
                                  >
                                    <Send className="w-3 h-3" /> Return / Transfer
                                  </button>
                                )}

                                {/* Handover Voucher (if released) */}
                                {doc.isReleased && (
                                  <button
                                    onClick={() => {
                                      setSelectedVoucherDoc(doc);
                                      setCurrentView('PRINT_VOUCHER');
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                                    title="Print customer handover voucher"
                                  >
                                    <FileText className="w-3.5 h-3.5" /> Voucher
                                  </button>
                                )}

                                {/* Dispatch Memo (if dispatched) */}
                                {doc.isDispatched && (
                                  <button
                                    onClick={() => {
                                      setDispatchedMemoDocs([doc]);
                                      setCurrentView('PRINT_DISPATCH_MEMO');
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
                                    title="View & print dispatch memorandum"
                                  >
                                    <FileText className="w-3.5 h-3.5" /> Memo
                                  </button>
                                )}

                                {/* AI Client Notice */}
                                {!doc.isReleased && !doc.isDispatched && (
                                  <button
                                    onClick={() => setNoticeModalDoc(doc)}
                                    className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                                    title="Draft client collection notice (SMS / WhatsApp / Letter)"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Delete Single Document */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDoc(doc.id, doc.contractNo)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Delete document record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 dark:border-slate-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 no-print">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
        <div>
          <span>Branch Deletion Document Operations & Legal Custody System</span>
          <span className="mx-2">·</span>
          <span>16-Column Sri Lankan Finance Standard</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>SLA Rules: 55–60d Warning · &gt;60d Cutoff to Head Office</span>
          <span>·</span>
          <button
            onClick={() => setIsAiAuditOpen(true)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" /> AI SLA Audit
          </button>
        </div>
      </footer>

      {/* Modals */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportExcel}
        existingDocs={documents}
      />

      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewDoc}
        nextNo={nextNo}
      />

      <ReleaseDocumentModal
        document={releaseModalDoc}
        isOpen={Boolean(releaseModalDoc)}
        onClose={() => setReleaseModalDoc(null)}
        onConfirmRelease={handleConfirmRelease}
      />

      <DispatchTransferModal
        isOpen={isDispatchModalOpen}
        onClose={() => {
          setIsDispatchModalOpen(false);
          setDocsToDispatch([]);
        }}
        documentsToDispatch={docsToDispatch}
        onConfirmDispatch={handleConfirmDispatch}
      />

      <AiAuditModal
        isOpen={isAiAuditOpen}
        onClose={() => setIsAiAuditOpen(false)}
        stats={stats}
        documents={documentsWithSla}
      />

      <AiNoticeModal
        document={noticeModalDoc}
        isOpen={Boolean(noticeModalDoc)}
        onClose={() => setNoticeModalDoc(null)}
      />

      {/* In-app Confirmation Modal (Never blocked by iframe security!) */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        variant={confirmModalState.variant}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Pure Chart Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        documents={filteredDocs}
      />
    </div>
  );
}
