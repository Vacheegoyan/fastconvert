/**
 * YouTube backend: getInfo, prepare (MP3/MP4), poster.
 * Lives next to route.ts so Next.js resolves ./yt-backend.js without ROOT.
 * Also used by server.js via require('./app/api/download/yt-backend.js').
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const { Readable } = require('stream');

const STANDARD_RESOLUTIONS = [144, 240, 360, 480, 720, 1080, 1440, 2160];
const TOLERANCE = 20;
const UNPLAYABLE_MESSAGE = 'This video cannot be downloaded right now (YouTube restriction or format unavailable). Try another video.';
let decipherWarned = false;

function getDownloadsDir() {
  const base = path.join(process.cwd(), 'downloads');
  const temp = path.join(base, 'temp');
  const final = path.join(base, 'final');
  [temp, final].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  return { base, temp, final };
}

function cleanUrl(url) {
  if (!url || typeof url !== 'string') return url;
  let u = url.split('&list=')[0].split('?list=')[0];
  return u.trim();
}

function normalizeYoutubeUrl(url) {
  const m = url.match(/youtube\.com\/shorts\/([^&\n?#/]+)/);
  if (m && m[1]) return `https://www.youtube.com/watch?v=${m[1]}`;
  return url;
}

function sanitizeFilename(name) {
  if (!name || typeof name !== 'string') return 'video';
  let s = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/[<>:"/\\|?*]/g, '').trim().replace(/^\s+|\s+$/g, '');
  s = s.replace(/\s+/g, ' ');
  return s || 'video';
}

function extractVideoId(url) {
  const m = (url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#/]+)/);
  return m ? m[1] : null;
}

/** True if format has a usable direct URL (no decipher needed: no sig/s= in URL). */
function isDirectUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const u = url;
  if (/\b(sig|s)=[^&]+/i.test(u)) return false;
  return u.startsWith('http://') || u.startsWith('https://');
}

/** Prefer audio itags: 140 (m4a), 251 (opus), 249. Returns first format with direct URL. */
function getDirectAudioFormat(streamingData) {
  if (!streamingData) return null;
  const formats = streamingData.formats || [];
  const adaptive = streamingData.adaptive_formats || [];
  const all = [...formats, ...adaptive];
  const preferredItags = [140, 251, 249];
  for (const itag of preferredItags) {
    const f = all.find((x) => Number(x.itag) === itag && isDirectUrl(x.url));
    if (f) return f;
  }
  return all.find((f) => (f.audioQuality != null || f.mimeType && /audio\//.test(f.mimeType)) && isDirectUrl(f.url)) || null;
}

/** Best muxed or video-only format with direct URL near target height. */
function getDirectVideoFormat(streamingData, targetHeight) {
  if (!streamingData) return null;
  const formats = streamingData.formats || [];
  const adaptive = streamingData.adaptive_formats || [];
  const all = [...formats, ...adaptive];
  const withUrl = all.filter((f) => (f.height != null || f.video_quality) && isDirectUrl(f.url));
  if (withUrl.length === 0) return null;
  const target = targetHeight || 720;
  withUrl.sort((a, b) => {
    const ha = a.height || parseInt(String(a.video_quality || '0').replace('p', ''), 10) || 0;
    const hb = b.height || parseInt(String(b.video_quality || '0').replace('p', ''), 10) || 0;
    return Math.abs(ha - target) - Math.abs(hb - target);
  });
  return withUrl[0];
}

/** Prefer muxed formats (formats[]) with direct URL for single-URL MP4. */
function getDirectMuxedFormat(streamingData, targetHeight) {
  if (!streamingData) return null;
  const formats = streamingData.formats || [];
  const withUrl = formats.filter((f) => (f.height != null || f.video_quality) && isDirectUrl(f.url));
  if (withUrl.length === 0) return null;
  const target = targetHeight || 720;
  withUrl.sort((a, b) => {
    const ha = a.height || parseInt(String(a.video_quality || '0').replace('p', ''), 10) || 0;
    const hb = b.height || parseInt(String(b.video_quality || '0').replace('p', ''), 10) || 0;
    return Math.abs(ha - target) - Math.abs(hb - target);
  });
  return withUrl[0];
}

/** getInfo (preview) via youtubei.js — use getBasicInfo + retrieve_player: false to avoid decipher. */
async function getInfo(url) {
  const u = cleanUrl(normalizeYoutubeUrl(url));
  const videoId = extractVideoId(u);
  if (!videoId) return { success: false, error: 'Invalid YouTube URL' };
  try {
    const { Innertube } = await import('youtubei.js');
    const innertube = await Innertube.create({
      retrieve_player: false,
      lang: 'en',
    });
    const videoInfo = await innertube.getBasicInfo(videoId);
    if (!videoInfo || !videoInfo.basic_info) {
      return { success: false, error: 'Failed to get video info' };
    }
    const bi = videoInfo.basic_info;
    let thumbUrl = '';
    if (bi.thumbnail && Array.isArray(bi.thumbnail) && bi.thumbnail.length > 0) {
      const last = bi.thumbnail[bi.thumbnail.length - 1];
      thumbUrl = (last && last.url) ? last.url : (typeof last === 'string' ? last : '');
    }
    let resolutions = [360, 480, 720, 1080, 1440, 2160];
    const streamingData = videoInfo.streaming_data;
    if (streamingData) {
      const formats = streamingData.formats || [];
      const adaptive = streamingData.adaptive_formats || [];
      const allFormats = [...formats, ...adaptive];
      const heights = new Set();
      for (const f of allFormats) {
        const h = f.height || (f.video_quality && parseInt(String(f.video_quality).replace('p', ''), 10));
        if (h && h > 0) heights.add(Number(h));
      }
      const available = STANDARD_RESOLUTIONS.filter((r) =>
        Array.from(heights).some((h) => Math.abs(h - r) <= TOLERANCE)
      );
      if (available.length > 0) resolutions = [...available].sort((a, b) => b - a);
    }
    return {
      success: true,
      title: bi.title || 'Unknown',
      thumbnail: thumbUrl,
      duration: typeof bi.duration === 'number' ? bi.duration : parseInt(String(bi.duration || 0), 10) || 0,
      author: bi.author || (bi.channel && bi.channel.name) || 'Unknown',
      resolutions,
      video_id: bi.id || videoId,
      description: (bi.short_description || '').slice(0, 200),
    };
  } catch (err) {
    console.error('[yt-backend] getInfo error:', err.message);
    return { success: false, error: err.message || 'Failed to get video info' };
  }
}

function getFfmpegPath() {
  try {
    const ffmpegStatic = require('ffmpeg-static');
    if (ffmpegStatic && typeof ffmpegStatic === 'string' && fs.existsSync(ffmpegStatic)) {
      return ffmpegStatic;
    }
  } catch (e) {
    // ignore
  }
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

/** Get basic info without player (no decipher). For direct-URL path. */
async function getBasicInfoForDownload(url) {
  const u = cleanUrl(normalizeYoutubeUrl(url));
  const videoId = extractVideoId(u);
  if (!videoId) return { error: 'Invalid YouTube URL' };
  try {
    const { Innertube } = await import('youtubei.js');
    // Add rotating proxies here for IP rotation to avoid blocks.
    const innertube = await Innertube.create({
      retrieve_player: false,
      lang: 'en',
    });
    const videoInfo = await innertube.getBasicInfo(videoId);
    if (!videoInfo || !videoInfo.basic_info) return { error: 'Failed to get video info' };
    const title = (videoInfo.basic_info && videoInfo.basic_info.title) ? videoInfo.basic_info.title : 'video';
    const safeTitle = sanitizeFilename(title);
    return { videoInfo, streaming_data: videoInfo.streaming_data, title, safeTitle };
  } catch (err) {
    return { error: err.message || 'Failed to get video info' };
  }
}

/** Get youtubei VideoInfo for download. Tries with player only when needed (decipher). Retry up to 2 times. */
async function getVideoInfoForDownload(url) {
  const u = cleanUrl(normalizeYoutubeUrl(url));
  const videoId = extractVideoId(u);
  if (!videoId) return { error: 'Invalid YouTube URL' };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { Innertube } = await import('youtubei.js');
      // Add rotating proxies here for IP rotation to avoid blocks.
      const innertube = await Innertube.create({
        retrieve_player: true,
        lang: 'en',
      });
      let videoInfo = await innertube.getInfo(u).catch(() => null);
      if (!videoInfo || !videoInfo.basic_info) {
        videoInfo = await innertube.getBasicInfo(videoId);
      }
      if (!videoInfo || !videoInfo.basic_info) {
        return { error: 'Failed to get video info' };
      }
      const status = videoInfo.playability_status;
      const statusStr = status && status.status ? String(status.status).toUpperCase() : '';
      if (statusStr === 'LOGIN_REQUIRED' || statusStr === 'AGE_VERIFICATION_REQUIRED' || statusStr === 'CONTENT_CHECK_REQUIRED') {
        return { error: 'This video is unavailable (age-restricted, private, or sign-in required).' };
      }
      const title = (videoInfo.basic_info && videoInfo.basic_info.title) ? videoInfo.basic_info.title : 'video';
      const safeTitle = sanitizeFilename(title);
      return { videoInfo, title, safeTitle };
    } catch (err) {
      const msg = err.message || 'Failed to get video';
      if (/age.?restricted|login required|sign.?in required|private video|not available in your country/i.test(msg)) {
        return { error: 'This video is unavailable (age-restricted, private, or not available in your region).' };
      }
      if (attempt === 1) return { error: msg };
    }
  }
  return { error: 'Failed to get video info' };
}

/** Pipe a direct URL into ffmpeg to produce MP3. */
function pipeDirectUrlToMp3(directUrl, outMp3, finalPath, finalFilename, ffmpegPath, qualityKbps, resolve) {
  const req = https.get(directUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0' } }, (res) => {
    if (res.statusCode !== 200) {
      resolve({ success: false, file_path: null, original_filename: finalFilename, message: UNPLAYABLE_MESSAGE });
      return;
    }
    const ffmpeg = spawn(ffmpegPath, [
      '-i', 'pipe:0',
      '-acodec', 'libmp3lame',
      '-b:a', String(qualityKbps) + 'k',
      '-y', outMp3,
    ], { stdio: ['pipe', 'pipe', 'pipe'] });
    res.pipe(ffmpeg.stdin);
    ffmpeg.stdin.on('error', () => {});
    res.on('error', (err) => {
      try { ffmpeg.kill(); } catch (_) {}
      resolve({ success: false, file_path: null, original_filename: finalFilename, message: UNPLAYABLE_MESSAGE });
    });
    ffmpeg.on('error', (err) => {
      try { if (fs.existsSync(outMp3)) fs.unlinkSync(outMp3); } catch (_) {}
      resolve({ success: false, file_path: null, original_filename: finalFilename });
    });
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        try { if (fs.existsSync(outMp3)) fs.unlinkSync(outMp3); } catch (_) {}
        resolve({ success: false, file_path: null, original_filename: finalFilename });
        return;
      }
      try {
        fs.renameSync(outMp3, finalPath);
        resolve({ success: true, file_path: finalPath, original_filename: finalFilename });
      } catch (e) {
        try { fs.copyFileSync(outMp3, finalPath); fs.unlinkSync(outMp3); } catch (_) {}
        resolve({ success: true, file_path: finalPath, original_filename: finalFilename });
      }
    });
  });
  req.on('error', () => resolve({ success: false, file_path: null, original_filename: finalFilename, message: UNPLAYABLE_MESSAGE }));
}

/**
 * MP3: First try direct URL (no player). Else youtubei download (decipher). Never throw.
 */
async function prepareMp3(url, qualityKbps, downloadsDir) {
  const ffmpegPath = getFfmpegPath();
  const { temp, final } = downloadsDir;

  const basic = await getBasicInfoForDownload(url);
  if (!basic.error && basic.streaming_data) {
    const audioFormat = getDirectAudioFormat(basic.streaming_data);
    if (audioFormat && audioFormat.url) {
      const safeTitle = basic.safeTitle;
      const outMp3 = path.join(temp, safeTitle + '.mp3');
      const finalFilename = safeTitle + '.mp3';
      const finalPath = path.join(final, finalFilename);
      return new Promise((resolve) => {
        pipeDirectUrlToMp3(audioFormat.url, outMp3, finalPath, finalFilename, ffmpegPath, qualityKbps, resolve);
      });
    }
  }

  const result = await getVideoInfoForDownload(url);
  if (result.error) {
    return { success: false, file_path: null, original_filename: null, message: result.error };
  }
  const { videoInfo, safeTitle } = result;
  const outMp3 = path.join(temp, safeTitle + '.mp3');
  const finalFilename = safeTitle + '.mp3';
  const finalPath = path.join(final, finalFilename);

  return new Promise((resolve) => {
    videoInfo.download({ type: 'audio', quality: 'best' })
      .then((webStream) => {
        if (!webStream) {
          resolve({ success: false, file_path: null, original_filename: finalFilename, message: UNPLAYABLE_MESSAGE });
          return;
        }
        const nodeStream = Readable.fromWeb(webStream);
        const ffmpeg = spawn(ffmpegPath, [
          '-i', 'pipe:0',
          '-acodec', 'libmp3lame',
          '-b:a', String(qualityKbps) + 'k',
          '-y', outMp3,
        ], { stdio: ['pipe', 'pipe', 'pipe'] });

        nodeStream.pipe(ffmpeg.stdin);
        ffmpeg.stdin.on('error', () => {});
        nodeStream.on('error', (err) => {
          try { ffmpeg.kill(); } catch (_) {}
          resolve({ success: false, file_path: null, original_filename: finalFilename, message: UNPLAYABLE_MESSAGE });
        });
        ffmpeg.on('error', (err) => {
          try { if (fs.existsSync(outMp3)) fs.unlinkSync(outMp3); } catch (_) {}
          resolve({ success: false, file_path: null, original_filename: finalFilename });
        });
        ffmpeg.on('close', (code) => {
          if (code !== 0) {
            try { if (fs.existsSync(outMp3)) fs.unlinkSync(outMp3); } catch (_) {}
            resolve({ success: false, file_path: null, original_filename: finalFilename });
            return;
          }
          try {
            fs.renameSync(outMp3, finalPath);
            resolve({ success: true, file_path: finalPath, original_filename: finalFilename });
          } catch (e) {
            try { fs.copyFileSync(outMp3, finalPath); fs.unlinkSync(outMp3); } catch (_) {}
            resolve({ success: true, file_path: finalPath, original_filename: finalFilename });
          }
        });
      })
      .catch((err) => {
        if (!decipherWarned) {
          decipherWarned = true;
          console.warn('[yt-backend] prepareMp3 decipher/stream (warn once):', err.message);
        }
        resolve({ success: false, file_path: null, original_filename: finalFilename, message: UNPLAYABLE_MESSAGE });
      });
  });
}

/** MP4: First try direct muxed URL (no player). Else youtubei download (decipher). Never throw. */
async function prepareMp4(url, resolution, downloadsDir) {
  const ffmpegPath = getFfmpegPath();
  const { temp, final } = downloadsDir;

  const basic = await getBasicInfoForDownload(url);
  if (!basic.error && basic.streaming_data) {
    const muxed = getDirectMuxedFormat(basic.streaming_data, resolution);
    if (muxed && muxed.url) {
      const safeTitle = basic.safeTitle;
      const tempRaw = path.join(temp, safeTitle + '_raw.' + Date.now());
      const finalPath = path.join(final, safeTitle + '.mp4');
      return new Promise((resolve) => {
        const client = muxed.url.startsWith('https') ? https : http;
        const req = client.get(muxed.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0' } }, (res) => {
          if (res.statusCode !== 200) {
            resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4', message: UNPLAYABLE_MESSAGE });
            return;
          }
          const out = fs.createWriteStream(tempRaw);
          res.pipe(out);
          res.on('error', () => {
            out.destroy();
            try { if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw); } catch (_) {}
            resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4', message: UNPLAYABLE_MESSAGE });
          });
          out.on('error', () => {
            try { if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw); } catch (_) {}
            resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4' });
          });
          out.on('finish', () => {
            out.close(() => {
              if (!fs.existsSync(tempRaw)) {
                resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4' });
                return;
              }
              const ffmpeg = spawn(ffmpegPath, [
                '-i', tempRaw,
                '-c', 'copy',
                '-movflags', '+faststart',
                '-y', finalPath,
              ], { stdio: ['pipe', 'pipe', 'pipe'] });
              ffmpeg.on('close', (code) => {
                try { if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw); } catch (_) {}
                if (code !== 0) {
                  try { if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath); } catch (_) {}
                  resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4' });
                  return;
                }
                resolve({ success: true, file_path: finalPath, original_filename: safeTitle + '.mp4' });
              });
              ffmpeg.on('error', () => {
                try { if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw); } catch (_) {}
                resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4' });
              });
            });
          });
        });
        req.on('error', () => resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4', message: UNPLAYABLE_MESSAGE }));
      });
    }
  }

  const result = await getVideoInfoForDownload(url);
  if (result.error) {
    return { success: false, file_path: null, original_filename: null, message: result.error };
  }
  const { videoInfo, safeTitle } = result;
  const qualityStr = resolution + 'p';
  const tempRaw = path.join(temp, safeTitle + '_raw.' + Date.now());
  const finalPath = path.join(final, safeTitle + '.mp4');

  return new Promise((resolve) => {
    videoInfo.download({ type: 'video+audio', quality: qualityStr })
      .then((webStream) => {
        if (!webStream) {
          resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4', message: UNPLAYABLE_MESSAGE });
          return;
        }
        const nodeStream = Readable.fromWeb(webStream);
        const out = fs.createWriteStream(tempRaw);
        nodeStream.pipe(out);
        nodeStream.on('error', (err) => {
          out.destroy();
          try { if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw); } catch (_) {}
          resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4', message: UNPLAYABLE_MESSAGE });
        });
        out.on('error', (err) => {
          try { if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw); } catch (_) {}
          resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4' });
        });
        out.on('finish', () => {
          out.close(() => {
            if (!fs.existsSync(tempRaw)) {
              resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4' });
              return;
            }
            const ffmpeg = spawn(ffmpegPath, [
              '-i', tempRaw,
              '-c', 'copy',
              '-movflags', '+faststart',
              '-y', finalPath,
            ], { stdio: ['pipe', 'pipe', 'pipe'] });
            ffmpeg.on('close', (code) => {
              try { if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw); } catch (_) {}
              if (code !== 0) {
                try { if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath); } catch (_) {}
                resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4' });
                return;
              }
              resolve({ success: true, file_path: finalPath, original_filename: safeTitle + '.mp4' });
            });
            ffmpeg.on('error', (err) => {
              try { if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw); } catch (_) {}
              resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4' });
            });
          });
        });
      })
      .catch((err) => {
        if (!decipherWarned) {
          decipherWarned = true;
          console.warn('[yt-backend] prepareMp4 decipher/stream (warn once):', err.message);
        }
        try { if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw); } catch (_) {}
        resolve({ success: false, file_path: null, original_filename: safeTitle + '.mp4', message: UNPLAYABLE_MESSAGE });
      });
  });
}

async function preparePoster(url, posterQuality, downloadsDir) {
  const dirs = downloadsDir || getDownloadsDir();
  const meta = await getInfo(url);
  if (!meta.success || !meta.video_id) {
    return { success: false, file_path: null, original_filename: 'poster.jpg' };
  }
  const quality = (posterQuality || 'high').toLowerCase();
  const base = `https://i.ytimg.com/vi/${meta.video_id}`;
  const map = {
    default: `${base}/default.jpg`,
    mqdefault: `${base}/mqdefault.jpg`,
    hqdefault: `${base}/hqdefault.jpg`,
    sddefault: `${base}/sddefault.jpg`,
    maxresdefault: `${base}/maxresdefault.jpg`,
    high: `${base}/maxresdefault.jpg`,
  };
  const thumbUrl = map[quality] || map.maxresdefault;
  const { temp, final } = dirs;
  const safeTitle = sanitizeFilename(meta.title || 'poster');
  const finalFilename = `${safeTitle}-poster.jpg`;
  const finalPath = path.join(final, finalFilename);
  const tempPath = path.join(temp, `poster_${Date.now()}.jpg`);

  return new Promise((resolve) => {
    const client = thumbUrl.startsWith('https') ? https : http;
    const req = client.get(thumbUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0' } }, (res) => {
      if (res.statusCode !== 200) {
        resolve({ success: false, file_path: null, original_filename: finalFilename });
        return;
      }
      const w = fs.createWriteStream(tempPath);
      res.pipe(w);
      w.on('finish', () => {
        w.close();
        try {
          const stat = fs.statSync(tempPath);
          if (stat.size < 1024) {
            fs.unlinkSync(tempPath);
            resolve({ success: false, file_path: null, original_filename: finalFilename });
            return;
          }
          fs.renameSync(tempPath, finalPath);
          resolve({ success: true, file_path: finalPath, original_filename: finalFilename });
        } catch (e) {
          try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
          resolve({ success: false, file_path: null, original_filename: finalFilename });
        }
      });
      w.on('error', () => {
        try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
        resolve({ success: false, file_path: null, original_filename: finalFilename });
      });
    });
    req.on('error', () => {
      resolve({ success: false, file_path: null, original_filename: finalFilename });
    });
  });
}

async function prepare(url, quality, outputPath) {
  const downloadsDir = outputPath
    ? { base: outputPath, temp: path.join(outputPath, 'temp'), final: path.join(outputPath, 'final') }
    : getDownloadsDir();
  [downloadsDir.temp, downloadsDir.final].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const isMp3 = quality === 'mp3' || (typeof quality === 'string' && quality.startsWith('mp3-'));
  if (isMp3) {
    const kbps = quality === 'mp3' ? '320' : quality.replace('mp3-', '');
    return prepareMp3(url, kbps, downloadsDir);
  }
  const res = typeof quality === 'string' && quality.endsWith('p')
    ? parseInt(quality.replace('p', ''), 10) || 720
    : 720;
  return prepareMp4(url, res, downloadsDir);
}

function deleteFile(filePath) {
  const { temp, final } = getDownloadsDir();
  const fileName = path.basename(filePath);
  let deleted = false;
  for (const dir of [final, temp]) {
    const p = path.join(dir, fileName);
    try {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        deleted = true;
      }
    } catch (_) {}
  }
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deleted = true;
    }
  } catch (_) {}
  return { success: deleted };
}

module.exports = {
  getInfo,
  prepare,
  preparePoster,
  deleteFile,
  getDownloadsDir,
  cleanUrl,
  normalizeYoutubeUrl,
};
