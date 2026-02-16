/**
 * Express backend for YouTube download API.
 * Same API as Next.js /api/download: info, prepare, prepare_poster, delete_file, download (stream).
 * Run: node server.js (default port 4000). Frontend can proxy /api/download to this server or use Next.js route.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ytBackend = require('./app/api/download/yt-backend.js');

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const downloadsDir = path.join(process.cwd(), 'downloads');
const finalDir = path.join(downloadsDir, 'final');
const tempDir = path.join(downloadsDir, 'temp');

function ensureDirs() {
  [downloadsDir, tempDir, finalDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function extractVideoId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube-nocookie\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#/]+)/);
  return m ? m[1] : null;
}

// POST /api/download — same body/actions as Next.js route
app.post('/api/download', async (req, res) => {
  ensureDirs();
  const { url, quality, action, file_path, fileName, original_filename, file_name, poster_quality } = req.body || {};

  if (!url && action !== 'download' && action !== 'delete_file') {
    return res.status(400).json({ success: false, message: 'URL is required' });
  }

  if (url && !extractVideoId(ytBackend.normalizeYoutubeUrl(url))) {
    return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
  }

  const normalizedUrl = url ? ytBackend.normalizeYoutubeUrl(url) : '';

  // preview / info
  if (action === 'preview' || action === 'info') {
    try {
      const info = await ytBackend.getInfo(normalizedUrl);
      if (info.success) {
        return res.json({ success: true, metadata: info });
      }
      return res.json({
        success: false,
        message: info.error || 'Unable to load video information',
        metadata: {},
      });
    } catch (e) {
      return res.json({
        success: false,
        message: 'Unable to load video information',
        metadata: {},
      });
    }
  }

  // prepare (MP3 or MP4)
  if (action === 'prepare') {
    if (!quality) {
      return res.status(400).json({ success: false, message: 'Quality is required' });
    }
    try {
      const result = await ytBackend.prepare(normalizedUrl, quality, downloadsDir);
      if (result.success && result.file_path && fs.existsSync(result.file_path)) {
        return res.json({
          success: true,
          message: 'Video prepared successfully',
          file_path: result.file_path,
          fileName: result.original_filename || path.basename(result.file_path),
        });
      }
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to prepare video',
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: 'Unable to prepare video. ' + (e.message || String(e)),
      });
    }
  }

  // prepare_poster
  if (action === 'prepare_poster') {
    try {
      const dirs = {
        base: downloadsDir,
        temp: tempDir,
        final: finalDir,
      };
      const result = await ytBackend.preparePoster(normalizedUrl, poster_quality || 'high', dirs);
      if (result.success && result.file_path && fs.existsSync(result.file_path)) {
        return res.json({
          success: true,
          message: 'Poster prepared successfully',
          file_path: result.file_path,
          fileName: result.original_filename || path.basename(result.file_path),
        });
      }
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to prepare poster',
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: 'Unable to prepare poster. ' + (e.message || String(e)),
      });
    }
  }

  // delete_file
  if (action === 'delete_file') {
    if (!file_path) {
      return res.status(400).json({ success: false, message: 'File path is required' });
    }
    const result = ytBackend.deleteFile(file_path);
    if (result.success) {
      return res.json({ success: true, message: 'File deleted successfully' });
    }
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  // download (stream file)
  if (action === 'download') {
    if (!file_path) {
      return res.status(400).json({ success: false, message: 'File path is required' });
    }
    try {
      if (!fs.existsSync(file_path)) {
        return res.status(404).json({ success: false, message: 'File not found. Please convert again.' });
      }
      const stat = fs.statSync(file_path);
      const fileName = path.basename(file_path);
      const ext = path.extname(fileName).toLowerCase();
      const contentType =
        ext === '.mp3' ? 'audio/mpeg'
        : ext === '.mp4' ? 'video/mp4'
        : (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg'
        : ext === '.png' ? 'image/png'
        : 'application/octet-stream';
      const originalName = original_filename || fileName || file_name || fileName;
      const safeName = /[^\x00-\x7F]/.test(fileName) ? 'download' + ext : fileName;
      let contentDisposition = `attachment; filename="${safeName}"`;
      if (originalName && originalName !== safeName) {
        contentDisposition += `; filename*=UTF-8''${encodeURIComponent(originalName)}`;
      }
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', contentDisposition);
      res.setHeader('Content-Length', String(stat.size));
      const stream = fs.createReadStream(file_path);
      stream.pipe(res);
      stream.on('error', (err) => {
        if (!res.headersSent) res.status(500).json({ success: false, message: err.message });
      });
      // Optional: delete file after stream finishes (e.g. after 30s delay) — can be done in Next route instead
      return;
    } catch (e) {
      return res.status(500).json({
        success: false,
        message: 'Failed to download file. ' + (e.message || String(e)),
      });
    }
  }

  return res.status(400).json({ success: false, message: 'Unknown action' });
});

app.listen(PORT, () => {
  console.log(`[server] YouTube API listening on http://localhost:${PORT}`);
});
