'use client';

import React, { useEffect, useState } from 'react';
import { 
  Download, 
  Users, 
  Zap, 
  Shield, 
  Clock, 
  TrendingUp, 
  Globe, 
  Star,
  Music,
  Video,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface StatCard {
  icon: React.ElementType;
  value: string;
  label: string;
  description: string;
  color: string;
  delay: number;
}

interface InfoCard {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  delay: number;
}

export default function StatisticsSection({ mode = 'mixed' }: { mode?: 'mp3' | 'mp4' | 'poster' | 'shorts' | '4k' | 'mixed' }) {
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

    const element = document.getElementById('statistics-section');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  // Generate random but realistic statistics
  const stats: StatCard[] = [
    {
      icon: Download,
      value: '2.5M+',
      label: 'Downloads',
      description: 'Total downloads completed',
      color: 'text-blue-500',
      delay: 0,
    },
    {
      icon: Users,
      value: '150K+',
      label: 'Active Users',
      description: 'Users this month',
      color: 'text-green-500',
      delay: 100,
    },
    {
      icon: Zap,
      value: '< 30s',
      label: 'Avg Speed',
      description: 'Average conversion time',
      color: 'text-yellow-500',
      delay: 200,
    },
    {
      icon: TrendingUp,
      value: '99.9%',
      label: 'Success Rate',
      description: 'Successful conversions',
      color: 'text-purple-500',
      delay: 300,
    },
  ];

  const infoCards: InfoCard[] = mode === 'mp3' ? [
    {
      icon: Music,
      title: 'High Quality Audio',
      description: 'Extract crystal-clear MP3 audio from any YouTube video at 320 kbps.',
      color: 'text-pink-500',
      delay: 0,
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Convert and download your favorite music in seconds. No waiting, no delays.',
      color: 'text-yellow-500',
      delay: 100,
    },
    {
      icon: Shield,
      title: '100% Safe',
      description: 'All downloads are processed securely. No malware, no ads, no tracking.',
      color: 'text-green-500',
      delay: 200,
    },
  ] : (mode === 'mp4' || mode === 'shorts' || mode === '4k') ? [
    {
      icon: Video,
      title: 'Multiple Resolutions',
      description: 'Download videos in any quality from 360p to 4K. Choose the perfect resolution for your needs.',
      color: 'text-blue-500',
      delay: 0,
    },
    {
      icon: Globe,
      title: 'Universal Compatibility',
      description: 'Works with all devices and players. MP4 format ensures maximum compatibility.',
      color: 'text-purple-500',
      delay: 100,
    },
    {
      icon: Clock,
      title: 'Quick Downloads',
      description: 'Fast download speeds with optimized compression. Get your videos in minutes.',
      color: 'text-orange-500',
      delay: 200,
    },
  ] : mode === 'poster' ? [
    {
      icon: ImageIcon,
      title: 'High Resolution',
      description: 'Download thumbnails in best available resolution (up to 1280×720).',
      color: 'text-indigo-500',
      delay: 0,
    },
    {
      icon: Star,
      title: 'Perfect Quality',
      description: 'Get the best quality thumbnails directly from YouTube servers.',
      color: 'text-yellow-500',
      delay: 100,
    },
    {
      icon: CheckCircle2,
      title: 'Instant Access',
      description: 'Download thumbnails instantly without any conversion process.',
      color: 'text-green-500',
      delay: 200,
    },
  ] : [
    {
      icon: Download,
      title: 'All Formats',
      description: 'Download videos as MP4 (1080p) or extract audio as MP3 (320 kbps). Choose format and go.',
      color: 'text-blue-500',
      delay: 0,
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your downloads are processed securely. We never store or track your activity.',
      color: 'text-green-500',
      delay: 100,
    },
    {
      icon: Zap,
      title: 'Free Forever',
      description: 'No hidden fees, no subscriptions. All features are completely free to use.',
      color: 'text-yellow-500',
      delay: 200,
    },
  ];

  return (
    <section id="statistics-section" className="w-full py-16 px-4">
      <div className="w-full max-w-6xl mx-auto space-y-12">
        {/* Statistics Cards */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Platform Statistics</h2>
            <p className="text-muted-foreground">Trusted by millions of users worldwide</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className={`relative overflow-hidden border-2 transition-all duration-500 ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-10'
                  } hover:shadow-lg hover:scale-105`}
                  style={{
                    transitionDelay: `${stat.delay}ms`,
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-transparent rounded-bl-full" />
                  <CardHeader className="relative">
                    <div className={`inline-flex p-3 rounded-lg bg-accent/10 mb-2 ${stat.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-3xl font-bold">{stat.value}</CardTitle>
                    <CardDescription className="text-base font-semibold">{stat.label}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Information Cards */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Why Choose Us?</h2>
            <p className="text-muted-foreground">Everything you need for your YouTube downloads</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {infoCards.map((info, index) => {
              const Icon = info.icon;
              return (
                <Card
                  key={index}
                  className={`relative overflow-hidden border-2 transition-all duration-500 ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-10'
                  } hover:shadow-xl hover:scale-105 hover:border-accent/50 group`}
                  style={{
                    transitionDelay: `${info.delay}ms`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <CardHeader className="relative">
                    <div className={`inline-flex p-4 rounded-xl bg-accent/10 mb-4 group-hover:scale-110 transition-transform duration-300 ${info.color}`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-xl">{info.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-base leading-relaxed">
                      {info.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Animated Features Bar */}
        <div
          className={`mt-12 rounded-2xl border-2 border-border bg-gradient-to-r from-card via-accent/5 to-card p-8 transition-all duration-700 ${
            isVisible
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
          }`}
        >
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            {[
              { icon: Shield, text: '100% Secure' },
              { icon: Zap, text: 'Lightning Fast' },
              { icon: Globe, text: 'No Registration' },
              { icon: Star, text: 'Free Forever' },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-500 ${
                    isVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-5'
                  }`}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
