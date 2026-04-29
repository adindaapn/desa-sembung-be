const express = require("express");
const router = express.Router();
const agendaController = require("../controllers/agendaController");

// Publik (Sudah ada)
router.get("/", agendaController.getAgenda);

// Admin (Tambahkan ini)
router.post("/add", agendaController.addAgenda);
router.put("/update/:id", agendaController.updateAgenda);
router.delete("/delete/:id", agendaController.deleteAgenda);

module.exports = router;
