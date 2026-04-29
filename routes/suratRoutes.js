const express = require("express");
const router = express.Router();
// Pastikan path ke suratController sudah benar
const suratController = require("../controllers/suratController");

// 1. Dropdown Jenis Surat
router.get("/jenis", suratController.getJenisSurat);

// 2. Submit Pengajuan (Warga)
router.post(
  "/ajukan",
  (req, res, next) => {
    suratController.uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return res.status(500).json({ error: err.message });
      }
      next();
    });
  },
  suratController.buatPengajuan,
);

// 3. Admin: Lihat List Surat Pending
router.get("/admin/list", suratController.getPengajuanAdmin);

// 4. Admin: Upload Surat Hasil
router.post(
  "/admin/upload-hasil/:id",
  suratController.uploadMiddleware,
  suratController.uploadSuratHasil,
);

// === PERBAIKAN DI SINI ===
// Baris router.put("/verifikasi", authController.verifikasiSurat) DIHAPUS
// karena menyebabkan error 'authController is not defined'
// =========================

// 5. Admin: Verifikasi/Update Status (Gunakan ID agar spesifik)
router.put("/admin/verifikasi/:id", suratController.verifikasiSurat);

// 6. Admin: Lihat Riwayat Filter
router.get("/admin/riwayat", suratController.getRiwayatAdmin);

// 7. Admin: Statistik Dashboard
router.get("/admin/all", suratController.getAllSurat);

// 8. User: Lihat Riwayat Sendiri
router.get("/user/:userId", suratController.getPengajuanByUser);

// 9. Detail Pengajuan (Untuk Warga & Admin)
router.get("/detail/:id", suratController.getDetailPengajuan);

module.exports = router;
