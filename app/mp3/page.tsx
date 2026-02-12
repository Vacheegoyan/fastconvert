import type { Metadata } from 'next';
import { canonicalUrl } from '@/lib/seo';
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/json-ld';
import Converter from '@/components/converter';
import SeoContent from '@/components/seo-content';

export const metadata: Metadata = {
  title: 'YouTube to MP3 Converter – Audio Download Tool',
  description:
    'Extract audio from YouTube videos as MP3. Choose bitrate 128–320 kbps. Personal use only. Users are responsible for complying with local copyright laws.',
  alternates: { canonical: canonicalUrl('/mp3') },
};

export default function MP3Page() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="YouTube to MP3 Converter"
        description="Extract audio from YouTube videos as MP3. Personal use only."
        url={canonicalUrl('/mp3')}
      />
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'MP3 Converter', path: '/mp3' }]} />
      <Converter defaultQuality="mp3-192" showQualitySelector={true} mode="mp3" />
      <SeoContent slug="mp3" />
    </>
  );
}
