import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function createSampleAgreementPdf(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  // Document Title
  page.drawText('MUTUAL NON-DISCLOSURE AGREEMENT', {
    x: 100,
    y: height - 80,
    size: 16,
    font: timesRomanBold,
    color: rgb(0.1, 0.1, 0.2),
  });

  page.drawLine({
    start: { x: 50, y: height - 95 },
    end: { x: width - 50, y: height - 95 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });

  const bodyParagraphs = [
    'This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the date of execution by and between the undersigned parties for the purpose of preventing the unauthorized disclosure of Confidential Information.',
    '1. Confidential Information: All proprietary information, software architectures, cryptographic algorithms, designs, documents, and trade secrets disclosed by either party to the other shall be considered strictly confidential.',
    '2. Obligations of Receiving Party: The receiving party agrees to hold and maintain the Confidential Information in strictest confidence and not to disclose such information to any third party without prior written authorization.',
    '3. Governing Law: This Agreement shall be governed by and construed in accordance with the laws of the applicable jurisdiction, without giving effect to any principles of conflicts of law.',
    '4. Electronic Signatures: The parties acknowledge and agree that this document may be signed electronically via CloudSign in accordance with ESIGN and UETA standards, and such electronic signatures shall be legally binding and enforceable.'
  ];

  let yOffset = height - 130;
  for (const para of bodyParagraphs) {
    // Wrap paragraph text
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const textWidth = timesRoman.widthOfTextAtSize(testLine, 10);
      if (textWidth > width - 100) {
        page.drawText(line, { x: 50, y: yOffset, size: 10, font: timesRoman, color: rgb(0.2, 0.2, 0.2) });
        yOffset -= 16;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      page.drawText(line, { x: 50, y: yOffset, size: 10, font: timesRoman, color: rgb(0.2, 0.2, 0.2) });
      yOffset -= 24;
    }
  }

  // Signature Block Section
  yOffset -= 20;
  page.drawText('IN WITNESS WHEREOF, the parties hereto have executed this Agreement.', {
    x: 50,
    y: yOffset,
    size: 10,
    font: timesRomanBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  yOffset -= 60;

  // Party A (Company)
  page.drawText('COMPANY REPRESENTATIVE:', { x: 50, y: yOffset, size: 9, font: timesRomanBold });
  page.drawLine({ start: { x: 50, y: yOffset - 40 }, end: { x: 250, y: yOffset - 40 }, thickness: 0.8, color: rgb(0.5, 0.5, 0.5) });
  page.drawText('Signature: Authorized Corporate Signatory', { x: 50, y: yOffset - 35, size: 9, font: helvetica, color: rgb(0.1, 0.3, 0.6) });
  page.drawText('Date: ' + new Date().toISOString().split('T')[0], { x: 50, y: yOffset - 55, size: 8.5, font: helvetica, color: rgb(0.4, 0.4, 0.4) });

  // Party B (Signer - Target for user to sign!)
  page.drawText('RECEIVING PARTY / SIGNER:', { x: 320, y: yOffset, size: 9, font: timesRomanBold });
  page.drawLine({ start: { x: 320, y: yOffset - 40 }, end: { x: 520, y: yOffset - 40 }, thickness: 1, color: rgb(0.2, 0.4, 0.8) });
  page.drawText('[ PLACE YOUR SIGNATURE HERE ]', { x: 335, y: yOffset - 30, size: 8, font: helvetica, color: rgb(0.3, 0.5, 0.8) });
  page.drawText('Date: ________________________', { x: 320, y: yOffset - 55, size: 8.5, font: timesRoman, color: rgb(0.4, 0.4, 0.4) });

  return await pdfDoc.save();
}
