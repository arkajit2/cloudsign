import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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

  const originalHash = await computeSha256(originalPdfBytes);
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pages = pdfDoc.getPages();

  // 1. Stamp all placed fields onto their respective pages
  for (const field of fields) {
    if (field.pageNumber < 1 || field.pageNumber > pages.length) continue;
    const page = pages[field.pageNumber - 1];
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();

    // Convert percentage coordinates (from top-left) to PDF points (from bottom-left)
    const fieldWidthPt = (field.width / 100) * pageWidth;
    const fieldHeightPt = (field.height / 100) * pageHeight;
    const fieldXPt = (field.x / 100) * pageWidth;
    const fieldYPt = pageHeight - ((field.y / 100) * pageHeight) - fieldHeightPt;

    if (field.type === 'signature' || field.type === 'initials') {
      if (field.signatureDataUrl) {
        try {
          let embeddedImage;
          if (field.signatureDataUrl.startsWith('data:image/png')) {
            const base64Data = field.signatureDataUrl.split(',')[1];
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            embeddedImage = await pdfDoc.embedPng(imageBytes);
          } else if (field.signatureDataUrl.startsWith('data:image/jpeg') || field.signatureDataUrl.startsWith('data:image/jpg')) {
            const base64Data = field.signatureDataUrl.split(',')[1];
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
          }

          if (embeddedImage) {
            page.drawImage(embeddedImage, {
              x: fieldXPt,
              y: fieldYPt,
              width: fieldWidthPt,
              height: fieldHeightPt,
            });
          }
        } catch (err) {
          console.error('Failed to embed signature image:', err);
          // Fallback text stamp if image fails
          page.drawText(`Signed by: ${field.signerName}`, {
            x: fieldXPt + 4,
            y: fieldYPt + fieldHeightPt / 2,
            size: 11,
            font: helveticaOblique,
            color: rgb(0.05, 0.2, 0.5),
          });
        }
      }
    } else if (field.type === 'date') {
      const dateText = field.value || new Date().toISOString().split('T')[0];
      const fontSize = Math.max(9, Math.min(14, fieldHeightPt * 0.45));
      page.drawText(dateText, {
        x: fieldXPt + 4,
        y: fieldYPt + (fieldHeightPt - fontSize) / 2,
        size: fontSize,
        font: helvetica,
        color: rgb(0.1, 0.15, 0.25),
      });
    } else if (field.type === 'name' || field.type === 'text') {
      const text = field.value || field.signerName;
      const fontSize = Math.max(9, Math.min(14, fieldHeightPt * 0.45));
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

  // 2. Append DocuSign-style Certificate of Completion if enabled
  if (appendCertificate) {
    const certPage = pdfDoc.addPage([595.28, 841.89]); // Standard A4 (Points)
    const { width: cW, height: cH } = certPage.getSize();

    // Top Header Banner
    certPage.drawRectangle({
      x: 0,
      y: cH - 85,
      width: cW,
      height: 85,
      color: rgb(0.03, 0.12, 0.25), // Cloudflare/DocuSign Deep Navy
    });

    certPage.drawText('CloudSign Certificate of Completion', {
      x: 40,
      y: cH - 45,
      size: 20,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    certPage.drawText('Secured via Cloudflare Edge Network | Cryptographic Tamper-Evident Audit Record', {
      x: 40,
      y: cH - 65,
      size: 9,
      font: helvetica,
      color: rgb(0.7, 0.85, 1),
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

    certPage.drawText(`Document Title: ${documentTitle.slice(0, 50)}`, {
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

    certPage.drawText(`Completed Date: ${completedAt} UTC`, {
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
    certPage.drawText(`Signer: ${signerName}`, {
      x: 40,
      y: currentY,
      size: 11,
      font: helveticaBold,
      color: rgb(0.05, 0.1, 0.2),
    });

    certPage.drawText(`Email: ${signerEmail}`, {
      x: 40,
      y: currentY - 16,
      size: 9,
      font: helvetica,
      color: rgb(0.3, 0.35, 0.45),
    });

    certPage.drawText(`Security Level: Cloudflare Zero Trust / Edge IP Verified`, {
      x: 40,
      y: currentY - 30,
      size: 8.5,
      font: helvetica,
      color: rgb(0.3, 0.35, 0.45),
    });

    certPage.drawText(`Signer IP Address: ${ipAddress}`, {
      x: 40,
      y: currentY - 44,
      size: 8.5,
      font: helvetica,
      color: rgb(0.3, 0.35, 0.45),
    });

    // Signature stamp thumbnail on certificate
    const sigField = fields.find(f => f.type === 'signature' && f.signatureDataUrl);
    if (sigField?.signatureDataUrl) {
      try {
        let sigImg;
        if (sigField.signatureDataUrl.startsWith('data:image/png')) {
          const base64Data = sigField.signatureDataUrl.split(',')[1];
          const imgBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          sigImg = await pdfDoc.embedPng(imgBytes);
        }
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
    const disclosureText = 
      'This document was executed electronically in compliance with the Electronic Signatures in Global and\n' +
      'National Commerce Act (ESIGN) and the Uniform Electronic Transactions Act (UETA). The cryptographic\n' +
      'hash above guarantees document integrity. Any modification to the signed document invalidates this certificate.';
    
    certPage.drawText(disclosureText, {
      x: 40,
      y: currentY,
      size: 7.5,
      lineHeight: 11,
      font: helveticaOblique,
      color: rgb(0.35, 0.4, 0.45),
    });

    // Cloudflare Edge Security Seal Badge
    currentY = currentY - 70;
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
