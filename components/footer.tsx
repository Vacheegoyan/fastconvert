'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background w-full">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-muted-foreground max-w-2xl">
          This tool is for personal use only. Users are responsible for complying with local copyright laws.
        </p>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
            Terms of Use
          </Link>
        </nav>
        <p className="text-sm text-muted-foreground">
          © {currentYear} fast-convertor. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
