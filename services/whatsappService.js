const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Inisialisasi WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./whatsapp-session", // Folder untuk menyimpan session
  }),
  puppeteer: {
    headless: true,
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

// Event: QR Code untuk scan (hanya pertama kali)
client.on("qr", (qr) => {
  console.log("\n========================================");
  console.log("📱 SCAN QR CODE INI DENGAN WHATSAPP ANDA:");
  console.log("========================================\n");

  // Tampilkan QR code di terminal
  qrcode.generate(qr, { small: true });

  console.log("\n========================================");
  console.log("✅ Buka WhatsApp di HP Anda");
  console.log("✅ Tap Menu (⋮) → Linked Devices");
  console.log('✅ Tap "Link a Device"');
  console.log("✅ Scan QR code di atas");
  console.log("========================================\n");
});

// Event: WhatsApp siap digunakan
client.on("ready", () => {
  console.log("\n🎉 WhatsApp Client berhasil terhubung!");
  console.log("✅ Siap mengirim notifikasi WhatsApp\n");
});

// Event: Koneksi terputus
client.on("disconnected", (reason) => {
  console.log("❌ WhatsApp Client terputus:", reason);
});

// Event: Autentikasi berhasil
client.on("authenticated", () => {
  console.log("✅ WhatsApp berhasil terautentikasi!");
});

// Event: Autentikasi gagal
client.on("auth_failure", (msg) => {
  console.error("❌ Autentikasi WhatsApp gagal:", msg);
});

// Fungsi untuk mengirim pesan WhatsApp
const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    // Format nomor: 628xxx (Indonesia)
    // Hapus karakter non-digit
    const cleanNumber = phoneNumber.replace(/\D/g, "");

    // Tambahkan 62 jika dimulai dengan 0
    let formattedNumber = cleanNumber;
    if (cleanNumber.startsWith("0")) {
      formattedNumber = "62" + cleanNumber.substring(1);
    }

    // Tambahkan @c.us untuk WhatsApp ID
    const chatId = formattedNumber + "@c.us";

    console.log(`📤 Mengirim pesan ke ${chatId}...`);

    // Kirim pesan
    await client.sendMessage(chatId, message);

    console.log(`✅ Pesan berhasil dikirim ke ${phoneNumber}`);
    return { success: true, message: "Pesan berhasil dikirim" };
  } catch (error) {
    console.error("❌ Error mengirim pesan WhatsApp:", error);
    return { success: false, error: error.message };
  }
};

// Fungsi untuk cek apakah nomor terdaftar di WhatsApp
const isRegisteredWhatsApp = async (phoneNumber) => {
  try {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    let formattedNumber = cleanNumber;
    if (cleanNumber.startsWith("0")) {
      formattedNumber = "62" + cleanNumber.substring(1);
    }

    const chatId = formattedNumber + "@c.us";
    const isRegistered = await client.isRegisteredUser(chatId);

    return isRegistered;
  } catch (error) {
    console.error("Error checking WhatsApp registration:", error);
    return false;
  }
};

// Fungsi untuk mengirim notifikasi pengajuan surat ke admin
const notifyAdminPengajuanSurat = async (adminPhone, data) => {
  const message = `
🔔 *NOTIFIKASI PENGAJUAN SURAT BARU*

Nama Pemohon: ${data.nama_pemohon}
Jenis Surat: ${data.jenis_surat}
Tanggal Pengajuan: ${data.tanggal_pengajuan}
Status: Menunggu Persetujuan

Silakan cek di Panel Admin untuk memproses pengajuan ini.

Terima kasih,
Sistem Desa Sembung
    `.trim();

  return await sendWhatsAppMessage(adminPhone, message);
};

// Fungsi untuk mengirim notifikasi persetujuan ke warga
const notifyWargaPersetujuanSurat = async (wargaPhone, data) => {
  const message = `
✅ *SURAT ANDA TELAH DISETUJUI*

Halo ${data.nama_pemohon},

Pengajuan surat Anda telah disetujui!

Jenis Surat: ${data.jenis_surat}
Nomor Surat: ${data.nomor_surat}
Tanggal Persetujuan: ${data.tanggal_persetujuan}

Anda dapat mengambil surat di kantor desa atau mendownload di website.

Terima kasih,
Pemerintah Desa Sembung
    `.trim();

  return await sendWhatsAppMessage(wargaPhone, message);
};

// Fungsi untuk mengirim notifikasi penolakan ke warga
const notifyWargaPenolakanSurat = async (wargaPhone, data) => {
  const message = `
❌ *PENGAJUAN SURAT DITOLAK*

Halo ${data.nama_pemohon},

Mohon maaf, pengajuan surat Anda tidak dapat diproses.

Jenis Surat: ${data.jenis_surat}
Alasan Penolakan: ${data.alasan_penolakan}
Tanggal Penolakan: ${data.tanggal_penolakan}

Silakan hubungi kantor desa untuk informasi lebih lanjut.

Terima kasih,
Pemerintah Desa Sembung
    `.trim();

  return await sendWhatsAppMessage(wargaPhone, message);
};

// Initialize WhatsApp Client
const initializeWhatsApp = () => {
  console.log("🔄 Menginisialisasi WhatsApp Client...");
  client.initialize();
};

module.exports = {
  client,
  initializeWhatsApp,
  sendWhatsAppMessage,
  isRegisteredWhatsApp,
  notifyAdminPengajuanSurat,
  notifyWargaPersetujuanSurat,
  notifyWargaPenolakanSurat,
};
