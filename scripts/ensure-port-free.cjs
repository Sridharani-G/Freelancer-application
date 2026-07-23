const { exec } = require('child_process');

const port = 5000;
const platform = process.platform;

function killPort() {
  const command = platform === 'win32'
    ? `powershell -NoProfile -Command "$connections = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue; foreach ($connection in $connections) { if ($connection.OwningProcess -and $connection.OwningProcess -ne 0) { try { Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue } catch {} } }"`
    : `lsof -ti tcp:${port} | xargs -r kill -9`;

  exec(command, (error) => {
    if (error && !/No matching|not found|No process|not recognized|not found/i.test(error.message)) {
      console.warn('Could not clear port 5000 automatically:', error.message);
    }
    process.exit(0);
  });
}

killPort();
