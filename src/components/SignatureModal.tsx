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
  defaultName = 'John Doe',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'draw' | 'type'>('upload');
  const [signerName, setSignerName] = useState(defaultName);

  // Upload Tab State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processedSignatureUrl, setProcessedSignatureUrl] = useState<string | null>(null);
  const [processingOptions, setProcessingOptions] = useState<SignatureProcessingOptions>({
    removeBackground: true,
    threshold: 215,
    inkColor: 'blue',
    autoCrop: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Draw Tab State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState<'#0f3d82' | '#111827'>('#0f3d82');
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);
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
    ctx.fillStyle = '#0f3d82'; // DocuSign blue
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-docusign-600" />
              Create & Adopt Signature
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload your actual signature or draw/type to place on the document
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Signer Name Input */}
        <div className="px-6 pt-4 pb-2 bg-slate-50/50 border-b border-slate-100 flex items-center gap-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Signer Full Name:
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="e.g. Jane Doe"
            className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-docusign-500 focus:border-transparent font-medium"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'upload'
                ? 'bg-white text-docusign-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Signature Image
          </button>

          <button
            onClick={() => setActiveTab('draw')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'draw'
                ? 'bg-white text-docusign-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <PenTool className="w-4 h-4" />
            Draw Signature
          </button>

          <button
            onClick={() => setActiveTab('type')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition ${
              activeTab === 'type'
                ? 'bg-white text-docusign-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Type className="w-4 h-4" />
            Type Signature
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: UPLOAD SIGNATURE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {!uploadedFile ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-docusign-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-docusign-50/30 transition group">
                  <div className="w-14 h-14 bg-docusign-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition">
                    <Upload className="w-7 h-7 text-docusign-600" />
                  </div>
                  <span className="text-base font-semibold text-slate-800">
                    Click to browse or drop signature photo
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
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
                  <div className="border border-slate-200 rounded-xl p-4 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] relative min-h-[160px] flex items-center justify-center">
                    {isProcessing ? (
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin text-docusign-600" />
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
                      className="absolute top-2 right-2 text-xs bg-white/90 hover:bg-red-50 text-slate-600 hover:text-red-600 px-2.5 py-1 rounded-md border border-slate-200 transition flex items-center gap-1 shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Change Image
                    </button>
                  </div>

                  {/* Smart Background Removal & Ink Settings */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Smart Ink Isolation (DocuSign Filter)
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
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-docusign-600"></div>
                        <span className="ml-2 text-xs font-medium text-slate-600">
                          Transparent Paper
                        </span>
                      </label>
                    </div>

                    {/* Color options */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setProcessingOptions({ ...processingOptions, inkColor: 'blue' })
                        }
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                          processingOptions.inkColor === 'blue'
                            ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-[#0f3d82] inline-block"></span>
                        DocuSign Navy
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setProcessingOptions({ ...processingOptions, inkColor: 'black' })
                        }
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                          processingOptions.inkColor === 'black'
                            ? 'bg-slate-100 border-slate-900 text-slate-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
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
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-center gap-1.5 transition ${
                          processingOptions.inkColor === 'original'
                            ? 'bg-slate-100 border-slate-700 text-slate-900 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Original Photo
                      </button>
                    </div>

                    {/* Sensitivity slider */}
                    <div className="flex items-center gap-3 pt-2">
                      <Sliders className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-500 whitespace-nowrap">Paper Cutoff:</span>
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
                        className="w-full accent-docusign-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <span className="text-xs text-slate-500 font-mono w-8 text-right">
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
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] relative">
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
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600">Color:</span>
                  <button
                    type="button"
                    onClick={() => setDrawColor('#0f3d82')}
                    className={`w-6 h-6 rounded-full bg-[#0f3d82] ring-offset-2 transition ${
                      drawColor === '#0f3d82' ? 'ring-2 ring-docusign-500 scale-110' : 'opacity-80'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setDrawColor('#111827')}
                    className={`w-6 h-6 rounded-full bg-[#111827] ring-offset-2 transition ${
                      drawColor === '#111827' ? 'ring-2 ring-docusign-500 scale-110' : 'opacity-80'
                    }`}
                  />

                  <div className="h-4 w-px bg-slate-300 mx-2" />

                  <span className="text-xs font-semibold text-slate-600">Stroke:</span>
                  <button
                    type="button"
                    onClick={() => setStrokeWidth(1.8)}
                    className={`px-2 py-0.5 text-xs rounded border ${
                      strokeWidth === 1.8 ? 'bg-docusign-100 border-docusign-400 font-bold' : 'bg-white'
                    }`}
                  >
                    Fine
                  </button>
                  <button
                    type="button"
                    onClick={() => setStrokeWidth(2.8)}
                    className={`px-2 py-0.5 text-xs rounded border ${
                      strokeWidth === 2.8 ? 'bg-docusign-100 border-docusign-400 font-bold' : 'bg-white'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setStrokeWidth(4.2)}
                    className={`px-2 py-0.5 text-xs rounded border ${
                      strokeWidth === 4.2 ? 'bg-docusign-100 border-docusign-400 font-bold' : 'bg-white'
                    }`}
                  >
                    Bold
                  </button>
                </div>

                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-1"
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
              <p className="text-xs text-slate-500">
                Choose a cursive font style for your digital signature:
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
                    className={`p-4 rounded-xl border text-left transition relative flex flex-col justify-between h-28 ${
                      selectedFontStyle === style.id
                        ? 'border-docusign-500 bg-docusign-50/40 ring-2 ring-docusign-200'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {style.name}
                    </span>
                    <span className={`text-2xl text-[#0f3d82] truncate ${style.class}`}>
                      {signerName || 'Signature'}
                    </span>
                    {selectedFontStyle === style.id && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-docusign-600 text-white rounded-full flex items-center justify-center">
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
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
            Cloudflare ESIGN / UETA Compliant
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
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
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-docusign-600 to-docusign-700 hover:from-docusign-700 hover:to-docusign-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              Adopt & Use Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
