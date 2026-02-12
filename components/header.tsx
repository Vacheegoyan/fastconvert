'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, Video, Image, Film } from 'lucide-react';

const navItems = [
  { href: '/mp3', icon: Music, label: 'MP3' },
  { href: '/mp4', icon: Video, label: 'MP4' },
  { href: '/poster', icon: Image, label: 'Poster' },
  { href: '/shorts', icon: Film, label: 'Shorts' },
  { href: '/4k', icon: Video, label: '4K' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-background/70">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 sm:h-16 items-center justify-between gap-4">
        {/* Logo and Brand */}
        <Link
          href="/"
          aria-current={pathname === '/' ? 'page' : undefined}
          className={`flex items-center gap-2.5 font-bold text-[11px] sm:text-xl tracking-tight cursor-pointer rounded-lg px-2 py-1.5 -ml-2 transition-colors ${
            pathname === '/' ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted/80 hover:text-primary'
          }`}
        >
          <img
            src="/logo.png"
            alt="fast-convertor"
            className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg object-contain"
          />
          <span style={{ fontFamily: 'var(--font-rubik-storm)' }} className="tracking-widest uppercase hidden sm:inline">
            fast-convertor
          </span>
        </Link>

        {/* Navigation Menu */}
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-2.5 transition-all duration-200 min-w-[2.5rem] sm:min-w-0 border ${
                  isActive
                    ? 'bg-primary/15 text-primary border-primary/40 hover:bg-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 border-transparent hover:border-border'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" aria-hidden />
                <span className="text-[10px] sm:text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
