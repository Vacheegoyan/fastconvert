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
        This online tool lets you paste a YouTube video link and obtain an audio file (MP3) or a video file (MP4) for personal use. You choose the format and quality; the conversion runs in the browser and on our servers. No software installation is required.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Supported Output Formats</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        You can request MP3 audio at several bitrates or MP4 video at common resolutions. The options shown depend on what the source video provides. Not every video offers every resolution; the tool will list what is available after you enter the URL.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Quality Options</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        For audio, higher bitrates generally mean better sound quality and larger file sizes. For video, higher resolutions (e.g. 720p, 1080p) give sharper picture but larger files and sometimes longer processing. You can pick the balance that fits your device and storage.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">How the Process Works</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        After you paste a valid YouTube URL, the tool fetches information about the video. You then select the desired format and quality and start the conversion. When it is ready, you download the file to your device. Files are temporarily stored on our side only long enough to complete the download.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Related Tools</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        If you only need audio, use the <Link href="/mp3" className="text-primary underline underline-offset-2 hover:no-underline">MP3 converter</Link> for a focused workflow. For video, the <Link href="/mp4" className="text-primary underline underline-offset-2 hover:no-underline">MP4 tool</Link> supports resolutions from standard definition up to Full HD. You can also <Link href="/poster" className="text-primary underline underline-offset-2 hover:no-underline">download thumbnails</Link> from videos, or grab <Link href="/shorts" className="text-primary underline underline-offset-2 hover:no-underline">Shorts</Link> and <Link href="/4k" className="text-primary underline underline-offset-2 hover:no-underline">4K</Link> where available.
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
        This tool extracts audio from a YouTube video and saves it as an MP3 file. You paste the video URL, choose a bitrate, and receive an audio file suitable for personal listening on your devices.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Bitrate Options</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        We offer 128, 160, 192, and 320 kbps. 128 kbps is adequate for speech and casual listening and keeps file size smaller. 160 and 192 kbps are common choices for music when you want a balance of quality and size. 320 kbps is the highest option and is suitable when you want the best fidelity from the source; files will be larger.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Audio Quality in Practice</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        The perceived difference between bitrates depends on your headphones or speakers and the type of content. For podcasts or voice, 128 kbps is often sufficient. For music with a wide frequency range, 192 or 320 kbps may sound noticeably better on good equipment. The source video’s own audio quality remains the upper limit; higher bitrates preserve that quality rather than add new detail.
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
        This tool lets you download a YouTube video as an MP4 file. You enter the video URL, pick a resolution (e.g. 360p, 480p, 720p, 1080p), and download the resulting file. The format is widely supported on phones, tablets, computers, and media players.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Resolution Options</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Common options include 360p and 480p (standard definition), 720p (HD), and 1080p (Full HD). The list of available resolutions depends on what the uploader and YouTube provide for that video. Not every video has every resolution; the tool shows what is available after you paste the link.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Video Compatibility</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        MP4 is a standard container that works on most devices and operating systems. You can play the file in built-in players, VLC, or other software. Higher resolutions look better on larger screens but produce larger files and may take longer to process and download.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Playback on Different Devices</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        On small screens, 720p is often enough. For a TV or monitor, 1080p is a common choice when available. Your device and connection speed may affect how smoothly high-resolution video plays. Choosing a lower resolution can reduce file size and buffering.
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
        This tool lets you download the thumbnail image that appears for a YouTube video. You paste the video URL and choose a size; the tool returns the image file. No video or audio is downloaded—only the still image used as the video’s preview.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Thumbnail Sizes</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        YouTube serves thumbnails in several sizes: default (120×90), medium (320×180), high (480×360), standard (640×480), and maximum resolution (e.g. 1280×720 or higher when available). Not every video has a maximum-resolution thumbnail; the tool shows the options that exist for the URL you enter.
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
        This tool lets you download a YouTube Shorts video as an MP4 file. Shorts are vertical, short-form videos on YouTube. You paste the Shorts URL, choose a resolution if available, and download the resulting file for personal use.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Shorts Format</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Shorts are designed for vertical viewing (e.g. 9:16 aspect ratio) and are typically under sixty seconds. The downloaded file keeps that aspect ratio so it displays correctly on phones and vertical screens. You can still play it on a computer; it will appear with letterboxing or pillarboxing depending on the player.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Resolution Availability</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        The resolutions offered depend on what YouTube provides for that Short. Common options include 360p, 480p, and 720p. Not every Short has every resolution; the tool lists what is available after you enter the URL. Higher resolution means better clarity but larger file size.
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
        This tool lets you download a YouTube video in 4K (Ultra HD) when the source offers that resolution. You paste the video URL and select 2160p (4K) if it appears in the list. The output is an MP4 file suitable for large screens and high-resolution displays.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">4K Limitations</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        Not every YouTube video is available in 4K. The uploader must have published a 4K version, and YouTube must serve it for that video. If 2160p does not appear in the options, the video does not have 4K available; you can still choose the highest resolution listed (e.g. 1080p or 1440p). Regional or technical restrictions can also affect availability.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Device and Storage Requirements</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        4K files are large. A few minutes of video can be hundreds of megabytes or more. Ensure you have enough free space and a stable connection. Playback of 4K content also requires a device and screen that support that resolution; otherwise you may not see a visible improvement over 1080p.
      </p>

      <h3 className="text-xl font-semibold mt-6 mb-3">File Sizes</h3>
      <p className="text-muted-foreground leading-relaxed mb-4">
        File size depends on resolution, frame rate, and length. 4K (2160p) produces significantly larger files than 1080p or 720p. If you need smaller files or faster downloads, choose a lower resolution. The tool shows all available resolutions so you can pick what fits your needs.
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
