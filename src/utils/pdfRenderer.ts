import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    // Cloudflare cdnjs / local worker fallback
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    // Fallback to Cloudflare-hosted CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  }
}

export interface RenderPageResult {
  width: number;
  height: number;
}

export class PDFDocumentViewer {
  private pdfDoc: any = null;
  public pageCount: number = 0;

  async load(source: Uint8Array | ArrayBuffer | string): Promise<number> {
    const loadingTask = pdfjsLib.getDocument(
      typeof source === 'string'
        ? source
        : { data: source instanceof Uint8Array ? source : new Uint8Array(source) }
    );
    this.pdfDoc = await loadingTask.promise;
    this.pageCount = this.pdfDoc.numPages;
    return this.pageCount;
  }

  async renderPage(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.5
  ): Promise<RenderPageResult> {
    if (!this.pdfDoc) throw new Error('PDF document not loaded');
    if (pageNumber < 1 || pageNumber > this.pageCount) {
      throw new Error(`Invalid page number: ${pageNumber}`);
    }

    const page = await this.pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context not available');

    // High DPI rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    context.scale(dpr, dpr);

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    return {
      width: viewport.width,
      height: viewport.height,
    };
  }

  async getPageDimensions(pageNumber: number): Promise<{ width: number; height: number }> {
    if (!this.pdfDoc) throw new Error('PDF document not loaded');
    const page = await this.pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.0 });
    return {
      width: viewport.width,
      height: viewport.height,
    };
  }
}
