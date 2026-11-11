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

export type StatusAction = 'approve' | 'needs_info' | 'decline' | 'reopen' | 'void';

/** Which statuses each review action applies to, and where it leads. */
export const STATUS_ACTIONS: Record<StatusAction, { from: RecordStatus[]; to?: RecordStatus }> = {
  approve: { from: ['submitted', 'needs_info'], to: 'approved' },
  needs_info: { from: ['submitted', 'approved'], to: 'needs_info' },
  decline: { from: ['submitted', 'needs_info', 'approved'], to: 'declined' },
  // No `to`: back to "New submission" (online) or "Ready to issue" (office-entered).
  reopen: { from: ['declined'] },
  void: { from: ['issued'], to: 'voided' },
};

export const DECLINE_REASONS: Record<string, string> = {
  duplicate: 'Duplicate submission',
  spam: 'Spam or test submission',
  not_proceeding: 'Not going ahead',
  other: 'Other',
};
