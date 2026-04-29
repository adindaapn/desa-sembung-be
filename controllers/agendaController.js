const db = require("../config/database");

// 1. Ambil Agenda untuk Publik (Hanya yang belum lewat)
exports.getAgenda = (req, res) => {
  db.query(
    "SELECT * FROM tb_agenda WHERE tanggal >= CURDATE() ORDER BY tanggal ASC",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    },
  );
};

// 2. Ambil Semua Agenda untuk Admin (Termasuk yang sudah lewat)
exports.getAllAgendaAdmin = (req, res) => {
  db.query("SELECT * FROM tb_agenda ORDER BY tanggal DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// 3. Tambah Agenda Baru (Admin)
exports.addAgenda = (req, res) => {
  const { nama_kegiatan, tanggal, waktu, lokasi, keterangan } = req.body;
  const query =
    "INSERT INTO tb_agenda (nama_kegiatan, tanggal, waktu, lokasi, keterangan) VALUES (?, ?, ?, ?, ?)";

  db.query(
    query,
    [nama_kegiatan, tanggal, waktu, lokasi, keterangan],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        message: "✅ Agenda berhasil ditambahkan!",
        id: result.insertId,
      });
    },
  );
};

// 4. Update Agenda (Admin)
exports.updateAgenda = (req, res) => {
  const { id } = req.params;
  const { nama_kegiatan, tanggal, waktu, lokasi, keterangan } = req.body;
  const query =
    "UPDATE tb_agenda SET nama_kegiatan=?, tanggal=?, waktu=?, lokasi=?, keterangan=? WHERE id=?";

  db.query(
    query,
    [nama_kegiatan, tanggal, waktu, lokasi, keterangan, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Agenda berhasil diperbarui!" });
    },
  );
};

// 5. Hapus Agenda (Admin)
exports.deleteAgenda = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM tb_agenda WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Agenda berhasil dihapus!" });
  });
};
