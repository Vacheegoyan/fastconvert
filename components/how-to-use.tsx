'use client';

import React, { useEffect, useState } from 'react';
import { 
  Clipboard, 
  Search, 
  Music, 
  Video, 
  Image as ImageIcon,
  Download,
  CheckCircle2,
  ArrowRight,
  PlayCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

export default function HowToUse({ mode = 'mixed' }: { mode?: 'mp3' | 'mp4' | 'poster' | 'shorts' | '4k' | 'mixed' }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('how-to-use-section');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const steps: Step[] = mode === 'mp3' ? [
    {
      icon: Clipboard,
      title: 'Paste YouTube URL',
      description: 'Copy and paste the YouTube video URL you want to convert to MP3',
      color: 'text-blue-500',
    },
    {
      icon: Music,
      title: 'Convert to MP3',
      description: 'MP3 is delivered at 320 kbps. No quality selection needed—just click Convert.',
      color: 'text-pink-500',
    },
    {
      icon: Download,
      title: 'Download MP3',
      description: 'Click Convert, then Download to save your high-quality MP3 audio file (320 kbps)',
      color: 'text-green-500',
    },
  ] : (mode === 'mp4' || mode === 'shorts' || mode === '4k') ? [
    {
      icon: Search,
      title: 'Find Your Video',
      description: 'Paste the YouTube URL or use our search feature to find the video you want',
      color: 'text-blue-500',
    },
    {
      icon: Video,
      title: 'Convert to MP4',
      description: 'Videos are downloaded in 1080p (Full HD). No resolution selection needed—just click Convert.',
      color: 'text-purple-500',
    },
    {
      icon: Download,
      title: 'Download Video',
      description: 'Click Convert, then Download to save your video in MP4 format',
      color: 'text-green-500',
    },
  ] : mode === 'poster' ? [
    {
      icon: Clipboard,
      title: 'Paste Video URL',
      description: 'Copy and paste the YouTube video URL to get its thumbnail',
      color: 'text-blue-500',
    },
    {
      icon: ImageIcon,
      title: 'Get Thumbnail',
      description: 'Thumbnail is downloaded in best available resolution (up to 1280×720). No size selection needed.',
      color: 'text-indigo-500',
    },
    {
      icon: Download,
      title: 'Download Thumbnail',
      description: 'Click Convert, then Download to save the video thumbnail image',
      color: 'text-green-500',
    },
  ] : [
    {
      icon: Clipboard,
      title: 'Paste YouTube URL',
      description: 'Copy and paste the YouTube video URL you want to download',
      color: 'text-blue-500',
    },
    {
      icon: PlayCircle,
      title: 'Choose Format',
      description: 'Once the video is detected, select MP3 (audio, 320 kbps) or MP4 (video, 1080p)',
      color: 'text-purple-500',
    },
    {
      icon: Download,
      title: 'Download File',
      description: 'Click Convert, then Download to save your file automatically',
      color: 'text-green-500',
    },
  ];

  return (
    <section id="how-to-use-section" className="w-full py-20 px-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            How to Use
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            {mode === 'mp3' && 'Convert YouTube videos to MP3 in 3 simple steps'}
            {(mode === 'mp4' || mode === 'shorts' || mode === '4k') && 'Download YouTube videos as MP4 in 3 easy steps'}
            {mode === 'poster' && 'Download YouTube thumbnails in 3 simple steps'}
            {mode === 'mixed' && 'Download YouTube videos or audio in 3 simple steps'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
          {/* Subtle Connecting Line (Desktop only) */}
          <div className="hidden md:block absolute top-12 left-12 right-12 h-px bg-border/50" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative"
              >
                <Card
                  className={`relative border transition-all duration-500 ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-6'
                  } hover:shadow-lg hover:border-accent/30 group`}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Step Number - More Visible */}
                  <div className="absolute -top-3 left-6 w-9 h-9 rounded-full bg-accent border-2 border-background flex items-center justify-center text-sm font-bold text-accent-foreground z-10 shadow-md">
                    {index + 1}
                  </div>

                  <CardContent className="pt-8 pb-6 px-6 space-y-4">
                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-lg bg-accent/5 ${step.color} group-hover:bg-accent/10 transition-colors duration-300`}>
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold leading-tight">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Simple Arrow (Desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                    <div className={`transition-all duration-500 ${
                      isVisible
                        ? 'opacity-100'
                        : 'opacity-0'
                    }`}
                    style={{
                      transitionDelay: `${(index + 1) * 100}ms`,
                    }}>
                      <div className="p-1.5 rounded-full bg-background border border-border/50">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pro Tips Section */}
        <div className={`mt-12 rounded-xl border-2 border-accent/20 bg-gradient-to-br from-card to-card/80 p-6 md:p-8 transition-all duration-500 shadow-md hover:shadow-lg ${
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}
        style={{
          transitionDelay: '400ms',
        }}>
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Enhanced Icon */}
            <div className="flex-shrink-0">
              <div className="p-4 rounded-xl bg-accent border-2 border-accent/30 shadow-lg">
                <CheckCircle2 className="h-7 w-7 text-accent-foreground" />
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 space-y-4">
              <h3 className="font-bold text-xl text-foreground">Pro Tips</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {mode === 'mp3' && (
                  <>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>MP3 is delivered at 320 kbps for high-quality audio</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>You can search for videos directly using the search button</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>All conversions are processed securely on our servers</span>
                    </li>
                  </>
                )}
                {(mode === 'mp4' || mode === 'shorts' || mode === '4k') && (
                  <>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>Videos are downloaded in 1080p (Full HD) for high quality</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>MP4 format is compatible with all devices and media players</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>Use the search feature to quickly find videos without leaving the page</span>
                    </li>
                  </>
                )}
                {mode === 'poster' && (
                  <>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>Thumbnails are downloaded in best available resolution (up to 1280×720)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>Thumbnails are downloaded instantly without conversion</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>All thumbnail sizes are available directly from YouTube servers</span>
                    </li>
                  </>
                )}
                {mode === 'mixed' && (
                  <>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>MP3 is perfect for music and podcasts</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>Video downloads are in 1080p; MP3 is 320 kbps</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-accent mt-0.5 flex-shrink-0">•</span>
                      <span>Use the search feature to find videos without copying URLs</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
