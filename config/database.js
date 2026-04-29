const mysql = require("mysql2");

// Buat koneksi ke database
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Default user XAMPP
  password: "", // Default password XAMPP (kosong)
  database: "desa sembung", // Nama database yang kita buat di awal
});

// Cek koneksi
db.connect((err) => {
  if (err) {
    console.error("❌ Gagal koneksi ke Database:", err.message);
  } else {
    console.log("✅ Berhasil koneksi ke Database MySQL!");
  }
});

module.exports = db;
