'use client';

import React, { useState } from 'react';
import { Search, Loader2, Play, X, Clipboard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface VideoResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  url: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (url: string) => void;
}

export default function SearchModal({ isOpen, onClose, onSelectVideo }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsSearching(true);
    setError('');
    setSearchResults([]);
    setHasSearched(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.results) {
        setSearchResults(data.results);
      } else {
        const msg = data?.message || 'Failed to search videos';
        console.warn('[Search] Server responded:', response.status, msg);
        setError(msg);
      }
    } catch (err) {
      console.warn('[Search] Request failed:', err);
      setError('An error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectVideo = (url: string) => {
    onSelectVideo(url);
    setSearchQuery('');
    setHasSearched(false);
    setSearchResults([]);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setError('');
  };

  const handlePasteSearch = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSearchQuery(text);
    } catch (err) {
      setError('Failed to paste from clipboard');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl border-border bg-card shadow-2xl backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Search YouTube Videos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
        {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search for videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSearching}
                className="w-full rounded-lg border border-border bg-input px-4 py-3 pr-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                {isSearching && (
                  <Loader2 className="h-6 w-6 animate-spin text-accent font-bold" />
                )}
                {searchQuery && !isSearching && (
                  <button
                    onClick={handleClearSearch}
                    className="p-1 hover:bg-accent/20 rounded transition-colors cursor-pointer"
                    title="Clear"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
                <button
                  onClick={handlePasteSearch}
                  className="p-1 hover:bg-accent/20 rounded transition-colors cursor-pointer"
                  title="Paste from clipboard"
                >
                  <Clipboard className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Search Results */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((video) => (
                <div
                  key={video.id}
                  className="flex gap-3 p-3 rounded-lg border border-border/50 bg-background/50 hover:border-accent/50 hover:bg-accent/10 cursor-pointer transition-all"
                  onClick={() => handleSelectVideo(video.url)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectVideo(video.url);
                    }
                  }}
                >
                  <div className="flex-shrink-0 relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-24 h-16 rounded-lg object-cover"
                    />
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 text-xs bg-background/90 text-foreground px-1.5 py-0.5 rounded font-medium">
                        {video.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-2 text-foreground">
                      {video.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{video.channel}</p>
                  </div>
                  <div className="flex items-center">
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))
            ) : (
              !isSearching && hasSearched && (
                <p className="text-center text-muted-foreground py-8">
                  No results found
                </p>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
