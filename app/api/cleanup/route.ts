import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Cleanup old files from downloads/final folder
// Files older than 1 hour will be deleted
export async function GET(request: NextRequest) {
  try {
    const downloadsDir = path.join(process.cwd(), 'downloads');
    const finalDir = path.join(downloadsDir, 'final');
    const tempDir = path.join(downloadsDir, 'temp');
    
    if (!fs.existsSync(finalDir)) {
      return NextResponse.json({
        success: true,
        message: 'Final directory does not exist',
        deleted: 0,
      });
    }

    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
    let deletedCount = 0;

    // Clean up final folder
    const finalFiles = fs.readdirSync(finalDir);
    for (const file of finalFiles) {
      const filePath = path.join(finalDir, file);
      try {
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;
        
        if (age > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log('[Cleanup API] Deleted old file from final:', filePath);
        }
      } catch (error) {
        console.error('[Cleanup API] Error deleting file:', filePath, error);
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
            console.log('[Cleanup API] Deleted old file from temp:', filePath);
          }
        } catch (error) {
          console.error('[Cleanup API] Error deleting file:', filePath, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} old files.`,
      deleted: deletedCount,
    });
  } catch (error) {
    console.error('[Cleanup API] Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Cleanup failed: ' + (error instanceof Error ? error.message : String(error)),
    }, { status: 500 });
  }
}
