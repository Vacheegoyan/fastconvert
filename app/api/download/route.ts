import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { recordDownload, generateUserId } from '@/lib/analytics';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { withConversionSlot } from '@/lib/concurrency';

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

async function runPythonScript(action: string, url: string, quality?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'yt.py');
    // Store prepared files inside the project to avoid OS temp encoding issues
    const tempDir = path.join(process.cwd(), 'downloads');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Ensure temp and final subdirectories exist
    const tempSubDir = path.join(tempDir, 'temp');
    const finalSubDir = path.join(tempDir, 'final');
    if (!fs.existsSync(tempSubDir)) {
      fs.mkdirSync(tempSubDir, { recursive: true });
    }
    if (!fs.existsSync(finalSubDir)) {
      fs.mkdirSync(finalSubDir, { recursive: true });
    }

    const args = [scriptPath, action, url];
    if (quality) args.push(quality);
    args.push(tempDir);

    const pythonProcess = spawn('python', args, {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8'
      }
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      // Ensure proper UTF-8 encoding
      if (Buffer.isBuffer(data)) {
        stdout += data.toString('utf8');
      } else {
        stdout += data;
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      // Ensure proper UTF-8 encoding
      if (Buffer.isBuffer(data)) {
        stderr += data.toString('utf8');
      } else {
        stderr += data;
      }
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Extract JSON from stdout (may contain progress logs before JSON)
          const jsonMatch = stdout.match(/\{[\s\S]*"file_path"[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            resolve(result);
          } else {
            // Try parsing the whole output as JSON
            const result = JSON.parse(stdout.trim());
            resolve(result);
          }
        } catch (e) {
          // If not JSON, return success with message
          resolve({ success: true, message: stdout.trim() });
        }
      } else {
        reject(new Error(stderr || `Python script failed with code ${code}`));
      }
    });

    pythonProcess.on('error', (error) => {
      reject(error);
    });
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

    const { url, quality, action, file_path, fileName, original_filename, file_name, poster_quality } = await request.json();

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

    // For download action, don't require URL
    if (!url && action !== 'download') {
      return NextResponse.json(
        { success: false, message: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL if URL is provided
    if (url) {
      const videoId = extractVideoId(url);
      if (!videoId) {
        return NextResponse.json(
          { success: false, message: 'Invalid YouTube URL' },
          { status: 400 }
        );
      }
    }

    // If action is just to get metadata
    if (action === 'preview' || action === 'info') {
      try {
        // Normalize URL (convert shorts to watch format for better compatibility)
        const normalizedUrl = normalizeYoutubeUrl(url);
        // Use Python script to get video info directly from yt-dlp
        const result = await runPythonScript('info', normalizedUrl);
        
        // Parse the JSON result from Python
        let metadata = {};
        if (typeof result === 'string') {
          try {
            metadata = JSON.parse(result);
          } catch (e) {
            metadata = result;
          }
        } else {
          metadata = result;
        }
        
        return NextResponse.json({
          success: true,
          metadata,
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

    // For prepare (convert video and return file path)
    if (action === 'prepare') {
      if (!quality) {
        return NextResponse.json(
          { success: false, message: 'Quality is required' },
          { status: 400 }
        );
      }

      try {
        // Normalize URL (convert shorts to watch format for better compatibility)
        const normalizedUrl = normalizeYoutubeUrl(url);
        const result = await withConversionSlot(() =>
          runPythonScript('download', normalizedUrl, quality)
        );
        console.log('[Download API] Prepare result:', result);
        
        if (result && result.file_path && fs.existsSync(result.file_path)) {
          // Use original filename from Python if available, otherwise use safe filename
          const fileName = result.original_filename || path.basename(result.file_path);
          
          // Track download for analytics
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
            // Don't fail the request if tracking fails
            console.error('[Download API] Tracking error:', trackError);
          }
          
          return NextResponse.json({
            success: true,
            message: 'Video prepared successfully',
            file_path: result.file_path,
            fileName: fileName,
          });
        } else {
          return NextResponse.json({
            success: false,
            message: result?.message || 'Failed to prepare video',
          }, { status: 500 });
        }
      } catch (pythonError) {
        console.log('[Download API] Prepare error:', pythonError);
        return NextResponse.json(
          {
            success: false,
            message: 'Unable to prepare video. ' + (pythonError instanceof Error ? pythonError.message : String(pythonError)),
          },
          { status: 500 }
        );
      }
    }

    // For poster prepare (download thumbnail/poster and return file path)
    if (action === 'prepare_poster') {
      try {
        // Normalize URL (convert shorts to watch format for better compatibility)
        const normalizedUrl = normalizeYoutubeUrl(url);
        const result = await withConversionSlot(() =>
          runPythonScript('poster', normalizedUrl, poster_quality)
        );
        console.log('[Download API] Poster prepare result:', result);

        if (result && result.file_path && fs.existsSync(result.file_path)) {
          const fileName = result.original_filename || path.basename(result.file_path);
          return NextResponse.json({
            success: true,
            message: 'Poster prepared successfully',
            file_path: result.file_path,
            fileName: fileName,
          });
        }

        return NextResponse.json(
          { success: false, message: result?.message || 'Failed to prepare poster' },
          { status: 500 }
        );
      } catch (pythonError) {
        console.log('[Download API] Poster prepare error:', pythonError);
        return NextResponse.json(
          {
            success: false,
            message: 'Unable to prepare poster. ' + (pythonError instanceof Error ? pythonError.message : String(pythonError)),
          },
          { status: 500 }
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
        const downloadsDir = path.join(process.cwd(), 'downloads');
        const tempDir = path.join(downloadsDir, 'temp');
        const finalDir = path.join(downloadsDir, 'final');
        
        let deleted = false;
        const fileName = path.basename(file_path);
        
        // Try to delete from final folder first (where file is moved after conversion)
        const finalPath = path.join(finalDir, fileName);
        if (fs.existsSync(finalPath)) {
          fs.unlinkSync(finalPath);
          console.log('[Download API] File deleted from final:', finalPath);
          deleted = true;
        }
        
        // Also try to delete from temp folder (in case it's still there)
        const tempPath = path.join(tempDir, fileName);
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
          console.log('[Download API] File deleted from temp:', tempPath);
          deleted = true;
        }
        
        // Also try to delete from the exact path provided
        if (fs.existsSync(file_path)) {
          fs.unlinkSync(file_path);
          console.log('[Download API] File deleted from path:', file_path);
          deleted = true;
        }
        
        if (deleted) {
          return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
          });
        } else {
          return NextResponse.json({
            success: false,
            message: 'File not found',
          }, { status: 404 });
        }
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
        // This allows user to retry download if they cancelled the save dialog
        // Delete from both temp and final folders
        const downloadsDir = path.join(process.cwd(), 'downloads');
        const finalDir = path.join(downloadsDir, 'final');
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

    // For actual download (legacy, for backward compatibility)
    if (!quality) {
      return NextResponse.json(
        { success: false, message: 'Quality is required for download' },
        { status: 400 }
      );
    }

    try {
      // Use Python yt.py script for download
      const result = await withConversionSlot(() =>
        runPythonScript('download', url, quality)
      );

      console.log('[Download API] Python result:', result);
      
      // Check if Python script returned a file path
      if (result && result.file_path && typeof result.file_path === 'string' && result.file_path.length > 0) {
        let filePath = result.file_path;
        
        // Convert Windows backslashes to forward slashes for consistency
        filePath = filePath.replace(/\\/g, path.sep);
        
        // Convert relative path to absolute path if needed
        if (!path.isAbsolute(filePath)) {
          filePath = path.join(process.cwd(), filePath);
        }
        
        console.log('[Download API] File path (absolute):', filePath);
        
        try {
          // Check if file exists
          if (!fs.existsSync(filePath)) {
            console.log('[Download API] File not found at:', filePath);
            return NextResponse.json({
              success: false,
              message: `File not found: ${filePath}`,
            }, { status: 404 });
          }
          
          // Read the file
          const fileBuffer = fs.readFileSync(filePath);
          const fileSize = fileBuffer.length;
          const fileName = path.basename(filePath);

          // Build Content-Disposition with RFC5987 encoding
          const originalName = (result && (result.original_filename || result.fileName)) || fileName;
          // Use ASCII-safe filename or create a generic one
          const safeName = /[^\x00-\x7F]/.test(fileName) ? 'download' + path.extname(fileName) : fileName;
          
          // HTTP headers must be ASCII-only, so use RFC 5987 encoding for UTF-8 filenames
          let contentDisposition = `attachment; filename="${safeName}"`;
          if (originalName && originalName !== safeName) {
            // If different from safeName, add RFC 5987 encoded version
            contentDisposition += `; filename*=UTF-8''${encodeURIComponent(originalName)}`;
          }

          console.log('[Download API] File found:', fileName, 'Size:', fileSize);
          console.log('[Download API] Original name:', originalName);
          console.log('[Download API] Content-Disposition:', contentDisposition);

          // Return file as downloadable response
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': quality === 'mp3' ? 'audio/mpeg' : 'video/mp4',
              'Content-Disposition': contentDisposition,
              'Content-Length': fileSize.toString(),
            },
          });
        } catch (readError) {
          console.log('[Download API] File read error:', readError);
          
          return NextResponse.json({
            success: false,
            message: 'Failed to read file after download',
            error: readError instanceof Error ? readError.message : String(readError)
          }, { status: 500 });
        }
      } else {
        console.log('[Download API] No valid file path in result:', result);
        
        return NextResponse.json({
          success: false,
          message: result?.message || 'Download failed: No file generated',
        }, { status: 500 });
      }
    } catch (pythonError) {
      console.log('[Download API] Python script error:', pythonError);
      
      return NextResponse.json(
        {
          success: false,
          message: 'Unable to download. ' + (pythonError instanceof Error ? pythonError.message : String(pythonError)),
        },
        { status: 500 }
      );
    }
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
