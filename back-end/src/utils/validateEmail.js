function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Alamat email tidak boleh kosong',
    };
  }

  const trimmed = email.trim();
  // Validasi format email RFC 5322 sederhana
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const isValidFormat = emailRegex.test(trimmed);

  if (!isValidFormat) {
    return {
      isValid: false,
      error: 'Format alamat email tidak valid',
    };
  }

  return {
    isValid: true,
    email: trimmed,
  };
}

module.exports = {
  validateEmail,
};
