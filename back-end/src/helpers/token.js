const crypto = require('crypto');

/**
 * Helper untuk membuat token akses unik & aman untuk Penilaian tanpa login (Magic Link / Access Token)
 */

function generateAccessToken(prefix = 'token') {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `${prefix}_${randomBytes}`;
}

function generatePublicAssessmentUrl(baseUrl, token, role = 'mitra') {
  const cleanBase = String(baseUrl || '').replace(/\/+$/, '');
  return `${cleanBase}/assessment?role=${role}&token=${encodeURIComponent(token)}`;
}

module.exports = {
  generateAccessToken,
  generatePublicAssessmentUrl,
};
