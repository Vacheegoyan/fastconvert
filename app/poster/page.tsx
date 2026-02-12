import type { Metadata } from 'next';
import { canonicalUrl } from '@/lib/seo';
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/json-ld';
import Converter from '@/components/converter';
import SeoContent from '@/components/seo-content';

export const metadata: Metadata = {
  title: 'YouTube Thumbnail Downloader – Image Tool',
  description:
    'Download YouTube video thumbnails in several sizes. For preview or reference. Personal use only. Users are responsible for complying with local copyright laws.',
  alternates: { canonical: canonicalUrl('/poster') },
};

export default function PosterPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="YouTube Thumbnail Downloader"
        description="Download YouTube video thumbnails. Personal use only."
        url={canonicalUrl('/poster')}
      />
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Thumbnail Downloader', path: '/poster' }]} />
      <Converter defaultQuality="poster-maxresdefault" showQualitySelector={true} mode="poster" />
      <SeoContent slug="poster" />
    </>
  );
}
