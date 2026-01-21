
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./stream.db');

db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user',
        quota_gb INTEGER DEFAULT 1,
        expiry_date TEXT,
        rtmp_key TEXT
    )`);

    // Media Files Table
    db.run(`CREATE TABLE IF NOT EXISTS media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        filename TEXT,
        type TEXT,
        size INTEGER,
        path TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Streams Table (Running processes)
    db.run(`CREATE TABLE IF NOT EXISTS active_streams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        pid INTEGER,
        mode TEXT,
        status TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

module.exports = db;
