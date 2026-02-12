import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';

interface SearchResult {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  url: string;
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request.headers);
    const rl = rateLimit(`search:${clientId}`, 30, 60);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, message: 'Too many searches. Please try again later.', retryAfter: rl.resetIn },
        { status: 429, headers: { 'Retry-After': String(rl.resetIn) } }
      );
    }

    const { query } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json(
        { success: false, message: 'Search query is required' },
        { status: 400 }
      );
    }

    try {
      // @ts-ignore
      const ytSearch = (await import('yt-search')).default;
      
      // Fetch multiple pages in parallel for speed and to get up to 100 videos
      // yt-search typically returns ~20 videos per page, so we fetch 5 pages
      const maxPages = 5;
      const targetResults = 100;
      
      // Try to get results with pages option if supported, otherwise use simple query
      let allVideos: any[] = [];
      const videoIdSet = new Set<string>();
      
      // First, try a simple search to see what we get
      try {
        const initialResults = await ytSearch(query);
        if (initialResults && initialResults.videos && Array.isArray(initialResults.videos)) {
          for (const video of initialResults.videos) {
            if (video.videoId && !videoIdSet.has(video.videoId)) {
              videoIdSet.add(video.videoId);
              allVideos.push(video);
              if (allVideos.length >= targetResults) break;
            }
          }
        }
      } catch (initialError) {
        console.error('Initial search error:', initialError);
      }
      
      // If we need more results, try fetching additional pages
      if (allVideos.length < targetResults) {
        // Try different approaches to get more results
        for (let attempt = 2; attempt <= maxPages && allVideos.length < targetResults; attempt++) {
          try {
            // Try with page parameter if supported
            let pageResults;
            try {
              pageResults = await ytSearch({ query, page: attempt } as any);
            } catch {
              // If page parameter doesn't work, try simple query again (may return different results)
              pageResults = await ytSearch(query);
            }
            
            if (pageResults && pageResults.videos && Array.isArray(pageResults.videos)) {
              for (const video of pageResults.videos) {
                if (video.videoId && !videoIdSet.has(video.videoId)) {
                  videoIdSet.add(video.videoId);
                  allVideos.push(video);
                  if (allVideos.length >= targetResults) break;
                }
              }
            }
          } catch (pageError) {
            // Continue to next attempt if this one fails
            continue;
          }
        }
      }

      if (allVideos.length === 0) {
        return NextResponse.json(
          { success: true, results: [] },
          { status: 200 }
        );
      }

      // Map to SearchResult format (already limited to 100 and deduplicated)
      const videos: SearchResult[] = allVideos.slice(0, targetResults).map((video: any) => ({
        id: video.videoId,
        title: video.title,
        channel: video.author?.name || 'Unknown',
        thumbnail: video.thumbnail,
        duration: video.duration?.timestamp || '',
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
      }));

      return NextResponse.json(
        { success: true, results: videos },
        { status: 200 }
      );
    } catch (searchError) {
      console.error('YouTube search error:', searchError);
      return NextResponse.json(
        { success: false, message: 'Failed to search YouTube. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while searching' },
      { status: 500 }
    );
  }
}
