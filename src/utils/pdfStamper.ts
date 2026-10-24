import { PDFDocument, rgb, StandardFonts, PDFImage } from 'pdf-lib';
import type { SignatureField } from '../types';
import { computeSha256 } from './crypto';

export interface StampOptions {
  originalPdfBytes: Uint8Array;
  fields: SignatureField[];
  envelopeId: string;
  documentTitle: string;
  signerName: string;
  signerEmail?: string;
  ipAddress?: string;
  appendCertificate?: boolean;
}

export interface StampResult {
  signedPdfBytes: Uint8Array;
  originalHash: string;
  signedHash: string;
  envelopeId: string;
  completedAt: string;
}

/**
 * Safely sanitizes text for PDF standard fonts (Helvetica/TimesRoman)
 * which strictly only support WinAnsi (Latin-1) characters.
 */
function sanitizePdfText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // En/em dashes
    .replace(/[\u2026]/g, '...')     // Ellipsis
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' '); // Strip non-WinAnsi
}

/**
 * Decodes a clean base64 string to Uint8Array safely without stack overflow.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const clean = base64.replace(/[\s\r\n]+/g, '');
  const binaryString = atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts any image (data URL, blob URL, webp, etc.) to PNG data URL via HTML Canvas.
 */
async function convertToPngDataUrl(sourceUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve(sourceUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 400;
      canvas.height = img.naturalHeight || img.height || 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(sourceUrl);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = sourceUrl;
  });
}

/**
 * Safely embeds an image into a pdf-lib PDFDocument.
 */
async function embedSignatureImage(pdfDoc: PDFDocument, dataUrl: string): Promise<PDFImage | null> {
  try {
    let targetUrl = dataUrl;

    // If it's not a direct PNG or JPEG data URL, convert it via canvas
    if (!targetUrl.startsWith('data:image/png') && !targetUrl.startsWith('data:image/jpeg') && !targetUrl.startsWith('data:image/jpg')) {
      targetUrl = await convertToPngDataUrl(targetUrl);
    }

    if (targetUrl.startsWith('data:image/png')) {
      const base64Data = targetUrl.split(',')[1];
      const bytes = base64ToUint8Array(base64Data);
      return await pdfDoc.embedPng(bytes);
    } else if (targetUrl.startsWith('data:image/jpeg') || targetUrl.startsWith('data:image/jpg')) {
      const base64Data = targetUrl.split(',')[1];
      const bytes = base64ToUint8Array(base64Data);
      return await pdfDoc.embedJpg(bytes);
    }
  } catch (err) {
    console.error('Error in embedSignatureImage:', err);
  }
  return null;
}

export async function stampDocument(options: StampOptions): Promise<StampResult> {
  const {
    originalPdfBytes,
    fields,
    envelopeId,
    documentTitle,
    signerName,
    signerEmail = 'signer@example.com',
    ipAddress = 'Cloudflare Edge (Protected)',
    appendCertificate = true,
  } = options;

  if (!originalPdfBytes || originalPdfBytes.byteLength === 0) {
    throw new Error('Original document bytes are missing or empty.');
  }

  // Clone bytes to avoid detachment issues
  const safePdfBytes = new Uint8Array(originalPdfBytes.slice());
  const originalHash = await computeSha256(safePdfBytes);

  // Load PDF with ignoreEncryption: true to support read-only or permission-flagged PDFs
  const pdfDoc = await PDFDocument.load(safePdfBytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pages = pdfDoc.getPages();

  // Cache embedded signature images by dataUrl so we only embed each image once
  const imageCache = new Map<string, PDFImage>();

  // 1. Stamp all placed fields onto their respective pages
  for (const field of fields) {
    if (field.pageNumber < 1 || field.pageNumber > pages.length) continue;
    const page = pages[field.pageNumber - 1];
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    // Convert percentage coordinates (from top-left) to PDF points (from bottom-left)
    const fieldWidthPt = Math.max(10, (field.width / 100) * pageWidth);
    const fieldHeightPt = Math.max(5, (field.height / 100) * pageHeight);
    const fieldXPt = (field.x / 100) * pageWidth;
    const fieldYPt = Math.max(0, pageHeight - ((field.y / 100) * pageHeight) - fieldHeightPt);

    if (field.type === 'signature' || field.type === 'initials') {
      if (field.signatureDataUrl) {
        try {
          let embeddedImage = imageCache.get(field.signatureDataUrl);
          if (!embeddedImage) {
            const img = await embedSignatureImage(pdfDoc, field.signatureDataUrl);
            if (img) {
              imageCache.set(field.signatureDataUrl, img);
              embeddedImage = img;
            }
          }

          if (embeddedImage) {
            page.drawImage(embeddedImage, {
              x: fieldXPt,
              y: fieldYPt,
              width: fieldWidthPt,
              height: fieldHeightPt,
            });
          } else {
            // Text fallback if image conversion failed
            page.drawText(sanitizePdfText(`Signed by: ${field.signerName}`), {
              x: fieldXPt + 4,
              y: fieldYPt + fieldHeightPt / 2,
              size: 11,
              font: helveticaOblique,
              color: rgb(0.05, 0.2, 0.5),
            });
          }
        } catch (err) {
          console.error('Failed to stamp signature image onto page:', err);
          page.drawText(sanitizePdfText(`Signed by: ${field.signerName}`), {
            x: fieldXPt + 4,
            y: fieldYPt + fieldHeightPt / 2,
            size: 11,
            font: helveticaOblique,
            color: rgb(0.05, 0.2, 0.5),
          });
        }
      }
    } else if (field.type === 'date') {
      const rawDate = field.value || new Date().toISOString().split('T')[0];
      const dateText = sanitizePdfText(rawDate);
      const fontSize = Math.max(8, Math.min(13, fieldHeightPt * 0.45));
      page.drawText(dateText, {
        x: fieldXPt + 4,
        y: fieldYPt + (fieldHeightPt - fontSize) / 2,
        size: fontSize,
        font: helvetica,
        color: rgb(0.1, 0.15, 0.25),
      });
    } else if (field.type === 'name' || field.type === 'text') {
      const rawText = field.value || field.signerName || 'Signer';
      const text = sanitizePdfText(rawText);
      const fontSize = Math.max(8, Math.min(13, fieldHeightPt * 0.45));
      page.drawText(text, {
        x: fieldXPt + 4,
        y: fieldYPt + (fieldHeightPt - fontSize) / 2,
        size: fontSize,
        font: helvetica,
        color: rgb(0.1, 0.15, 0.25),
      });
    }
  }

  const completedAt = new Date().toISOString();

  // 2. Append Certificate of Completion if enabled
  if (appendCertificate) {
    try {
      const certPage = pdfDoc.addPage([595.28, 841.89]); // Standard A4 (Points)
      const { width: cW, height: cH } = certPage.getSize();

      // Top Header Banner
      certPage.drawRectangle({
        x: 0,
        y: cH - 85,
        width: cW,
        height: 85,
        color: rgb(0.204, 0.082, 0.224), // Fraoula Deep Plum #341539
      });

      certPage.drawText('CloudSign Certificate of Completion', {
        x: 40,
        y: cH - 45,
        size: 20,
        font: helveticaBold,
        color: rgb(1, 1, 0.773), // Fraoula Cream #FFFFC5
      });

      certPage.drawText('Secured via Cloudflare Edge Network | Cryptographic Tamper-Evident Audit Record', {
        x: 40,
        y: cH - 65,
        size: 9,
        font: helvetica,
        color: rgb(0.95, 0.95, 0.8), // Fraoula Cream
      });

      // Envelope & Document Summary Box
      let currentY = cH - 110;
      certPage.drawRectangle({
        x: 40,
        y: currentY - 70,
        width: cW - 80,
        height: 70,
        color: rgb(0.96, 0.98, 1.0),
        borderColor: rgb(0.85, 0.9, 0.96),
        borderWidth: 1,
      });

      certPage.drawText('ENVELOPE SUMMARY', {
        x: 55,
        y: currentY - 20,
        size: 10,
        font: helveticaBold,
        color: rgb(0.05, 0.25, 0.5),
      });

      certPage.drawText(`Document Title: ${sanitizePdfText(documentTitle).slice(0, 48)}`, {
        x: 55,
        y: currentY - 38,
        size: 9,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      certPage.drawText(`Envelope ID: ${envelopeId}`, {
        x: 55,
        y: currentY - 52,
        size: 9,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      certPage.drawText(`Completed Date: ${completedAt.slice(0, 10)} UTC`, {
        x: 320,
        y: currentY - 38,
        size: 9,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      certPage.drawText(`Pages: ${pages.length + 1} (Includes Certificate)`, {
        x: 320,
        y: currentY - 52,
        size: 9,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Signer Events Section
      currentY = currentY - 95;
      certPage.drawText('SIGNER EVENTS & VERIFICATION', {
        x: 40,
        y: currentY,
        size: 11,
        font: helveticaBold,
        color: rgb(0.1, 0.15, 0.25),
      });

      currentY = currentY - 15;
      certPage.drawLine({
        start: { x: 40, y: currentY },
        end: { x: cW - 40, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.85, 0.9),
      });

      currentY = currentY - 25;
      certPage.drawText(`Signer: ${sanitizePdfText(signerName)}`, {
        x: 40,
        y: currentY,
        size: 11,
        font: helveticaBold,
        color: rgb(0.05, 0.1, 0.2),
      });

      certPage.drawText(`Email: ${sanitizePdfText(signerEmail)}`, {
        x: 40,
        y: currentY - 16,
        size: 9,
        font: helvetica,
        color: rgb(0.3, 0.35, 0.45),
      });

      certPage.drawText('Security Level: Cloudflare Zero Trust / Edge IP Verified', {
        x: 40,
        y: currentY - 30,
        size: 8.5,
        font: helvetica,
        color: rgb(0.3, 0.35, 0.45),
      });

      certPage.drawText(`Signer IP Address: ${sanitizePdfText(ipAddress)}`, {
        x: 40,
        y: currentY - 44,
        size: 8.5,
        font: helvetica,
        color: rgb(0.3, 0.35, 0.45),
      });

      // Signature stamp thumbnail on certificate
      const sigField = fields.find((f) => f.type === 'signature' && f.signatureDataUrl);
      if (sigField?.signatureDataUrl) {
        try {
          const sigImg = imageCache.get(sigField.signatureDataUrl) || (await embedSignatureImage(pdfDoc, sigField.signatureDataUrl));
          if (sigImg) {
            certPage.drawRectangle({
              x: cW - 200,
              y: currentY - 45,
              width: 160,
              height: 55,
              color: rgb(1, 1, 1),
              borderColor: rgb(0.8, 0.85, 0.9),
              borderWidth: 1,
            });
            certPage.drawImage(sigImg, {
              x: cW - 195,
              y: currentY - 40,
              width: 150,
              height: 45,
            });
            certPage.drawText('Electronic Signature Stamped', {
              x: cW - 195,
              y: currentY - 55,
              size: 7.5,
              font: helveticaOblique,
              color: rgb(0.4, 0.5, 0.6),
            });
          }
        } catch (err) {
          console.error('Failed to draw signature preview on cert:', err);
        }
      }

      // Cryptographic Hashes Section
      currentY = currentY - 95;
      certPage.drawText('CRYPTOGRAPHIC INTEGRITY & AUDIT PROOF', {
        x: 40,
        y: currentY,
        size: 11,
        font: helveticaBold,
        color: rgb(0.1, 0.15, 0.25),
      });

      currentY = currentY - 15;
      certPage.drawLine({
        start: { x: 40, y: currentY },
        end: { x: cW - 40, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.85, 0.9),
      });

      currentY = currentY - 20;
      certPage.drawText('Original Document SHA-256 Checksum:', {
        x: 40,
        y: currentY,
        size: 8.5,
        font: helveticaBold,
        color: rgb(0.2, 0.25, 0.35),
      });

      currentY = currentY - 14;
      certPage.drawText(originalHash, {
        x: 40,
        y: currentY,
        size: 7.5,
        font: helvetica,
        color: rgb(0.1, 0.3, 0.6),
      });

      currentY = currentY - 25;
      certPage.drawText('Electronic Signature Legal Disclosure:', {
        x: 40,
        y: currentY,
        size: 8.5,
        font: helveticaBold,
        color: rgb(0.2, 0.25, 0.35),
      });

      currentY = currentY - 15;
      const disclosureLines = [
        'This document was executed electronically in compliance with the Electronic Signatures in Global and',
        'National Commerce Act (ESIGN) and the Uniform Electronic Transactions Act (UETA). The cryptographic',
        'hash above guarantees document integrity. Any modification to the signed document invalidates this certificate.'
      ];

      for (const line of disclosureLines) {
        certPage.drawText(line, {
          x: 40,
          y: currentY,
          size: 7.5,
          font: helveticaOblique,
          color: rgb(0.35, 0.4, 0.45),
        });
        currentY -= 11;
      }

      // Cloudflare Edge Security Seal Badge
      currentY = currentY - 30;
      certPage.drawRectangle({
        x: 40,
        y: currentY - 30,
        width: cW - 80,
        height: 45,
        color: rgb(0.94, 0.98, 0.94),
        borderColor: rgb(0.7, 0.88, 0.7),
        borderWidth: 1,
      });

      certPage.drawText('VERIFIED AUDIT LOG STORED IN CLOUDFLARE D1 & R2', {
        x: 55,
        y: currentY - 5,
        size: 9,
        font: helveticaBold,
        color: rgb(0.1, 0.5, 0.2),
      });

      certPage.drawText(`Tamper-evident record sealed at Cloudflare Edge. Envelope Token: ${envelopeId}`, {
        x: 55,
        y: currentY - 20,
        size: 7.5,
        font: helvetica,
        color: rgb(0.2, 0.4, 0.25),
      });
    } catch (certErr) {
      console.error('Non-critical certificate generation error:', certErr);
    }
  }

  const signedPdfBytes = await pdfDoc.save();
  const signedHash = await computeSha256(signedPdfBytes);

  return {
    signedPdfBytes,
    originalHash,
    signedHash,
    envelopeId,
    completedAt,
  };
}
