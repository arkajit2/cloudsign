/**
 * Image processing utilities for uploaded signatures.
 * Automatically removes paper background, enhances ink contrast,
 * and auto-crops extraneous borders for high-fidelity DocuSign stamping.
 */

export interface SignatureProcessingOptions {
  removeBackground: boolean;
  threshold: number; // 0 to 255 (paper threshold, default 210)
  inkColor: 'original' | 'blue' | 'black';
  autoCrop: boolean;
}

export async function processUploadedSignature(
  imageSource: File | string,
  options: SignatureProcessingOptions = {
    removeBackground: true,
    threshold: 215,
    inkColor: 'blue',
    autoCrop: true,
  }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
          return;
        }

        ctx.drawImage(img, 0, 0);

        if (!options.removeBackground) {
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = canvas.width;
        const height = canvas.height;

        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        let hasInk = false;

        const threshold = options.threshold;

        // Ink color palettes
        // Professional DocuSign Blue Ink: RGB(15, 60, 140)
        // Classic Black Ink: RGB(20, 24, 33)
        const targetR = options.inkColor === 'blue' ? 16 : options.inkColor === 'black' ? 20 : 0;
        const targetG = options.inkColor === 'blue' ? 55 : options.inkColor === 'black' ? 24 : 0;
        const targetB = options.inkColor === 'blue' ? 140 : options.inkColor === 'black' ? 33 : 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a === 0) continue;

            // Perceived luminance
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

            if (luminance >= threshold) {
              // Paper background -> make completely transparent
              data[idx + 3] = 0;
            } else {
              // Ink stroke detected
              hasInk = true;
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;

              // Calculate ink density: darker pixels = higher density
              const inkDensity = Math.min(1, Math.max(0, (threshold - luminance) / (threshold * 0.75)));
              const newAlpha = Math.round(inkDensity * 255);

              if (options.inkColor !== 'original') {
                data[idx] = targetR;
                data[idx + 1] = targetG;
                data[idx + 2] = targetB;
                data[idx + 3] = Math.min(a, newAlpha);
              } else {
                data[idx + 3] = Math.min(a, newAlpha);
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // Auto-crop to content if ink was found and autoCrop is enabled
        if (options.autoCrop && hasInk && maxX > minX && maxY > minY) {
          const padding = 12;
          const cropX = Math.max(0, minX - padding);
          const cropY = Math.max(0, minY - padding);
          const cropWidth = Math.min(width - cropX, maxX - minX + padding * 2);
          const cropHeight = Math.min(height - cropY, maxY - minY + padding * 2);

          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = cropWidth;
          croppedCanvas.height = cropHeight;
          const croppedCtx = croppedCanvas.getContext('2d');

          if (croppedCtx) {
            croppedCtx.drawImage(
              canvas,
              cropX, cropY, cropWidth, cropHeight,
              0, 0, cropWidth, cropHeight
            );
            resolve(croppedCanvas.toDataURL('image/png'));
            return;
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Error processing signature image:', err);
        resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
      }
    };

    img.onerror = (err) => {
      reject(err);
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    }
  });
}
