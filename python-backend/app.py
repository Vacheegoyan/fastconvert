from fastapi import FastAPI, Request, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from yt import YouTubeDownloader  # Import from yt.py
import asyncio
from concurrent.futures import ThreadPoolExecutor
import json

app = FastAPI()
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

downloader = YouTubeDownloader()
executor = ThreadPoolExecutor(max_workers=5)  # Max 5 concurrent

@app.post("/info")
@limiter.limit("5/minute")
async def get_info(request: Request):
    data = await request.json()
    url = data.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL required")
    result = json.loads(downloader.get_video_info_json(url))
    return result

@app.post("/download")
@limiter.limit("5/minute")
async def download(request: Request):
    data = await request.json()
    print(f"Full body: {data}")
    url = data.get("url")
    quality = data.get("quality")
    output_path = data.get("output_path", "downloads")
    print(f"Received quality (type only): {quality}")
    if not url or not quality:
        return {"success": False, "message": "Missing required fields"}

    # Temporary simplified: ignore incoming quality value, use fixed defaults
    def run_download():
        import sys
        sys.stderr.write(f"[/download] output_path={output_path}\n")
        if quality == "mp3" or (isinstance(quality, str) and quality.startswith("mp3-")):
            result = downloader.download_mp3(url, output_path, "320")  # always 320kbps
        else:
            result = downloader.download_mp4_with_sound(url, 1080, output_path)  # always 1080p
        sys.stderr.write(f"[/download] result={result}\n")
        if isinstance(result, tuple) and result[0]:
            file_path, original_filename = result
            return {"success": True, "file_path": file_path, "original_filename": original_filename}
        if result is None or not isinstance(result, tuple):
            msg = "MP3 conversion or move failed"
            if isinstance(result, dict) and result.get("message"):
                msg = result["message"]
            return {"success": False, "message": msg}
        return {"success": False, "message": "Conversion failed"}

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(executor, run_download)

@app.post("/poster")
@limiter.limit("5/minute")
async def poster(request: Request):
    data = await request.json()
    url = data.get("url")
    output_path = data.get("output_path", "downloads")
    if not url:
        raise HTTPException(status_code=400, detail="URL required")

    # Temporary simplified: always maxresdefault (1280x720)
    def run_poster():
        result = downloader.download_poster(url, "maxresdefault", output_path)
        if isinstance(result, tuple):
            file_path, original_filename = result
            return {"success": True, "file_path": file_path, "original_filename": original_filename}
        return {"success": False, "message": "Poster failed"}

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(executor, run_poster)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)