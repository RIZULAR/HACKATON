const ROLES = Object.freeze({
  MAHASISWA: 'mahasiswa',
  DPL: 'dpl',
  FAKULTAS: 'fakultas',
  KAPRODI: 'kaprodi',
  MITRA: 'mitra',
});

const ALL_ROLES = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ALL_ROLES,
};
