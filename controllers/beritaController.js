const db = require("../config/database");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage untuk gambar berita
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "desa-sembung/berita",
    allowed_formats: ["jpg", "jpeg", "png"],
    resource_type: "image",
  },
});

exports.uploadBeritaMiddleware = multer({ storage }).single("gambar");

// 1. AMBIL SEMUA BERITA (PUBLIK)
exports.getBerita = (req, res) => {
  db.query(
    "SELECT * FROM tb_berita ORDER BY tgl_posting DESC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
};

// 2. AMBIL DETAIL SATU BERITA (PUBLIK)
exports.getBeritaById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM tb_berita WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(404).json({ message: "Berita tidak ditemukan" });
    res.json(results[0]);
  });
};

// 3. TAMBAH BERITA BARU (ADMIN)
exports.createBerita = (req, res) => {
  const { judul, isi, kategori } = req.body;
  // Cloudinary menyimpan URL di file.path
  const gambar = req.file ? req.file.path : null;

  if (!judul || !isi || !kategori) {
    return res
      .status(400)
      .json({ message: "Judul, isi, dan kategori wajib diisi!" });
  }

  const query =
    "INSERT INTO tb_berita (judul, isi, kategori, gambar) VALUES (?, ?, ?, ?)";
  db.query(query, [judul, isi, kategori, gambar], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      message: "✅ Berita berhasil diterbitkan!",
      id: result.insertId,
    });
  });
};

// 4. UPDATE BERITA (ADMIN)
exports.updateBerita = (req, res) => {
  const { id } = req.params;
  const { judul, isi, kategori } = req.body;

  if (!judul || !isi || !kategori) {
    return res
      .status(400)
      .json({ message: "Judul, isi, dan kategori wajib diisi!" });
  }

  if (req.file) {
    // Cloudinary menyimpan URL di file.path
    const gambar = req.file.path;
    const query =
      "UPDATE tb_berita SET judul = ?, isi = ?, kategori = ?, gambar = ? WHERE id = ?";
    db.query(query, [judul, isi, kategori, gambar, id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Berita berhasil diperbarui!" });
    });
  } else {
    const query =
      "UPDATE tb_berita SET judul = ?, isi = ?, kategori = ? WHERE id = ?";
    db.query(query, [judul, isi, kategori, id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Berita berhasil diperbarui!" });
    });
  }
};

// 5. HAPUS BERITA (ADMIN)
exports.deleteBerita = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM tb_berita WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Berita berhasil dihapus!" });
  });
};
