require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Import Routes
const db = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const suratRoutes = require("./routes/suratRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const beritaRoutes = require("./routes/beritaRoutes");
const agendaRoutes = require("./routes/agendaRoutes");
const statistikRoutes = require("./routes/statistikRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === KONFIGURASI STATIC FOLDER (Foto Profil, Berkas, & Berita) ===
// Cukup satu baris ini untuk semua folder di dalam 'uploads'
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
    },
  }),
);

// === KONFIGURASI WHATSAPP BOT ===
global.isWhatsappReady = false; // Guard agar controller tidak error saat bot belum login

const whatsapp = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    handleSIGINT: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

// Event: Tampilkan QR Code di terminal
whatsapp.on("qr", (qr) => {
  console.log("--------------------------------------------------");
  console.log("📱 SCAN QR CODE INI UNTUK CONNECT WHATSAPP DESA:");
  qrcode.generate(qr, { small: true });
  console.log("--------------------------------------------------");
});

// Event: WhatsApp Siap
whatsapp.on("ready", () => {
  console.log("✅ WhatsApp Bot Berhasil Terhubung dan Siap!");
  global.isWhatsappReady = true;
});

// Event: Terputus
whatsapp.on("disconnected", (reason) => {
  console.log("⚠️ WhatsApp Bot Terputus:", reason);
  global.isWhatsappReady = false;
  // Mencoba inisialisasi ulang
  whatsapp.initialize();
});

// Event: Gagal Login
whatsapp.on("auth_failure", (msg) => {
  console.error("❌ Gagal Autentikasi WhatsApp:", msg);
  global.isWhatsappReady = false;
});

// Jalankan WhatsApp
whatsapp.initialize();

// Simpan ke Global Object
global.whatsapp = whatsapp;

// === API ROUTES ===
app.use("/api/auth", authRoutes);
app.use("/api/surat", suratRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/berita", beritaRoutes);
app.use("/api/agenda", agendaRoutes);
app.use("/api/statistik", statistikRoutes);

// === DEFAULT ROUTE ===
app.get("/", (req, res) => {
  res.json({
    message: "✅ Server Backend Desa Sembung Berjalan!",
    whatsapp_status: global.isWhatsappReady
      ? "Connected"
      : "Disconnected/Connecting",
    time: new Date().toLocaleString("id-ID"),
  });
});

// === ERROR HANDLING MIDDLEWARE ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Terjadi kesalahan pada server!" });
});

// === JALANKAN SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📁 Folder Upload: ${path.join(__dirname, "uploads")}`);
});
