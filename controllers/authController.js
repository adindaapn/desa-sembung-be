const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage untuk foto profil
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "desa-sembung/profile",
    allowed_formats: ["jpg", "jpeg", "png"],
    resource_type: "image",
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2000000 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Hanya diperbolehkan mengunggah gambar (jpg/png)!"));
  },
}).single("foto");

exports.uploadFoto = upload;

// 1. REGISTER
exports.register = async (req, res) => {
  const { nik, nama_lengkap, username, email, password, no_hp } = req.body;

  if (!nik || !nama_lengkap || !username || !password) {
    return res.status(400).json({ message: "Mohon lengkapi data wajib!" });
  }

  const cekQuery =
    "SELECT * FROM tb_users WHERE nik = ? OR username = ? OR email = ?";
  db.query(cekQuery, [nik, username, email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      return res
        .status(400)
        .json({ message: "NIK, Username, atau Email sudah terdaftar!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = `
      INSERT INTO tb_users (nik, nama_lengkap, username, email, password, no_hp, role, foto) 
      VALUES (?, ?, ?, ?, ?, ?, 'warga', NULL)
    `;

    db.query(
      insertQuery,
      [nik, nama_lengkap, username, email, hashedPassword, no_hp],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res
          .status(201)
          .json({ message: "Registrasi Berhasil! Silakan Login." });
      },
    );
  });
};

// 2. LOGIN
exports.login = (req, res) => {
  const { identifier, password } = req.body;
  const query =
    "SELECT * FROM tb_users WHERE nik = ? OR username = ? OR email = ?";

  db.query(
    query,
    [identifier, identifier, identifier],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(404).json({ message: "User tidak ditemukan!" });

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: "Password salah!" });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      return res.status(200).json({
        message: "Login Berhasil",
        token: token,
        user: {
          id: user.id,
          nama_lengkap: user.nama_lengkap,
          username: user.username,
          nik: user.nik,
          role: user.role,
          foto: user.foto,
        },
      });
    },
  );
};

// 3. GET PROFILE
exports.getProfile = (req, res) => {
  const { id } = req.params;
  const query =
    "SELECT id, nama_lengkap, nik, username, email, no_hp, role, foto FROM tb_users WHERE id = ?";

  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(404).json({ message: "User tidak ditemukan" });
    res.json(results[0]);
  });
};

// 4. UPDATE PROFIL
exports.updateProfile = (req, res) => {
  upload(req, res, async (err) => {
    if (err)
      return res.status(500).json({ message: "Gagal upload: " + err.message });
    const { id } = req.params;
    const { nama_lengkap, username, email, no_hp, password } = req.body;

    if (!nama_lengkap || !email) {
      return res.status(400).json({
        message: "Data tidak lengkap! Nama lengkap dan email wajib diisi.",
      });
    }

    const getQuery = "SELECT * FROM tb_users WHERE id = ?";
    db.query(getQuery, [id], async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(404).json({ message: "User tidak ditemukan" });

      const oldData = results[0];
      let query =
        "UPDATE tb_users SET nama_lengkap = ?, username = ?, email = ?, no_hp = ?";
      let params = [
        nama_lengkap || oldData.nama_lengkap,
        username || oldData.username,
        email || oldData.email,
        no_hp || oldData.no_hp,
      ];

      if (req.file) {
        // Cloudinary menyimpan URL di file.path
        query += ", foto = ?";
        params.push(req.file.path);
      }

      if (password && password.trim() !== "" && password !== "undefined") {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ", password = ?";
        params.push(hashedPassword);
      }

      query += " WHERE id = ?";
      params.push(id);

      db.query(query, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          message: "Profil berhasil diperbarui!",
          foto: req.file ? req.file.path : oldData.foto,
          user: {
            nama_lengkap: params[0],
            username: params[1],
            email: params[2],
            no_hp: params[3],
          },
        });
      });
    });
  });
};

// 5. GET ALL WARGA
exports.getAllWarga = (req, res) => {
  const query =
    "SELECT id, nik, nama_lengkap, email, no_hp, username, foto FROM tb_users WHERE role = 'warga' ORDER BY nama_lengkap ASC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 6. KIRIM OTP KE WHATSAPP
exports.sendOTP = async (req, res) => {
  const { identifier } = req.body;
  const query =
    "SELECT id, no_hp, nama_lengkap FROM tb_users WHERE nik = ? OR email = ? OR username = ?";

  db.query(
    query,
    [identifier, identifier, identifier],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(404).json({ message: "Data tidak ditemukan!" });

      const user = results[0];
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 5 * 60000);

      db.query(
        "UPDATE tb_users SET reset_otp = ?, reset_otp_expiry = ? WHERE id = ?",
        [otp, expiry, user.id],
        (updateErr) => {
          if (updateErr)
            return res.status(500).json({ error: updateErr.message });

          if (global.whatsapp) {
            let nomorWa = user.no_hp.replace(/[^0-9]/g, "");
            if (nomorWa.startsWith("0")) nomorWa = "62" + nomorWa.slice(1);
            const pesan = `*KODE VERIFIKASI DESA SEMBUNG*\n\nHalo *${user.nama_lengkap}*,\n\nKode OTP Anda adalah: *${otp}*\n\nKode ini berlaku selama 5 menit.`;

            global.whatsapp
              .sendMessage(nomorWa + "@c.us", pesan)
              .then(() => res.json({ message: "Kode OTP telah dikirim." }))
              .catch(() =>
                res.status(500).json({ message: "Gagal mengirim WhatsApp." }),
              );
          } else {
            res
              .status(500)
              .json({ message: "Sistem WhatsApp sedang offline." });
          }
        },
      );
    },
  );
};

// 7. VERIFIKASI OTP & RESET PASSWORD
exports.resetPasswordWithOTP = async (req, res) => {
  const { identifier, otp, newPassword } = req.body;
  const query =
    "SELECT id, reset_otp, reset_otp_expiry FROM tb_users WHERE (nik = ? OR email = ? OR username = ?) AND reset_otp = ?";

  db.query(
    query,
    [identifier, identifier, identifier, otp],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0)
        return res.status(400).json({ message: "Kode OTP salah." });

      const user = results[0];
      if (new Date() > new Date(user.reset_otp_expiry))
        return res.status(400).json({ message: "Kode OTP kadaluarsa." });

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.query(
        "UPDATE tb_users SET password = ?, reset_otp = NULL, reset_otp_expiry = NULL WHERE id = ?",
        [hashedPassword, user.id],
        () => res.json({ message: "Password berhasil diperbarui!" }),
      );
    },
  );
};
