export interface DeletionDocument {
  id: string;
  no: number | string;
  contractNo: string;
  clientName: string;
  clientNic: string;
  regNo: string;
  ladSentDate: string;
  sentLadOfficer: string;
  receivedBranchDate: string;
  receivedOfficerBranch: string;
  documentsCollectedBy: string;
  documentsCollectedNic: string;
  collectedDate: string;
  collectedSignature: string;
  handedOverDate: string;
  handedOverOfficerName: string;
  handedOverOfficerSignature: string;
  remarks?: string;

  // Dispatch / Return / Transfer Tracking
  dispatchStatus?: 'AT_BRANCH' | 'DISPATCHED_HO' | 'TRANSFERRED_BRANCH';
  dispatchedTo?: string; // e.g. "Head Office (LAD)" or "Kandy Branch"
  dispatchDate?: string; // DD/MM/YYYY
  dispatchCourierRef?: string; // Tracking No / Waybill / Courier Name
  dispatchOfficer?: string; // Officer who authorized/dispatched
  dispatchReason?: string; // Why returned/transferred

  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SlaStatus = 'NORMAL' | 'WARNING_55_60' | 'CRITICAL_BREACH' | 'RELEASED' | 'DISPATCHED';

export interface DocumentWithSla extends DeletionDocument {
  daysAtBranch: number;
  daysRemainingTo60: number;
  slaStatus: SlaStatus;
  isReleased: boolean;
  isDispatched: boolean;
}

export interface BranchStats {
  total: number;
  released: number;
  pending: number;
  dispatched: number;
  normalPending: number;
  warningCount: number; // 55 to 60 days pending
  breachedCount: number; // >60 days pending
}
