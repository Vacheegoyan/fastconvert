import type { Metadata } from 'next';
import { canonicalUrl } from '@/lib/seo';
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/json-ld';
import HomeClient from '@/components/home-client';
import SeoContent from '@/components/seo-content';

export const metadata: Metadata = {
  title: 'YouTube Video Converter – Download MP3 & MP4 Online',
  description:
    'Convert YouTube videos to MP3 or MP4 online. Choose format and quality. Personal use only. Users are responsible for complying with local copyright laws.',
  alternates: { canonical: canonicalUrl('/') },
};

export default function HomePage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="YouTube Video Converter"
        description="Convert YouTube videos to MP3 or MP4 online. Personal use only."
        url={canonicalUrl('/')}
      />
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }]} />
      <HomeClient />
      <SeoContent slug="home" />
    </>
  );
}
