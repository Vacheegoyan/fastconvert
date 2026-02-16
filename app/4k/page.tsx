import type { Metadata } from 'next';
import Link from 'next/link';
import { canonicalUrl } from '@/lib/seo';
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/json-ld';
import SeoContent from '@/components/seo-content';
import { Video } from 'lucide-react';

export const metadata: Metadata = {
  title: 'YouTube 4K Downloader – Ultra HD Tool',
  description:
    'Download YouTube videos in 4K (2160p) when available. Large files, device requirements apply. Personal use only. Users are responsible for complying with local copyright laws.',
  alternates: { canonical: canonicalUrl('/4k') },
};

export default function FourKPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="YouTube 4K Video Downloader"
        description="Download YouTube videos in 4K when available. Personal use only."
        url={canonicalUrl('/4k')}
      />
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: '4K Downloader', path: '/4k' }]} />
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background text-foreground">
        <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-6 shadow-md ring-1 ring-primary/10 inline-flex">
              <Video className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                YouTube 4K Downloader
              </span>
            </h1>
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-8">
              <p className="text-lg font-semibold text-primary">Coming Soon</p>
              <p className="text-sm text-muted-foreground mt-2">
                Ultra HD (4K) downloads will be available in a future update. Use MP4 for 1080p in the meantime.
              </p>
            </div>
            <Link
              href="/mp4"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Download in 1080p (MP4)
            </Link>
          </div>
        </main>
        <SeoContent slug="4k" />
      </div>
    </>
  );
}
