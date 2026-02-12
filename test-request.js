(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', quality: 'mp3', action: 'prepare' })
    });
    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('HEADERS', Object.fromEntries(res.headers));
    console.log('BODY', text);
  } catch (e) {
    console.error('ERROR', e);
  }
})();
