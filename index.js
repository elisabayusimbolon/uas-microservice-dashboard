const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ENVIRONMENT VARIABLES
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'kependudukan_db';
const SECRET_KEY = process.env.SECRET_KEY || 'rahasia_negara_top_secret'; // Harus SAMA dengan Login

if (!MONGODB_URI) console.error("⚠️ MONGODB_URI belum di-set di Vercel Dashboard!");

// FUNGSI PERIKSA TOKEN (Middleware)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) return res.status(401).json({ error: "Akses Ditolak: Token tidak ada" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token tidak valid atau kadaluwarsa" });
        req.user = user; // Simpan data user dari token
        next();
    });
}

app.get('/', (req, res) => res.send('Microservice Dashboard: ONLINE'));

// API UTAMA: AMBIL DATA PROFIL
app.get('/api/dashboard', authenticateToken, async (req, res) => {
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        
        // Cari user berdasarkan ID yang ada di dalam Token
        // Kita exclude password agar tidak ikut terkirim (projection)
        const userProfile = await db.collection('users').findOne(
            { _id: new ObjectId(req.user.id) },
            { projection: { password: 0 } } 
        );

        if (!userProfile) {
            return res.status(404).json({ error: "Data penduduk tidak ditemukan" });
        }

        // Kirim data ke Frontend
        res.json({ 
            status: "sukses", 
            data: userProfile 
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ error: "Gagal mengambil data dari database" });
    } finally {
        if (client) client.close();
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server Dashboard jalan di port ${PORT}`));

module.exports = app;