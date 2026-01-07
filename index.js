const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- SATPAM PENGECEK TOKEN (Middleware) ---
const authenticateToken = (req, res, next) => {
    // 1. Ambil token dari Header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) {
        return res.status(401).json({ error: "Anda tidak punya akses! (Token hilang)" });
    }

    // 2. Cek keaslian token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token tidak valid atau sudah kadaluwarsa" });
        }
        req.user = user; // Simpan data user agar bisa dipakai di bawah
        next(); // Lanjut boleh masuk
    });
};

// --- ENDPOINT DASHBOARD (RAHASIA) ---
// Perhatikan ada 'authenticateToken' di tengahnya
app.get('/api/dashboard', authenticateToken, (req, res) => {
    res.json({ 
        message: "Selamat Datang di Dashboard Rahasia!", 
        data: {
            secretInfo: "Ini data rahasia yang hanya bisa dilihat user login.",
            userInfo: req.user // Menampilkan data user yang ada di dalam token
        } 
    });
});

app.get('/', (req, res) => res.send('Microservice Dashboard Ready'));

module.exports = app;

if (require.main === module) {
    app.listen(4000, () => console.log('Dashboard running on port 4000'));
}