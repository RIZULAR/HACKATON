const crypto = require('crypto');

function generateRandomToken(prefix = 'token', bytesLength = 32, encoding = 'hex') {
  const actualBytes = Math.max(bytesLength, 32);
  const randomBytes = crypto.randomBytes(actualBytes);
  const tokenString = encoding === 'base64url'
    ? randomBytes.toString('base64url')
    : randomBytes.toString('hex');

  return prefix ? `${prefix}_${tokenString}` : tokenString;
}

module.exports = {
  generateRandomToken,
};
