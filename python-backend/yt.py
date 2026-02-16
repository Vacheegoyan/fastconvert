#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import yt_dlp
import os
import sys
import subprocess
import json
import traceback
import uuid
import shutil
import unicodedata
import re
import urllib.request
import urllib.error
import glob
import time

class YouTubeDownloader:
    def __init__(self):
        self.ffmpeg_dir = self.check_ffmpeg()
        self.standard_resolutions = [144, 240, 360, 480, 720, 1080, 1440, 2160]  # Ստանդարտ ռեզոլյուցիաներ
        self.downloads_dir = self.init_downloads_dir()
        
    def check_ffmpeg(self):
        """Ստուգում է FFmpeg-ի առկայությունը"""
        ffmpeg_dir = os.path.join(os.path.dirname(__file__), "ffmpeg", "bin")
        ffmpeg_exe = os.path.join(ffmpeg_dir, "ffmpeg.exe")
        
        if os.path.exists(ffmpeg_exe):
            return ffmpeg_dir
        else:
            return None

    def init_downloads_dir(self):
        """Ստեղծում է downloads թղթապանակի կառուցվածքը"""
        downloads_dir = os.path.join(os.path.dirname(__file__), "downloads")
        temp_dir = os.path.join(downloads_dir, "temp")
        final_dir = os.path.join(downloads_dir, "final")
        
        os.makedirs(temp_dir, exist_ok=True)
        os.makedirs(final_dir, exist_ok=True)
        
        return {
            'base': downloads_dir,
            'temp': temp_dir,
            'final': final_dir
        }

    def clean_url(self, url):
        """Մաքրում է URL-ը պլեյլիստի պարամետրերից"""
        if '&list=' in url:
            url = url.split('&list=')[0]
        if '?list=' in url:
            url = url.split('?list=')[0]
        return url

    def sanitize_filename(self, filename):
        """Մաքրում է filename-ը non-ASCII characters-ից"""
        # Remove non-ASCII characters
        filename = unicodedata.normalize('NFKD', filename)
        filename = filename.encode('ascii', 'ignore').decode('ascii')
        
        # Remove or replace invalid characters
        invalid_chars = r'[<>:"/\\|?*]'
        filename = re.sub(invalid_chars, '', filename)
        
        # Remove leading/trailing spaces and dots
        filename = filename.strip('. ')
        
        # Collapse multiple spaces
        filename = re.sub(r'\s+', ' ', filename)
        
        return filename if filename else 'video'

    def get_video_info(self, url):
        """Ստանում է տեսանյութի մասին տեղեկություն"""
        ydl_opts = {
            'quiet': True, 
            'no_warnings': True, 
            'noplaylist': True,
            # Speed optimizations
            'skip_download': True,
            'extract_flat': False,
            'no_check_certificate': False,  # Keep security
            'socket_timeout': 10,  # Faster timeout
            'fragment_retries': 3,  # Reduce retries for speed
            'retries': 3,
            'http_chunk_size': 10485760,  # 10MB chunks for faster processing
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)
        except Exception as e:
            traceback.print_exc(file=sys.stderr)
            return None
    
    def get_video_info_json(self, url):
        """Ստանում է տեսանյութի տեղեկություն JSON ձևաչափով (API-ի համար)"""
        info = self.get_video_info(url)
        if not info:
            return json.dumps({"success": False, "error": "Failed to get video info"}, ensure_ascii=False)
        
        resolutions = self.get_available_standard_resolutions(info)
        
        # Extract clean title and thumbnail
        title = info.get('title', 'Unknown')
        thumbnail = info.get('thumbnail', '')
        duration = info.get('duration', 0)
        uploader = info.get('uploader', 'Unknown')
        
        result = {
            "success": True,
            "title": title,
            "thumbnail": thumbnail,
            "duration": duration,
            "author": uploader,
            "resolutions": resolutions if resolutions else [360, 480, 720],
            "video_id": info.get('id', ''),
            "description": info.get('description', '')[:200] if info.get('description') else ''
        }
        
        return json.dumps(result, ensure_ascii=False)

    def get_playlist_info(self, url):
        """Ստանում է պլեյլիստի տեղեկություն"""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
            # Speed optimizations
            'socket_timeout': 10,
            'fragment_retries': 3,
            'retries': 3,
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)
        except Exception as e:
            print(f"❌ Սխալ պլեյլիստի տեղեկություն ստանալիս: {e}")
            return None

    def find_downloaded_file(self, url, output_path, expected_ext):
        """Գտնում է բեռնված ֆայլը. If no exact title match, falls back to newest file with expected_ext in temp_dir."""
        try:
            if not os.path.exists(output_path):
                return None
            
            files = [f for f in os.listdir(output_path) if f.endswith(expected_ext)]
            print(f"Searching in {output_path} for .{expected_ext}, found: {files}")
            if files:
                latest_file = max([os.path.join(output_path, f) for f in files], key=os.path.getctime)
                return latest_file
        except Exception as e:
            import traceback
            traceback.print_exc(file=sys.stderr)
        
        return None

    def move_to_final_folder(self, original_path, original_filename=None, output_path='.', force_mp3=False):
        """Տեղափոխում է ֆայլը final թղթապանակ՝ պահպանելով բնօրիգինալ անունը"""
        if original_path is None:
            print("move_to_final_folder: original_path is None, returning unknown.mp3")
            return None, "unknown.mp3"
        original_path = os.path.abspath(original_path)
        if not os.path.exists(original_path):
            sys.stderr.write(f"move_to_final_folder: original_path does not exist: {original_path}\n")
            return None, original_filename or os.path.basename(original_path)
        
        final_path = None
        try:
            if not original_filename:
                original_filename = os.path.basename(original_path)
            
            # Resolve final_dir and temp_dir with absolute paths
            base = os.path.abspath(output_path) if output_path != '.' else os.path.abspath(self.downloads_dir['base'])
            final_dir = os.path.abspath(os.path.join(base, 'final'))
            temp_dir = os.path.abspath(os.path.join(base, 'temp'))
            
            os.makedirs(final_dir, exist_ok=True)
            os.makedirs(temp_dir, exist_ok=True)
            
            if force_mp3:
                final_name = self.sanitize_filename(os.path.splitext(original_filename)[0]) + ".mp3"
            else:
                final_name = original_filename
            final_path = os.path.join(final_dir, final_name)
            print(f"Attempting move from {original_path} to {final_path}")
            if not os.path.exists(original_path):
                print("Source file missing before move")
                return None, original_filename or os.path.basename(original_path)
            shutil.move(original_path, final_path)
            print(f"Final path resolved: {final_path}")
            if force_mp3:
                print(f"Final MP3 path: {final_path}")
            return final_path, final_name if force_mp3 else original_filename
        except Exception as e:
            sys.stderr.write(f"Move error: {str(e)}\nPath from: {original_path}\nPath to: {final_path or '(not set)'}\n")
            sys.stderr.write(traceback.format_exc())
            return None, original_filename or os.path.basename(original_path)

    def download_mp3(self, url, output_path='.', quality_kbps='320'):
        """MP3 download — temporary simplified: always 320kbps."""
        kbps_int = 320
        print(f"Using kbps: {kbps_int} (CBR, fixed)")
        # Ստանալ վիդեոյի տեղեկություն (բնօրիգինալ անունը)
        video_info = self.get_video_info(url)
        if not video_info:
            return None
        
        original_title = video_info.get('title', 'video')
        
        # Հստահիցեք որ downloads թղթապանակների կառուցվածքը ճիշտ է
        if output_path != '.' and 'downloads' in str(output_path):
            base = os.path.normpath(os.path.abspath(output_path))
            temp_dir = os.path.join(base, 'temp')
            os.makedirs(temp_dir, exist_ok=True)
            self.downloads_dir['final'] = os.path.join(base, 'final')
            os.makedirs(self.downloads_dir['final'], exist_ok=True)
        else:
            temp_dir = self.downloads_dir['temp']
        
        expected_title = self.sanitize_filename(original_title)
        # Force output template with sanitized title so we can rename to .mp3 after
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(temp_dir, f"{expected_title}.%(ext)s"),
            'quiet': True,
            'no_warnings': True,
            'noplaylist': True,
            # Speed optimizations
            'socket_timeout': 10,
            'fragment_retries': 3,
            'retries': 3,
            'http_chunk_size': 10485760,  # 10MB chunks
            'concurrent_fragments': 4,  # Download fragments in parallel
        }
        
        if self.ffmpeg_dir:
            # preferredquality > 10 → yt-dlp uses -b:a {value}k (CBR)
            ydl_opts.update({
                'ffmpeg_location': self.ffmpeg_dir,
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': kbps_int,
                }]
            })
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            # Give FFmpeg time to finish writing the .mp3 file.
            time.sleep(2)
            temp_dir_abs = os.path.abspath(temp_dir)
            mp3_path = os.path.join(temp_dir_abs, f"{expected_title}.mp3")
            # Force rename any .webm/.m4a/.opus to .mp3 if FFmpegExtractAudio didn't rename
            for ext in ['.webm', '.m4a', '.opus']:
                candidate = os.path.join(temp_dir_abs, f"{expected_title}{ext}")
                if os.path.isfile(candidate):
                    try:
                        os.rename(candidate, mp3_path)
                        print(f"Renamed {candidate} to {mp3_path}")
                    except OSError as e:
                        sys.stderr.write(f"Rename failed: {e}\n")
                    break
            # file_path: prefer .mp3 at expected path, else newest .mp3, else fallbacks
            if os.path.isfile(mp3_path):
                file_path = mp3_path
                print(f"Using MP3 at expected path: {file_path}")
            else:
                mp3_files = glob.glob(os.path.join(temp_dir_abs, '*.mp3'))
                all_files = []
                if mp3_files:
                    file_path = max(mp3_files, key=os.path.getctime)
                    print(f"Found newest MP3 in temp: {file_path} (created {time.ctime(os.path.getctime(file_path))})")
                else:
                    print(f"No .mp3 files found in {temp_dir_abs}. Listing all files:")
                    all_files = os.listdir(temp_dir_abs) if os.path.exists(temp_dir_abs) else []
                    print(all_files)
                    file_path = None
                if file_path is None:
                    candidate = os.path.join(temp_dir_abs, f"{expected_title}.mp3")
                    if os.path.isfile(candidate):
                        file_path = candidate
                        print(f"Found MP3 by title: {file_path}")
                    if file_path is None:
                        webm_files = glob.glob(os.path.join(temp_dir_abs, '*.webm'))
                        if webm_files:
                            file_path = max(webm_files, key=os.path.getctime)
                            print(f"Using newest .webm as fallback: {file_path}")
            if file_path:
                print(f"Downloaded to: {file_path}")
                actual_filename = os.path.basename(file_path)
                final_path, _ = self.move_to_final_folder(file_path, actual_filename, output_path, force_mp3=True)
                if final_path:
                    print(f"Moved to final: {final_path}")
                    return final_path, original_title
                else:
                    sys.stderr.write(f"Error: Failed to move file to final folder\n")
                    return None
            else:
                sys.stderr.write(f"Error: Could not find downloaded MP3 file in {temp_dir}\n")
                return {"success": False, "message": "No MP3 file found after conversion"}
        except Exception as e:
            traceback.print_exc(file=sys.stderr)
            return None

    def download_mp4_with_sound(self, url, resolution, output_path='.'):
        """MP4 download — temporary simplified: always 1080p (bestvideo[height<=1080]+bestaudio)."""
        resolution = 1080
        print(f"Using resolution: {resolution}p (fixed)")
        # Ստանալ վիդեոյի տեղեկություն (բնօրիգինալ անունը)
        video_info = self.get_video_info(url)
        if not video_info:
            return None
        
        original_title = video_info.get('title', 'video')
        
        # Հստահիցեք որ downloads թղթապանակների կառուցվածքը ճիշտ է
        if output_path != '.' and 'downloads' in str(output_path):
            base = os.path.normpath(os.path.abspath(output_path))
            temp_dir = os.path.join(base, 'temp')
            os.makedirs(temp_dir, exist_ok=True)
            self.downloads_dir['final'] = os.path.join(base, 'final')
            os.makedirs(self.downloads_dir['final'], exist_ok=True)
        else:
            temp_dir = self.downloads_dir['temp']
        
        ydl_opts = {
            'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
            'noplaylist': True,
            'merge_output_format': 'mp4',
            # Ensure audio is always included
            'writesubtitles': False,
            'writeautomaticsub': False,
            # Speed optimizations
            'socket_timeout': 10,
            'fragment_retries': 3,
            'retries': 3,
            'http_chunk_size': 10485760,  # 10MB chunks
            'concurrent_fragments': 4,  # Download fragments in parallel
        }
        
        # Եթե FFmpeg կա, միավորել video + audio streams (4K inclusive)
        if self.ffmpeg_dir:
            # Միայն height<= — լավագույն տեսանյութ մինչև ընտրված ռեզոլյուցիա
            format_str = (
                f'bestvideo[height<={resolution}]+bestaudio/'
                f'best[height<={resolution}]'
            )
            ydl_opts.update({
                'ffmpeg_location': self.ffmpeg_dir,
                'format': format_str,
                'merge_output_format': 'mp4',
            })
        else:
            # Without FFmpeg, try to find already merged format
            # Simplified format selection for speed
            format_str = (
                f'best[height={resolution}][ext=mp4]/'  # Exact resolution
                f'best[height<={resolution}][ext=mp4]/'  # Any up to resolution
                f'best[ext=mp4]'  # Fallback
            )
            ydl_opts['format'] = format_str
            ydl_opts.pop('postprocessors', None)
            ydl_opts.pop('merge_output_format', None)
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
                file_path = self.find_downloaded_file(url, temp_dir, '.mp4')
                if file_path:
                    actual_filename = os.path.basename(file_path)
                    final_path, _ = self.move_to_final_folder(file_path, actual_filename, output_path)
                    if final_path:
                        return final_path, original_title
                    else:
                        sys.stderr.write(f"Error: Failed to move MP4 file to final folder\n")
                        return None
                else:
                    sys.stderr.write(f"Error: Could not find downloaded MP4 file in {temp_dir}\n")
                    return None
        except Exception as e:
            import traceback
            traceback.print_exc(file=sys.stderr)
            return self.download_simple_mp4(url, resolution, output_path)

    def download_simple_mp4(self, url, resolution, output_path):
        """Պարզ MP4 բեռնում"""
        
        # Ստանալ վիդեոյի տեղեկություն (բնօրիգինալ անունը)
        video_info = self.get_video_info(url)
        if not video_info:
            return None

    def download_poster(self, url, poster_quality='high', output_path='.'):
        """Բեռնում է վիդեոյի thumbnail/poster-ը (low/medium/high)"""
        info = self.get_video_info(url)
        if not info:
            return None, None

        title = info.get('title', 'poster')
        video_id = info.get('id')
        if not video_id:
            return None, None

        # Ensure downloads folder structure exists for Node output_path
        if output_path != '.' and 'downloads' in output_path:
            temp_dir = os.path.join(output_path, 'temp')
            os.makedirs(temp_dir, exist_ok=True)
            self.downloads_dir['final'] = os.path.join(output_path, 'final')
            os.makedirs(self.downloads_dir['final'], exist_ok=True)
        else:
            temp_dir = self.downloads_dir['temp']

        safe_title = self.sanitize_filename(title)
        original_filename = f"{safe_title}-poster.jpg"

        # YouTube thumbnail variants (all available sizes)
        # maxresdefault.jpg is the highest quality (1280x720 or higher)
        # sddefault.jpg is standard definition (640x480)
        # hqdefault.jpg is high quality (480x360)
        # mqdefault.jpg is medium quality (320x180)
        # default.jpg is low quality (120x90)
        base = f"https://i.ytimg.com/vi/{video_id}"
        # Temporary simplified: always maxresdefault (1280x720)
        quality = 'maxresdefault'
        
        # Build candidates list based on quality (fixed to maxresdefault)
        if quality == 'default':
            candidates = [f"{base}/default.jpg"]  # 120x90
        elif quality == 'mqdefault':
            candidates = [f"{base}/mqdefault.jpg"]  # 320x180
        elif quality == 'hqdefault':
            candidates = [f"{base}/hqdefault.jpg"]  # 480x360
        elif quality == 'sddefault':
            candidates = [f"{base}/sddefault.jpg"]  # 640x480
        elif quality == 'maxresdefault':
            # For maxresdefault, try yt-dlp thumbnail first (if available), then maxresdefault
            candidates = []
            thumbnail_url = info.get('thumbnail')
            if thumbnail_url:
                candidates.append(thumbnail_url)
            candidates.append(f"{base}/maxresdefault.jpg")  # 1280x720 or higher
        else:
            # Fallback: try maxresdefault first, then others
            candidates = []
            thumbnail_url = info.get('thumbnail')
            if thumbnail_url:
                candidates.append(thumbnail_url)
            candidates.extend([
                f"{base}/maxresdefault.jpg",  # 1280x720 or higher
                f"{base}/sddefault.jpg",       # 640x480
                f"{base}/hqdefault.jpg",       # 480x360
            ])

        out_path = os.path.join(temp_dir, f"{uuid.uuid4().hex}.jpg")
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
        }

        downloaded = False
        last_error = None
        for thumb_url in candidates:
            try:
                req = urllib.request.Request(thumb_url, headers=headers)
                with urllib.request.urlopen(req, timeout=20) as resp:
                    if resp.status != 200:
                        continue
                    data = resp.read()
                    # Skip tiny "not found" placeholders (less than 1KB)
                    if not data or len(data) < 1024:
                        continue
                    with open(out_path, 'wb') as f:
                        f.write(data)
                downloaded = True
                break
            except Exception as e:
                last_error = e
                continue

        if not downloaded or not os.path.exists(out_path):
            return None, original_filename

        final_path, _ = self.move_to_final_folder(out_path, original_filename, output_path)
        return final_path, original_filename
        
        original_title = video_info.get('title', 'video')
        
        # Հստահիցեք որ downloads թղթապանակների կառուցվածքը ճիշտ է
        if output_path != '.' and 'downloads' in output_path:
            # Node.js-ից downloads ուղին է ստացվում, ստեղծել temp/final
            temp_dir = os.path.join(output_path, 'temp')
            os.makedirs(temp_dir, exist_ok=True)
            self.downloads_dir['final'] = os.path.join(output_path, 'final')
            os.makedirs(self.downloads_dir['final'], exist_ok=True)
        else:
            # Local օգտագործման դեպքում
            temp_dir = self.downloads_dir['temp']
        
        ydl_opts = {
            'format': 'best[ext=mp4]/best',
            'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
        }
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
                file_path = self.find_downloaded_file(url, temp_dir, '.mp4')
                if file_path:
                    actual_filename = os.path.basename(file_path)
                    final_path, _ = self.move_to_final_folder(file_path, actual_filename, output_path)
                    if final_path:
                        return final_path, original_title
                    else:
                        sys.stderr.write(f"Error: Failed to move simple MP4 to final folder\n")
                        return None
                else:
                    sys.stderr.write(f"Error: Could not find simple MP4 file in {temp_dir}\n")
                    return None
        except Exception as e:
            import traceback
            traceback.print_exc(file=sys.stderr)
            return None

    def check_and_open_file(self, url, resolution, output_path):
        """Ստուգում է ֆայլի ստեղծումը և փորձում բացել"""
        try:
            # Ստանալ տեսանյութի անվանումը
            info = self.get_video_info(url)
            if info:
                title = info.get('title', 'video')
                safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '_')).rstrip()
                
                # Ստուգել ֆայլի առկայությունը
                possible_extensions = ['.mp4', '.webm', '.mkv', '.m4a']
                found_file = None
                
                for ext in possible_extensions:
                    file_path = os.path.join(output_path, f"{safe_title}{ext}")
                    if os.path.exists(file_path):
                        found_file = file_path
                        break
                
                if found_file:
                    print(f"✅ Ֆայլը ստեղծվել է: {found_file}")
                    
                    # Հարցնել արդյոք բացել ֆայլը
                    choice = input("\n🔧 Բացել ֆայլը? (y/n): ").strip().lower()
                    if choice == 'y':
                        try:
                            os.startfile(found_file)  # Windows-ի համար
                            print("📂 Ֆայլը բացված է")
                        except:
                            try:
                                subprocess.run(['start', found_file], shell=True)  # Այլընտրանքային եղանակ
                            except:
                                print("⚠️  Չհաջողվեց բացել ֆայլը, բացեք ձեռքով")
                else:
                    print("⚠️  Ֆայլը չի գտնվել, բայց բեռնումը հաջողված է")
                    
        except Exception as e:
            print(f"⚠️  Ֆայլի ստուգման սխալ: {e}")

    def get_available_standard_resolutions(self, info):
        """Ստանում է ստանդարտ ռեզոլյուցիաները, որոնք հասանելի են տեսանյութում (360-ից մինչև 2160)"""
        if not info:
            return []
            
        formats = info.get('formats', [])
        all_heights = set()
        
        # Հավաքել բոլոր հասանելի heights-ները formats-ից
        # YouTube-ում video և audio streams-ները հաճախ առանձին են, բայց կարող են միավորվել
        for f in formats:
            height = f.get('height')
            if height and height > 0:
                # Ստուգել որ ունի video stream (կարող է լինել առանց audio, բայց կմիավորվի)
                has_video = f.get('vcodec') != 'none'
                if has_video:
                    all_heights.add(height)
        
        if not all_heights:
            return []
        
        # Ստանդարտ ռեզոլյուցիաները (360-ից մինչև 2160)
        relevant_standards = [r for r in self.standard_resolutions if r >= 360 and r <= 2160]
        
        # Գտնել բոլոր ստանդարտ ռեզոլյուցիաները, որոնք հասանելի են
        # Օգտագործել ավելի մեծ tolerance (20px) որպեսզի գտնենք բոլոր հնարավորները
        standard_available = []
        for std_res in relevant_standards:
            # Ստուգել եթե կա format, որի height-ը մոտ է այս ստանդարտին
            for height in all_heights:
                if abs(height - std_res) <= 20:  # 20px tolerance
                    if std_res not in standard_available:
                        standard_available.append(std_res)
                    break
        
        # Եթե չենք գտել ստանդարտներ, փորձել գտնել ամենամոտ ստանդարտները
        if not standard_available:
            for height in sorted(all_heights, reverse=True):
                if height >= 360 and height <= 2160:
                    # Գտնել ամենամոտ ստանդարտ ռեզոլյուցիան
                    closest_std = min(relevant_standards, key=lambda x: abs(x - height))
                    if abs(closest_std - height) <= 50:  # 50px tolerance
                        if closest_std not in standard_available:
                            standard_available.append(closest_std)
        
        # Վերադարձնել բոլոր հասանելի ստանդարտ ռեզոլյուցիաները (360-ից մինչև 2160)
        return sorted(standard_available, reverse=True)

    def download_mp3_playlist_interactive(self, playlist_url):
        """Ինտերակտիվ MP3 պլեյլիստի բեռնում"""
        playlist_info = self.get_playlist_info(playlist_url)
        if not playlist_info:
            print("❌ Չհաջողվեց ստանալ պլեյլիստի տեղեկություն")
            return
        
        entries = playlist_info.get('entries', [])
        if not entries:
            print("❌ Պլեյլիստը դատարկ է")
            return
        
        print(f"\n📚 Պլեյլիստ: {playlist_info.get('title', 'Անանուն')}")
        print(f"🎵 Երգերի քանակ: {len(entries)}")
        
        # Ստեղծել պլեյլիստի թղթապանակ
        playlist_title = playlist_info.get('title', 'Playlist_MP3')
        safe_title = "".join(c for c in playlist_title if c.isalnum() or c in (' ', '_')).rstrip()
        playlist_folder = os.path.join(os.getcwd(), safe_title)
        os.makedirs(playlist_folder, exist_ok=True)
        
        success_count = 0
        skip_count = 0
        
        for i, entry in enumerate(entries, 1):
            if not entry:
                continue
                
            video_url = f"https://www.youtube.com/watch?v={entry.get('id')}"
            video_title = entry.get('title', f'Track {i}')
            
            print(f"\n{'='*60}")
            print(f"[{i}/{len(entries)}] {video_title}")
            print(f"{'='*60}")
            
            # Ինտերակտիվ ընտրություն
            print("\nԸնտրեք գործողություն:")
            print("1. ✅ Բեռնել MP3")
            print("2. ⏭️  Անտեսել")
            print("3. 🛑 Կանգնեցնել")
            
            choice = self.get_user_choice([1, 2, 3])
            
            if choice == 1:
                # Բեռնել MP3
                result = self.download_mp3(video_url, playlist_folder)
                if isinstance(result, tuple) and result[0]:
                    success_count += 1
                    print(f"✅ Բեռնված ({success_count}/{len(entries)})")
                else:
                    print(f"❌ Ձախողված ({i}/{len(entries)})")
            
            elif choice == 2:
                # Անտեսել
                skip_count += 1
                print(f"⏭️  Անտեսված ({skip_count}/{len(entries)})")
                continue
            
            elif choice == 3:
                # Կանգնեցնել
                print("🛑 Բեռնումը կանգնեցված է")
                break
        
        # Ամփոփում
        self.show_summary(success_count, skip_count, len(entries), playlist_folder)

    def download_mp4_playlist_interactive(self, playlist_url):
        """Ինտերակտիվ MP4 պլեյլիստի բեռնում"""
        playlist_info = self.get_playlist_info(playlist_url)
        if not playlist_info:
            print("❌ Չհաջողվեց ստանալ պլեյլիստի տեղեկություն")
            return
        
        entries = playlist_info.get('entries', [])
        if not entries:
            print("❌ Պլեյլիստը դատարկ է")
            return
        
        print(f"\n📚 Պլեյլիստ: {playlist_info.get('title', 'Անանուն')}")
        print(f"🎬 Տեսանյութերի քանակ: {len(entries)}")
        
        # Ստեղծել պլեյլիստի թղթապանակ
        playlist_title = playlist_info.get('title', 'Playlist_MP4')
        safe_title = "".join(c for c in playlist_title if c.isalnum() or c in (' ', '_')).rstrip()
        playlist_folder = os.path.join(os.getcwd(), safe_title)
        os.makedirs(playlist_folder, exist_ok=True)
        
        success_count = 0
        skip_count = 0
        
        for i, entry in enumerate(entries, 1):
            if not entry:
                continue
                
            video_url = f"https://www.youtube.com/watch?v={entry.get('id')}"
            video_title = entry.get('title', f'Video {i}')
            
            print(f"\n{'='*60}")
            print(f"[{i}/{len(entries)}] {video_title}")
            print(f"{'='*60}")
            
            # Ստանալ տեսանյութի տեղեկություն
            video_info = self.get_video_info(video_url)
            if not video_info:
                print("❌ Չհաջողվեց ստանալ տեսանյութի տեղեկություն")
                skip_count += 1
                continue
            
            # Ստանալ ստանդարտ ռեզոլյուցիաները
            resolutions = self.get_available_standard_resolutions(video_info)
            
            if not resolutions:
                print("❌ Ֆորմատներ չեն գտնվել")
                skip_count += 1
                continue
            
            # Ինտերակտիվ ընտրություն
            print("\nԸնտրեք գործողություն:")
            print("1. 🎬 Բեռնել MP4 (ընտրել ռեզոլյուցիա)")
            print("2. ⏭️  Անտեսել այս տեսանյութը")
            print("3. 🛑 Կանգնեցնել բեռնումը")
            
            choice = self.get_user_choice([1, 2, 3])
            
            if choice == 1:
                # Ընտրել ռեզոլյուցիա
                selected_res = self.select_standard_resolution(resolutions)
                if selected_res:
                    result = self.download_mp4_with_sound(video_url, selected_res, playlist_folder)
                    if isinstance(result, tuple) and result[0]:
                        success_count += 1
                        print(f"✅ {selected_res}p բեռնված ({success_count}/{len(entries)})")
                    else:
                        print(f"❌ Ձախողված ({i}/{len(entries)})")
                else:
                    skip_count += 1
                    print(f"⏭️  Անտեսված ({skip_count}/{len(entries)})")
            
            elif choice == 2:
                # Անտեսել
                skip_count += 1
                print(f"⏭️  Անտեսված ({skip_count}/{len(entries)})")
                continue
            
            elif choice == 3:
                # Կանգնեցնել
                print("🛑 Բեռնումը կանգնեցված է")
                break
        
        # Ամփոփում
        self.show_summary(success_count, skip_count, len(entries), playlist_folder)

    def select_standard_resolution(self, resolutions):
        """Ընտրում է ստանդարտ ռեզոլյուցիան"""
        print("\n📊 ՍՏԱՆԴԱՐՏ ՌԵԶՈԼՅՈՒՑԻԱՆԵՐԸ:")
        
        # Կցել ստանդարտ անունները
        resolution_names = {
            144: "144p (ցածր)",
            240: "240p (ցածր)",
            360: "360p (SD)",
            480: "480p (SD)",
            720: "720p (HD)",
            1080: "1080p (Full HD)",
            1440: "1440p (2K)",
            2160: "2160p (4K)"
        }
        
        for idx, res in enumerate(resolutions, 1):
            name = resolution_names.get(res, f"{res}p")
            print(f"{idx}. {name}")
        
        print(f"{len(resolutions) + 1}. ↩️  Վերադառնալ")
        
        while True:
            try:
                choice = input(f"\n🎯 Ընտրեք ռեզոլյուցիայի համարը (1-{len(resolutions) + 1}): ").strip()
                
                if not choice:
                    continue
                
                choice_num = int(choice)
                
                if 1 <= choice_num <= len(resolutions):
                    return resolutions[choice_num - 1]
                elif choice_num == len(resolutions) + 1:
                    return None
                else:
                    print(f"❌ Մուտքագրեք 1-{len(resolutions) + 1} միջակայքում")
            except ValueError:
                print("❌ Անվավեր մուտք")

    def get_user_choice(self, valid_choices):
        """Ստանում է օգտագործողի ընտրությունը"""
        while True:
            try:
                choice = input("\nՁեր ընտրությունը: ").strip()
                
                if not choice:
                    continue
                
                choice_num = int(choice)
                
                if choice_num in valid_choices:
                    return choice_num
                else:
                    print(f"❌ Մուտքագրեք {', '.join(map(str, valid_choices))}")
            except ValueError:
                print("❌ Անվավեր մուտք")

    def show_summary(self, success, skip, total, folder):
        """Ցույց է տալիս ամփոփումը"""
        print(f"\n{'='*60}")
        print("📊 ԱՄՓՈՓՈՒՄ")
        print(f"{'='*60}")
        print(f"✅ Հաջողված: {success}")
        print(f"⏭️  Անտեսված: {skip}")
        print(f"📊 Ընդհանուր: {total}")
        print(f"📁 Պահվել է: {folder}")
        print(f"{'='*60}")

    def progress_hook(self, d):
        """Առաջընթացի ցուցադրում"""
        if d['status'] == 'downloading':
            percent = d.get('_percent_str', '0%').strip()
            speed = d.get('_speed_str', 'N/A').strip()
            eta = d.get('_eta_str', 'N/A').strip()
            
            print(f"\rDownloading: {percent} | {speed} | ETA: {eta}", end='', flush=True)
        elif d['status'] == 'finished':
            print(f"\rDownload completed!{' ' * 50}")

    def main_menu(self):
        """Գլխավոր մենյու"""
        while True:
            print("\n" + "="*60)
            print("🎬 YOUTUBE DOWNLOADER - ՍՏԱՆԴԱՐՏ ՏԱՐԲԵՐԱԿ")
            print("="*60)
            
            print("\n📋 ԳԼԽԱՎՈՐ ՄԵՆՅՈՒ:")
            print("1. 🎬 Բեռնել տեսանյութ (MP4)")
            print("2. 🎵 Բեռնել աուդիո (MP3)")
            print("3. 📚 Բեռնել աուդիո պլեյլիստ (MP3)")
            print("4. 🎞️  Բեռնել տեսանյութ պլեյլիստ (MP4)")
            print("5. ⚙️  Կարգավորումներ")
            print("6. 🚪 Դուրս գալ")
            
            choice = self.get_user_choice([1, 2, 3, 4, 5, 6])
            
            if choice == 1:
                self.download_single_mp4()
            elif choice == 2:
                self.download_single_mp3()
            elif choice == 3:
                self.download_mp3_playlist_interactive_menu()
            elif choice == 4:
                self.download_mp4_playlist_interactive_menu()
            elif choice == 5:
                self.settings_menu()
            elif choice == 6:
                print("\n👋 Ցտեսություն!")
                break

    def download_single_mp4(self):
        """Մեկ տեսանյութի MP4 բեռնում"""
        print("\n" + "="*60)
        print("🎬 ԲԵՌՆՈՒՄ ՄԵԿ ՏԵՍԱՆՅՈՒԹ (MP4)")
        print("="*60)
        
        url = input("\n📥 Մուտքագրեք YouTube URL: ").strip()
        if not url:
            print("❌ URL չի մուտքագրվել")
            return
        
        # Մաքրել URL-ը
        url = self.clean_url(url)
        
        # Ստանալ տեսանյութի տեղեկություն
        info = self.get_video_info(url)
        if not info:
            print("❌ Չհաջողվեց ստանալ տեղեկություն")
            return
        
        print(f"\n📺 Տեսանյութ: {info.get('title', 'Անանուն')}")
        print(f"⏱️  Տևողություն: {self.format_duration(info.get('duration', 0))}")
        
        # Ստանալ ստանդարտ ռեզոլյուցիաները
        resolutions = self.get_available_standard_resolutions(info)
        
        if not resolutions:
            print("❌ Ստանդարտ ֆորմատներ չեն գտնվել")
            return
        
        # Ընտրել ռեզոլյուցիա
        selected_res = self.select_standard_resolution(resolutions)
        if not selected_res:
            return
        
        # Բեռնում
        confirm = input(f"\n✅ Բեռնել {selected_res}p MP4? (y/n): ").strip().lower()
        
        if confirm == 'y':
            result = self.download_mp4_with_sound(url, selected_res)
            if isinstance(result, tuple) and result[0]:
                safe_path, original_title = result
                print(f"✅ Բեռնված: {original_title}")
            else:
                print("❌ Բեռնումը ձախողվել է")
        else:
            print("❌ Բեռնումը չեղարկված է")

    def download_single_mp3(self):
        """Մեկ տեսանյութի MP3 բեռնում"""
        print("\n" + "="*60)
        print("🎵 ԲԵՌՆՈՒՄ ՄԵԿ ԱՈՒԴԻՈ (MP3)")
        print("="*60)
        
        url = input("\n📥 Մուտքագրեք YouTube URL: ").strip()
        if not url:
            print("❌ URL չի մուտքագրվել")
            return
        
        # Մաքրել URL-ը
        url = self.clean_url(url)
        
        # Բեռնում
        confirm = input("\n✅ Բեռնել MP3? (y/n): ").strip().lower()
        
        if confirm == 'y':
            result = self.download_mp3(url)
            if isinstance(result, tuple) and result[0]:
                safe_path, original_title = result
                print(f"✅ Բեռնված: {original_title}")
            else:
                print("❌ Բեռնումը ձախողվել է")
        else:
            print("❌ Բեռնումը չեղարկված է")

    def download_mp3_playlist_interactive_menu(self):
        """MP3 պլեյլիստի բեռնման մենյու"""
        print("\n" + "="*60)
        print("📚 ԲԵՌՆՈՒՄ ԱՈՒԴԻՈ ՊԼԵՅԼԻՍՏ (MP3)")
        print("="*60)
        
        url = input("\n📥 Մուտքագրեք պլեյլիստի URL: ").strip()
        if not url:
            print("❌ URL չի մուտքագրվել")
            return
        
        # Ստուգել որ պլեյլիստ է
        playlist_info = self.get_playlist_info(url)
        if not playlist_info or 'entries' not in playlist_info:
            print("❌ Սա պլեյլիստ չէ")
            return
        
        print(f"\n📚 Պլեյլիստ: {playlist_info.get('title', 'Անանուն')}")
        print(f"🎵 Երգերի քանակ: {len(playlist_info.get('entries', []))}")
        
        confirm = input("\n✅ Սկսել ինտերակտիվ բեռնումը? (y/n): ").strip().lower()
        
        if confirm == 'y':
            self.download_mp3_playlist_interactive(url)
        else:
            print("❌ Բեռնումը չեղարկված է")

    def download_mp4_playlist_interactive_menu(self):
        """MP4 պլեյլիստի բեռնման մենյու"""
        print("\n" + "="*60)
        print("🎞️  ԲԵՌՆՈՒՄ ՏԵՍԱՆՅՈՒԹ ՊԼԵՅԼԻՍՏ (MP4)")
        print("="*60)
        
        url = input("\n📥 Մուտքագրեք պլեյլիստի URL: ").strip()
        if not url:
            print("❌ URL չի մուտքագրվել")
            return
        
        # Ստուգել որ պլեյլիստ է
        playlist_info = self.get_playlist_info(url)
        if not playlist_info or 'entries' not in playlist_info:
            print("❌ Սա պլեյլիստ չէ")
            return
        
        print(f"\n📚 Պլեյլիստ: {playlist_info.get('title', 'Անանուն')}")
        print(f"🎬 Տեսանյութերի քանակ: {len(playlist_info.get('entries', []))}")
        
        confirm = input("\n✅ Սկսել ինտերակտիվ բեռնումը? (y/n): ").strip().lower()
        
        if confirm == 'y':
            self.download_mp4_playlist_interactive(url)
        else:
            print("❌ Բեռնումը չեղարկված է")

    def settings_menu(self):
        """Կարգավորումների մենյու"""
        print("\n" + "="*60)
        print("⚙️  ԿԱՐԳԱՎՈՐՈՒՄՆԵՐ")
        print("="*60)
        
        if self.ffmpeg_dir:
            print("✅ FFmpeg: Տեղադրված է")
            print(f"   Ուղի: {self.ffmpeg_dir}")
        else:
            print("❌ FFmpeg: Չի գտնվել")
            print("\n💡 FFmpeg տեղադրելու համար:")
            print("1. Ներբեռնեք ffmpeg-git-essentials.7z")
            print("2. Ապաարխայեք 'ffmpeg/bin/' թղթապանակում")
            print("3. Պետք է լինի այս կառուցվածքը:")
            print("   your_folder/")
            print("   ├── ffmpeg/")
            print("   │   └── bin/")
            print("   │       ├── ffmpeg.exe")
            print("   │       ├── ffprobe.exe")
            print("   │       └── ffplay.exe")
            print("   ├── youtube_downloader.py")
            print("   └── ...")
        
        input("\nՍեղմեք Enter շարունակելու համար...")

    def format_duration(self, seconds):
        """Ձևավորում է տևողությունը"""
        if not seconds:
            return "Անհայտ"
        
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        secs = seconds % 60
        
        if hours > 0:
            return f"{hours}:{minutes:02d}:{secs:02d}"
        else:
            return f"{minutes}:{secs:02d}"

def main():
    """Գլխավոր ֆունկցիա"""
    # Ստուգել yt-dlp-ը
    try:
        import yt_dlp
    except ImportError:
        os.system(f"{sys.executable} -m pip install yt-dlp")
        import yt_dlp
    
    # Ստեղծել բեռնիչը
    downloader = YouTubeDownloader()
    
    # CLI mode for API calls
    if len(sys.argv) > 1:
        action = sys.argv[1]
        
        if action == 'info':
            # Get video info in JSON format
            url = sys.argv[2] if len(sys.argv) > 2 else None
            if url:
                result = downloader.get_video_info_json(url)
                # Ensure output is UTF-8
                if isinstance(result, str):
                    sys.stdout.write(result)
                else:
                    sys.stdout.write(json.dumps(result, ensure_ascii=False))
            else:
                sys.stdout.write(json.dumps({"success": False, "error": "URL required"}))
        
        elif action == 'download':
            # Download video
            url = sys.argv[2] if len(sys.argv) > 2 else None
            quality = sys.argv[3] if len(sys.argv) > 3 else 'mp3'
            output_path = sys.argv[4] if len(sys.argv) > 4 else '.'
            
            if not url:
                sys.stdout.write(json.dumps({"success": False, "error": "URL required"}))
                return
            
            url = downloader.clean_url(url)
            file_path = None
            original_filename = None
            
            # Check if it's MP3 quality (mp3, mp3-128, mp3-160, mp3-192, mp3-320)
            if quality == 'mp3' or quality.startswith('mp3-'):
                # Extract kbps from quality string (e.g., 'mp3-192' -> '192')
                if quality.startswith('mp3-'):
                    kbps = quality.replace('mp3-', '')
                else:
                    kbps = '320'  # Default to 320 kbps for 'mp3'
                result = downloader.download_mp3(url, output_path, kbps)
                if isinstance(result, tuple):
                    file_path, original_filename = result
                else:
                    file_path = result
            else:
                # Convert quality string to resolution number
                resolution = int(quality.replace('p', '')) if quality.endswith('p') else 720
                result = downloader.download_mp4_with_sound(url, resolution, output_path)
                if isinstance(result, tuple):
                    file_path, original_filename = result
                else:
                    file_path = result
            
            # Use safe filename for file_path, but preserve original filename
            output_filename = original_filename if original_filename else (os.path.basename(file_path) if file_path else 'unknown')
            
            result = {
                "success": file_path is not None,
                "message": f"Download completed as {quality}" if file_path else f"Failed to download as {quality}",
                "quality": quality,
                "format": "mp3" if (quality == "mp3" or quality.startswith("mp3-")) else "mp4",
                "file_path": file_path,
                "original_filename": output_filename
            }
            sys.stdout.write(json.dumps(result, ensure_ascii=False))
        elif action == 'poster':
            url = sys.argv[2] if len(sys.argv) > 2 else None
            poster_quality = sys.argv[3] if len(sys.argv) > 3 else 'high'
            output_path = sys.argv[4] if len(sys.argv) > 4 else '.'

            if not url:
                sys.stdout.write(json.dumps({"success": False, "error": "URL required"}))
                return

            url = downloader.clean_url(url)
            file_path, original_filename = downloader.download_poster(url, poster_quality, output_path)
            result = {
                "success": file_path is not None,
                "message": "Poster prepared" if file_path else "Failed to prepare poster",
                "format": "poster",
                "file_path": file_path,
                "original_filename": original_filename or (os.path.basename(file_path) if file_path else "poster.jpg")
            }
            sys.stdout.write(json.dumps(result, ensure_ascii=False))
        else:
            downloader.main_menu()
    else:
        # Interactive mode
        downloader.main_menu()

if __name__ == "__main__":
    main()