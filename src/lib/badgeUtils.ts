/**
 * Badge Generation & Printing Utilities
 * Implements the official ACADÉMIE THE BEST ID card format:
 * - 54 x 86 mm (portrait) CR80 standard format
 * - Recto (Front): Marine wave header, school crest, white photo box, category pill,
 *                  student surname & first name, class, centered high-contrast QR code,
 *                  category bottom banner with matricule & academic year.
 * - Verso (Back): Arched accent, central school crest, institution title, 3 usage rules,
 *                 dashed lost badge notice box with Nomayos address, signatures section,
 *                 and contact footer band with official phone numbers.
 * - Duplex alignment for Recto-Verso A4 double-sided printing.
 */
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { Student, BadgeCycle } from '../types';

export interface BadgeTheme {
  primary: string; // Header/Accent color
  pillBg: string;
  pillText: string;
  bannerBg: string;
  label: string;
  badgeCode: string;
}

export const BADGE_CYCLES: Record<BadgeCycle, BadgeTheme> = {
  '1er CYCLE': {
    primary: '#ea580c', // Orange
    pillBg: '#ea580c',
    pillText: '#ffffff',
    bannerBg: '#ea580c',
    label: 'ÉLÈVE • 1er CYCLE',
    badgeCode: '1er cycle',
  },
  '2nd CYCLE': {
    primary: '#1d4ed8', // Royal Blue
    pillBg: '#1d4ed8',
    pillText: '#ffffff',
    bannerBg: '#1d4ed8',
    label: 'ÉLÈVE • 2nd CYCLE',
    badgeCode: '2nd cycle',
  },
  'ENSEIGNANT': {
    primary: '#059669', // Emerald Green
    pillBg: '#059669',
    pillText: '#ffffff',
    bannerBg: '#059669',
    label: 'ENSEIGNANT',
    badgeCode: 'Enseignant',
  },
  'ADMINISTRATION': {
    primary: '#334155', // Charcoal/Slate
    pillBg: '#334155',
    pillText: '#ffffff',
    bannerBg: '#334155',
    label: 'ADMINISTRATION',
    badgeCode: 'Administration',
  },
};

export const SCHOOL_INFO = {
  name: 'ACADÉMIE THE BEST',
  titlePart1: 'ACADÉMIE',
  titlePart2: 'THE BEST',
  tagline: 'Leur devenir, notre priorité',
  academicYear: '2026-2027',
  lostNoticeTitle: 'Si vous trouvez ce badge,',
  lostNoticeBody: 'merci de le rapporter à l\'académie :',
  lostNoticeAddress: 'Nomayos (derrière Station TOTAL) – Mbankomo',
  phones: '652 679 307 • 690 892 898 • 693 136 797',
  subGroup: 'Groupe scolaire bilingue NJOUONTS & SONS',
  rules: [
    'Ce badge est strictement personnel et obligatoire dans l\'enceinte de l\'établissement.',
    'Il doit être présenté à toute demande du personnel.',
    'Toute perte doit être signalée immédiatement à l\'administration.',
  ],
};

/**
 * Determine default cycle based on student level
 */
export function getDefaultCycleForLevel(level: string): BadgeCycle {
  const l = (level || '').toLowerCase();
  if (
    l.includes('form 1') ||
    l.includes('form 2') ||
    l.includes('form 3') ||
    l.includes('6e') ||
    l.includes('5e') ||
    l.includes('4e') ||
    l.includes('3e')
  ) {
    return '1er CYCLE';
  }
  return '2nd CYCLE';
}

/**
 * Split student name into Surname and First Name
 */
export function parseStudentNames(student: Student): { lastName: string; firstName: string } {
  if (student.lastName && student.firstName) {
    return { lastName: student.lastName.toUpperCase(), firstName: student.firstName };
  }

  const parts = (student.name || '').trim().split(/\s+/);
  if (parts.length === 1) {
    return { lastName: parts[0].toUpperCase(), firstName: '' };
  }
  // Assume first word is Surname (e.g., MBARGA), rest is first name (e.g. Jean-Paul)
  const lastName = parts[0].toUpperCase();
  const firstName = parts.slice(1).join(' ');
  return { lastName, firstName };
}

/**
 * Format Matricule e.g. TBA-2026-0001
 */
export function getFormattedMatricule(student: Student, index: number = 0): string {
  if (student.matricule && student.matricule.trim()) {
    return student.matricule.trim();
  }
  const numStr = String(index + 1).padStart(4, '0');
  return `TBA-2026-${numStr}`;
}

/**
 * Get Clean Class Display e.g. "Classe : 6e"
 */
export function getFormattedClass(student: Student): string {
  if (student.className && student.className.trim()) {
    return student.className.trim();
  }
  return student.level;
}

/**
 * High-resolution School Crest SVG Data URI
 */
export const CREST_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="crestGold" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </radialGradient>
    <linearGradient id="crestNavy" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1931"/>
      <stop offset="100%" stop-color="#162a56"/>
    </linearGradient>
    <path id="topTextArc" d="M 32,100 A 68,68 0 0,1 168,100" fill="none"/>
  </defs>

  <!-- Outer gold beaded ring -->
  <circle cx="100" cy="100" r="95" fill="none" stroke="url(#crestGold)" stroke-width="4"/>
  <circle cx="100" cy="100" r="90" fill="url(#crestNavy)" stroke="#d97706" stroke-width="2"/>

  <!-- Inner thin gold border -->
  <circle cx="100" cy="100" r="68" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,2"/>

  <!-- Curved Text: ACADÉMIE THE BEST -->
  <text font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#fef08a" letter-spacing="1.5">
    <textPath href="#topTextArc" startOffset="50%" text-anchor="middle">
      ACADÉMIE THE BEST
    </textPath>
  </text>

  <!-- Laurel Wreath Left -->
  <g fill="#f59e0b" opacity="0.9">
    <path d="M 46,110 C 44,95 50,80 60,68 C 58,74 58,82 62,88 C 54,94 50,102 46,110 Z"/>
    <circle cx="56" cy="80" r="2.5"/>
    <circle cx="51" cy="94" r="2.5"/>
    <circle cx="58" cy="106" r="2.5"/>
  </g>

  <!-- Laurel Wreath Right -->
  <g fill="#f59e0b" opacity="0.9">
    <path d="M 154,110 C 156,95 150,80 140,68 C 142,74 142,82 138,88 C 146,94 150,102 154,110 Z"/>
    <circle cx="144" cy="80" r="2.5"/>
    <circle cx="149" cy="94" r="2.5"/>
    <circle cx="142" cy="106" r="2.5"/>
  </g>

  <!-- Five Point Star at Top Center -->
  <polygon points="100,56 103,64 111,64 105,69 107,77 100,72 93,77 95,69 89,64 97,64" fill="url(#crestGold)"/>

  <!-- Open Book Symbol -->
  <g transform="translate(72, 78) scale(0.56)">
    <!-- Book Pages -->
    <path d="M 50,30 C 35,22 15,22 5,26 L 5,72 C 15,68 35,68 50,76 C 65,68 85,68 95,72 L 95,26 C 85,22 65,22 50,30 Z" fill="#ffffff" stroke="#f59e0b" stroke-width="3"/>
    <!-- Page Lines Left -->
    <line x1="14" y1="36" x2="42" y2="40" stroke="#f59e0b" stroke-width="2"/>
    <line x1="14" y1="46" x2="42" y2="50" stroke="#f59e0b" stroke-width="2"/>
    <line x1="14" y1="56" x2="42" y2="60" stroke="#f59e0b" stroke-width="2"/>
    <!-- Page Lines Right -->
    <line x1="58" y1="40" x2="86" y2="36" stroke="#f59e0b" stroke-width="2"/>
    <line x1="58" y1="50" x2="86" y2="46" stroke="#f59e0b" stroke-width="2"/>
    <line x1="58" y1="60" x2="86" y2="56" stroke="#f59e0b" stroke-width="2"/>
    <!-- Center Spine -->
    <line x1="50" y1="30" x2="50" y2="76" stroke="#d97706" stroke-width="3"/>
  </g>

  <!-- Bottom Gold Ribbon Banner -->
  <g transform="translate(100, 150)">
    <!-- Ribbon body -->
    <path d="M -54,-10 L 54,-10 L 46,10 L -46,10 Z" fill="url(#crestGold)" stroke="#b45309" stroke-width="1.5"/>
    <!-- Ribbon tails -->
    <path d="M -54,-10 L -66,-2 L -50,6 L -54,-10 Z" fill="#b45309"/>
    <path d="M 54,-10 L 66,-2 L 50,6 L 54,-10 Z" fill="#b45309"/>
    <!-- Year Text -->
    <text x="0" y="4" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="900" fill="#0a1931" text-anchor="middle" letter-spacing="2">
      2021
    </text>
  </g>
</svg>
`)}`;

/**
 * Generate QR code as high-resolution PNG data URL
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: 320,
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Load Image Helper for Canvas Drawing
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Render RECTO (Front) of Badge onto HTML Canvas
 * Dimensions: 638 x 1016 px (at 300 DPI for 54 x 86 mm)
 */
export async function renderBadgeRectoCanvas(
  student: Student,
  index: number = 0
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 638;
  canvas.height = 1016;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  const cycle = student.cycle || getDefaultCycleForLevel(student.level);
  const theme = BADGE_CYCLES[cycle] || BADGE_CYCLES['1er CYCLE'];
  const { lastName, firstName } = parseStudentNames(student);
  const matricule = getFormattedMatricule(student, index);
  const academicYear = student.academicYear || SCHOOL_INFO.academicYear;
  const className = getFormattedClass(student);

  // 1. Clean White Base Card with rounded clip
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Border (crisp cutting guide)
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  // 2. Navy Blue Header with Wavy Bottom
  const headerHeight = 310;
  ctx.save();
  ctx.fillStyle = '#0b1a3d'; // Deep marine navy
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, 0);
  ctx.lineTo(canvas.width, headerHeight - 30);
  // Elegant wavy curve
  ctx.bezierCurveTo(
    canvas.width * 0.75,
    headerHeight + 20,
    canvas.width * 0.25,
    headerHeight - 70,
    0,
    headerHeight - 20
  );
  ctx.closePath();
  ctx.fill();

  // Subtle geometric grid pattern overlay on navy header
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 20; x < canvas.width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, headerHeight);
    ctx.stroke();
  }
  for (let y = 20; y < headerHeight; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Draw School Crest Emblem (top left)
  try {
    const crestImg = await loadImage(CREST_SVG_DATA_URL);
    ctx.drawImage(crestImg, 34, 32, 105, 105);
  } catch (err) {
    console.warn('Could not load crest for canvas:', err);
  }

  // 4. Header Titles (ACADÉMIE THE BEST + Tagline)
  ctx.textAlign = 'left';
  // "ACADÉMIE"
  ctx.font = 'bold 30px "Inter", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ACADÉMIE', 156, 72);

  // "THE BEST"
  ctx.font = '900 36px "Inter", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f97316'; // Vibrant orange
  ctx.fillText('THE BEST', 156, 114);

  // Tagline
  ctx.font = 'italic 16px "Inter", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
  ctx.fillText(SCHOOL_INFO.tagline, 156, 142);

  // 5. White Photo Container (Centered, overlapping header)
  const photoBoxW = 224;
  const photoBoxH = 274;
  const photoBoxX = (canvas.width - photoBoxW) / 2;
  const photoBoxY = 176;

  // Shadow for photo box
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH, 22);
  ctx.fill();
  ctx.restore();

  // Photo Box White Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.stroke();

  // Photo Content
  const innerPad = 8;
  const innerPhotoW = photoBoxW - innerPad * 2;
  const innerPhotoH = photoBoxH - innerPad * 2;
  const innerPhotoX = photoBoxX + innerPad;
  const innerPhotoY = photoBoxY + innerPad;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(innerPhotoX, innerPhotoY, innerPhotoW, innerPhotoH, 16);
  ctx.clip();

  if (student.photoUrl) {
    try {
      const studentImg = await loadImage(student.photoUrl);
      ctx.drawImage(studentImg, innerPhotoX, innerPhotoY, innerPhotoW, innerPhotoH);
    } catch {
      drawSilhouettePlaceholder(ctx, innerPhotoX, innerPhotoY, innerPhotoW, innerPhotoH);
    }
  } else {
    drawSilhouettePlaceholder(ctx, innerPhotoX, innerPhotoY, innerPhotoW, innerPhotoH);
  }
  ctx.restore();

  // 6. Category Pill Badge
  const pillY = 478;
  const pillH = 38;
  const pillW = 280;
  const pillX = (canvas.width - pillW) / 2;

  ctx.save();
  ctx.fillStyle = theme.pillBg;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 19);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = 'bold 17px "Inter", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = theme.pillText;
  ctx.fillText(theme.label, canvas.width / 2, pillY + 25);
  ctx.restore();

  // 7. Student Name
  ctx.textAlign = 'center';
  // Surname in Bold Navy Uppercase
  ctx.font = '900 36px "Inter", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(lastName || 'ÉTUDIANT', canvas.width / 2, 560);

  // First name below
  if (firstName) {
    ctx.font = '600 24px "Inter", system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(firstName, canvas.width / 2, 598);
  }

  // Class Line e.g. "Classe : 6e"
  ctx.font = 'bold 22px "Inter", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#1e293b';
  ctx.fillText(`Classe : ${className}`, canvas.width / 2, 638);

  // 8. Centered High-Contrast QR Code
  const qrSize = 186;
  const qrX = (canvas.width - qrSize) / 2;
  const qrY = 672;
  const qrData = `XCLS1:${student.id}`;
  const qrUrl = await generateQrDataUrl(qrData);
  const qrImg = await loadImage(qrUrl);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  // 9. Bottom Category Color Banner
  const bannerH = 74;
  const bannerY = canvas.height - bannerH;

  ctx.fillStyle = theme.bannerBg;
  ctx.fillRect(0, bannerY, canvas.width, bannerH);

  // Banner Text: N° TBA-2026-0001 • 2026-2027
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px "Inter", monospace, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`N° ${matricule} • ${academicYear}`, canvas.width / 2, bannerY + 45);

  return canvas;
}

/**
 * Render VERSO (Back) of Badge onto HTML Canvas
 * Dimensions: 638 x 1016 px (at 300 DPI for 54 x 86 mm)
 */
export async function renderBadgeVersoCanvas(
  student: Student,
  index: number = 0
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = 638;
  canvas.height = 1016;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  const cycle = student.cycle || getDefaultCycleForLevel(student.level);
  const theme = BADGE_CYCLES[cycle] || BADGE_CYCLES['1er CYCLE'];

  // 1. White Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Outer Border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  // 2. Top Accent Arched Bar in Category Color
  ctx.fillStyle = theme.primary;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, 0);
  ctx.lineTo(canvas.width, 24);
  ctx.bezierCurveTo(canvas.width * 0.7, 40, canvas.width * 0.3, 40, 0, 24);
  ctx.closePath();
  ctx.fill();

  // 3. Central School Crest
  try {
    const crestImg = await loadImage(CREST_SVG_DATA_URL);
    ctx.drawImage(crestImg, (canvas.width - 140) / 2, 54, 140, 140);
  } catch (err) {
    console.warn('Could not load crest for verso:', err);
  }

  // 4. Institution Titles
  ctx.textAlign = 'center';
  ctx.font = 'bold 28px "Inter", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#0f172a';
  // Draw ACADÉMIE THE BEST
  const acadText = 'ACADÉMIE ';
  const bestText = 'THE BEST';
  ctx.font = 'bold 28px "Inter", sans-serif';
  const acadWidth = ctx.measureText(acadText).width;
  ctx.font = '900 28px "Inter", sans-serif';
  const bestWidth = ctx.measureText(bestText).width;
  const totalW = acadWidth + bestWidth;
  const startX = (canvas.width - totalW) / 2;

  ctx.textAlign = 'left';
  ctx.font = 'bold 28px "Inter", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(acadText, startX, 230);

  ctx.font = '900 28px "Inter", sans-serif';
  ctx.fillStyle = '#ea580c';
  ctx.fillText(bestText, startX + acadWidth, 230);

  // Tagline
  ctx.textAlign = 'center';
  ctx.font = 'italic 16px "Inter", sans-serif';
  ctx.fillStyle = '#d97706';
  ctx.fillText(SCHOOL_INFO.tagline, canvas.width / 2, 260);

  // 5. Usage Rules (3 bullet points with orange dots)
  const rules = SCHOOL_INFO.rules;
  let ruleY = 308;
  const bulletX = 52;
  const textX = 76;
  const maxTextWidth = canvas.width - 128;

  rules.forEach((rule) => {
    // Orange bullet circle
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(bulletX, ruleY - 5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Rule text wrapped
    ctx.textAlign = 'left';
    ctx.font = '500 16px "Inter", sans-serif';
    ctx.fillStyle = '#334155';
    const lines = wrapText(ctx, rule, maxTextWidth);
    lines.forEach((line, lIdx) => {
      ctx.fillText(line, textX, ruleY + lIdx * 22);
    });
    ruleY += lines.length * 22 + 18;
  });

  // 6. Lost Badge Notice Box (Dashed Orange Border)
  const boxX = 44;
  const boxY = 478;
  const boxW = canvas.width - 88;
  const boxH = 154;

  ctx.save();
  // Pale orange background
  ctx.fillStyle = '#fff7ed';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 16);
  ctx.fill();

  // Dashed border
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 6]);
  ctx.stroke();
  ctx.restore();

  // Lost box text
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px "Inter", sans-serif';
  ctx.fillStyle = '#ea580c';
  ctx.fillText(SCHOOL_INFO.lostNoticeTitle, canvas.width / 2, boxY + 36);

  ctx.font = '500 15px "Inter", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(SCHOOL_INFO.lostNoticeBody, canvas.width / 2, boxY + 66);

  ctx.font = 'bold 17px "Inter", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(SCHOOL_INFO.lostNoticeAddress, canvas.width / 2, boxY + 104);

  // 7. Signatures Block
  const sigY = 684;
  ctx.font = '600 15px "Inter", sans-serif';
  ctx.fillStyle = '#475569';

  // Left: Signature du titulaire
  ctx.textAlign = 'center';
  ctx.fillText('Signature du titulaire', 170, sigY);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(70, sigY + 68);
  ctx.lineTo(270, sigY + 68);
  ctx.stroke();

  // Right: Cachet / Direction
  ctx.fillText('Cachet / Direction', canvas.width - 170, sigY);
  // Stamp seal circle outline
  ctx.save();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(canvas.width - 170, sigY + 70, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 8. Bottom Footer Band (Category Color)
  const footerH = 92;
  const footerY = canvas.height - footerH;

  ctx.fillStyle = theme.bannerBg;
  ctx.fillRect(0, footerY, canvas.width, footerH);

  // Phone numbers line
  ctx.textAlign = 'center';
  ctx.font = '900 21px "Inter", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(SCHOOL_INFO.phones, canvas.width / 2, footerY + 38);

  // Subtitle line
  ctx.font = '500 14px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillText(SCHOOL_INFO.subGroup, canvas.width / 2, footerY + 68);

  return canvas;
}

/**
 * Draw placeholder silhouette when no photo is uploaded
 */
function drawSilhouettePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Light slate gradient background
  const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
  bgGrad.addColorStop(0, '#e2e8f0');
  bgGrad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(x, y, w, h);

  // Silhouette color
  ctx.fillStyle = '#94a3b8';

  // Head circle
  const headR = w * 0.22;
  const headX = x + w / 2;
  const headY = y + h * 0.38;
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders ellipse/arc
  const shoulderW = w * 0.44;
  const shoulderH = h * 0.34;
  const shoulderY = y + h * 0.68;
  ctx.beginPath();
  ctx.ellipse(headX, shoulderY + shoulderH * 0.5, shoulderW, shoulderH, 0, Math.PI, 0);
  ctx.fill();
}

/**
 * Simple text wrapping helper for canvas
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = `${currentLine} ${word}`;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Export Duplex A4 PDF Document
 * Standard A4: 210 x 297 mm
 * Card Dimensions: 54 x 86 mm (portrait)
 * Fits 6 badges per page (2 columns x 3 rows).
 * Page 1: Fronts (Recto)
 * Page 2: Backs (Verso) with columns HORIZONTALLY MIRRORED for duplex long-edge flip alignment!
 */
export async function generateDuplexBadgesPdf(
  students: Student[],
  progressCallback?: (status: string, percent: number) => void
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cardWidth = 54;
  const cardHeight = 86;
  const cols = 2;
  const rows = 3;
  const cardsPerPage = cols * rows; // 6 cards per A4 page

  // Margins calculation to center the 2x3 grid on 210x297mm A4 sheet
  const gapX = 14; // mm between columns
  const gapY = 8; // mm between rows
  const gridWidth = cols * cardWidth + (cols - 1) * gapX; // 2 * 54 + 14 = 122 mm
  const gridHeight = rows * cardHeight + (rows - 1) * gapY; // 3 * 86 + 16 = 274 mm
  const startX = (210 - gridWidth) / 2; // (210 - 122) / 2 = 44 mm
  const startY = (297 - gridHeight) / 2; // (297 - 274) / 2 = 11.5 mm

  const totalPages = Math.ceil(students.length / cardsPerPage);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const sliceStart = pageIdx * cardsPerPage;
    const pageStudents = students.slice(sliceStart, sliceStart + cardsPerPage);

    if (pageIdx > 0) {
      doc.addPage('a4', 'portrait');
    }

    // ----------------------------------------------------
    // RECTO PAGE (Odd Page in Duplex)
    // ----------------------------------------------------
    if (progressCallback) {
      progressCallback(
        `Rendering Recto page ${pageIdx + 1}/${totalPages}...`,
        Math.round(((pageIdx * 2) / (totalPages * 2)) * 100)
      );
    }

    // Header label on print margin
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `ACADÉMIE THE BEST • BILINGUAL ACADEMY — RECTO (PAGE ${pageIdx * 2 + 1}) • CUT ALONG GUIDES`,
      14,
      7
    );

    // Render Fronts
    for (let i = 0; i < pageStudents.length; i++) {
      const student = pageStudents[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      const rectoCanvas = await renderBadgeRectoCanvas(student, sliceStart + i);
      const rectoDataUrl = rectoCanvas.toDataURL('image/jpeg', 0.95);

      // Draw card
      doc.addImage(rectoDataUrl, 'JPEG', x, y, cardWidth, cardHeight);

      // Draw light dashed crop marks around card
      doc.setDrawColor(203, 213, 225);
      doc.setLineDashPattern([1, 2], 0);
      doc.rect(x - 0.5, y - 0.5, cardWidth + 1, cardHeight + 1);
    }

    // ----------------------------------------------------
    // VERSO PAGE (Even Page in Duplex)
    // CRITICAL: Columns are HORIZONTALLY MIRRORED!
    // Col 0 on Recto aligns with Col 1 on Verso, and vice versa!
    // ----------------------------------------------------
    doc.addPage('a4', 'portrait');

    if (progressCallback) {
      progressCallback(
        `Rendering Verso page ${pageIdx + 1}/${totalPages}...`,
        Math.round(((pageIdx * 2 + 1) / (totalPages * 2)) * 100)
      );
    }

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `ACADÉMIE THE BEST • BILINGUAL ACADEMY — VERSO (PAGE ${pageIdx * 2 + 2}) • MIRRORED DUPLEX ALIGNED`,
      14,
      7
    );

    for (let i = 0; i < pageStudents.length; i++) {
      const student = pageStudents[i];
      const origCol = i % cols;
      const row = Math.floor(i / cols);

      // MIRROR COLUMNS: Col 0 becomes Col 1, Col 1 becomes Col 0
      const mirroredCol = cols - 1 - origCol;
      const x = startX + mirroredCol * (cardWidth + gapX);
      const y = startY + row * (cardHeight + gapY);

      const versoCanvas = await renderBadgeVersoCanvas(student, sliceStart + i);
      const versoDataUrl = versoCanvas.toDataURL('image/jpeg', 0.95);

      doc.addImage(versoDataUrl, 'JPEG', x, y, cardWidth, cardHeight);

      // Draw light dashed crop marks around card
      doc.setDrawColor(203, 213, 225);
      doc.setLineDashPattern([1, 2], 0);
      doc.rect(x - 0.5, y - 0.5, cardWidth + 1, cardHeight + 1);
    }
  }

  if (progressCallback) {
    progressCallback('Done generating duplex PDF!', 100);
  }

  return doc;
}

/**
 * Generate a ZIP containing High-Res PNGs for each selected student
 * (Recto, Verso, and Combined)
 */
export async function generateBadgesZip(
  students: Student[],
  progressCallback?: (status: string, percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('THE_BEST_ACADEMY_BADGES');

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const matricule = getFormattedMatricule(student, i);
    const safeName = student.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (progressCallback) {
      progressCallback(
        `Rendering badge images for ${student.name} (${i + 1}/${students.length})...`,
        Math.round((i / students.length) * 100)
      );
    }

    // 1. Recto Canvas
    const rectoCanvas = await renderBadgeRectoCanvas(student, i);
    const rectoBlob = await new Promise<Blob | null>((resolve) =>
      rectoCanvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (rectoBlob && folder) {
      folder.file(`${matricule}_${safeName}_RECTO.png`, rectoBlob);
    }

    // 2. Verso Canvas
    const versoCanvas = await renderBadgeVersoCanvas(student, i);
    const versoBlob = await new Promise<Blob | null>((resolve) =>
      versoCanvas.toBlob((b) => resolve(b), 'image/png')
    );
    if (versoBlob && folder) {
      folder.file(`${matricule}_${safeName}_VERSO.png`, versoBlob);
    }
  }

  if (progressCallback) {
    progressCallback('Compressing ZIP archive...', 95);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  if (progressCallback) {
    progressCallback('ZIP ready for download!', 100);
  }
  return content;
}
