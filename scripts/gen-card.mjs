import QRCode from 'qrcode';
import sharp from 'sharp';
import { readFileSync } from 'fs';

const W = 620, H = 874;

const qrBuf = await QRCode.toBuffer('https://livefyacoustic.vercel.app', {
  type: 'png', width: 400, margin: 2,
  color: { dark: '#000000', light: '#ffffff' }
});

const icon = readFileSync('./public/icons/icon-192.png');
const iconBuf = await sharp(icon).resize(100, 100).toBuffer();
const qrSize = 360;
const qrResized = await sharp(qrBuf).resize(qrSize, qrSize).toBuffer();

const qrX = Math.floor(W/2) - Math.floor(qrSize/2);
const qrY = 310;

const svgOverlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="5" fill="#1DB954"/>
  <rect y="${H-5}" width="${W}" height="5" fill="#1DB954"/>
  <text x="${W/2}" y="230" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="64" fill="#1DB954" letter-spacing="-2">LIVEFY</text>
  <text x="${W/2}" y="270" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#888888">Elige la música de esta noche</text>
  <rect x="${qrX - 14}" y="${qrY - 14}" width="${qrSize + 28}" height="${qrSize + 28}" rx="22" fill="white"/>
  <text x="${W/2}" y="${qrY + qrSize + 52}" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#555555">Escanea · Vota · Disfruta</text>
  <text x="${W/2}" y="${H - 54}" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" fill="#3a3a3a">🎸 Si te ha gustado la música,</text>
  <text x="${W/2}" y="${H - 26}" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" fill="#3a3a3a">puedes dejar una propina desde la app</text>
</svg>`;

await sharp({ create: { width: W, height: H, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } } })
  .composite([
    { input: Buffer.from(svgOverlay), top: 0, left: 0 },
    { input: iconBuf, top: 60, left: Math.floor(W/2) - 50 },
    { input: qrResized, top: qrY, left: qrX },
  ])
  .png()
  .toFile('./public/livefy-card.png');

console.log('✓ Cartelito generado en public/livefy-card.png');
