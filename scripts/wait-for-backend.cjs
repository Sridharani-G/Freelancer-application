const http = require('http');

function waitForBackend(port = 5000, timeoutMs = 60000) {
  const started = Date.now();

  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.request({ host: '127.0.0.1', port, path: '/api/health', method: 'GET' }, (res) => {
        res.resume();
        res.on('end', () => {
          resolve();
        });
      });

      req.on('error', () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error('Backend did not become ready in time.'));
          return;
        }
        setTimeout(tryOnce, 1000);
      });

      req.end();
    };

    tryOnce();
  });
}

waitForBackend().then(() => {
  console.log('Backend is reachable, starting Vite dev server...');
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
