const CLAIM_STATUSES = Object.freeze({
  DRAFT: 'draft',
  WAITING_PARTNER: 'waiting_partner',
  WAITING_DPL: 'waiting_dpl',
  REVISION: 'revision',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  READY_FINALIZATION: 'ready_finalization',
  FINALIZED: 'finalized',
});

module.exports = {
  CLAIM_STATUSES,
};
