const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

const port = 27017;
const host = '127.0.0.1';
const dataDir = path.join(__dirname, '..', '.mongodb-data');
const logPath = path.join(dataDir, 'mongod.log');

function waitForMongo(portNumber, hostName) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 20000;
    const tryConnect = () => {
      const socket = net.createConnection({ host: hostName, port: portNumber });
      socket.once('connect', () => {
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        if (Date.now() > deadline) {
          reject(new Error('MongoDB did not become ready in time.'));
        } else {
          setTimeout(tryConnect, 500);
        }
      });
    };
    tryConnect();
  });
}

async function main() {
  fs.mkdirSync(dataDir, { recursive: true });

  try {
    await waitForMongo(port, host);
    console.log('MongoDB already running on localhost:27017');
    return;
  } catch {
    // continue to start it
  }

  const candidates = [
    process.env.MONGOD_PATH,
    'mongod',
    'C:\\Users\\sridh\\.cache\\mongodb-binaries\\mongod-x64-win32-8.2.6.exe',
  ].filter(Boolean);

  let launched = false;
  for (const bin of candidates) {
    try {
      const child = spawn(bin, ['--dbpath', dataDir, '--logpath', logPath, '--port', String(port), '--bind_ip', host], {
        stdio: 'ignore',
        detached: process.platform !== 'win32',
      });

      child.unref();
      launched = true;
      console.log(`Starting MongoDB with ${bin}`);
      break;
    } catch (error) {
      console.warn(`Could not launch MongoDB from ${bin}: ${error.message}`);
    }
  }

  if (!launched) {
    console.error('Unable to start MongoDB because no compatible binary was found.');
    process.exit(1);
  }

  try {
    await waitForMongo(port, host);
    console.log('MongoDB is ready on localhost:27017');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
