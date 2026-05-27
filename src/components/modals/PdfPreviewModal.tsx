import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Loader2, MousePointer2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type PdfOverlayType = 'signature' | 'stamp';

export interface PdfOverlayAsset {
  id: PdfOverlayType;
  type: PdfOverlayType;
  label: string;
  imageUrl: string;
}

export interface PdfOverlayPlacement {
  id: PdfOverlayType;
  type: PdfOverlayType;
  imageUrl: string;
  pageIndex: number;
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
}

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
  mode?: 'view' | 'sign';
  overlays?: PdfOverlayAsset[];
  onApprove?: (placements: PdfOverlayPlacement[]) => void;
}

interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
}

interface OverlayBox {
  id: PdfOverlayType;
  type: PdfOverlayType;
  label: string;
  imageUrl: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  naturalRatio?: number;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const SCALE_STEP = 0.1;
const DEFAULT_SCALE = 1;
const MAX_PAGE_WIDTH = 820;

const baseOverlayWidth: Record<PdfOverlayType, number> = {
  signature: 180,
  stamp: 220,
};

const defaultOverlayHeight: Record<PdfOverlayType, number> = {
  signature: 96,
  stamp: 220,
};

const defaultOverlayPosition: Record<PdfOverlayType, { x: number; y: number }> = {
  signature: { x: 48, y: 48 },
  stamp: { x: 280, y: 64 },
};

const PdfPageCanvas: React.FC<{
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  displayWidth: number;
  onRendered: (page: PageInfo) => void;
  renderKey: number;
}> = ({ pdfDoc, pageNumber, displayWidth, onRendered, renderKey }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    const renderPage = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const page = await pdfDoc.getPage(pageNumber);
      if (cancelled) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const displayScale = displayWidth / baseViewport.width;
      const viewport = page.getViewport({ scale: displayScale });
      const pixelRatio = window.devicePixelRatio || 1;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
        transform: pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : undefined,
      });

      await renderTask.promise;
      if (!cancelled) {
        onRendered({ pageNumber, width: viewport.width, height: viewport.height });
      }
    };

    renderPage().catch((error) => {
      if (!cancelled && error?.name !== 'RenderingCancelledException') {
        console.error('Failed to render PDF page:', error);
      }
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [displayWidth, onRendered, pageNumber, pdfDoc, renderKey]);

  return <canvas ref={canvasRef} className="block bg-white" />;
};

const createOverlayBoxes = (assets: PdfOverlayAsset[]): OverlayBox[] => assets.map((asset) => ({
  ...asset,
  pageIndex: 0,
  x: defaultOverlayPosition[asset.type].x,
  y: defaultOverlayPosition[asset.type].y,
  width: baseOverlayWidth[asset.type],
  height: defaultOverlayHeight[asset.type],
}));

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  title,
  mode = 'view',
  overlays = [],
  onApprove,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [overlayBoxes, setOverlayBoxes] = useState<OverlayBox[]>([]);
  const [activeOverlayId, setActiveOverlayId] = useState<PdfOverlayType>('signature');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const activeDragPageIndexRef = useRef(0);
  const showSigningTools = mode === 'sign' && overlays.length > 0;

  const activeOverlay = overlayBoxes.find((box) => box.id === activeOverlayId);
  const activeScale = activeOverlay ? activeOverlay.width / baseOverlayWidth[activeOverlay.type] : DEFAULT_SCALE;
  const scalePercent = Math.round(activeScale * 100);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setPdfDoc(null);
    setPages([]);
    setLoadError(null);
    setRenderKey((current) => current + 1);

    const loadingTask = pdfjsLib.getDocument(fileUrl);
    loadingTask.promise
      .then((doc) => {
        if (!cancelled) setPdfDoc(doc);
      })
      .catch((error) => {
        console.error('Failed to load PDF:', error);
        if (!cancelled) setLoadError('Gagal memuat file PDF.');
      });

    return () => {
      cancelled = true;
    };
  }, [fileUrl, isOpen]);

  useEffect(() => {
    if (!showSigningTools) {
      setOverlayBoxes([]);
      return;
    }

    setOverlayBoxes(createOverlayBoxes(overlays));
    setActiveOverlayId(overlays[0]?.id || 'signature');
  }, [overlays, showSigningTools]);

  const pageNumbers = useMemo(() => {
    if (!pdfDoc) return [];
    return Array.from({ length: pdfDoc.numPages }, (_, index) => index + 1);
  }, [pdfDoc]);

  const handlePageRendered = useCallback((page: PageInfo) => {
    setPages((current) => {
      const next = current.filter((item) => item.pageNumber !== page.pageNumber);
      next.push(page);
      return next.sort((a, b) => a.pageNumber - b.pageNumber);
    });
  }, []);

  const clampOverlay = useCallback((box: OverlayBox) => {
    const page = pages[box.pageIndex];
    if (!page) return box;

    const width = Math.min(box.width, page.width);
    const height = Math.min(box.height, page.height);

    return {
      ...box,
      width,
      height,
      x: Math.max(0, Math.min(box.x, page.width - width)),
      y: Math.max(0, Math.min(box.y, page.height - height)),
    };
  }, [pages]);

  const updateOverlay = useCallback((id: PdfOverlayType, updater: (box: OverlayBox) => OverlayBox) => {
    setOverlayBoxes((current) => current.map((box) => (
      box.id === id ? clampOverlay(updater(box)) : box
    )));
  }, [clampOverlay]);

  const handleImageLoad = (id: PdfOverlayType, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;

    updateOverlay(id, (box) => {
      const naturalRatio = img.naturalHeight / img.naturalWidth;
      return {
        ...box,
        naturalRatio,
        height: box.width * naturalRatio,
      };
    });
  };

  const handleOverlayPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, box: OverlayBox) => {
    if ((e.target as HTMLElement).closest('[data-resize-control]')) return;

    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const overlayRect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - overlayRect.left,
      y: e.clientY - overlayRect.top,
    });
    activeDragPageIndexRef.current = box.pageIndex;
    setActiveOverlayId(box.id);
    setIsDragging(true);
  }, []);

  const handlePagePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, pageIndex: number) => {
    if (!showSigningTools || !activeOverlay) return;
    if ((e.target as HTMLElement).closest('[data-overlay-box]')) return;

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const pageRect = e.currentTarget.getBoundingClientRect();
    updateOverlay(activeOverlay.id, (box) => ({
      ...box,
      pageIndex,
      x: e.clientX - pageRect.left - box.width / 2,
      y: e.clientY - pageRect.top - box.height / 2,
    }));

    activeDragPageIndexRef.current = pageIndex;
    setDragOffset({ x: activeOverlay.width / 2, y: activeOverlay.height / 2 });
    setIsDragging(true);
  }, [activeOverlay, showSigningTools, updateOverlay]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !activeOverlay) return;
    e.preventDefault();

    const activePageIndex = activeDragPageIndexRef.current;
    const pageEl = pageRefs.current[activePageIndex];
    if (!pageEl) return;

    const pageRect = pageEl.getBoundingClientRect();
    updateOverlay(activeOverlay.id, (box) => ({
      ...box,
      pageIndex: activePageIndex,
      x: e.clientX - pageRect.left - dragOffset.x,
      y: e.clientY - pageRect.top - dragOffset.y,
    }));
  }, [activeOverlay, dragOffset, isDragging, updateOverlay]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const setActiveScale = useCallback((nextScale: number) => {
    if (!activeOverlay) return;
    updateOverlay(activeOverlay.id, (box) => {
      const width = baseOverlayWidth[box.type] * nextScale;
      return {
        ...box,
        width,
        height: width * (box.naturalRatio || box.height / box.width),
      };
    });
  }, [activeOverlay, updateOverlay]);

  const handleApprove = () => {
    if (!onApprove || overlayBoxes.length === 0) return;

    const placements = overlayBoxes.map((box) => {
      const page = pages[box.pageIndex];
      const safeBox = clampOverlay(box);

      return page ? {
        id: safeBox.id,
        type: safeBox.type,
        imageUrl: safeBox.imageUrl,
        pageIndex: safeBox.pageIndex,
        xRatio: safeBox.x / page.width,
        yRatio: safeBox.y / page.height,
        widthRatio: safeBox.width / page.width,
        heightRatio: safeBox.height / page.height,
      } : null;
    }).filter((placement): placement is PdfOverlayPlacement => placement !== null);

    onApprove(placements);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-gray-100"
          >
            <div className="flex items-center justify-between px-8 py-5 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                {showSigningTools && (
                  <p className="text-sm text-blue-600 font-medium flex items-center gap-1 mt-1">
                    <MousePointer2 className="w-4 h-4" /> Pilih item, lalu geser ke halaman dan posisi yang diinginkan
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {showSigningTools && activeOverlay && (
              <div className="px-8 py-3 border-b bg-blue-50 flex flex-wrap items-center justify-center gap-4">
                <div className="flex rounded-xl bg-white p-1 border border-blue-100 shadow-sm">
                  {overlayBoxes.map((box) => (
                    <button
                      key={box.id}
                      type="button"
                      onClick={() => setActiveOverlayId(box.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                        activeOverlayId === box.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
                      }`}
                    >
                      {box.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Ukuran {activeOverlay.label}</span>

                <button
                  type="button"
                  onClick={() => setActiveScale(Math.max(activeScale - SCALE_STEP, MIN_SCALE))}
                  disabled={activeScale <= MIN_SCALE}
                  className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  title="Perkecil"
                  data-resize-control
                >
                  <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>

                <div className="flex items-center gap-2.5 min-w-[180px]">
                  <input
                    type="range"
                    min={MIN_SCALE}
                    max={MAX_SCALE}
                    step={SCALE_STEP}
                    value={activeScale}
                    onChange={(e) => setActiveScale(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-200"
                    data-resize-control
                  />
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full min-w-[42px] text-center tabular-nums">
                    {scalePercent}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveScale(Math.min(activeScale + SCALE_STEP, MAX_SCALE))}
                  disabled={activeScale >= MAX_SCALE}
                  className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  title="Perbesar"
                  data-resize-control
                >
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveScale(DEFAULT_SCALE)}
                  className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all active:scale-95 ml-1"
                  title="Reset ukuran"
                  data-resize-control
                >
                  <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            )}

            <div className="flex-1 bg-gray-200 p-6 overflow-auto">
              {loadError && (
                <div className="mx-auto max-w-xl rounded-xl bg-white p-6 text-center text-sm font-semibold text-red-600 shadow">
                  {loadError}
                </div>
              )}

              {!loadError && !pdfDoc && (
                <div className="h-full flex items-center justify-center text-gray-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memuat PDF...
                </div>
              )}

              {!loadError && pdfDoc && (
                <div className="mx-auto flex w-fit flex-col gap-6">
                  {pageNumbers.map((pageNumber, pageIndex) => {
                    const page = pages.find((item) => item.pageNumber === pageNumber);
                    const pageOverlays = overlayBoxes.filter((box) => box.pageIndex === pageIndex);

                    return (
                      <div
                        key={pageNumber}
                        ref={(node) => { pageRefs.current[pageIndex] = node; }}
                        onPointerDown={(event) => handlePagePointerDown(event, pageIndex)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        className="relative bg-white shadow-2xl"
                        style={{
                          width: `${page?.width ?? MAX_PAGE_WIDTH}px`,
                          minHeight: `${page?.height ?? 1160}px`,
                        }}
                      >
                        <PdfPageCanvas
                          pdfDoc={pdfDoc}
                          pageNumber={pageNumber}
                          displayWidth={MAX_PAGE_WIDTH}
                          onRendered={handlePageRendered}
                          renderKey={renderKey}
                        />

                        <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white">
                          Halaman {pageNumber}
                        </div>

                        {showSigningTools && pageOverlays.map((box) => {
                          const selected = activeOverlayId === box.id;

                          return (
                            <div
                              key={box.id}
                              data-overlay-box
                              onPointerDown={(event) => handleOverlayPointerDown(event, box)}
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              onPointerCancel={handlePointerUp}
                              className="absolute z-10 touch-none select-none"
                              style={{
                                left: `${box.x}px`,
                                top: `${box.y}px`,
                                width: `${box.width}px`,
                                height: `${box.height}px`,
                                cursor: isDragging && selected ? 'grabbing' : 'grab',
                              }}
                            >
                              <div
                                className={`relative h-full w-full border-2 rounded-lg p-2 shadow-xl backdrop-blur-[2px] transition-all duration-150 ${
                                  selected ? 'border-blue-600 bg-blue-100/50 shadow-2xl' : 'border-blue-400 bg-blue-50/30'
                                }`}
                              >
                                <img
                                  src={box.imageUrl}
                                  alt={box.label}
                                  onLoad={(event) => handleImageLoad(box.id, event)}
                                  className="pointer-events-none h-full w-full select-none object-contain mix-blend-multiply"
                                  style={{ opacity: box.type === 'stamp' ? 0.6 : 1 }}
                                  draggable={false}
                                />
                                <div className="absolute -top-3 -left-3 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md whitespace-nowrap">
                                  {box.label} · {Math.round((box.width / baseOverlayWidth[box.type]) * 100)}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-8 py-5 border-t bg-gray-50 flex justify-between items-center">
              <p className="text-xs text-gray-400 italic">
                {mode === 'sign' ? 'Pastikan posisi dan ukuran tanda tangan serta stempel sudah sesuai sebelum menyetujui.' : 'Gunakan tombol download untuk menyimpan dokumen.'}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  Batal
                </button>
                {showSigningTools && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={overlayBoxes.length === 0 || overlayBoxes.some((box) => !pages[box.pageIndex])}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Konfirmasi Posisi & Setujui
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PdfPreviewModal;
