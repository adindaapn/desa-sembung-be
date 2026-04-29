const express = require("express");
const router = express.Router();
const whatsappController = require("../controllers/whatsappController");

// Test kirim pesan WhatsApp
// POST /api/whatsapp/send-test
router.post("/send-test", whatsappController.sendTestMessage);

// Cek status WhatsApp client
// GET /api/whatsapp/status
router.get("/status", whatsappController.getWhatsAppStatus);

// Cek apakah nomor terdaftar di WhatsApp
// POST /api/whatsapp/check-number
router.post("/check-number", whatsappController.checkWhatsAppNumber);

module.exports = router;
