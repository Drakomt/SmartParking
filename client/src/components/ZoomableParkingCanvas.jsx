import { useEffect, useLayoutEffect, useRef, useState } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;
const DRAG_THRESHOLD = 4;

export default function ZoomableParkingCanvas({ children, label = "מפת החניון" }) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [canvasHeight, setCanvasHeight] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const zoomRef = useRef(MIN_ZOOM);
  const pinchRef = useRef(null);
  const zoomFrameRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const mouseDragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimeoutRef = useRef(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const updateHeight = () => setCanvasHeight(canvas.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const getDistance = (touches) => Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY,
    );

    const getMidpoint = (touches) => {
      const bounds = viewport.getBoundingClientRect();
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2 - bounds.left,
        y: (touches[0].clientY + touches[1].clientY) / 2 - bounds.top,
      };
    };

    const handleTouchStart = (event) => {
      if (event.touches.length !== 2) return;
      event.preventDefault();

      const midpoint = getMidpoint(event.touches);
      pinchRef.current = {
        distance: getDistance(event.touches),
        zoom: zoomRef.current,
        contentX: (viewport.scrollLeft + midpoint.x) / zoomRef.current,
        contentY: (viewport.scrollTop + midpoint.y) / zoomRef.current,
      };
    };

    const handleTouchMove = (event) => {
      if (event.touches.length !== 2 || !pinchRef.current) return;
      event.preventDefault();

      const midpoint = getMidpoint(event.touches);
      const gesture = pinchRef.current;
      const ratio = getDistance(event.touches) / gesture.distance;
      const nextZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, gesture.zoom * ratio),
      );

      if (zoomFrameRef.current) cancelAnimationFrame(zoomFrameRef.current);
      zoomFrameRef.current = requestAnimationFrame(() => {
        zoomRef.current = nextZoom;
        setZoom(nextZoom);

        if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = requestAnimationFrame(() => {
          viewport.scrollLeft = gesture.contentX * nextZoom - midpoint.x;
          viewport.scrollTop = gesture.contentY * nextZoom - midpoint.y;
        });
      });
    };

    const handleTouchEnd = (event) => {
      if (event.touches.length < 2) pinchRef.current = null;
    };

    viewport.addEventListener("touchstart", handleTouchStart, { passive: false });
    viewport.addEventListener("touchmove", handleTouchMove, { passive: false });
    viewport.addEventListener("touchend", handleTouchEnd);
    viewport.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      viewport.removeEventListener("touchstart", handleTouchStart);
      viewport.removeEventListener("touchmove", handleTouchMove);
      viewport.removeEventListener("touchend", handleTouchEnd);
      viewport.removeEventListener("touchcancel", handleTouchEnd);
      if (zoomFrameRef.current) cancelAnimationFrame(zoomFrameRef.current);
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
      if (suppressClickTimeoutRef.current) clearTimeout(suppressClickTimeoutRef.current);
    };
  }, []);

  const handlePointerDown = (event) => {
    if (zoom <= MIN_ZOOM || event.pointerType !== "mouse" || event.button !== 0) return;

    const viewport = viewportRef.current;
    if (!viewport) return;

    mouseDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
      moved: false,
    };
  };

  const handlePointerMove = (event) => {
    const viewport = viewportRef.current;
    const drag = mouseDragRef.current;
    if (!viewport || !drag || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD) return;

    if (!drag.moved) {
      drag.moved = true;
      viewport.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }

    event.preventDefault();
    viewport.scrollLeft = drag.scrollLeft - deltaX;
    viewport.scrollTop = drag.scrollTop - deltaY;
  };

  const finishPointerDrag = (event) => {
    const viewport = viewportRef.current;
    const drag = mouseDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (drag.moved) {
      suppressClickRef.current = true;
      if (suppressClickTimeoutRef.current) clearTimeout(suppressClickTimeoutRef.current);
      suppressClickTimeoutRef.current = setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }

    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    mouseDragRef.current = null;
    setIsDragging(false);
  };

  const handleClickCapture = (event) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const updateZoom = (nextZoom) => {
    const normalizedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    zoomRef.current = normalizedZoom;
    setZoom(normalizedZoom);
    if (normalizedZoom === MIN_ZOOM && viewportRef.current) {
      viewportRef.current.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };

  const zoomPercent = Math.round(zoom * 100);

  return (
    <section className="w-full" aria-label={label}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2" dir="rtl">
        <p className="text-xs font-medium text-on-surface-variant sm:text-sm">
          {zoom === MIN_ZOOM ? "תצוגה מלאה" : `תצוגה מוגדלת · ${zoomPercent}%`}
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-1 shadow-sm" role="group" aria-label="בקרי הגדלת מפת החניון">
          <button
            type="button"
            onClick={() => updateZoom(zoom - ZOOM_STEP)}
            disabled={zoom === MIN_ZOOM}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="הקטנת מפת החניון"
          >
            <span className="material-symbols-outlined" aria-hidden="true">remove</span>
          </button>
          <button
            type="button"
            onClick={() => updateZoom(MIN_ZOOM)}
            disabled={zoom === MIN_ZOOM}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="התאמת כל מפת החניון למסך"
          >
            <span className="material-symbols-outlined" aria-hidden="true">fit_screen</span>
          </button>
          <button
            type="button"
            onClick={() => updateZoom(zoom + ZOOM_STEP)}
            disabled={zoom === MAX_ZOOM}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="הגדלת מפת החניון"
          >
            <span className="material-symbols-outlined" aria-hidden="true">add</span>
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`parking-map-viewport w-full rounded-2xl ${zoom > MIN_ZOOM ? `overflow-auto select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}` : "overflow-hidden"}`}
        style={canvasHeight ? { height: `${canvasHeight}px` } : undefined}
        dir="ltr"
        tabIndex={zoom > MIN_ZOOM ? 0 : undefined}
        aria-label={zoom > MIN_ZOOM ? "מפה מוגדלת. ניתן לגרור בעכבר או לגלול בתוך אזור המפה." : undefined}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerDrag}
        onPointerCancel={finishPointerDrag}
        onClickCapture={handleClickCapture}
        onDragStart={(event) => event.preventDefault()}
      >
        <div
          ref={canvasRef}
          className="w-full origin-top-left"
          style={{ transform: `scale(${zoom})` }}
        >
          {children}
        </div>
      </div>

      <p className="mt-2 text-xs leading-5 text-on-surface-variant sm:hidden">
        השתמשו בשתי אצבעות או בכפתורי ההגדלה, ואז גררו בתוך המפה כדי לבחון חניות מקרוב.
      </p>
      <p className="mt-2 hidden text-xs leading-5 text-on-surface-variant sm:block">
        לאחר ההגדלה, לחצו וגררו את המפה בעזרת העכבר כדי לנוע בתוכה.
      </p>
    </section>
  );
}
