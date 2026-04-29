require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
// WhatsApp ditutup sementara agar RAM tidak penuh dan Database lancar
// const { Client, LocalAuth } = require("whatsapp-web.js");
// const qrcode = require("qrcode-terminal");

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
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === KONFIGURASI STATIC FOLDER ===
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
    },
  }),
);

// === KONFIGURASI WHATSAPP BOT (DIMATIKAN UNTUK RAILWAY) ===
global.isWhatsappReady = false;
/*
const whatsapp = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    handleSIGINT: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--no-zygote",
    ],
  },
});

whatsapp.on("qr", (qr) => {
  console.log("📱 SCAN QR CODE DI TERMINAL RAILWAY:");
  qrcode.generate(qr, { small: true });
});

whatsapp.on("ready", () => {
  console.log("✅ WhatsApp Bot Terhubung!");
  global.isWhatsappReady = true;
});

whatsapp.initialize().catch((err) => {
  console.error("❌ WhatsApp Error:", err.message);
});

global.whatsapp = whatsapp;
*/

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
    whatsapp_status: "Disabled for Stability",
    database: "Connecting...",
    time: new Date().toLocaleString("id-ID"),
  });
});

// === ERROR HANDLING ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Terjadi kesalahan pada server!",
    error: err.message,
  });
});

// === JALANKAN SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di Port: ${PORT}`);
});
