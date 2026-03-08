import assert from 'node:assert/strict';
import vm from 'node:vm';

process.env.NODE_ENV = 'production';

const { default: handler } = await import('../server.js');

function renderHtml(urlPath) {
  return new Promise((resolve, reject) => {
    const req = {
      url: urlPath,
      method: 'GET',
      on() {
        reject(new Error('Unexpected req.on call for GET HTML render'));
      },
    };

    let body = '';
    const res = {
      writeHead() {},
      write(chunk) {
        body += String(chunk || '');
      },
      end(chunk = '') {
        body += String(chunk || '');
        resolve(body);
      },
    };

    try {
      handler(req, res);
    } catch (error) {
      reject(error);
    }
  });
}

const html = await renderHtml('/?date=2026-03-08&hour=12&minute=3');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
assert.ok(scripts.length >= 2, 'HTML phải chứa script theme bootstrap và script client chính');

const clientScript = scripts.at(-1);
assert.match(clientScript, /kimonForm\.addEventListener\('submit', handleKymonSend\);/, 'Client script phải bind submit handler cho chat form');

assert.doesNotThrow(
  () => new vm.Script(clientScript),
  'Inline client script phải parse được, nếu không form submit sẽ rơi về reload mặc định'
);

console.log('ASSERTIONS: OK');
