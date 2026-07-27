const { supabaseClient } = require('../lib/supabaseClient');

const BUCKET_NAME = 'internship-documents';

function response(data = null, error = null) {
  if (error) {
    return {
      data: null,
      error: {
        message: error.message || String(error),
        code: error.code || error.status || 'STORAGE_ERROR',
        details: error.details || null,
      },
    };
  }
  return { data, error: null };
}

async function uploadFileToStorage(folder, studentId, internshipId, file, defaultName) {
  try {
    if (!file) return response(null, new Error('File tidak boleh kosong'));

    const fileName = file.name || defaultName;
    const filePath = `${studentId}/${internshipId}/${folder}/${Date.now()}_${fileName}`;
    const fileBody = file.buffer || file.body || file;

    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBody, {
        contentType: file.type || file.mimeType || 'application/pdf',
        upsert: true,
      });

    if (error) return response(null, error);
    return response({ path: data?.path || filePath, fullPath: data?.fullPath || '' });
  } catch (err) {
    return response(null, err);
  }
}

async function uploadApplicationProposal(studentId, internshipId, file) {
  return uploadFileToStorage('proposals', studentId, internshipId, file, 'proposal.pdf');
}

async function uploadAcceptanceProof(studentId, internshipId, file) {
  return uploadFileToStorage('acceptance_proofs', studentId, internshipId, file, 'acceptance.pdf');
}

async function uploadLogbook(studentId, internshipId, file) {
  return uploadFileToStorage('logbooks', studentId, internshipId, file, 'logbook.pdf');
}

async function uploadInternshipReport(studentId, internshipId, file) {
  return uploadFileToStorage('reports', studentId, internshipId, file, 'report.pdf');
}

async function uploadCertificate(studentId, internshipId, file) {
  return uploadFileToStorage('certificates', studentId, internshipId, file, 'certificate.pdf');
}

async function uploadCpmkEvidence(studentId, internshipId, file) {
  return uploadFileToStorage('cpmk_evidences', studentId, internshipId, file, 'evidence.pdf');
}

async function getSignedDocumentUrl(path, expiresInSeconds = 3600) {
  try {
    if (!path) return response(null, new Error('Path dokumen wajib diisi'));

    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresInSeconds);

    if (error) return response(null, error);
    return response({ signedUrl: data?.signedUrl || '' });
  } catch (err) {
    return response(null, err);
  }
}

async function deleteDraftDocument(path) {
  try {
    if (!path) return response(null, new Error('Path dokumen wajib diisi'));

    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) return response(null, error);
    return response({ message: 'Dokumen berhasil dihapus', deleted: data });
  } catch (err) {
    return response(null, err);
  }
}

module.exports = {
  uploadApplicationProposal,
  uploadAcceptanceProof,
  uploadLogbook,
  uploadInternshipReport,
  uploadCertificate,
  uploadCpmkEvidence,
  getSignedDocumentUrl,
  deleteDraftDocument,
};
