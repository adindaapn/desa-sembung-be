const db = require("../config/database");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// 1. Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Konfigurasi Multer + Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "desa-sembung",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
    resource_type: "auto",
  },
});

const upload = multer({ storage: storage });

// 3. Ambil Jenis Surat
exports.getJenisSurat = (req, res) => {
  db.query("SELECT * FROM tb_jenis_surat", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 4. Buat Pengajuan (Warga)
exports.buatPengajuan = (req, res) => {
  const { user_id, jenis_surat_id, keperluan } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ message: "Wajib upload berkas!" });

  // Cloudinary menyimpan URL di file.path
  const fileUrl = file.path;
  const fileName = file.originalname;

  const queryPengajuan = `
    INSERT INTO tb_pengajuan_surat (user_id, jenis_surat_id, status, keterangan_admin, tgl_pengajuan) 
    VALUES (?, ?, 'pending', ?, NOW())
  `;

  db.query(
    queryPengajuan,
    [user_id, jenis_surat_id, keperluan],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const pengajuanId = result.insertId;

      const queryBerkas = `INSERT INTO tb_berkas_persyaratan (pengajuan_id, nama_file, path_file) VALUES (?, ?, ?)`;
      db.query(queryBerkas, [pengajuanId, fileName, fileUrl], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
          message: "Pengajuan berhasil dikirim!",
          pengajuan_id: pengajuanId,
        });
      });
    },
  );
};

// 5. Ambil Surat Pending (Admin)
exports.getPengajuanAdmin = (req, res) => {
  const query = `
    SELECT p.id, u.nama_lengkap, u.nik, j.nama_surat, p.tgl_pengajuan, p.status, p.file_hasil, b.nama_file, b.path_file  
    FROM tb_pengajuan_surat p
    JOIN tb_users u ON p.user_id = u.id
    JOIN tb_jenis_surat j ON p.jenis_surat_id = j.id
    LEFT JOIN tb_berkas_persyaratan b ON p.id = b.pengajuan_id
    WHERE p.status = 'pending'
    ORDER BY p.tgl_pengajuan DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 6. Upload File Hasil (Admin)
exports.uploadSuratHasil = (req, res) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) return res.status(400).json({ message: "File wajib diupload!" });

  // Cloudinary menyimpan URL di file.path
  const fileUrl = file.path;

  const queryUpdate =
    "UPDATE tb_pengajuan_surat SET file_hasil = ? WHERE id = ?";
  db.query(queryUpdate, [fileUrl, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      message: "File hasil berhasil diupload!",
      filename: fileUrl,
    });
  });
};

// 7. Verifikasi Surat (Admin) + Notifikasi WhatsApp
exports.verifikasiSurat = (req, res) => {
  const { id } = req.params;
  const { status, catatan } = req.body;

  const queryCek = `
    SELECT p.status, p.file_hasil, u.no_hp, u.nama_lengkap, j.nama_surat 
    FROM tb_pengajuan_surat p
    JOIN tb_users u ON p.user_id = u.id
    JOIN tb_jenis_surat j ON p.jenis_surat_id = j.id
    WHERE p.id = ?
  `;

  db.query(queryCek, [id], (err, results) => {
    if (err || results.length === 0)
      return res.status(500).json({ error: "Data tidak ditemukan" });

    const dataSurat = results[0];
    const statusLama = dataSurat.status;
    const fileHasil = dataSurat.file_hasil;

    if (status === "selesai" && !fileHasil) {
      return res.status(400).json({
        error: "Harap upload file hasil terlebih dahulu sebelum menyetujui!",
      });
    }

    db.query(
      "UPDATE tb_pengajuan_surat SET status = ?, catatan_penolakan = ? WHERE id = ?",
      [status, catatan || null, id],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });

        const queryLog = `INSERT INTO tb_log_status_pengajuan (pengajuan_id, status_sebelumnya, status_baru, waktu_perubahan) VALUES (?, ?, ?, NOW())`;
        db.query(queryLog, [id, statusLama, status], () => {
          if (global.whatsapp) {
            let nomorWa = dataSurat.no_hp.replace(/[^0-9]/g, "");
            if (nomorWa.startsWith("0")) {
              nomorWa = "62" + nomorWa.slice(1);
            }
            const chatId = nomorWa + "@c.us";

            const statusText =
              status === "selesai" ? "✅ DISETUJUI / SELESAI" : "❌ DITOLAK";
            const pesan =
              `*NOTIFIKASI LAYANAN DESA SEMBUNG*\n\n` +
              `Halo *${dataSurat.nama_lengkap}*,\n` +
              `Pengajuan surat *${dataSurat.nama_surat}* Anda telah selesai diproses.\n\n` +
              `Status: *${statusText}*\n` +
              `Catatan: ${catatan || "-"}\n\n` +
              `Silakan cek riwayat pengajuan di website untuk mengunduh berkas jika sudah tersedia.\n` +
              `_Pesan otomatis dari Sistem Informasi Desa_`;

            global.whatsapp
              .sendMessage(chatId, pesan)
              .then(() =>
                console.log(`WA Terkirim ke ${dataSurat.nama_lengkap}`),
              )
              .catch((err) => console.error("Gagal kirim WA:", err));
          }

          res.json({
            message: `Surat berhasil diubah menjadi ${status} dan notifikasi dikirim.`,
          });
        });
      },
    );
  });
};

// 8. Ambil Riwayat User (Warga)
exports.getPengajuanByUser = (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT p.id, j.nama_surat, p.tgl_pengajuan, p.status, p.file_hasil
    FROM tb_pengajuan_surat p
    JOIN tb_jenis_surat j ON p.jenis_surat_id = j.id
    WHERE p.user_id = ?
    ORDER BY p.tgl_pengajuan DESC
  `;
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 9. Ambil Riwayat Admin dengan Filter
exports.getRiwayatAdmin = (req, res) => {
  const { bulan, tahun, status } = req.query;
  let query = `
    SELECT p.id, u.nama_lengkap, u.nik, j.nama_surat, p.tgl_pengajuan, p.status, p.file_hasil, b.path_file 
    FROM tb_pengajuan_surat p
    JOIN tb_users u ON p.user_id = u.id
    JOIN tb_jenis_surat j ON p.jenis_surat_id = j.id
    LEFT JOIN tb_berkas_persyaratan b ON p.id = b.pengajuan_id
    WHERE p.status IN ('selesai', 'ditolak')
  `;

  const params = [];
  if (bulan && tahun) {
    query += " AND MONTH(p.tgl_pengajuan) = ? AND YEAR(p.tgl_pengajuan) = ?";
    params.push(bulan, tahun);
  }
  if (status && status !== "semua") {
    query += " AND p.status = ?";
    params.push(status);
  }
  query += " ORDER BY p.tgl_pengajuan DESC";

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 10. Dashboard Statistik (Admin)
exports.getAllSurat = (req, res) => {
  const query = `
    SELECT p.id, u.nama_lengkap, j.nama_surat, p.tgl_pengajuan, p.status 
    FROM tb_pengajuan_surat p
    JOIN tb_users u ON p.user_id = u.id
    JOIN tb_jenis_surat j ON p.jenis_surat_id = j.id
    ORDER BY p.tgl_pengajuan DESC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 11. Ambil Detail Pengajuan Spesifik
exports.getDetailPengajuan = (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      p.id, 
      u.nama_lengkap, 
      u.nik, 
      j.nama_surat, 
      p.tgl_pengajuan, 
      p.status, 
      p.file_hasil, 
      b.path_file,
      p.keterangan_admin AS keperluan,
      p.catatan_penolakan 
    FROM tb_pengajuan_surat p
    JOIN tb_users u ON p.user_id = u.id
    JOIN tb_jenis_surat j ON p.jenis_surat_id = j.id
    LEFT JOIN tb_berkas_persyaratan b ON p.id = b.pengajuan_id
    WHERE p.id = ?
  `;

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Pesan Error:", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0)
      return res.status(404).json({ message: "Data tidak ditemukan" });

    res.json(results[0]);
  });
};

exports.uploadMiddleware = upload.single("file");
