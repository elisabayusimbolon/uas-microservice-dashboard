// FILE: uas-microservice-dashboard/index.js
// FUNCTION: PROMPT SERVICE (CRUD Data)

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- KONFIGURASI DATABASE KHUSUS DATA ---
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'microservice_prompts'; // Database 2 (BEDA DENGAN AUTH!)
const SECRET_KEY = process.env.SECRET_KEY || 'kunci_rahasia_negara';

// Middleware: Pengecekan Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Akses Ditolak (Butuh Token)" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: "Token Tidak Valid" });
        req.user = user;
        next();
    });
}

// --- CRUD 1: CREATE (Simpan Prompt) ---
app.post('/api/prompts', authenticateToken, async (req, res) => {
    const { title, content, category } = req.body;
    let client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        
        await db.collection('items').insertOne({
            userId: req.user.id, // ID Pemilik
            title,
            content,
            category,
            createdAt: new Date()
        });
        res.json({ message: "Prompt Berhasil Disimpan!" });
    } catch (e) { res.status(500).send(e.toString()); } finally { client.close(); }
});

// --- CRUD 2: READ (Baca Semua Prompt Saya) ---
app.get('/api/prompts', authenticateToken, async (req, res) => {
    let client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        
        // Hanya ambil data milik user yang sedang login
        const items = await db.collection('items')
            .find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .toArray();
            
        res.json(items);
    } catch (e) { res.status(500).send(e.toString()); } finally { client.close(); }
});

// --- CRUD 3: UPDATE (Edit Prompt) ---
app.put('/api/prompts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, content, category } = req.body;
    let client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        
        await db.collection('items').updateOne(
            { _id: new ObjectId(id), userId: req.user.id },
            { $set: { title, content, category } }
        );
        res.json({ message: "Prompt Berhasil Diupdate!" });
    } catch (e) { res.status(500).send(e.toString()); } finally { client.close(); }
});

// --- CRUD 4: DELETE (Hapus Prompt) ---
app.delete('/api/prompts/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    let client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        
        await db.collection('items').deleteOne({ 
            _id: new ObjectId(id), 
            userId: req.user.id 
        });
        res.json({ message: "Prompt Dihapus!" });
    } catch (e) { res.status(500).send(e.toString()); } finally { client.close(); }
});

app.get('/', (req, res) => res.send("PROMPT SERVICE IS RUNNING..."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Prompt Service running on port ${PORT}`));
module.exports = app;