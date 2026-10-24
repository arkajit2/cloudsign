import React, { useState, useRef, useEffect } from 'react';
import { Upload, PenTool, Type, Trash2, Check, RefreshCw, Sliders, Sparkles, X } from 'lucide-react';
import { processUploadedSignature } from '../utils/imageProcessing';
import type { SignatureProcessingOptions } from '../utils/imageProcessing';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (signatureDataUrl: string, signerName: string, mode: 'upload' | 'draw' | 'type') => void;
  defaultName?: string;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
  defaultName = 'Jane Doe',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'draw' | 'type'>('upload');
  const [signerName, setSignerName] = useState(defaultName);

  // Synchronize signerName when defaultName or modal opens
  useEffect(() => {
    if (defaultName) {
      setSignerName(defaultName);
    }
  }, [defaultName, isOpen]);

  // Upload Tab State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedSignatureUrl, setProcessedSignatureUrl] = useState<string | null>(null);
  const [processingOptions, setProcessingOptions] = useState<SignatureProcessingOptions>({
    removeBackground: true,
    threshold: 215,
    inkColor: 'plum',
    autoCrop: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Draw Tab State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState<'#341539' | '#111827'>('#341539');
  const [strokeWidth, setStrokeWidth] = useState<number>(2.8);
  const [hasDrawnContent, setHasDrawnContent] = useState(false);

  // Type Tab State
  const [selectedFontStyle, setSelectedFontStyle] = useState<string>('font-signature1');

  // Trigger processing when file or options change
  useEffect(() => {
    if (uploadedFile) {
      setIsProcessing(true);
      processUploadedSignature(uploadedFile, processingOptions)
        .then((url) => {
          setProcessedSignatureUrl(url);
          setIsProcessing(false);
        })
        .catch((err) => {
          console.error(err);
          setIsProcessing(false);
        });
    }
  }, [uploadedFile, processingOptions]);

  // Setup Drawing Canvas
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Handle Draw Events
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawnContent(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = strokeWidth;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHasDrawnContent(false);
      }
    }
  };

  // Convert Typed Text to Transparent Canvas Image
  const generateTypedSignatureDataUrl = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#341539'; // Fraoula Plum
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let fontName = 'Dancing Script';
    if (selectedFontStyle === 'font-signature2') fontName = 'Pacifico';
    if (selectedFontStyle === 'font-signature3') fontName = 'Great Vibes';
    if (selectedFontStyle === 'font-signature4') fontName = 'Homemade Apple';

    ctx.font = `64px "${fontName}", cursive`;
    ctx.fillText(signerName || 'Signature', canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  // Confirm Signature
  const handleAdoptAndSign = () => {
    let finalUrl = '';

    if (activeTab === 'upload') {
      if (!processedSignatureUrl) return;
      finalUrl = processedSignatureUrl;
    } else if (activeTab === 'draw') {
      if (!canvasRef.current || !hasDrawnContent) return;
      finalUrl = canvasRef.current.toDataURL('image/png');
    } else if (activeTab === 'type') {
      finalUrl = generateTypedSignatureDataUrl();
    }

    if (finalUrl) {
      onSaveSignature(finalUrl, signerName, activeTab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#200b24]/85 backdrop-blur-md animate-fadeIn text-[#FFFFC5]">
      <div className="bg-[#341539] rounded-3xl shadow-2xl max-w-2xl w-full border border-[rgba(255,255,197,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[rgba(255,255,197,0.18)] flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#FFFFC5] flex items-center gap-2">
              <PenTool className="w-5 h-5 text-[#FFFFC5]" />
              Create & Adopt Signature
            </h3>
            <p className="text-xs text-[rgba(255,255,197,0.65)] mt-0.5">
              Upload your handwritten signature or draw/type to place on the document
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[rgba(255,255,197,0.6)] hover:text-[#FFFFC5] hover:bg-[rgba(255,255,197,0.1)] rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signer Name Input */}
        <div className="px-6 pt-4 pb-3 bg-[rgba(255,255,197,0.03)] border-b border-[rgba(255,255,197,0.15)] flex items-center gap-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-[rgba(255,255,197,0.65)] whitespace-nowrap">
            Signer Full Name:
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="e.g. Jane Doe"
            className="flex-1 px-3 py-1.5 text-sm bg-[rgba(52,21,57,0.8)] border border-[rgba(255,255,197,0.25)] focus:border-[#FFFFC5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FFFFC5] font-semibold text-[#FFFFC5] placeholder-[rgba(255,255,197,0.4)]"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[rgba(255,255,197,0.15)] bg-[rgba(255,255,197,0.02)] p-2 gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'upload'
                ? 'bg-[#FFFFC5] text-[#341539] shadow-md'
                : 'text-[#FFFFC5] hover:bg-[rgba(255,255,197,0.08)]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Signature Image
          </button>

          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'draw'
                ? 'bg-[#FFFFC5] text-[#341539] shadow-md'
                : 'text-[#FFFFC5] hover:bg-[rgba(255,255,197,0.08)]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Draw Signature
          </button>

          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'type'
                ? 'bg-[#FFFFC5] text-[#341539] shadow-md'
                : 'text-[#FFFFC5] hover:bg-[rgba(255,255,197,0.08)]'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Type Signature
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: UPLOAD SIGNATURE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {!uploadedFile ? (
                <label className="border-2 border-dashed border-[rgba(255,255,197,0.3)] hover:border-[#FFFFC5] rounded-3xl p-8 flex flex-col items-center justify-center cursor-pointer bg-[rgba(255,255,197,0.03)] hover:bg-[rgba(255,255,197,0.07)] transition group">
                  <div className="w-14 h-14 bg-[rgba(255,255,197,0.1)] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition border border-[rgba(255,255,197,0.25)]">
                    <Upload className="w-7 h-7 text-[#FFFFC5]" />
                  </div>
                  <span className="text-base font-bold text-[#FFFFC5]">
                    Click to browse or drop signature photo
                  </span>
                  <span className="text-xs text-[rgba(255,255,197,0.65)] mt-1">
                    Accepts PNG, JPG, JPEG, WEBP (phone photos & scans supported)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadedFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  {/* Clean Signature Preview Canvas */}
                  <div className="border border-[rgba(255,255,197,0.25)] rounded-2xl p-4 bg-white relative min-h-[160px] flex items-center justify-center shadow-inner">
                    {isProcessing ? (
                      <div className="flex items-center gap-2 text-[#341539] text-sm font-semibold">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#341539]" />
                        Enhancing ink and removing paper background...
                      </div>
                    ) : processedSignatureUrl ? (
                      <img
                        src={processedSignatureUrl}
                        alt="Signature Preview"
                        className="max-h-32 object-contain filter drop-shadow-sm"
                      />
                    ) : null}

                    <button
                      onClick={() => {
                        setUploadedFile(null);
                        setProcessedSignatureUrl(null);
                      }}
                      className="absolute top-2 right-2 text-xs bg-[#341539] text-[#FFFFC5] hover:bg-[#200b24] px-3 py-1 rounded-full border border-[rgba(255,255,197,0.3)] transition flex items-center gap-1 shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Change Image
                    </button>
                  </div>

                  {/* Smart Background Removal & Ink Settings */}
                  <div className="bg-[rgba(255,255,197,0.04)] p-4 rounded-2xl border border-[rgba(255,255,197,0.2)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#FFFFC5] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#FFFFC5]" />
                        Smart Ink Isolation Filter
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={processingOptions.removeBackground}
                          onChange={(e) =>
                            setProcessingOptions({
                              ...processingOptions,
                              removeBackground: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-[rgba(255,255,197,0.2)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#341539] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#FFFFC5] after:border-[#341539] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FFFFC5]"></div>
                        <span className="ml-2 text-xs font-medium text-[rgba(255,255,197,0.8)]">
                          Transparent Paper
                        </span>
                      </label>
                    </div>

                    {/* Color options */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setProcessingOptions({ ...processingOptions, inkColor: 'plum' })
                        }
                        className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                          processingOptions.inkColor === 'plum'
                            ? 'bg-[#FFFFC5] text-[#341539] border-[#FFFFC5] shadow-sm'
                            : 'bg-transparent border-[rgba(255,255,197,0.25)] text-[#FFFFC5] hover:bg-[rgba(255,255,197,0.08)]'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-[#341539] inline-block border border-[#FFFFC5]"></span>
                        Plum Ink
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setProcessingOptions({ ...processingOptions, inkColor: 'black' })
                        }
                        className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                          processingOptions.inkColor === 'black'
                            ? 'bg-[#FFFFC5] text-[#341539] border-[#FFFFC5] shadow-sm'
                            : 'bg-transparent border-[rgba(255,255,197,0.25)] text-[#FFFFC5] hover:bg-[rgba(255,255,197,0.08)]'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-[#111827] inline-block"></span>
                        Midnight Black
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setProcessingOptions({ ...processingOptions, inkColor: 'original' })
                        }
                        className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition ${
                          processingOptions.inkColor === 'original'
                            ? 'bg-[#FFFFC5] text-[#341539] border-[#FFFFC5] shadow-sm'
                            : 'bg-transparent border-[rgba(255,255,197,0.25)] text-[#FFFFC5] hover:bg-[rgba(255,255,197,0.08)]'
                        }`}
                      >
                        Original Photo
                      </button>
                    </div>

                    {/* Sensitivity slider */}
                    <div className="flex items-center gap-3 pt-2">
                      <Sliders className="w-4 h-4 text-[rgba(255,255,197,0.7)]" />
                      <span className="text-xs text-[rgba(255,255,197,0.7)] whitespace-nowrap">Paper Cutoff:</span>
                      <input
                        type="range"
                        min="150"
                        max="245"
                        value={processingOptions.threshold}
                        onChange={(e) =>
                          setProcessingOptions({
                            ...processingOptions,
                            threshold: parseInt(e.target.value, 10),
                          })
                        }
                        className="w-full accent-[#FFFFC5] h-1.5 bg-[rgba(255,255,197,0.2)] rounded-lg cursor-pointer"
                      />
                      <span className="text-xs text-[#FFFFC5] font-mono w-8 text-right">
                        {processingOptions.threshold}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DRAW SIGNATURE */}
          {activeTab === 'draw' && (
            <div className="space-y-4">
              <div className="border border-[rgba(255,255,197,0.25)] rounded-2xl overflow-hidden bg-white relative">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-44 cursor-crosshair touch-none"
                />
                {!hasDrawnContent && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-medium">
                    Draw your signature here with mouse or touch
                  </div>
                )}
              </div>

              {/* Drawing Toolbar */}
              <div className="flex items-center justify-between bg-[rgba(255,255,197,0.04)] p-3 rounded-2xl border border-[rgba(255,255,197,0.18)]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#FFFFC5]">Color:</span>
                  <button
                    type="button"
                    onClick={() => setDrawColor('#341539')}
                    className={`w-6 h-6 rounded-full bg-[#341539] border border-[#FFFFC5] ring-offset-2 transition ${
                      drawColor === '#341539' ? 'ring-2 ring-[#FFFFC5] scale-110' : 'opacity-80'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setDrawColor('#111827')}
                    className={`w-6 h-6 rounded-full bg-[#111827] ring-offset-2 transition ${
                      drawColor === '#111827' ? 'ring-2 ring-[#FFFFC5] scale-110' : 'opacity-80'
                    }`}
                  />

                  <div className="h-4 w-px bg-[rgba(255,255,197,0.25)] mx-2" />

                  <span className="text-xs font-bold text-[#FFFFC5]">Stroke:</span>
                  <button
                    type="button"
                    onClick={() => setStrokeWidth(1.8)}
                    className={`px-2.5 py-0.5 text-xs rounded-full border ${
                      strokeWidth === 1.8 ? 'bg-[#FFFFC5] text-[#341539] border-[#FFFFC5] font-bold' : 'bg-transparent text-[#FFFFC5] border-[rgba(255,255,197,0.25)]'
                    }`}
                  >
                    Fine
                  </button>
                  <button
                    type="button"
                    onClick={() => setStrokeWidth(2.8)}
                    className={`px-2.5 py-0.5 text-xs rounded-full border ${
                      strokeWidth === 2.8 ? 'bg-[#FFFFC5] text-[#341539] border-[#FFFFC5] font-bold' : 'bg-transparent text-[#FFFFC5] border-[rgba(255,255,197,0.25)]'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setStrokeWidth(4.2)}
                    className={`px-2.5 py-0.5 text-xs rounded-full border ${
                      strokeWidth === 4.2 ? 'bg-[#FFFFC5] text-[#341539] border-[#FFFFC5] font-bold' : 'bg-transparent text-[#FFFFC5] border-[rgba(255,255,197,0.25)]'
                    }`}
                  >
                    Bold
                  </button>
                </div>

                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-3 py-1.5 text-xs font-bold text-[rgba(255,255,197,0.8)] hover:text-red-400 hover:bg-[rgba(255,255,197,0.08)] rounded-full transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TYPE SIGNATURE */}
          {activeTab === 'type' && (
            <div className="space-y-3">
              <p className="text-xs text-[rgba(255,255,197,0.7)]">
                Choose a calligraphy style for your signature:
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'font-signature1', name: 'Dancing Script', class: 'font-signature1' },
                  { id: 'font-signature2', name: 'Pacifico', class: 'font-signature2' },
                  { id: 'font-signature3', name: 'Great Vibes', class: 'font-signature3' },
                  { id: 'font-signature4', name: 'Homemade Apple', class: 'font-signature4' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedFontStyle(style.id)}
                    className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between h-28 ${
                      selectedFontStyle === style.id
                        ? 'border-[#FFFFC5] bg-[rgba(255,255,197,0.12)] ring-2 ring-[#FFFFC5]'
                        : 'border-[rgba(255,255,197,0.2)] hover:border-[rgba(255,255,197,0.4)] bg-[rgba(255,255,197,0.03)]'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-[rgba(255,255,197,0.6)] tracking-wider">
                      {style.name}
                    </span>
                    <span className={`text-2xl text-[#FFFFC5] truncate ${style.class}`}>
                      {signerName || 'Signature'}
                    </span>
                    {selectedFontStyle === style.id && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-[#FFFFC5] text-[#341539] rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[rgba(255,255,197,0.15)] flex items-center justify-between bg-[rgba(255,255,197,0.02)]">
          <div className="text-xs text-[rgba(255,255,197,0.7)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFFFC5] inline-block animate-ping"></span>
            ESIGN & UETA Cryptographic Standard
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-[#FFFFC5] hover:bg-[rgba(255,255,197,0.1)] rounded-full transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdoptAndSign}
              disabled={
                (activeTab === 'upload' && !processedSignatureUrl) ||
                (activeTab === 'draw' && !hasDrawnContent) ||
                (activeTab === 'type' && !signerName.trim())
              }
              className="px-6 py-2.5 text-xs font-extrabold text-[#341539] bg-[#FFFFC5] hover:bg-[#fffff0] disabled:opacity-40 disabled:cursor-not-allowed rounded-full shadow-[0_4px_16px_rgba(255,255,197,0.25)] hover:shadow-[0_8px_24px_rgba(255,255,197,0.4)] hover:-translate-y-0.5 transition flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Adopt & Use Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
