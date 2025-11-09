// app.js - Serves a simple frontend and provides a secure webhook endpoint for deployments
// NOTE: Customize the deploy command and secure your server. This example expects
// an environment variable DEPLOY_TOKEN (a secret) which Jenkins will send in the
// header 'x-deploy-token'.

const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON bodies (for webhook payloads)
app.use(express.json());

// Simple frontend HTML served at '/'
app.get('/', (req, res) => {
  res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Node app — Deployed with Jenkins</title>
  <style>
    body{font-family:system-ui,Arial;background:#0b1220;color:#e6eef8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
    .box{max-width:880px;padding:28px;border-radius:12px;background:linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));box-shadow:0 8px 40px rgba(2,6,23,0.6);border:1px solid rgba(255,255,255,0.04)}
    h1{margin:0 0 10px 0;font-size:clamp(20px,4vw,36px);color:#cfe9ff}
    p{margin:0 0 8px 0;color:#bcd8f8}
    .badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#072038;color:#7fe3ff;font-weight:600;margin-top:12px}
    .meta{margin-top:14px;color:#9fc3e6;font-size:14px}
  </style>
</head>
<body>
  <main class="box">
    <h1>Node.js deployed with Jenkins</h1>
    <p>This app includes a simple frontend and a secure webhook endpoint to trigger deployments on an EC2 instance.</p>
    <p class="meta"><strong>Webhook:</strong> POST <code>/webhook</code> (requires header <code>x-deploy-token</code>)</p>
    <div class="badge">Node.js • Express • Jenkins • EC2</div>
  </main>
</body>
</html>`);
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Secure deploy webhook endpoint
app.post('/webhook', (req, res) => {
  const token = req.header('x-deploy-token');
  const expected = process.env.DEPLOY_TOKEN || 'changeme-token';

  if (!token || token !== expected) {
    console.warn('Unauthorized deploy attempt', { ip: req.ip });
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  // OPTIONAL: inspect req.body for branch, etc. Example:
  // const branch = req.body?.ref?.split('/').pop(); if (branch !== 'main') return res.status(400)...

  // Run deployment commands — customize for your environment. This runs in a shell.
  // IMPORTANT: Running shell from a webhook is powerful — make sure the deploy user
  // has limited permissions and that DEPLOY_TOKEN is secret.
  const cmd = `git pull origin main && npm ci --production && pm2 restart app || pm2 start app.js --name app`;

  exec(cmd, { cwd: process.cwd(), timeout: 5 * 60 * 1000 }, (err, stdout, stderr) => {
    if (err) {
      console.error('Deploy failed:', err, stderr);
      return res.status(500).json({ ok: false, message: 'Deploy failed', error: stderr || err.message });
    }
    console.log('Deploy succeeded:
', stdout);
    return res.json({ ok: true, message: 'Deploy started', output: stdout });
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

/*
  HOW TO USE (summary):
  1. Put this file on your EC2 instance (e.g. /home/ec2-user/app/app.js).
  2. Install dependencies: npm install express pm2
  3. Start with pm2: PM2 manages process restarts: pm2 start app.js --name app
  4. Set a secret: export DEPLOY_TOKEN="your-very-secret-token"
  5. On Jenkins, add a post-build step to send a POST to http://<EC2_IP>:3000/webhook
     - Include header: x-deploy-token: your-very-secret-token
     - Optionally send JSON payload containing branch info.
  6. For security, restrict inbound traffic on EC2 (security group) to only your Jenkins IP,
     and/or put the webhook behind a VPN or use SSH-based deploys.

  Customize the 'cmd' variable above to match your repository/branch and restart method
  (systemd, docker restart, or a custom script). For production, prefer running a
  dedicated deploy script instead of running complex shell commands directly from
  Node — e.g. create deploy.sh, make it executable, and exec('bash deploy.sh').
*/
