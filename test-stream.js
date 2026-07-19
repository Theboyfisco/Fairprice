const http = require('http');

// Test the SSE stream - connect and wait 5 seconds to see if it stays alive
const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/stream',
    method: 'GET',
    headers: { Accept: 'text/event-stream' },
  },
  (res) => {
    console.log('SSE Status:', res.statusCode);
    console.log('SSE Content-Type:', res.headers['content-type']);

    let chunkCount = 0;
    res.on('data', (chunk) => {
      chunkCount++;
      const str = chunk.toString();
      console.log(`[chunk ${chunkCount}]:`, str.slice(0, 200).trim());
      if (chunkCount >= 3) {
        req.destroy();
        console.log('\nStream is alive and delivering events!');
      }
    });
  }
);

req.on('error', (e) => {
  if (e.code !== 'ECONNRESET') console.log('Error:', e.message);
});

req.setTimeout(8000, () => {
  console.log('8s elapsed - stream connected but no events yet (expected when no live matches)');
  req.destroy();
});

req.end();
