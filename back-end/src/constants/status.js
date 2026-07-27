const INTERNSHIP_STATUS = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  VERIFIED_FAKULTAS: 'verified_fakultas',
  APPROVED_KAPRODI: 'approved_kaprodi',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
});

const CONVERSION_STATUS = Object.freeze({
  USULAN_DRAFT: 'usulan_draft',
  USULAN_SUBMITTED: 'usulan_submitted',
  USULAN_APPROVED: 'usulan_approved',
  KLAIM_SUBMITTED: 'klaim_submitted',
  ASSESSED_MITRA: 'assessed_mitra',
  REVIEWED_DPL: 'reviewed_dpl',
  FINALIZED: 'finalized',
});

const ASSESSMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  SUBMITTED: 'submitted',
});

module.exports = {
  INTERNSHIP_STATUS,
  CONVERSION_STATUS,
  ASSESSMENT_STATUS,
};
