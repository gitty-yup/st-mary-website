// Browser-safe (no database imports).
export type RecordStatus = 'submitted' | 'needs_info' | 'approved' | 'issued' | 'declined' | 'voided';

export const STATUS_LABELS: Record<RecordStatus, string> = {
  submitted: 'New submission',
  needs_info: 'Needs information',
  approved: 'Ready to issue',
  issued: 'Issued',
  declined: 'Declined',
  voided: 'Voided',
};
