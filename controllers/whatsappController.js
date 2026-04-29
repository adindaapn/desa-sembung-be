const whatsappService = require("../services/whatsappService");

// Test kirim pesan WhatsApp
exports.sendTestMessage = async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: "Phone number dan message wajib diisi",
      });
    }

    const result = await whatsappService.sendWhatsAppMessage(
      phoneNumber,
      message,
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "Pesan WhatsApp berhasil dikirim",
        data: result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Gagal mengirim pesan WhatsApp",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in sendTestMessage:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Cek status WhatsApp client
exports.getWhatsAppStatus = async (req, res) => {
  try {
    const state = await whatsappService.client.getState();

    return res.status(200).json({
      success: true,
      status: state,
      message:
        state === "CONNECTED"
          ? "WhatsApp terhubung"
          : "WhatsApp tidak terhubung",
    });
  } catch (error) {
    console.error("Error getting WhatsApp status:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mendapatkan status WhatsApp",
      error: error.message,
    });
  }
};

// Cek apakah nomor terdaftar di WhatsApp
exports.checkWhatsAppNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number wajib diisi",
      });
    }

    const isRegistered =
      await whatsappService.isRegisteredWhatsApp(phoneNumber);

    return res.status(200).json({
      success: true,
      phoneNumber: phoneNumber,
      isRegistered: isRegistered,
      message: isRegistered
        ? "Nomor terdaftar di WhatsApp"
        : "Nomor tidak terdaftar di WhatsApp",
    });
  } catch (error) {
    console.error("Error checking WhatsApp number:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengecek nomor WhatsApp",
      error: error.message,
    });
  }
};

module.exports = exports;
