import qrcode from 'qrcode-generator';
import React, { useMemo } from 'react';

/**
 * QR codes for event links (Photos → Links, and the printable sign). Error correction
 * level Q, so a creased or smudged printed sign still scans; a 4-module white border, as
 * the standard asks.
 */

const QUIET = 4;

/** The code as an SVG path in module units, and its width in modules (border included). */
export function qrPath(text: string): { size: number; d: string } {
  const qr = qrcode(0, 'Q');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) if (qr.isDark(row, col)) d += `M${col + QUIET} ${row + QUIET}h1v1h-1z`;
  }
  return { size: n + 2 * QUIET, d };
}

export function QrCode({ text, className, title }: { text: string; className?: string; title?: string }) {
  const { size, d } = useMemo(() => qrPath(text), [text]);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} shapeRendering='crispEdges' role='img' aria-label={title ?? `QR code for ${text}`}>
      <rect width={size} height={size} fill='#fff' />
      <path d={d} fill='#000' />
    </svg>
  );
}

/** Saves the code as a PNG about `px` pixels wide (sharp enough to print several inches across). */
export function downloadQrPng(text: string, filename: string, px = 1200): void {
  const { size, d } = qrPath(text);
  const scale = Math.max(1, Math.floor(px / size));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#000';
  ctx.fill(new Path2D(d));
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, 'image/png');
}
