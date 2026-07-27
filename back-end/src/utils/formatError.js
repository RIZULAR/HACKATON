function formatError(error, defaultMessage = 'Terjadi kesalahan pada sistem') {
  let message = defaultMessage;
  let code = 'INTERNAL_ERROR';

  if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    // Saring pesan error SQL / database agar tidak membocorkan struktur sensitif ke client
    const rawMsg = error.message || '';

    if (rawMsg.includes('violates foreign key constraint')) {
      message = 'Referensi data yang dimasukkan tidak ditemukan.';
      code = 'FOREIGN_KEY_VIOLATION';
    } else if (rawMsg.includes('duplicate key value violates unique constraint')) {
      message = 'Data sudah terdaftar dalam sistem.';
      code = 'DUPLICATE_KEY_VIOLATION';
    } else if (rawMsg.includes('permission denied') || rawMsg.includes('row-level security')) {
      message = 'Anda tidak memiliki hak akses untuk operasi ini.';
      code = 'PERMISSION_DENIED';
    } else {
      // Hilangkan potensial stack trace atau SQL query sensitif
      message = rawMsg.replace(/PG::[A-Za-z0-9_]+/g, '').replace(/relation "[^"]+"/g, 'tabel data').trim() || defaultMessage;
      code = error.code || error.status || 'APP_ERROR';
    }
  }

  // Format keluaran terstruktur tanpa membocorkan stack trace internal atau secret key
  return {
    success: false,
    error: {
      message,
      code,
    },
  };
}

module.exports = {
  formatError,
};
