const db = require("../config/database");

// Ambil semua data statistik
exports.getStatistik = (req, res) => {
  db.query("SELECT * FROM tb_statistik", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Update data statistik
exports.updateStatistik = (req, res) => {
  const { id } = req.params;
  const { value } = req.body;
  db.query(
    "UPDATE tb_statistik SET value = ? WHERE id = ?",
    [value, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Statistik berhasil diperbarui!" });
    },
  );
};
