import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { recordDownload, generateUserId } from '@/lib/analytics';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import ytBackend from './yt-backend.js';

// Cleanup old files periodically (files older than 1 hour)
function cleanupOldFiles() {
  try {
    const downloadsDir = path.join(process.cwd(), 'downloads');
    const finalDir = path.join(downloadsDir, 'final');
    const tempDir = path.join(downloadsDir, 'temp');
    
    if (!fs.existsSync(finalDir) && !fs.existsSync(tempDir)) {
      return;
    }

    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
    let deletedCount = 0;

    // Clean up final folder
    if (fs.existsSync(finalDir)) {
      const finalFiles = fs.readdirSync(finalDir);
      for (const file of finalFiles) {
        const filePath = path.join(finalDir, file);
        try {
          const stats = fs.statSync(filePath);
          const age = now - stats.mtimeMs;
          
          if (age > maxAge) {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log('[Download API] Cleaned up old file from final:', filePath);
          }
        } catch (error) {
          // Ignore errors for individual files
        }
      }
    }

    // Clean up temp folder
    if (fs.existsSync(tempDir)) {
      const tempFiles = fs.readdirSync(tempDir);
      for (const file of tempFiles) {
        const filePath = path.join(tempDir, file);
        try {
          const stats = fs.statSync(filePath);
          const age = now - stats.mtimeMs;
          
          if (age > maxAge) {
            fs.unlinkSync(filePath);
            deletedCount++;
            console.log('[Download API] Cleaned up old file from temp:', filePath);
          }
        } catch (error) {
          // Ignore errors for individual files
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[Download API] Cleanup completed. Deleted ${deletedCount} old files.`);
    }
  } catch (error) {
    console.error('[Download API] Cleanup error:', error);
  }
}

// Run cleanup periodically (every 10 minutes)
let lastCleanup = 0;
const cleanupInterval = 10 * 60 * 1000; // 10 minutes

interface VideoMetadata {
  title?: string;
  thumbnail?: string;
  duration?: number;
  author?: string;
  resolutions?: number[];
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube-nocookie\.com\/embed\/)([^&\n?#]+)/,
    /(?:youtube\.com\/shorts\/)([^&\n?#\/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function normalizeYoutubeUrl(url: string): string {
  // Convert shorts URL to watch URL for better compatibility
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^&\n?#\/]+)/);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/watch?v=${shortsMatch[1]}`;
  }
  return url;
}

const downloadsDir = path.join(process.cwd(), 'downloads');
const finalDir = path.join(downloadsDir, 'final');
const tempDir = path.join(downloadsDir, 'temp');

const PYTHON_URL = 'http://localhost:8000';

async function proxyToPython(action: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const url = body.url as string;
  console.log('Proxying to Python:', action, url);
  const res = await fetch(`${PYTHON_URL}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...body,
      output_path: downloadsDir,
    }),
  });
  const data = await res.json().catch(() => ({}));
  console.log('Python response:', data);
  return data as Record<string, unknown>;
}

function ensureDownloadDirs() {
  [downloadsDir, tempDir, finalDir].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request.headers);

    // Run cleanup periodically
    const now = Date.now();
    if (now - lastCleanup > cleanupInterval) {
      cleanupOldFiles();
      lastCleanup = now;
    }

    const body = await request.json();
    const { url, quality, action, file_path, fileName, original_filename, file_name, poster_quality } = body;
    console.log('Received body:', { url, quality, action, file_path: file_path ? '[present]' : undefined });
    if (quality !== undefined) console.log('Received quality:', quality);

    // Rate limit heavy actions: 15 per minute per IP (prepare + download)
    const heavyActions = ['prepare', 'prepare_poster', 'download'];
    if (action && heavyActions.includes(action)) {
      const rl = rateLimit(`download:${clientId}`, 15, 60);
      if (!rl.success) {
        return NextResponse.json(
          {
            success: false,
            message: 'Too many requests. Please try again later.',
            retryAfter: rl.resetIn,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(rl.resetIn),
              'X-RateLimit-Remaining': String(rl.remaining),
            },
          }
        );
      }
    }

    // For download (stream) and delete_file, don't require URL
    if (!url && !['download', 'delete_file'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 200 }
      );
    }

    // Validate YouTube URL if URL is provided (for actions that need it)
    if (url && !['delete_file'].includes(action)) {
      const videoId = extractVideoId(url);
      if (!videoId) {
        return NextResponse.json(
          { success: false, message: 'Invalid YouTube URL' },
          { status: 200 }
        );
      }
    }

    // If action is just to get metadata
    if (action === 'preview' || action === 'info') {
      try {
        const normalizedUrl = normalizeYoutubeUrl(url);
        const result = await ytBackend.getInfo(normalizedUrl);
        if (result.success) {
          return NextResponse.json({ success: true, metadata: result });
        }
        return NextResponse.json({
          success: false,
          message: result.error || 'Unable to load video information',
          metadata: {}
        });
      } catch (err) {
        console.log('[Download API] Info error:', err);
        return NextResponse.json({
          success: false,
          message: 'Unable to load video information',
          metadata: {}
        });
      }
    }

    // For prepare (convert video) - proxy to Python
    if (action === 'prepare') {
      if (!url || !quality) {
        return NextResponse.json(
          { success: false, message: 'Missing url or quality' },
          { status: 200 }
        );
      }

      try {
        ensureDownloadDirs();
        const normalizedUrl = normalizeYoutubeUrl(url);
        const result = await proxyToPython('download', { url: normalizedUrl, quality });

        const filePath = typeof result.file_path === 'string' ? result.file_path : '';
        if (result.success && filePath && fs.existsSync(filePath)) {
          const fileName = (result.original_filename as string) || path.basename(filePath);
          try {
            const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
            const userAgent = request.headers.get('user-agent') || undefined;
            const country = request.headers.get('cf-ipcountry') ||
                           request.headers.get('x-vercel-ip-country') ||
                           undefined;
            const userId = generateUserId(ip, userAgent);
            const videoId = extractVideoId(url);
            recordDownload(quality, quality, videoId || undefined, userId, country);
          } catch (trackError) {
            console.error('[Download API] Tracking error:', trackError);
          }
          return NextResponse.json({
            success: true,
            message: 'Video prepared successfully',
            file_path: filePath,
            fileName: fileName,
          }, { status: 200 });
        }
        return NextResponse.json({
          success: Boolean(result.success),
          message: (result.message as string) || 'Failed to prepare video',
          fileName: (result.original_filename as string) ?? null,
          original_filename: (result.original_filename as string) ?? null,
        }, { status: 200 });
      } catch (prepareError) {
        console.warn('[Download API] Prepare error:', prepareError);
        return NextResponse.json(
          {
            success: false,
            message: 'Unable to prepare video. Please try again.',
          },
          { status: 200 }
        );
      }
    }

    // For poster prepare - proxy to Python
    if (action === 'prepare_poster') {
      try {
        ensureDownloadDirs();
        const normalizedUrl = normalizeYoutubeUrl(url);
        const result = await proxyToPython('poster', {
          url: normalizedUrl,
          quality: poster_quality || 'high',
        });
        console.log('[Download API] Poster prepare result:', result);

        if (result && result.file_path && typeof result.file_path === 'string' && fs.existsSync(result.file_path)) {
          const fileName = (result.original_filename as string) || path.basename(result.file_path);
          return NextResponse.json({
            success: true,
            message: 'Poster prepared successfully',
            file_path: result.file_path,
            fileName: fileName,
          }, { status: 200 });
        }
        return NextResponse.json(
          { success: result?.success ?? false, message: (result?.message as string) || 'Failed to prepare poster' },
          { status: 200 }
        );
      } catch (posterError) {
        console.warn('[Download API] Poster prepare error:', posterError);
        return NextResponse.json(
          { success: false, message: 'Unable to prepare poster. Please try again.' },
          { status: 200 }
        );
      }
    }

    // For delete_file (delete a prepared file from both temp and final folders)
    if (action === 'delete_file') {
      if (!file_path) {
        return NextResponse.json(
          { success: false, message: 'File path is required' },
          { status: 400 }
        );
      }
      try {
        const result = ytBackend.deleteFile(file_path);
        if (result.success) {
          return NextResponse.json({ success: true, message: 'File deleted successfully' });
        }
        return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
      } catch (error) {
        console.log('[Download API] Delete error:', error);
        return NextResponse.json({
          success: false,
          message: 'Failed to delete file: ' + (error instanceof Error ? error.message : String(error)),
        }, { status: 500 });
      }
    }

    // For download (stream prepared file)
    if (action === 'download') {
      if (!file_path) {
        return NextResponse.json(
          { success: false, message: 'File path is required' },
          { status: 400 }
        );
      }

      try {
        if (!fs.existsSync(file_path)) {
          console.log('[Download API] File not found at:', file_path);
          return NextResponse.json({
            success: false,
            message: 'File not found. Please convert again.',
          }, { status: 404 });
        }

        // Read file
        const fileBuffer = fs.readFileSync(file_path);
        const fileSize = fileBuffer.length;
        const fileName = path.basename(file_path);
        const ext = path.extname(fileName).toLowerCase();
        const contentType =
          ext === '.mp3'
            ? 'audio/mpeg'
            : ext === '.mp4'
              ? 'video/mp4'
              : ext === '.jpg' || ext === '.jpeg'
                ? 'image/jpeg'
                : ext === '.png'
                  ? 'image/png'
                  : 'application/octet-stream';

        console.log('[Download API] Streaming file:', fileName, 'Size:', fileSize);

        // Build Content-Disposition value (safe ASCII filename + UTF-8 fallback)
        const fileNameBasename = path.basename(file_path);
        const originalName = original_filename || fileName || file_name;
        // Use ASCII-safe filename or create a generic one
        const safeName = /[^\x00-\x7F]/.test(fileNameBasename) ? 'download' + path.extname(fileNameBasename) : fileNameBasename;
        let contentDisposition = `attachment; filename="${safeName}"`;
        if (originalName && originalName !== safeName) {
          // If different from safeName, add RFC 5987 encoded version
          contentDisposition += `; filename*=UTF-8''${encodeURIComponent(originalName)}`;
        }

        // Delete file after download completes with a delay
        const finalPath = path.join(finalDir, fileName);
        
        // Delete after 30 seconds - enough time to retry if cancelled, but not too long
        setTimeout(() => {
          try {
            // Delete from final folder (where file is moved after conversion)
            if (fs.existsSync(finalPath)) {
              fs.unlinkSync(finalPath);
              console.log('[Download API] File deleted from final after download:', finalPath);
            }
            // Also delete from original path if still exists
            if (fs.existsSync(file_path)) {
              fs.unlinkSync(file_path);
              console.log('[Download API] File deleted from path after download:', file_path);
            }
          } catch (deleteError) {
            console.log('[Download API] Failed to delete file after download:', deleteError);
          }
        }, 30 * 1000); // 30 seconds delay

        // Return file as downloadable response
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': contentDisposition,
            'Content-Length': fileSize.toString(),
          },
        });
      } catch (error) {
        console.log('[Download API] Download error:', error);
        return NextResponse.json({
          success: false,
          message: 'Failed to download file: ' + (error instanceof Error ? error.message : String(error)),
        }, { status: 500 });
      }
    }

    return NextResponse.json(
      { success: false, message: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.log('[Download API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to process request. Please try again.',
      },
      { status: 500 }
    );
  }
}
