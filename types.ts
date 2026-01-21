
export enum StreamMode {
  VIDEO = 'VIDEO',
  AUDIO_PLAYLIST = 'AUDIO_PLAYLIST'
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  quotaGB: number;
  usedBytes: number;
  expiryDate: string;
  rtmpKeys: {
    youtube?: string;
    facebook?: string;
    twitch?: string;
    tiktok?: string;
  };
}

export interface MediaFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  size: number;
  url: string;
}

export interface LogEntry {
  timestamp: string;
  type: 'info' | 'error' | 'ffmpeg';
  message: string;
}
