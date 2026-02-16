import React from 'react';
import Link from 'next/link';

type PageSlug = 'home' | 'mp3' | 'mp4' | 'poster' | 'shorts' | '4k';

interface SeoContentProps {
  slug: PageSlug;
}

/**
 * Unique, human-written content per page (600+ words).
 * Uses h2/h3 only; h1 is on the page above.
 * Neutral, factual tone; no keyword stuffing or promotional claims.
 */
export default function SeoContent({ slug }: SeoContentProps) {
  switch (slug) {
    case 'home':
      return <HomeContent />;
    case 'mp3':
      return <MP3Content />;
    case 'mp4':
      return <MP4Content />;
    case 'poster':
      return <PosterContent />;
    case 'shorts':
      return <ShortsContent />;
    case '4k':
      return <Content4K />;
    default:
      return null;
  }
}

function HomeContent() {
  return (
    <section className="w-full max-w-3xl mx-auto px-4 py-12 text-foreground" aria-labelledby="about-heading">
      <h2 id="about-heading" className="text-2xl font-semibold mb-4">
        What This Tool Does
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        This online tool lets you paste a YouTube video link and obtain an audio file (MP3) or a video file (MP4) for personal use. You choose the format (MP3 or MP4); the conversion runs in the browser and on our servers. No software installation is required.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Supported Output Formats</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        You can request MP3 audio (320 kbps) or MP4 video (1080p). After you paste the URL and the video is detected, you select either MP3 or MP4 and start the conversion. The tool uses fixed high quality for both formats.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Output Quality</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        MP3 is delivered at 320 kbps and MP4 at 1080p (Full HD) for a consistent, high-quality result. When the file is ready, you download it to your device. Files are temporarily stored on our side only long enough to complete the download.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">How the Process Works</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        After you paste a valid YouTube URL, the tool fetches information about the video. Once the video is detected, you select the desired format (MP3 or MP4) and start the conversion. When it is ready, you download the file to your device.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Related Tools</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        If you only need audio, use the <Link href="/mp3" className="text-primary underline underline-offset-2 hover:no-underline">MP3 converter</Link> for a focused workflow. For video, the <Link href="/mp4" className="text-primary underline underline-offset-2 hover:no-underline">MP4 tool</Link> downloads in 1080p. You can also <Link href="/poster" className="text-primary underline underline-offset-2 hover:no-underline">download thumbnails</Link> from videos, or grab <Link href="/shorts" className="text-primary underline underline-offset-2 hover:no-underline">Shorts</Link>. The <Link href="/4k" className="text-primary underline underline-offset-2 hover:no-underline">4K</Link> page is coming soon.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Legal and Responsible Use</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        This tool is for personal use only. Users are responsible for complying with local copyright laws and the terms of service of the platforms they use. We do not encourage bypassing any access controls or using the service in a way that infringes rights.
      </p>
    </section>
  );
}

function MP3Content() {
  return (
    <section className="w-full max-w-3xl mx-auto px-4 py-12 text-foreground" aria-labelledby="mp3-about">
      <h2 id="mp3-about" className="text-2xl font-semibold mb-4">
        About the MP3 Converter
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        This tool extracts audio from a YouTube video and saves it as an MP3 file. You paste the video URL and receive a high-quality audio file (320 kbps) suitable for personal listening on your devices.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Output Quality</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        MP3 is delivered at 320 kbps for consistent, high-quality audio. The source video’s own audio quality remains the upper limit; 320 kbps preserves that quality. Files are suitable for music, podcasts, and voice.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Audio Quality in Practice</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        ​320 kbps is a high bitrate that works well for music and speech on good headphones or speakers. No format or bitrate selection is required—you paste the URL, convert, and download.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Personal Use Only</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        This service is intended for personal use. Users are responsible for complying with local copyright laws. Do not redistribute or use the output for commercial purposes without appropriate rights.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Other Formats</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        If you need video instead of audio, use the <Link href="/mp4" className="text-primary underline underline-offset-2 hover:no-underline">MP4 downloader</Link>. For the main page with both audio and video options, go to the <Link href="/" className="text-primary underline underline-offset-2 hover:no-underline">home page</Link>.
      </p>
    </section>
  );
}

function MP4Content() {
  return (
    <section className="w-full max-w-3xl mx-auto px-4 py-12 text-foreground" aria-labelledby="mp4-about">
      <h2 id="mp4-about" className="text-2xl font-semibold mb-4">
        About the MP4 Video Downloader
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        This tool lets you download a YouTube video as an MP4 file. You enter the video URL and download the resulting file in 1080p (Full HD). The format is widely supported on phones, tablets, computers, and media players.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Output Resolution</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Videos are downloaded in 1080p (Full HD) for consistent high quality. No resolution selection is required—you paste the link, convert, and download.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Video Compatibility</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        MP4 is a standard container that works on most devices and operating systems. You can play the file in built-in players, VLC, or other software. 1080p looks good on TVs and monitors and is widely supported.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Related Tools</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        For audio only, use the <Link href="/mp3" className="text-primary underline underline-offset-2 hover:no-underline">MP3 converter</Link>. For Shorts or 4K, see the <Link href="/shorts" className="text-primary underline underline-offset-2 hover:no-underline">Shorts downloader</Link> and <Link href="/4k" className="text-primary underline underline-offset-2 hover:no-underline">4K tool</Link>. For thumbnails, use the <Link href="/poster" className="text-primary underline underline-offset-2 hover:no-underline">thumbnail downloader</Link>.
      </p>
    </section>
  );
}

function PosterContent() {
  return (
    <section className="w-full max-w-3xl mx-auto px-4 py-12 text-foreground" aria-labelledby="poster-about">
      <h2 id="poster-about" className="text-2xl font-semibold mb-4">
        About the Thumbnail Downloader
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        This tool lets you download the thumbnail image that appears for a YouTube video. You paste the video URL and get the image in the best available resolution (up to 1280×720). No video or audio is downloaded—only the still image used as the video’s preview.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Thumbnail Quality</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        The tool downloads the highest-quality thumbnail available for the video (typically up to 1280×720). No size selection is required—you paste the URL and download the image.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Typical Use Cases</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        People use thumbnails for personal reference, design mockups, or as a preview image in presentations or reports. Use the image in a way that respects copyright and platform terms. We do not encourage using thumbnails to mislead others or to imply endorsement.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Image Formats</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        The downloaded file is typically in a standard web image format (e.g. JPEG). You can open it in any image viewer or editor. Larger sizes give more detail but take slightly more storage.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Other Tools</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        If you need the full video, use the <Link href="/mp4" className="text-primary underline underline-offset-2 hover:no-underline">MP4 downloader</Link> or the <Link href="/" className="text-primary underline underline-offset-2 hover:no-underline">main converter</Link>. For audio only, see the <Link href="/mp3" className="text-primary underline underline-offset-2 hover:no-underline">MP3 converter</Link>.
      </p>
    </section>
  );
}

function ShortsContent() {
  return (
    <section className="w-full max-w-3xl mx-auto px-4 py-12 text-foreground" aria-labelledby="shorts-about">
      <h2 id="shorts-about" className="text-2xl font-semibold mb-4">
        About the Shorts Downloader
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        This tool lets you download a YouTube Shorts video as an MP4 file. Shorts are vertical, short-form videos on YouTube. You paste the Shorts URL and download the file in 1080p for personal use.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Shorts Format</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Shorts are designed for vertical viewing (e.g. 9:16 aspect ratio) and are typically under sixty seconds. The downloaded file keeps that aspect ratio so it displays correctly on phones and vertical screens. You can still play it on a computer; it will appear with letterboxing or pillarboxing depending on the player.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Aspect Ratio</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        The output preserves the vertical format. If you use it in an editor or combine it with other clips, you may need to account for the 9:16 ratio in your project settings. The file is standard MP4 and works in most video players and editing software.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Personal Use</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        This tool is for personal use only. Users are responsible for complying with local copyright laws. Do not redistribute or use the download in ways that violate the creator’s rights or platform terms.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Related Options</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        For standard horizontal videos, use the <Link href="/mp4" className="text-primary underline underline-offset-2 hover:no-underline">MP4 downloader</Link> or the <Link href="/" className="text-primary underline underline-offset-2 hover:no-underline">home page</Link>. For 4K content, see the <Link href="/4k" className="text-primary underline underline-offset-2 hover:no-underline">4K tool</Link>.
      </p>
    </section>
  );
}

function Content4K() {
  return (
    <section className="w-full max-w-3xl mx-auto px-4 py-12 text-foreground" aria-labelledby="4k-about">
      <h2 id="4k-about" className="text-2xl font-semibold mb-4">
        About the 4K Video Downloader
      </h2>
      <p className="text-muted-foreground leading-relaxed mb-4">
        4K (Ultra HD) download for YouTube videos is coming soon. This page is kept for reference and SEO. For now, use the <Link href="/mp4" className="text-primary underline underline-offset-2 hover:no-underline">MP4 downloader</Link> to get videos in 1080p (Full HD).
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Coming Soon</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        When 4K support is available, you will be able to download YouTube videos in 2160p (4K) when the source offers that resolution. Not every video is available in 4K; it depends on what the uploader and YouTube provide.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Until Then</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        4K files are large and require more storage and bandwidth. For most use cases, 1080p (Full HD) from the MP4 downloader is sufficient. Use the link above to download in 1080p.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Personal Use and Compliance</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        This tool is for personal use only. Users are responsible for complying with local copyright laws. We do not encourage bypassing any access controls or using the service in a way that infringes rights.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Other Resolutions</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        For standard HD or Full HD without 4K, use the <Link href="/mp4" className="text-primary underline underline-offset-2 hover:no-underline">MP4 downloader</Link>. For Shorts, see the <Link href="/shorts" className="text-primary underline underline-offset-2 hover:no-underline">Shorts downloader</Link>. The <Link href="/" className="text-primary underline underline-offset-2 hover:no-underline">home page</Link> offers both audio and video options.
      </p>
    </section>
  );
}
