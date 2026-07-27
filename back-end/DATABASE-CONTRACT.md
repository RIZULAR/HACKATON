# DATABASE CONTRACT SPECIFICATION
**Sistem Konversi Nilai Magang Berbasis Outcome-Based Education (OBE)**

> 📌 **PENTING UNTUK TIM MIGRATION SQL**:  
> Dokumen ini berisi spesifikasi resmi skema tabel dan fungsi RPC Supabase PostgreSQL yang diasumsikan dan dipanggil oleh service layer backend.

---

## 🗄️ 1. SKEMA TABEL MINIMAL

1. **`profiles`**: Menampung data pengguna untuk 5 role (`mahasiswa`, `dpl`, `fakultas`, `kaprodi`, `mitra`).
2. **`internship_applications`**: Menampung pendaftaran magang mahasiswa.
3. **`internship_status_history`**: Audit trail riwayat perubahan status magang.
4. **`courses`**: Katalog Mata Kuliah OBE.
5. **`course_cpmks`**: Capaian Pembelajaran Mata Kuliah (CPMK).
6. **`conversion_proposals`**: Usulan rencana konversi mata kuliah magang.
7. **`proposal_activities`**: Rincian kegiatan mahasiswa dalam usulan konversi.
8. **`proposal_activity_courses`**: Alokasi jam kegiatan ke mata kuliah.
9. **`proposal_activity_cpmks`**: Pemetaan kegiatan ke CPMK.
10. **`conversion_claims`**: Klaim bukti & laporan hasil magang.
11. **`claim_activities`**: Kegiatan nyata yang diklaim mahasiswa.
12. **`claim_evidences`**: Tautan dokumen bukti kegiatan.
13. **`partner_assessments`**: Nilai dari Mitra Industri (bobot 60%).
14. **`dpl_reviews`**: Review dan nilai dari Dosen Pembimbing Lapangan (bobot 40%).
15. **`review_tokens`**: Token penilaian aman tanpa login (*magic link*).
16. **`final_conversion_results`**: Hasil perhitungan nilai & grade akhir (A/B/C/D/E).
17. **`notifications`**: Notifikasi sistem per-user.
18. **`audit_logs`**: Log aktivitas transaksi penting sistem.

---

## ⚡ 2. SPESIFIKASI RPC (STORED PROCEDURES)

### A. ALUR PENGAJUAN MAGANG

#### 1. `create_internship_draft`
- **Parameter**: `p_company_name` (TEXT), `p_position` (TEXT), `p_duration_months` (INT)
- **Contoh Return**: `{"id": "uuid-123", "status": "draft"}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `draft`
- **Possibility Error**: `UNAUTHORIZED`, `INVALID_PARAMETER`

#### 2. `update_internship_application`
- **Parameter**: `p_app_id` (UUID), `p_company_name` (TEXT), `p_position` (TEXT)
- **Contoh Return**: `{"id": "uuid-123", "status": "draft", "updated_at": "2026-07-27T10:00:00Z"}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `draft`
- **Possibility Error**: `APPLICATION_NOT_FOUND`, `NOT_DRAFT_STATUS`

#### 3. `submit_internship_application`
- **Parameter**: `p_app_id` (UUID)
- **Contoh Return**: `{"id": "uuid-123", "status": "submitted"}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `submitted`
- **Possibility Error**: `INCOMPLETE_DOCUMENTS`, `INVALID_STATUS_TRANSITION`

#### 4. `faculty_review_internship`
- **Parameter**: `p_app_id` (UUID), `p_decision` (TEXT: 'approve'|'revision'|'reject'), `p_note` (TEXT)
- **Contoh Return**: `{"id": "uuid-123", "status": "waiting_kaprodi"}`
- **Role**: `fakultas`
- **Status Dihasilkan**: `waiting_kaprodi` / `faculty_revision` / `rejected`
- **Possibility Error**: `UNAUTHORIZED_ROLE`, `APPLICATION_NOT_IN_SUBMITTED_STATE`

#### 5. `kaprodi_finalize_internship`
- **Parameter**: `p_app_id` (UUID), `p_decision` (TEXT: 'approve'|'revision'|'reject'), `p_assigned_dpl_id` (UUID), `p_note` (TEXT)
- **Contoh Return**: `{"id": "uuid-123", "status": "approved", "dpl_id": "uuid-dpl-456"}`
- **Role**: `kaprodi`
- **Status Dihasilkan**: `approved` / `kaprodi_revision` / `rejected`
- **Possibility Error**: `DPL_NOT_FOUND`, `APPLICATION_NOT_WAITING_KAPRODI`

#### 6. `get_my_internship_applications`
- **Parameter**: *tidak ada*
- **Contoh Return**: `[{"id": "uuid-123", "company_name": "PT Tech", "status": "approved"}]`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: *baca data (readonly)*
- **Possibility Error**: `UNAUTHENTICATED`

#### 7. `get_faculty_pending_applications`
- **Parameter**: *tidak ada*
- **Contoh Return**: `[{"id": "uuid-123", "student_name": "Budi", "status": "submitted"}]`
- **Role**: `fakultas`
- **Status Dihasilkan**: *baca data (readonly)*
- **Possibility Error**: `UNAUTHORIZED_ROLE`

#### 8. `get_kaprodi_pending_applications`
- **Parameter**: *tidak ada*
- **Contoh Return**: `[{"id": "uuid-123", "student_name": "Budi", "status": "waiting_kaprodi"}]`
- **Role**: `kaprodi`
- **Status Dihasilkan**: *baca data (readonly)*
- **Possibility Error**: `UNAUTHORIZED_ROLE`

#### 9. `get_assigned_dpl_internships`
- **Parameter**: *tidak ada*
- **Contoh Return**: `[{"id": "uuid-123", "student_name": "Budi", "company": "PT Tech"}]`
- **Role**: `dpl`
- **Status Dihasilkan**: *baca data (readonly)*
- **Possibility Error**: `UNAUTHORIZED_ROLE`

#### 10. `get_internship_detail`
- **Parameter**: `p_app_id` (UUID)
- **Contoh Return**: `{"id": "uuid-123", "company_name": "PT Tech", "status": "approved", "student": {...}}`
- **Role**: `mahasiswa`, `dpl`, `fakultas`, `kaprodi`
- **Status Dihasilkan**: *baca data (readonly)*
- **Possibility Error**: `NOT_FOUND`, `FORBIDDEN_ACCESS`

#### 11. `get_available_dpl_directory`
- **Parameter**: *tidak ada*
- **Contoh Return**: `[{"id": "uuid-dpl-1", "full_name": "Dr. Ahmad", "nip": "19850101"}]`
- **Role**: `kaprodi`, `fakultas`
- **Status Dihasilkan**: *baca data (readonly)*
- **Possibility Error**: `UNAUTHORIZED_ROLE`

---

### B. ALUR USULAN KONVERSI (PROPOSAL)

#### 12. `create_conversion_proposal`
- **Parameter**: `p_internship_id` (UUID)
- **Contoh Return**: `{"id": "prop-123", "status": "draft"}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `draft`
- **Possibility Error**: `INTERNSHIP_NOT_APPROVED`

#### 13. `add_proposal_activity`
- **Parameter**: `p_proposal_id` (UUID), `p_title` (TEXT), `p_total_hours` (INT)
- **Contoh Return**: `{"id": "act-1", "title": "Web Development", "total_hours": 120}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `draft`
- **Possibility Error**: `PROPOSAL_LOCKED`

#### 14. `allocate_activity_to_course`
- **Parameter**: `p_activity_id` (UUID), `p_course_id` (UUID), `p_allocated_hours` (INT)
- **Contoh Return**: `{"activity_id": "act-1", "course_id": "c-1", "allocated_hours": 80}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `draft`
- **Possibility Error**: `EXCEEDS_ACTIVITY_HOURS`

#### 15. `map_activity_to_cpmk`
- **Parameter**: `p_activity_id` (UUID), `p_cpmk_id` (UUID)
- **Contoh Return**: `{"activity_id": "act-1", "cpmk_id": "cpmk-1"}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `draft`
- **Possibility Error**: `CPMK_NOT_FOUND`

#### 16. `validate_proposal_hours`
- **Parameter**: `p_proposal_id` (UUID)
- **Contoh Return**: `{"proposal_id": "prop-123", "total_hours": 520, "is_valid": true}`
- **Role**: `mahasiswa`, `dpl`
- **Status Dihasilkan**: *baca data (readonly)*
- **Possibility Error**: `PROPOSAL_NOT_FOUND`

#### 17. `submit_conversion_proposal`
- **Parameter**: `p_proposal_id` (UUID)
- **Contoh Return**: `{"id": "prop-123", "status": "waiting_dpl"}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `waiting_dpl`
- **Possibility Error**: `HOURS_INSUFFICIENT`

#### 18. `review_proposal_by_dpl`
- **Parameter**: `p_proposal_id` (UUID), `p_decision` (TEXT: 'approve'|'revision'), `p_note` (TEXT)
- **Contoh Return**: `{"id": "prop-123", "status": "approved"}`
- **Role**: `dpl`
- **Status Dihasilkan**: `approved` / `revision`
- **Possibility Error**: `NOT_ASSIGNED_DPL`

---

### C. ALUR KLAIM BUKTI (CLAIM)

#### 19. `create_conversion_claim`
- **Parameter**: `p_proposal_id` (UUID)
- **Contoh Return**: `{"id": "claim-123", "status": "draft"}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `draft`
- **Possibility Error**: `PROPOSAL_NOT_APPROVED`

#### 20. `update_claim_activity`
- **Parameter**: `p_claim_activity_id` (UUID), `p_actual_hours` (INT), `p_description` (TEXT)
- **Contoh Return**: `{"id": "cact-1", "actual_hours": 100}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `draft`
- **Possibility Error**: `CLAIM_LOCKED`

#### 21. `add_claim_evidence`
- **Parameter**: `p_claim_activity_id` (UUID), `p_file_path` (TEXT)
- **Contoh Return**: `{"id": "ev-1", "file_path": "student-1/logbook.pdf"}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `draft`
- **Possibility Error**: `INVALID_FILE_PATH`

#### 22. `validate_claim_documents`
- **Parameter**: `p_claim_id` (UUID)
- **Contoh Return**: `{"claim_id": "claim-123", "is_valid": true, "documents": {"hasCertificate": true, "hasLogbook": true, "hasReport": true}}`
- **Role**: `mahasiswa`, `dpl`
- **Status Dihasilkan**: *baca data (readonly)*
- **Possibility Error**: `CLAIM_NOT_FOUND`

#### 23. `submit_conversion_claim`
- **Parameter**: `p_claim_id` (UUID)
- **Contoh Return**: `{"id": "claim-123", "status": "waiting_partner"}`
- **Role**: `mahasiswa`
- **Status Dihasilkan**: `waiting_partner`
- **Possibility Error**: `DOCUMENTS_INCOMPLETE`

---

### D. ALUR PENILAIAN & KONVERSI OBE

#### 24. `submit_partner_assessment`
- **Parameter**: `p_token` (TEXT), `p_scores` (JSONB), `p_evaluator_name` (TEXT)
- **Contoh Return**: `{"id": "pass-1", "status": "assessed"}`
- **Role**: `anon` (Mitra via Token)
- **Status Dihasilkan**: `waiting_dpl` (pada level klaim)
- **Possibility Error**: `TOKEN_EXPIRED`, `TOKEN_ALREADY_USED`

#### 25. `submit_dpl_claim_review`
- **Parameter**: `p_token` (TEXT) / User Session, `p_scores` (JSONB), `p_comments` (TEXT)
- **Contoh Return**: `{"id": "drev-1", "status": "reviewed"}`
- **Role**: `dpl` / `anon` (DPL via Token)
- **Status Dihasilkan**: `ready_finalization`
- **Possibility Error**: `INVALID_TOKEN`, `PARTNER_ASSESSMENT_MISSING`

#### 26. `calculate_final_score`
- **Parameter**: `p_partner_score` (NUMERIC), `p_dpl_score` (NUMERIC), `p_partner_weight` (NUMERIC), `p_dpl_weight` (NUMERIC)
- **Contoh Return**: `{"final_score": 86.0, "letter_grade": "A"}`
- **Role**: `system`, `dpl`, `kaprodi`
- **Status Dihasilkan**: *perhitungan matematis (readonly)*
- **Possibility Error**: `INVALID_NUMERIC_SCORE`

#### 27. `finalize_conversion_result`
- **Parameter**: `p_claim_id` (UUID)
- **Contoh Return**: `{"claim_id": "claim-123", "status": "finalized", "transcripts": [...]}`
- **Role**: `kaprodi`
- **Status Dihasilkan**: `finalized`
- **Possibility Error**: `REVIEWS_INCOMPLETE`, `UNAUTHORIZED_ROLE`

---

### E. AGREGASI DASHBOARD

#### 28. `get_faculty_dashboard_summary`
- **Parameter**: `p_filters` (JSONB)
- **Contoh Return**: `{"total": 45, "summary": {"submitted": 10, "approved": 35}}`
- **Role**: `fakultas`
- **Status Dihasilkan**: *baca statistik (readonly)*
- **Possibility Error**: `UNAUTHORIZED_ROLE`

#### 29. `get_kaprodi_dashboard_summary`
- **Parameter**: `p_filters` (JSONB)
- **Contoh Return**: `{"totalApplications": 45, "assignedDplCount": 40, "totalClaims": 30}`
- **Role**: `kaprodi`
- **Status Dihasilkan**: *baca statistik (readonly)*
- **Possibility Error**: `UNAUTHORIZED_ROLE`

#### 30. `get_partner_statistics`
- **Parameter**: `p_filters` (JSONB)
- **Contoh Return**: `{"totalAssessments": 30, "companySummary": {"PT Tech": 12}}`
- **Role**: `kaprodi`, `fakultas`
- **Status Dihasilkan**: *baca statistik (readonly)*
- **Possibility Error**: `UNAUTHORIZED_ROLE`

#### 31. `get_dpl_workload_statistics`
- **Parameter**: `p_filters` (JSONB)
- **Contoh Return**: `{"totalDpls": 10, "dplWorkloads": [{"dplId": "u-1", "fullName": "Dr. Ahmad", "assignedCount": 5}]}`
- **Role**: `kaprodi`, `fakultas`
- **Status Dihasilkan**: *baca statistik (readonly)*
- **Possibility Error**: `UNAUTHORIZED_ROLE`
