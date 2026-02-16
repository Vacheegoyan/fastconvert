'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { Download, Music, Video, Image, Film, Check, AlertCircle, Loader2, Zap, Search, X, Clipboard } from 'lucide-react';
import SearchModal from '@/components/search-modal';
import StatisticsSection from '@/components/statistics-section';
import HowToUse from '@/components/how-to-use';

type ConverterMode = 'mixed' | 'mp3' | 'mp4' | 'poster' | 'shorts' | '4k';

interface VideoMetadata {
  title?: string;
  thumbnail?: string;
  author?: string;
  duration?: number;
  resolutions?: number[];
}

interface DownloadResult {
  success: boolean;
  message: string;
  downloadUrl?: string;
}

interface ConverterProps {
  mode?: ConverterMode;
}

// Simplified: no quality selection — backend uses fixed defaults (MP3 320kbps, MP4 1080p, poster maxresdefault)
export default function Converter({
  mode = 'mixed',
}: ConverterProps) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [preparedFile, setPreparedFile] = useState<{ path: string; fileName: string } | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showRetryMessage, setShowRetryMessage] = useState(false);
  const [fileTimeout, setFileTimeout] = useState<NodeJS.Timeout | null>(null);

  const validateYoutubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
    return youtubeRegex.test(url);
  };

  const deletePreparedFile = async (filePath: string) => {
    try {
      await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete_file',
          file_path: filePath,
        }),
      });
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleUrlChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    const previousUrl = youtubeUrl;
    
    // If URL is cleared or changed and there's a prepared file, delete it first
    if ((!url.trim() || url !== previousUrl) && preparedFile) {
      await deletePreparedFile(preparedFile.path);
      setPreparedFile(null);
      setShowRetryMessage(false);
      if (fileTimeout) {
        clearTimeout(fileTimeout);
        setFileTimeout(null);
      }
    }
    
    setYoutubeUrl(url);
    setError('');
    setVideoMetadata(null);
    setDownloadResult(null);
  };

  const handleSearchModalSelect = (url: string) => {
    setYoutubeUrl(url);
    setError('');
    setVideoMetadata(null);
    setDownloadResult(null);
  };

  const handleClearUrl = async () => {
    // Delete prepared file if exists before clearing
    if (preparedFile) {
      await deletePreparedFile(preparedFile.path);
      setPreparedFile(null);
      setShowRetryMessage(false);
      if (fileTimeout) {
        clearTimeout(fileTimeout);
        setFileTimeout(null);
      }
    }
    
    setYoutubeUrl('');
    setError('');
    setVideoMetadata(null);
    setDownloadResult(null);
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setYoutubeUrl(text);
    } catch (err) {
      setError('Failed to paste from clipboard');
    }
  };

  // Fetch video preview when user stops typing
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!youtubeUrl.trim()) {
        setVideoMetadata(null);
        return;
      }

      if (!validateYoutubeUrl(youtubeUrl)) {
        setError('Invalid YouTube URL');
        return;
      }

      setIsPreviewLoading(true);
      setError('');

      try {
        const response = await fetch('/api/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: youtubeUrl,
            action: 'preview',
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setVideoMetadata(data.metadata);
        } else {
          const msg = data?.message || 'Unable to load video information';
          console.warn('[Preview] Server responded:', response.status, msg);
          setError(msg);
          setVideoMetadata(null);
        }
      } catch (err) {
        console.warn('[Preview] Request failed:', err);
        setError('Unable to load video information');
        setVideoMetadata(null);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 500);  // Reduced from 800ms to 500ms for faster preview

    return () => clearTimeout(timer);
  }, [youtubeUrl]);

  // Cleanup on unmount - delete file if user closes the page
  useEffect(() => {
    return () => {
      if (fileTimeout) {
        clearTimeout(fileTimeout);
      }
      if (preparedFile) {
        // Delete file when component unmounts (user closed page or navigated away)
        deletePreparedFile(preparedFile.path);
      }
    };
  }, [preparedFile, fileTimeout]);

  // Note: Activity tracking removed - files are managed by:
  // 1. URL clear/change - deletes file immediately
  // 2. Download - deletes file after 30 seconds
  // 3. Initial timeout - deletes file after 10 minutes if no download
  // 4. Component unmount - deletes file when user closes page

  const handleConvert = async () => {
    setError('');
    setDownloadResult(null);
    setDownloadProgress(0);
    
    // Clear previous file timeout if exists
    if (fileTimeout) {
      clearTimeout(fileTimeout);
      setFileTimeout(null);
    }
    
    // Delete previous prepared file if exists
    if (preparedFile) {
      await deletePreparedFile(preparedFile.path);
    }
    
    setPreparedFile(null);
    setShowRetryMessage(false);

    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYoutubeUrl(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    // 4K not available yet
    if (mode === '4k') {
      setError('4K - Coming Soon');
      return;
    }

    setIsLoading(true);

    try {
      const action =
        mode === 'poster'
          ? 'prepare_poster'
          : 'prepare';

      // Hardcoded defaults: MP3 320kbps, MP4 1080p, poster maxresdefault (backend also enforces these)
      const quality =
        mode === 'mp3' ? 'mp3-320' :
        mode === 'mp4' || mode === 'shorts' ? '1080p' :
        mode === 'poster' ? undefined : '1080p';
      const poster_quality = mode === 'poster' ? 'maxresdefault' : undefined;

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: youtubeUrl,
          quality: quality,
          action,
          poster_quality,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to prepare file');
        return;
      }

      if (data.file_path && data.fileName) {
        const newPreparedFile = {
          path: data.file_path,
          fileName: data.fileName,
        };
        setPreparedFile(newPreparedFile);
        setDownloadResult({
          success: true,
          message: `File ready: ${data.fileName}. Click Download to save it.`,
        });
        setDownloadProgress(100);
        
        // Set timeout to delete file after 10 minutes if download hasn't started
        // This handles inactive users - if they're not active, their files will be cleaned up
        const timeout = setTimeout(() => {
          setPreparedFile((currentFile) => {
            if (currentFile && currentFile.path === newPreparedFile.path) {
              deletePreparedFile(newPreparedFile.path);
              setDownloadResult({
                success: false,
                message: 'File expired. Please convert again.',
              });
              return null;
            }
            return currentFile;
          });
        }, 10 * 60 * 1000); // 10 minutes - enough time for active users
        setFileTimeout(timeout);
      } else {
        setError(data.message || 'Failed to prepare file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!preparedFile) {
      setError('No file prepared. Click Convert first.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'download',
          file_path: preparedFile.path,
          fileName: preparedFile.fileName,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && (contentType.includes('audio') || contentType.includes('video') || contentType.includes('image'))) {
        // This is a file download
        const blob = await response.blob();
        const disposition = response.headers.get('content-disposition');
        let fileName = preparedFile.fileName;

        if (disposition) {
          // Prefer RFC5987 encoded filename* if present
          const starMatch = disposition.match(/filename\*=UTF-8''([^;\n\r]+)/i);
          if (starMatch && starMatch[1]) {
            try {
              fileName = decodeURIComponent(starMatch[1]);
            } catch (e) {
              fileName = preparedFile.fileName;
            }
          } else {
            const nameMatch = disposition.match(/filename="?([^";]+)"?/i);
            if (nameMatch && nameMatch[1]) {
              fileName = nameMatch[1];
            }
          }
        }
        
        // Create blob URL and trigger download
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Wait a bit before revoking URL to ensure download started
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
        // File is deleted on server after download, so clear preparedFile state
        // But keep it for a short time in case user wants to see the message

        // Clear file timeout since download has started
        if (fileTimeout) {
          clearTimeout(fileTimeout);
          setFileTimeout(null);
        }

        // Show initial success message
        setDownloadResult({
          success: true,
          message: `Download started: ${fileName}`,
        });

        // File will be deleted on server after 30 seconds
        // Keep preparedFile available for retry during this time
        setShowRetryMessage(false);
        setTimeout(() => {
          setShowRetryMessage(true);
        }, 2000);
        
        // Clear preparedFile after 30 seconds (when file is deleted on server)
        setTimeout(() => {
          setPreparedFile(null);
          setShowRetryMessage(false);
        }, 30 * 1000);
      } else {
        const data = await response.json();
        setError(data.message || 'Download failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during download');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background text-foreground">
      <main className="flex min-h-screen flex-col items-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header - same design as home */}
          <div className="space-y-4 text-center animate-in fade-in duration-700 fill-mode-both">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Free &amp; fast conversion
            </div>
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-3 shadow-md ring-1 ring-primary/10">
                {mode === 'mp3' && <Music className="h-8 w-8 text-primary" />}
                {mode === 'mp4' && <Video className="h-8 w-8 text-primary" />}
                {mode === 'poster' && <Image className="h-8 w-8 text-primary" />}
                {mode === 'shorts' && <Film className="h-8 w-8 text-primary" />}
                {mode === '4k' && <Video className="h-8 w-8 text-primary" />}
                {mode === 'mixed' && <Video className="h-8 w-8 text-primary" />}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance max-w-xl">
                <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent dark:from-foreground dark:via-primary/90 dark:to-primary">
                  {mode === 'mp3' && 'YouTube to MP3 Converter'}
                  {mode === 'mp4' && 'YouTube to MP4 Video Downloader'}
                  {mode === 'poster' && 'YouTube Thumbnail Downloader'}
                  {mode === 'shorts' && 'YouTube Shorts Downloader'}
                  {mode === '4k' && 'YouTube 4K Video Downloader'}
                  {mode === 'mixed' && 'YouTube Downloader'}
                </span>
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {mode === 'mp3' && 'Extract MP3 audio from YouTube videos in high quality.'}
              {mode === 'mp4' && 'Download YouTube videos as MP4 in 1080p (Full HD).'}
              {mode === 'poster' && 'Download the video thumbnail in best resolution (up to 1280×720).'}
              {mode === 'shorts' && 'Download YouTube Shorts as MP4 in 1080p.'}
              {mode === '4k' && 'Download YouTube videos in 4K (2160p) when available.'}
              {mode === 'mixed' && 'Download YouTube videos and extract MP3 audio in high quality. Fast, safe, and free.'}
            </p>
          </div>

          {/* Main Card */}
          <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-2xl backdrop-blur-sm">
            {/* URL Input */}
            <div className="space-y-3">
              <label htmlFor="youtube-url" className="block text-sm font-semibold">
                YouTube URL
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="youtube-url"
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={handleUrlChange}
                    className="w-full rounded-lg border border-border bg-input px-4 py-3 pr-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    {isPreviewLoading && (
                      <Loader2 className="h-6 w-6 animate-spin text-accent font-bold" />
                    )}
                    {videoMetadata && !isPreviewLoading && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                    {youtubeUrl && (
                      <button
                        onClick={handleClearUrl}
                        className="p-1 hover:bg-accent/20 rounded transition-colors cursor-pointer"
                        title="Clear"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                    <button
                      onClick={handlePasteUrl}
                      className="p-1 hover:bg-accent/20 rounded transition-colors cursor-pointer"
                      title="Paste from clipboard"
                    >
                      <Clipboard className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                <Search className="h-5 w-5" />
                Search YouTube
              </button>
            </div>

            {/* Search Modal */}
            <SearchModal
              isOpen={isSearchModalOpen}
              onClose={() => setIsSearchModalOpen(false)}
              onSelectVideo={handleSearchModalSelect}
            />

            {/* Video Preview */}
            {videoMetadata && (
              <div className="space-y-3 rounded-lg border border-border/50 bg-background/50 p-4">
                <div className="flex gap-4">
                  {videoMetadata.thumbnail && (
                    <img
                      src={videoMetadata.thumbnail || "/placeholder.svg"}
                      alt="Video thumbnail"
                      className="h-20 w-32 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 space-y-1">
                    {videoMetadata.title && (
                      <h3 className="font-semibold text-sm line-clamp-2">
                        {videoMetadata.title}
                      </h3>
                    )}
                    {videoMetadata.author && (
                      <p className="text-xs text-muted-foreground">
                        by {videoMetadata.author}
                      </p>
                    )}
                    <p className="text-xs text-green-500 font-medium">
                      Video detected ✓
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4K - Coming Soon (no quality selection on any page) */}
            {mode === '4k' && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-center">
                <p className="text-sm font-medium text-primary">4K - Coming Soon</p>
                <p className="text-xs text-muted-foreground mt-1">Ultra HD downloads will be available in a future update.</p>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {isLoading && downloadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Downloading...</span>
                  <span>{downloadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {downloadResult?.success && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-green-500">{downloadResult.message}</p>
                  {preparedFile && showRetryMessage && (
                    <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      File is available for 30 seconds. If you cancelled the download, you can click the "Download" button again.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Download Button */}
            <div className="flex gap-3">
              <button
                onClick={handleConvert}
                disabled={isLoading || !videoMetadata || mode === '4k'}
                className="flex-1 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5" />
                    Convert
                  </>
                )}
              </button>
              
              <button
                onClick={handleDownload}
                disabled={!preparedFile || isLoading}
                className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-all hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* How to Use Section */}
        <HowToUse mode={mode} />

        {/* Statistics Section */}
        <StatisticsSection mode={mode} />
      </main>
    </div>
  );
}
