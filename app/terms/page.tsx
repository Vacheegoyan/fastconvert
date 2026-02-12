import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, ArrowLeft, FileCheck, AlertTriangle } from 'lucide-react';
import { canonicalUrl } from '@/lib/seo';
import { BreadcrumbJsonLd } from '@/components/json-ld';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'Terms of use for this website. Acceptable use and user responsibilities.',
  alternates: { canonical: canonicalUrl('/terms') },
};

const SECTIONS = [
  {
    icon: FileCheck,
    title: 'Acceptable Use',
    content:
      'This tool is for personal use only. You must comply with all applicable laws, including copyright and terms of service of the platforms whose content you use. We do not encourage bypassing access controls or using the service to infringe rights.',
  },
  {
    icon: Scale,
    title: 'User Responsibility',
    content:
      'Users are responsible for ensuring that their use of the service does not violate copyright, trademark, or other rights. We are not responsible for how you use the downloaded content.',
  },
  {
    icon: AlertTriangle,
    title: 'Disclaimer',
    content:
      'The service is provided as is. We do not guarantee availability, accuracy, or fitness for a particular purpose. We are not liable for any damages arising from your use of the site.',
  },
  {
    icon: FileCheck,
    title: 'Changes',
    content:
      'We may change these terms from time to time. Continued use of the site after changes constitutes acceptance of the updated terms.',
  },
];

export default function TermsPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Home', path: '/' }, { name: 'Terms of Use', path: '/terms' }]} />
      <article className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="rounded-2xl bg-primary/10 p-4 mb-6">
              <Scale className="h-12 w-12 text-primary" aria-hidden />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Terms of Use
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              By using this site, you agree to use it in a lawful and responsible way. You can update this content to match your actual terms.
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
