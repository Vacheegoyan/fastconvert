import type { Metadata } from 'next';
import { canonicalUrl } from '@/lib/seo';
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/json-ld';
import Converter from '@/components/converter';
import SeoContent from '@/components/seo-content';

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
      <Converter defaultQuality="2160p" showQualitySelector={true} mode="4k" />
      <SeoContent slug="4k" />
    </>
  );
}
