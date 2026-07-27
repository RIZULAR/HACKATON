const { generateRandomToken } = require('../utils/generateRandomToken');
const { hashToken: hashTokenUtil } = require('../utils/hashToken');

function response(data = null, error = null) {
  if (error) {
    return {
      data: null,
      error: {
        message: error.message || String(error),
        code: error.code || error.status || 'TOKEN_ERROR',
        details: error.details || null,
      },
    };
  }
  return { data, error: null };
}

function createSecureToken(prefix = 'token') {
  try {
    const token = generateRandomToken(prefix);
    return response({ token });
  } catch (err) {
    return response(null, err);
  }
}

function hashToken(token) {
  try {
    if (!token) return response(null, new Error('Token wajib diisi'));
    const hashed = hashTokenUtil(token);
    return response({ hashed });
  } catch (err) {
    return response(null, err);
  }
}

function validateTokenFormat(token) {
  try {
    if (!token || typeof token !== 'string') return response({ isValid: false });
    const isFormatValid = /^[a-zA-Z0-9_-]{16,128}$/.test(token);
    return response({ isValid: isFormatValid });
  } catch (err) {
    return response(null, err);
  }
}

function createReviewUrl(type = 'mitra', token = '', baseUrl = 'http://localhost:5173') {
  try {
    if (!token) return response(null, new Error('Token wajib diisi'));
    const cleanBase = String(baseUrl).replace(/\/+$/, '');
    const url = `${cleanBase}/assessment?type=${encodeURIComponent(type)}&token=${encodeURIComponent(token)}`;
    return response({ url });
  } catch (err) {
    return response(null, err);
  }
}

module.exports = {
  createSecureToken,
  hashToken,
  validateTokenFormat,
  createReviewUrl,
};
