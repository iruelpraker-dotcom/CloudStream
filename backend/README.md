
# VPS Installation Guide (Ubuntu)

## 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

## 2. Install FFMPEG
```bash
sudo apt install ffmpeg -y
# Verify installation
ffmpeg -version
```

## 3. Install Node.js & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install pm2 -g
```

## 4. Setup Project
```bash
mkdir cloud-stream && cd cloud-stream
# Upload backend files here
npm install
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 5. Security Note
Make sure your RTMP keys are kept in the database and never exposed in the terminal logs publicly.
