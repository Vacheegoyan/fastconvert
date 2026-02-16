import type { Metadata } from 'next';
import { canonicalUrl } from '@/lib/seo';
import { BreadcrumbJsonLd, SoftwareApplicationJsonLd } from '@/components/json-ld';
import Converter from '@/components/converter';
import SeoContent from '@/components/seo-content';

export const metadata: Metadata = {
  title: 'YouTube Shorts Downloader – Short Video Tool',
  description:
    'Download YouTube Shorts as MP4. Vertical format, common resolutions. Personal use only. Users are responsible for complying with local copyright laws.',
  alternates: { canonical: canonicalUrl('/shorts') },
};

export default function ShortsPage() {
  return (
    <>
      <SoftwareApplicationJsonLd
        name="YouTube Shorts Downloader"
        description="Download YouTube Shorts as MP4. Personal use only."
        url={canonicalUrl('/shorts')}
      />
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Shorts Downloader', path: '/shorts' }]} />
      <Converter mode="shorts" />
      <SeoContent slug="shorts" />
    </>
  );
}
