'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    question: 'What is this site?',
    answer:
      'This is an online YouTube converter. You can paste a YouTube video URL and get an MP3 audio file or MP4 video file for personal use. No software installation is required—everything runs in your browser.',
  },
  {
    question: 'How do I convert a YouTube video to MP3 or MP4?',
    answer:
      'Paste the YouTube video link in the input field, choose your preferred format (MP3 or MP4) and quality (e.g. 720p, 1080p for video, or bitrate for audio), then click Convert. When the file is ready, click Download to save it to your device.',
  },
  {
    question: 'Is the service free?',
    answer:
      'Yes. The conversion and download tools are free to use. The service is intended for personal use only. Please comply with local copyright laws and platform terms of service.',
  },
  {
    question: 'What formats and qualities are supported?',
    answer:
      'For audio we support MP3 at various bitrates (e.g. 128–320 kbps). For video we support MP4 at resolutions such as 360p, 480p, 720p, 1080p, and 4K when available. We also offer a thumbnail downloader and Shorts downloader. Available options depend on what the source video provides.',
  },
  {
    question: 'Do you store my data or the videos I convert?',
    answer:
      'We process your request on our servers to generate the file, but we do not keep your conversions indefinitely. Temporary files are removed after a short period or after you download. We do not sell your data. See our Privacy Policy for more details.',
  },
  {
    question: 'Why is my download not working?',
    answer:
      'Some videos may be restricted by the uploader or region, or the URL may be invalid. Make sure you are using a valid YouTube URL (youtube.com or youtu.be). If you use an ad blocker, try disabling it for this site, as it can sometimes block the download request.',
  },
  {
    question: 'Can I download YouTube Shorts or 4K videos?',
    answer:
      'Yes. Use the Shorts downloader page for vertical Shorts videos and the 4K page for videos that offer 2160p. Not every video has 4K; the tool will show only the resolutions available for the video you enter.',
  },
  {
    question: 'Is it legal to use this tool?',
    answer:
      'The tool is for personal use only. You are responsible for complying with local copyright laws and the terms of service of the platforms whose content you use. We do not encourage bypassing access controls or using the service to infringe rights. See our Terms of Use for full details.',
  },
];

export default function FaqSection() {
  return (
    <section
      className="w-full border-t bg-muted/30 py-16 px-4"
      aria-labelledby="faq-heading"
    >
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          <HelpCircle className="h-7 w-7 text-primary" aria-hidden />
          <h2
            id="faq-heading"
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            Frequently Asked Questions
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border border-border rounded-lg px-4 mb-3 bg-card shadow-sm hover:shadow-md transition-shadow data-[state=open]:shadow-md"
            >
              <AccordionTrigger className="text-left font-semibold py-5 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
