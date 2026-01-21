
const express = require('express');
const multer = require('multer');
const db = require('./database');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.body.userId || 'default';
        const dir = `./uploads/${userId}`;
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// API: Get User Media
app.get('/api/media/:userId', (req, res) => {
    const { userId } = req.params;
    db.all("SELECT * FROM media WHERE user_id = ?", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Upload Media
app.post('/api/upload', upload.single('file'), (req, res) => {
    const { userId, type } = req.body;
    const { filename, size, path: filePath } = req.file;
    
    db.run("INSERT INTO media (user_id, filename, type, size, path) VALUES (?, ?, ?, ?, ?)", 
        [userId, filename, type, size, filePath], 
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, filename, url: `http://${req.headers.host}/${filePath}` });
        }
    );
});

// API: Start Stream
app.post('/api/stream/start', (req, res) => {
    const { userId, rtmpUrl, mode, fileIds, loop } = req.body;

    // Fetch file paths from DB based on fileIds
    db.all(`SELECT path FROM media WHERE id IN (${fileIds.join(',')})`, (err, rows) => {
        if (err || rows.length === 0) return res.status(400).json({ error: "Files not found" });

        let command;
        if (mode === 'VIDEO') {
            const videoPath = rows[0].path;
            // FFMPEG command for Looping Video
            command = `ffmpeg -re ${loop ? '-stream_loop -1' : ''} -i ${videoPath} -c:v libx264 -preset veryfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 128k -f flv "${rtmpUrl}"`;
        } else {
            // Placeholder for Multi-Audio Audio Playlist
            const bgImage = rows.find(r => r.path.match(/\.(jpg|jpeg|png)$/i))?.path;
            const audioPath = rows.find(r => r.path.match(/\.(mp3|wav)$/i))?.path;
            command = `ffmpeg -re -loop 1 -i ${bgImage} -i ${audioPath} -c:v libx264 -preset veryfast -c:a aac -f flv "${rtmpUrl}"`;
        }

        const ffmpegProcess = spawn(command, { shell: true });
        
        // Log to DB or broadcast via Websocket in real app
        ffmpegProcess.stderr.on('data', (data) => {
            console.log(`FFMPEG [${userId}]: ${data}`);
        });

        db.run("INSERT INTO active_streams (user_id, pid, mode, status) VALUES (?, ?, ?, 'RUNNING')", 
            [userId, ffmpegProcess.pid, mode]);

        res.json({ status: "started", pid: ffmpegProcess.pid });
    });
});

// API: Stop Stream
app.post('/api/stream/stop', (req, res) => {
    const { userId } = req.body;
    db.get("SELECT pid FROM active_streams WHERE user_id = ? AND status = 'RUNNING'", [userId], (err, row) => {
        if (row) {
            try { process.kill(row.pid); } catch (e) {}
            db.run("DELETE FROM active_streams WHERE user_id = ?", [userId]);
            res.json({ status: "stopped" });
        } else {
            res.status(404).json({ error: "No active stream" });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CloudStream Engine running on port ${PORT}`));
