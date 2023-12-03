import { spawn } from 'child_process';
import { puppeteerBrowser, sleep } from './utils/misc';

const child = spawn('chromium', ['--no-sandbox', '--remote-debugging-port=9222'], {
  stdio: 'ignore',
  shell: '/bin/bash',
});
sleep(2000).then(async () => {
  await puppeteerBrowser({ url: 'https://nowsecure.nl/' }, async page => {
    await sleep(5000);
    await page.reload();
  });
  await sleep(5000);
  await puppeteerBrowser({ url: 'https://nowsecure.nl/' }, async _ => {
    await sleep(20000);
    child.kill();
  });
});
