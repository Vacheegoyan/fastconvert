import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft, FileText } from 'lucide-react';
import { canonicalUrl } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy policy for this website. How we handle data when you use our tools.',
  alternates: { canonical: canonicalUrl('/privacy') },
};

const SECTIONS = [
  {
    icon: FileText,
    title: 'Information We Collect',
    content:
      'When you use our conversion tools, we may receive the URLs you submit and process them on our servers to generate the requested output. We do not store your conversions indefinitely; temporary files are removed after a short period or after you download.',
  },
  {
    icon: Shield,
    title: 'How We Use Information',
    content:
      'We use the data necessary to provide the service (e.g. fetching video information and generating files). We do not sell your data. Analytics may be used to understand usage in aggregate and improve the site.',
  },
  {
    icon: FileText,
    title: 'Cookies and Storage',
    content:
      'We may use cookies or local storage for preferences (e.g. theme) and for essential operation of the site. You can control cookies through your browser settings.',
  },
  {
    icon: Shield,
    title: 'Third Parties',
    content:
      'Our infrastructure or analytics providers may process data in accordance with their own policies. We recommend reviewing their privacy notices if you have concerns.',
  },
  {
    icon: FileText,
    title: 'Changes',
    content:
      'We may update this policy from time to time. The effective date or a change log can be added here.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Privacy Policy', path: '/privacy' }]} />
      <article className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="rounded-2xl bg-primary/10 p-4 mb-6">
              <Shield className="h-12 w-12 text-primary" aria-hidden />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              This page describes how we handle information when you use this site. You can update this content to match your actual practices.
            </p>
          </div>

          <div className="space-y-6">
            {SECTIONS.map((section, index) => {
              const Icon = section.icon;
              return (
                <section
                  key={index}
                  className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-muted p-2.5 shrink-0">
                      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground mb-3">
                        {section.title}
                      </h2>
                      <p className="text-muted-foreground leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
