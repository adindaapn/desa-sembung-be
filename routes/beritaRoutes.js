const express = require("express");
const router = express.Router();
const beritaController = require("../controllers/beritaController");
const agendaController = require("../controllers/agendaController");

// 1. Ambil semua berita (Publik)
router.get("/", beritaController.getBerita);

// 2. Ambil detail satu berita (Publik)
router.get("/:id", beritaController.getBeritaById);

// 3. Tambah Berita Baru (Admin)
router.post(
  "/add",
  beritaController.uploadBeritaMiddleware,
  beritaController.createBerita,
);

// 4. Update Berita (Admin)
router.put(
  "/update/:id",
  beritaController.uploadBeritaMiddleware,
  beritaController.updateBerita,
);

// 5. Hapus Berita (Admin)
router.delete("/delete/:id", beritaController.deleteBerita);

// Rute Agenda
router.get("/agenda/all", agendaController.getAgenda);

module.exports = router;
