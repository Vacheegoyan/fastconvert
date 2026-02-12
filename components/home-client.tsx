'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Download, Music, Video, Check, AlertCircle, Loader2, Zap, Search, X, Clipboard } from 'lucide-react';
import SearchModal from '@/components/search-modal';
import StatisticsSection from '@/components/statistics-section';
import HowToUse from '@/components/how-to-use';

type Quality = 'mp3' | '360p' | '480p' | '720p' | '1080p';

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

export default function HomeClient() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [quality, setQuality] = useState<Quality>('mp3');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadResult, setDownloadResult] = useState<DownloadResult | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [preparedFile, setPreparedFile] = useState<{ path: string; fileName: string } | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const validateYoutubeUrl = (url: string): boolean => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\//;
    return youtubeRegex.test(url);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
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

  const handleClearUrl = () => {
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: youtubeUrl, action: 'preview' }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setVideoMetadata(data.metadata);
        } else {
          setError('Unable to load video information');
          setVideoMetadata(null);
        }
      } catch (err) {
        setError('Unable to load video information');
        setVideoMetadata(null);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [youtubeUrl]);

  const handleConvert = async () => {
    setError('');
    setDownloadResult(null);
    setDownloadProgress(0);
    setPreparedFile(null);
    if (!youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }
    if (!validateYoutubeUrl(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl, quality, action: 'prepare' }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to prepare file');
        return;
      }
      if (data.file_path && data.fileName) {
        setPreparedFile({ path: data.file_path, fileName: data.fileName });
        setDownloadResult({
          success: true,
          message: `File ready: ${data.fileName}. Click Download to save it.`,
        });
        setDownloadProgress(100);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'download',
          file_path: preparedFile.path,
          fileName: preparedFile.fileName,
        }),
      });
      if (response.ok && (response.headers.get('content-type')?.includes('audio') || response.headers.get('content-type')?.includes('video'))) {
        const blob = await response.blob();
        const disposition = response.headers.get('content-disposition');
        let fileName = preparedFile.fileName;
        if (disposition) {
          const starMatch = disposition.match(/filename\*=UTF-8''([^;\n\r]+)/i);
          if (starMatch?.[1]) {
            try {
              fileName = decodeURIComponent(starMatch[1]);
            } catch {
              fileName = preparedFile.fileName;
            }
          } else {
            const nameMatch = disposition.match(/filename="?([^";]+)"?/i);
            if (nameMatch?.[1]) fileName = nameMatch[1];
          }
        }
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        setDownloadResult({ success: true, message: `Downloaded: ${fileName}` });
        setPreparedFile(null);
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
      <div className="flex min-h-screen flex-col items-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
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
                <Video className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance max-w-xl">
                <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent dark:from-foreground dark:via-primary/90 dark:to-primary">
                  YouTube to MP3 and MP4 Converter
                </span>
              </h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Paste a YouTube video URL to convert it to MP3 audio or MP4 video. Choose format and quality, then download for personal use.
            </p>
          </div>

          <div className="space-y-6 rounded-2xl border border-border bg-card p-8 shadow-2xl backdrop-blur-sm">
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
                    {isPreviewLoading && <Loader2 className="h-6 w-6 animate-spin text-accent font-bold" />}
                    {videoMetadata && !isPreviewLoading && <Check className="h-5 w-5 text-green-500" />}
                    {youtubeUrl && (
                      <button onClick={handleClearUrl} className="p-1 hover:bg-accent/20 rounded transition-colors cursor-pointer" title="Clear">
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                    <button onClick={handlePasteUrl} className="p-1 hover:bg-accent/20 rounded transition-colors cursor-pointer" title="Paste from clipboard">
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

            <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} onSelectVideo={handleSearchModalSelect} />

            {videoMetadata && (
              <div className="space-y-3 rounded-lg border border-border/50 bg-background/50 p-4">
                <div className="flex gap-4">
                  {videoMetadata.thumbnail && (
                    <img src={videoMetadata.thumbnail || '/placeholder.svg'} alt="Video thumbnail" className="h-20 w-32 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 space-y-1">
                    {videoMetadata.title && <h3 className="font-semibold text-sm line-clamp-2">{videoMetadata.title}</h3>}
                    {videoMetadata.author && <p className="text-xs text-muted-foreground">by {videoMetadata.author}</p>}
                    <p className="text-xs text-green-500 font-medium">Video detected ✓</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="block text-sm font-semibold">Select Quality</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  { value: 'mp3' as Quality, label: 'MP3', icon: Music, description: 'Audio' },
                  { value: '360p' as Quality, label: '360p', icon: Video, description: 'SD' },
                  { value: '480p' as Quality, label: '480p', icon: Video, description: 'SD' },
                  { value: '720p' as Quality, label: '720p', icon: Video, description: 'HD' },
                  { value: '1080p' as Quality, label: '1080p', icon: Video, description: 'Full HD' },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setQuality(option.value)}
                      disabled={!videoMetadata}
                      className={`relative flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all text-center cursor-pointer ${
                        quality === option.value ? 'border-accent bg-accent/15' : 'border-border bg-background hover:border-accent/50'
                      } ${!videoMetadata ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-semibold">{option.label}</span>
                      <span className="text-[10px] text-muted-foreground">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

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
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                </div>
              </div>
            )}

            {downloadResult?.success && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-500">{downloadResult.message}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConvert}
                disabled={isLoading || !videoMetadata}
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

        <HowToUse mode="mixed" />
        <StatisticsSection mode="mixed" />
      </div>
    </div>
  );
}
