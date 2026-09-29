import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: process.env.SMTP_USER || 'comercial@storylens.com.br',
    pass: process.env.SMTP_PASS || 'Vaso3238@',
  },
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
};

const SERVICE_NAMES = {
  'video-evento': 'Vídeo para Eventos em Tempo Real',
  'fotografia': 'Fotografia Profissional Corporativa',
  'marketing': 'Marketing Digital & Roteiro Guiado',
  'combo': 'Pacote Completo / Ensaio & Vídeo',
  'outro': 'Outro Projeto Audiovisual',
};

function createTransporter() {
  return nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: {
      user: process.env.SMTP_USER || SMTP_CONFIG.auth.user,
      pass: process.env.SMTP_PASS || SMTP_CONFIG.auth.pass,
    },
  });
}

export async function handleContactRequest(body) {
  const { name = '', email = '', phone = '', service = '', message = '' } = body || {};
  if (!name.trim() || !email.trim() || !message.trim()) {
    return { status: 400, payload: { ok: false, error: 'Preencha Nome, E-mail e Mensagem.' } };
  }

  const serviceLabel = SERVICE_NAMES[service] || service || 'Não especificado';
  const smtpUser = process.env.SMTP_USER || SMTP_CONFIG.auth.user;
  const toEmail = process.env.CONTACT_TO || 'comercial@storylens.com.br';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e5e0; border-radius: 10px; overflow: hidden;">
      <div style="background: #0d1b22; color: #ffffff; padding: 24px 28px;">
        <h2 style="margin: 0; font-size: 20px; color: #0095B1;">Novo Contato pelo Site | StoryLens</h2>
        <p style="margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,0.7);">Recebido através do formulário de contato (storylens.com.br)</p>
      </div>
      <div style="padding: 28px; background: #fafaf8; color: #1a1a18;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #ecece6; width: 140px; color: #666;"><strong>Nome:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #ecece6;">${escapeHtml(name)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #ecece6; color: #666;"><strong>E-mail:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #ecece6;"><a href="mailto:${escapeHtml(email)}" style="color: #0095B1;">${escapeHtml(email)}</a></td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #ecece6; color: #666;"><strong>WhatsApp:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #ecece6;">${escapeHtml(phone || 'Não informado')}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #ecece6; color: #666;"><strong>Serviço:</strong></td>
            <td style="padding: 10px 0; border-bottom: 1px solid #ecece6;">${escapeHtml(serviceLabel)}</td>
          </tr>
        </table>
        <div style="margin-top: 20px;">
          <strong style="color: #666; font-size: 14px; display: block; margin-bottom: 8px;">Mensagem:</strong>
          <div style="background: #ffffff; border: 1px solid #e5e5e0; border-radius: 8px; padding: 16px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
        </div>
      </div>
    </div>
  `;

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Site StoryLens" <${smtpUser}>`,
      to: toEmail,
      replyTo: email,
      subject: `Novo Orçamento no Site: ${name} (${serviceLabel})`,
      html: htmlContent,
    });
    return { status: 200, payload: { ok: true, method: 'hostinger-smtp', messageId: info.messageId } };
  } catch (smtpError) {
    console.error('Hostinger SMTP error:', smtpError.message);
    return {
      status: 502,
      payload: {
        ok: false,
        code: smtpError.code || 'SMTP_ERROR',
        error: smtpError.response || smtpError.message,
      },
    };
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function requestListener(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // CORS headers for API
  if (url.pathname.startsWith('/api/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
  }

  if (url.pathname === '/api/contact/status' && req.method === 'GET') {
    try {
      const transporter = createTransporter();
      await transporter.verify();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, smtp: 'connected', host: SMTP_CONFIG.host, user: process.env.SMTP_USER || SMTP_CONFIG.auth.user }));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, smtp: 'auth_failed', host: SMTP_CONFIG.host, user: process.env.SMTP_USER || SMTP_CONFIG.auth.user, error: err.response || err.message }));
    }
    return;
  }

  if (url.pathname === '/api/contact' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const result = await handleContactRequest(body);
      res.writeHead(result.status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result.payload));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // Static file serving from dist/
  let safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';
  let filePath = path.join(DIST_DIR, safePath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const stat = fs.statSync(filePath);

  if (url.pathname.startsWith('/assets/')) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Support HTTP Range requests for smooth MP4 video streaming
  const range = req.headers.range;
  if (range && (ext === '.mp4' || ext === '.mov')) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    });
    file.pipe(res);
    return;
  }

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
  });
  fs.createReadStream(filePath).pipe(res);
}

// Start primary server on PORT (default 3000) and also port 80 if available (for Docker/Coolify)
const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  const primaryPort = Number(process.env.PORT || 3000);
  const server = http.createServer(requestListener);
  server.listen(primaryPort, '0.0.0.0', () => {
    console.log(`StoryLens Server listening on http://0.0.0.0:${primaryPort}`);
  });

  if (primaryPort !== 80) {
    const server80 = http.createServer(requestListener);
    server80.on('error', () => {}); // Ignore if non-root locally
    server80.listen(80, '0.0.0.0', () => {
      console.log(`StoryLens Server also listening on http://0.0.0.0:80`);
    });
  }
}
