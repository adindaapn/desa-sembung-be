const express = require("express");
const router = express.Router();
const statistikController = require("../controllers/statistikController");

// Jalur: http://localhost:5000/api/statistik
router.get("/", statistikController.getStatistik);
router.put("/:id", statistikController.updateStatistik);

module.exports = router;
