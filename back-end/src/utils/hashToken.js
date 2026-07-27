const crypto = require('crypto');

function hashToken(token) {
  if (!token || typeof token !== 'string') {
    return '';
  }

  // Hash SHA-256 tanpa pernah menyimpan atau mencetak token mentah ke log production
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  hashToken,
};
