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
// Konfigurasi CORS yang lebih luas untuk menghindari blokir browser
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

// === KONFIGURASI WHATSAPP BOT ===
global.isWhatsappReady = false;

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

// Event: QR Code
whatsapp.on("qr", (qr) => {
  console.log("📱 SCAN QR CODE DI TERMINAL RAILWAY:");
  qrcode.generate(qr, { small: true });
});

// Event: Ready
whatsapp.on("ready", () => {
  console.log("✅ WhatsApp Bot Terhubung!");
  global.isWhatsappReady = true;
});

// Event: Disconnected
whatsapp.on("disconnected", (reason) => {
  console.log("⚠️ WhatsApp Bot Terputus:", reason);
  global.isWhatsappReady = false;
  try {
    // whatsapp.initialize();
  } catch (error) {
    console.error("Gagal restart WhatsApp:", error);
  }
});

// Jalankan WhatsApp dengan Catch agar server tidak crash di hosting
whatsapp.initialize().catch((err) => {
  console.error(
    "❌ WhatsApp Error (Kemungkinan masalah Puppeteer di Hosting):",
    err.message,
  );
  console.log("ℹ️ Server tetap berjalan untuk API & Database.");
});

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
    whatsapp_status: global.isWhatsappReady ? "Connected" : "Disconnected",
    database: "Connected to TiDB Cloud",
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
