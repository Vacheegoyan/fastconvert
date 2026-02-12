from yt import YouTubeDownloader
import sys, traceback, os

class Logger:
    def debug(self, msg):
        print('[DEBUG]', msg)
    def info(self, msg):
        print('[INFO]', msg)
    def warning(self, msg):
        print('[WARNING]', msg)
    def error(self, msg):
        print('[ERROR]', msg)

dl = YouTubeDownloader()
url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
try:
    info = dl.get_video_info(url)
    print('INFO KEYS:', list(info.keys()) if info else 'no info')
    # Run yt_dlp directly with verbose logging
    import yt_dlp
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': os.path.join('downloads', '%(title)s.%(ext)s'),
        'quiet': False,
        'no_warnings': False,
        'noplaylist': True,
        'logger': Logger(),
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '320'
        }]
    }
    print('Starting yt_dlp via API...')
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            ydl.download([url])
            print('yt-dlp completed')
        except Exception as e:
            traceback.print_exc()
            print('yt-dlp error:', e)
    res = dl.download_mp3(url, output_path='downloads')
    print('RESULT (download_mp3):', res)
except Exception as e:
    traceback.print_exc()
    print('EXC:', e)
