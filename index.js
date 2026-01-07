const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb'); // Tambah ini
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Koneksi Database (SAMA SEPERTI REGISTER)
const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("microservice_db");
        console.log("DB Connected to Dashboard");
    } catch (error) {
        console.error("DB Error:", error);
    }
}
connectDB();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Akses Ditolak (Token Hilang)" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token Tidak Valid" });
        req.user = user;
        next();
    });
}

app.get('/', (req, res) => res.send('Dashboard KTP Service Ready'));

// API DASHBOARD (SEKARANG AMBIL DATA DARI DB)
app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        // Cari user di database berdasarkan email yang ada di token
        const usersCollection = db.collection('users');
        const userData = await usersCollection.findOne({ email: req.user.email });

        if (!userData) {
            return res.status(404).json({ error: "Data penduduk tidak ditemukan" });
        }

        // Kirim balik data KTP (Hapus password agar aman)
        const dataKTP = userData.ktp;
        
        res.json({
            message: "Akses Data Kependudukan Berhasil",
            data: dataKTP
        });

    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data database" });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Dashboard Service running on port ${PORT}`));

module.exports = app;