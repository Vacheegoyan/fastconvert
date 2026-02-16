import type { Metadata } from 'next';
import { canonicalUrl } from '@/lib/seo';
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/json-ld';
import Converter from '@/components/converter';
import SeoContent from '@/components/seo-content';

export const metadata: Metadata = {
  title: 'YouTube to MP4 Downloader – HD Video Tool',
  description:
    'Download YouTube videos as MP4 in 360p to 1080p. Compatible with most devices. Personal use only. Users are responsible for complying with local copyright laws.',
  alternates: { canonical: canonicalUrl('/mp4') },
};

export default function MP4Page() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="YouTube to MP4 Video Downloader"
        description="Download YouTube videos as MP4. Personal use only."
        url={canonicalUrl('/mp4')}
      />
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'MP4 Converter', path: '/mp4' }]} />
      <Converter mode="mp4" />
      <SeoContent slug="mp4" />
    </>
  );
}
