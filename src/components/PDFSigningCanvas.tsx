import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  PenTool,
  Calendar,
  User,
  Trash2,
  CheckCircle,
  FileText,
  Maximize2,
  Sparkles,
  Edit3,
} from 'lucide-react';
import type { SignatureField, FieldType } from '../types';
import { PDFDocumentViewer } from '../utils/pdfRenderer';

interface PDFSigningCanvasProps {
  pdfBytes: Uint8Array;
  documentTitle: string;
  fields: SignatureField[];
  onFieldsChange: (fields: SignatureField[]) => void;
  onOpenSignatureModal: (fieldId?: string) => void;
  onCompleteSigning: () => void;
  isProcessing: boolean;
  defaultSignerName: string;
  signerEmail?: string;
  onSignerNameChange?: (name: string) => void;
  onSignerEmailChange?: (email: string) => void;
}

export const PDFSigningCanvas: React.FC<PDFSigningCanvasProps> = ({
  pdfBytes,
  documentTitle,
  fields,
  onFieldsChange,
  onOpenSignatureModal,
  onCompleteSigning,
  isProcessing,
  defaultSignerName,
  signerEmail,
  onSignerNameChange,
  onSignerEmailChange,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.25);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<PDFDocumentViewer | null>(null);

  // Dragging & Resizing state
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [resizingFieldId, setResizingFieldId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [initialFieldDims, setInitialFieldDims] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Initialize and load PDF
  useEffect(() => {
    const viewer = new PDFDocumentViewer();
    viewerRef.current = viewer;

    viewer
      .load(pdfBytes)
      .then((count) => {
        setPageCount(count);
        setCurrentPage(1);
      })
      .catch((err) => {
        console.error('Failed to parse PDF document:', err);
      });
  }, [pdfBytes]);

  // Render Current Page
  useEffect(() => {
    if (!viewerRef.current || !canvasRef.current || pageCount === 0) return;

    let isCancelled = false;
    viewerRef.current
      .renderPage(currentPage, canvasRef.current, zoomScale)
      .catch((err) => {
        if (!isCancelled) {
          console.error('Page render error:', err);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentPage, zoomScale, pageCount]);

  // Add a field to the current page
  const addField = (type: FieldType) => {
    const newId = `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let width = 28; // % of page width
    let height = 8; // % of page height
    let value = '';

    if (type === 'date') {
      width = 22;
      height = 5;
      value = new Date().toISOString().split('T')[0];
    } else if (type === 'name') {
      width = 24;
      height = 5.5;
      value = defaultSignerName;
    }

    // Default centered placement
    const newField: SignatureField = {
      id: newId,
      type,
      pageNumber: currentPage,
      x: 36, // Centered horizontally
      y: 35 + (fields.filter((f) => f.pageNumber === currentPage).length * 8) % 45,
      width,
      height,
      value,
      signerName: defaultSignerName,
      signerEmail: signerEmail,
    };

    const updated = [...fields, newField];
    onFieldsChange(updated);
    setSelectedFieldId(newId);

    // If signature, immediately prompt modal if no signature yet
    if (type === 'signature') {
      onOpenSignatureModal(newId);
    }
  };

  const removeField = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onFieldsChange(fields.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  // Field Drag Handlers
  const handleMouseDown = (
    fieldId: string,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    setDraggingFieldId(fieldId);
    setDragStartPos({ x: e.clientX, y: e.clientY });

    const f = fields.find((item) => item.id === fieldId);
    if (f) {
      setInitialFieldDims({ x: f.x, y: f.y, w: f.width, h: f.height });
    }
  };

  const handleResizeMouseDown = (
    fieldId: string,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    setResizingFieldId(fieldId);
    setDragStartPos({ x: e.clientX, y: e.clientY });

    const f = fields.find((item) => item.id === fieldId);
    if (f) {
      setInitialFieldDims({ x: f.x, y: f.y, w: f.width, h: f.height });
    }
  };

  // Global mouse move for drag/resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartPos || !initialFieldDims || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - dragStartPos.x) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStartPos.y) / rect.height) * 100;

      if (draggingFieldId) {
        const nextX = Math.max(0, Math.min(100 - initialFieldDims.w, initialFieldDims.x + deltaXPercent));
        const nextY = Math.max(0, Math.min(100 - initialFieldDims.h, initialFieldDims.y + deltaYPercent));

        onFieldsChange(
          fields.map((f) =>
            f.id === draggingFieldId ? { ...f, x: nextX, y: nextY } : f
          )
        );
      } else if (resizingFieldId) {
        const nextW = Math.max(10, Math.min(80, initialFieldDims.w + deltaXPercent));
        const nextH = Math.max(3, Math.min(40, initialFieldDims.h + deltaYPercent));

        onFieldsChange(
          fields.map((f) =>
            f.id === resizingFieldId ? { ...f, width: nextW, height: nextH } : f
          )
        );
      }
    };

    const handleMouseUp = () => {
      setDraggingFieldId(null);
      setResizingFieldId(null);
      setDragStartPos(null);
      setInitialFieldDims(null);
    };

    if (draggingFieldId || resizingFieldId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingFieldId, resizingFieldId, dragStartPos, initialFieldDims, fields, onFieldsChange]);

  const currentPageFields = fields.filter((f) => f.pageNumber === currentPage);
  const signatureFieldsCount = fields.filter((f) => f.type === 'signature').length;
  const signedFieldsCount = fields.filter((f) => f.type === 'signature' && f.signatureDataUrl).length;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#200b24] text-[#FFFFC5] overflow-hidden select-none">
      {/* Top Navbar */}
      <div className="h-14 bg-[#341539] border-b border-[rgba(255,255,197,0.18)] px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[rgba(255,255,197,0.08)] text-[#FFFFC5] rounded-xl border border-[rgba(255,255,197,0.2)]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#FFFFC5] truncate max-w-xs sm:max-w-md">
              {documentTitle}
            </h2>
            <div className="text-[11px] text-[rgba(255,255,197,0.65)] flex items-center gap-2">
              <span>{pageCount} Pages</span>
              <span>•</span>
              <span className="text-[#FFFFC5] font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {signedFieldsCount}/{signatureFieldsCount || 0} Signatures Adopted
              </span>
            </div>
          </div>
        </div>

        {/* Center: Signer Name Quick-Edit Chip */}
        <div className="hidden md:flex items-center gap-2 bg-[rgba(255,255,197,0.06)] border border-[rgba(255,255,197,0.2)] px-3 py-1 rounded-full">
          <User className="w-3.5 h-3.5 text-[#FFFFC5] shrink-0" />
          <span className="text-[11px] text-[rgba(255,255,197,0.65)]">Signer:</span>
          <input
            type="text"
            value={defaultSignerName}
            onChange={(e) => onSignerNameChange?.(e.target.value)}
            className="bg-transparent text-xs font-bold text-[#FFFFC5] focus:outline-none focus:underline rounded px-1 w-28 sm:w-36 hover:bg-[rgba(255,255,197,0.08)] transition"
            title="Click to edit signer name"
            placeholder="Signer Name"
          />
          <Edit3 className="w-3 h-3 text-[rgba(255,255,197,0.5)] pointer-events-none" />
        </div>

        {/* Page Nav & Zoom */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[rgba(255,255,197,0.06)] rounded-full p-1 border border-[rgba(255,255,197,0.2)]">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 text-[rgba(255,255,197,0.65)] hover:text-[#FFFFC5] disabled:opacity-30 transition rounded-full"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 text-xs font-semibold text-[#FFFFC5]">
              Page {currentPage} of {pageCount}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage >= pageCount}
              className="p-1 text-[rgba(255,255,197,0.65)] hover:text-[#FFFFC5] disabled:opacity-30 transition rounded-full"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden sm:flex items-center bg-[rgba(255,255,197,0.06)] rounded-full p-1 border border-[rgba(255,255,197,0.2)]">
            <button
              onClick={() => setZoomScale((z) => Math.max(0.75, z - 0.15))}
              className="p-1 text-[rgba(255,255,197,0.65)] hover:text-[#FFFFC5] transition rounded-full"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-[#FFFFC5]">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((z) => Math.min(2.0, z + 0.15))}
              className="p-1 text-[rgba(255,255,197,0.65)] hover:text-[#FFFFC5] transition rounded-full"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={onCompleteSigning}
            disabled={isProcessing || fields.length === 0}
            className="px-6 py-2 rounded-full text-xs sm:text-sm font-extrabold text-[#341539] bg-[#FFFFC5] hover:bg-[#fffff0] disabled:opacity-40 shadow-[0_4px_16px_rgba(255,255,197,0.25)] hover:shadow-[0_8px_24px_rgba(255,255,197,0.4)] hover:-translate-y-0.5 transition flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 stroke-[2.5]" />
            {isProcessing ? 'Sealing Document...' : 'Finish & Sign Document'}
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-64 bg-[#2b1030] border-r border-[rgba(255,255,197,0.15)] p-4 flex flex-col justify-between shrink-0 z-10 overflow-y-auto">
          <div className="space-y-4">
            {/* Signer Profile Card */}
            <div className="p-3 bg-[rgba(255,255,197,0.05)] border border-[rgba(255,255,197,0.18)] rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#FFFFC5] uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#FFFFC5]" />
                  Signer Details
                </span>
                <span className="text-[10px] text-[#FFFFC5] font-semibold flex items-center gap-1 opacity-75">
                  <Edit3 className="w-3 h-3" /> Edit
                </span>
              </div>

              <div>
                <label className="text-[10px] text-[rgba(255,255,197,0.65)] block mb-1 font-medium">
                  Signer Full Name:
                </label>
                <input
                  type="text"
                  value={defaultSignerName}
                  onChange={(e) => onSignerNameChange?.(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-2.5 py-1.5 text-xs bg-[rgba(52,21,57,0.8)] border border-[rgba(255,255,197,0.2)] focus:border-[#FFFFC5] rounded-xl text-[#FFFFC5] font-semibold focus:outline-none focus:ring-1 focus:ring-[#FFFFC5] transition shadow-inner placeholder-[rgba(255,255,197,0.4)]"
                />
              </div>

              {signerEmail !== undefined && (
                <div>
                  <label className="text-[10px] text-[rgba(255,255,197,0.65)] block mb-1 font-medium">
                    Signer Email:
                  </label>
                  <input
                    type="email"
                    value={signerEmail}
                    onChange={(e) => onSignerEmailChange?.(e.target.value)}
                    placeholder="signer@example.com"
                    className="w-full px-2.5 py-1.5 text-xs bg-[rgba(52,21,57,0.8)] border border-[rgba(255,255,197,0.2)] focus:border-[#FFFFC5] rounded-xl text-[#FFFFC5] font-semibold focus:outline-none focus:ring-1 focus:ring-[#FFFFC5] transition shadow-inner placeholder-[rgba(255,255,197,0.4)]"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-bold text-[rgba(255,255,197,0.7)] uppercase tracking-wider mb-2">
                Standard Fields
              </div>
              <p className="text-[11px] text-[rgba(255,255,197,0.6)] mb-3">
                Click to place fields on Page {currentPage}. Drag anywhere to position.
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => addField('signature')}
                  className="w-full p-2.5 bg-[rgba(255,255,197,0.06)] hover:bg-[rgba(255,255,197,0.12)] border border-[rgba(255,255,197,0.22)] hover:border-[#FFFFC5] rounded-2xl text-left transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[#FFFFC5] text-[#341539] flex items-center justify-center shadow-md">
                      <PenTool className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#FFFFC5] group-hover:underline transition">
                        Signature Field
                      </div>
                      <div className="text-[10px] text-[rgba(255,255,197,0.6)]">Adopt uploaded or drawn</div>
                    </div>
                  </div>
                  <span className="text-xs text-[#FFFFC5] font-bold opacity-0 group-hover:opacity-100 transition">
                    + Add
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => addField('name')}
                  className="w-full p-2.5 bg-[rgba(255,255,197,0.04)] hover:bg-[rgba(255,255,197,0.1)] border border-[rgba(255,255,197,0.18)] hover:border-[#FFFFC5] rounded-2xl text-left transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[rgba(255,255,197,0.15)] text-[#FFFFC5] flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#FFFFC5]">Signer Name</div>
                      <div className="text-[10px] text-[rgba(255,255,197,0.6)] truncate max-w-[110px]">
                        {defaultSignerName}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[#FFFFC5] font-bold opacity-0 group-hover:opacity-100 transition">
                    + Add
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => addField('date')}
                  className="w-full p-2.5 bg-[rgba(255,255,197,0.04)] hover:bg-[rgba(255,255,197,0.1)] border border-[rgba(255,255,197,0.18)] hover:border-[#FFFFC5] rounded-2xl text-left transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-[rgba(255,255,197,0.15)] text-[#FFFFC5] flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#FFFFC5]">Date Signed</div>
                      <div className="text-[10px] text-[rgba(255,255,197,0.6)]">Auto-stamped today</div>
                    </div>
                  </div>
                  <span className="text-xs text-[#FFFFC5] font-bold opacity-0 group-hover:opacity-100 transition">
                    + Add
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Tip Card */}
          <div className="p-3 bg-[rgba(255,255,197,0.04)] border border-[rgba(255,255,197,0.15)] rounded-2xl text-[rgba(255,255,197,0.7)] text-xs space-y-1 mt-4">
            <div className="flex items-center gap-1.5 font-bold text-[#FFFFC5] text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-[#FFFFC5]" />
              Interactive Placement
            </div>
            <p className="text-[11px] leading-relaxed">
              Drag fields anywhere on the page. Click directly on any text or name box to edit its contents.
            </p>
          </div>
        </div>

        {/* Center PDF Viewer Viewport */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-[#200b24] p-8 flex items-start justify-center relative"
          onClick={() => setSelectedFieldId(null)}
        >
          {/* Document Page Canvas Container */}
          <div className="relative inline-block pdf-page-shadow bg-white rounded-lg transition-all">
            <canvas ref={canvasRef} className="block rounded-lg shadow-2xl" />

            {/* Placed Fields Overlay on Active Page */}
            {currentPageFields.map((field) => {
              const isSelected = selectedFieldId === field.id;

              return (
                <div
                  key={field.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFieldId(field.id);
                    if (field.type === 'signature' && !field.signatureDataUrl) {
                      onOpenSignatureModal(field.id);
                    }
                  }}
                  onMouseDown={(e) => handleMouseDown(field.id, e)}
                  style={{
                    position: 'absolute',
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    width: `${field.width}%`,
                    height: `${field.height}%`,
                  }}
                  className={`cursor-move group border-2 rounded-lg transition-colors flex items-center justify-center select-none ${
                    field.type === 'signature'
                      ? isSelected
                        ? 'border-[#341539] bg-[rgba(52,21,57,0.15)] signature-field-active'
                        : 'border-[#341539]/80 bg-[rgba(52,21,57,0.06)] hover:border-[#341539]'
                      : isSelected
                      ? 'border-[#341539] bg-[rgba(52,21,57,0.12)]'
                      : 'border-[#341539]/60 bg-white/70 hover:border-[#341539]'
                  }`}
                >
                  {/* Field Content: Interactive inputs for direct typing */}
                  {field.type === 'signature' ? (
                    field.signatureDataUrl ? (
                      <img
                        src={field.signatureDataUrl}
                        alt="Signature"
                        className="w-full h-full object-contain pointer-events-none p-1"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#341539] font-extrabold text-xs pointer-events-none">
                        <PenTool className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Sign Here</span>
                      </div>
                    )
                  ) : field.type === 'name' || field.type === 'text' ? (
                    <input
                      type="text"
                      value={field.value !== undefined ? field.value : field.signerName || defaultSignerName}
                      onChange={(e) => {
                        const val = e.target.value;
                        onFieldsChange(
                          fields.map((f) =>
                            f.id === field.id ? { ...f, value: val, signerName: val } : f
                          )
                        );
                        if (field.type === 'name') {
                          onSignerNameChange?.(val);
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFieldId(field.id);
                      }}
                      placeholder="Type name here..."
                      className="w-full h-full bg-white/95 text-[#341539] font-bold text-xs px-2 text-center rounded border border-transparent focus:border-[#341539] focus:outline-none focus:ring-1 focus:ring-[#341539] shadow-sm transition"
                    />
                  ) : field.type === 'date' ? (
                    <input
                      type="text"
                      value={field.value !== undefined ? field.value : new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        const val = e.target.value;
                        onFieldsChange(
                          fields.map((f) => (f.id === field.id ? { ...f, value: val } : f))
                        );
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFieldId(field.id);
                      }}
                      placeholder="YYYY-MM-DD"
                      className="w-full h-full bg-white/95 text-[#341539] font-mono text-xs px-2 text-center rounded border border-transparent focus:border-[#341539] focus:outline-none focus:ring-1 focus:ring-[#341539] shadow-sm transition"
                    />
                  ) : null}

                  {/* Field Actions Toolbar (when selected or hovered) */}
                  <div
                    className={`absolute -top-7 right-0 flex items-center gap-1 bg-[#341539] border border-[rgba(255,255,197,0.3)] rounded-full px-2 py-0.5 shadow-md ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    } transition-opacity z-10 text-[#FFFFC5]`}
                  >
                    {field.type === 'signature' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSignatureModal(field.id);
                        }}
                        className="text-[10px] text-[#FFFFC5] hover:underline px-1 py-0.5 font-bold transition"
                      >
                        Change
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => removeField(field.id, e)}
                      className="text-[rgba(255,255,197,0.7)] hover:text-red-400 p-0.5 rounded transition"
                      title="Delete Field"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Resize Handle (Bottom-Right) */}
                  <div
                    onMouseDown={(e) => handleResizeMouseDown(field.id, e)}
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#341539] rounded-sm cursor-se-resize border border-[#FFFFC5] shadow-sm flex items-center justify-center"
                    title="Resize Field"
                  >
                    <Maximize2 className="w-2 h-2 text-[#FFFFC5]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
