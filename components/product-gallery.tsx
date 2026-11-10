"use client";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  X,
  Scan,
} from "lucide-react";
import type { Product } from "@/data/products";
import { useText } from "./hooks";

export function ProductGallery({ product }: { product: Product }) {
  const { t } = useText();
  const images = product.images || [];
  const [index, setIndex] = useState(0),
    [open, setOpen] = useState(false),
    [zoomed, setZoomed] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null),
    swiped = useRef(false);
  const viewport = useRef<HTMLDivElement>(null);
  const current = images[index] || images[0],
    multiple = images.length > 1;
  function select(next: number) {
    setIndex((next + images.length) % images.length);
    setZoomed(false);
    viewport.current?.scrollTo(0, 0);
  }
  function keyboard(e: KeyboardEvent) {
    if (!multiple) return;
    const next =
      e.key === "ArrowRight"
        ? index + 1
        : e.key === "ArrowLeft"
          ? index - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? images.length - 1
              : null;
    if (next !== null) {
      e.preventDefault();
      select(next);
    }
  }
  function down(e: PointerEvent) {
    swiped.current = false;
    start.current = { x: e.clientX, y: e.clientY };
  }
  function up(e: PointerEvent) {
    const p = start.current;
    start.current = null;
    if (!p || !multiple || zoomed) return;
    const x = e.clientX - p.x,
      y = e.clientY - p.y;
    if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y) * 1.3) {
      swiped.current = true;
      select(index + (x < 0 ? 1 : -1));
    }
  }
  const gestures = {
    onPointerDown: down,
    onPointerUp: up,
    onPointerCancel: () => {
      start.current = null;
    },
  };
  const arrows = (
    <>
      <button
        type="button"
        className="galleryArrow galleryPrevious"
        aria-label={t("previous")}
        onClick={() => select(index - 1)}
      >
        <ChevronLeft />
      </button>
      <button
        type="button"
        className="galleryArrow galleryNext"
        aria-label={t("next")}
        onClick={() => select(index + 1)}
      >
        <ChevronRight />
      </button>
    </>
  );
  if (!current)
    return (
      <div className="galleryEmpty">
        <Scan aria-hidden="true" />
        <span>{t("missingPhoto")}</span>
      </div>
    );
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        setZoomed(false);
      }}
    >
      <section
        className="productGallery"
        aria-label={t("gallery")}
        aria-roledescription={t("carousel")}
        onKeyDown={keyboard}
      >
        <div className="galleryStage">
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="galleryOpen"
              aria-label={t("openImage")}
              {...gestures}
              onClick={(e) => {
                if (swiped.current) {
                  e.preventDefault();
                  swiped.current = false;
                }
              }}
            >
              <Image
                key={current.url}
                unoptimized
                draggable={false}
                src={current.url}
                alt={current.alt || product.name}
                width={1200}
                height={1200}
                className="galleryImage"
              />
              <span className="galleryZoomHint" aria-hidden="true">
                <ZoomIn size={19} />
              </span>
            </button>
          </Dialog.Trigger>
          {multiple && arrows}
        </div>
        {multiple && (
          <>
            <div className="galleryThumbnails" aria-label={t("gallery")}>
              {images.map((im, i) => (
                <button
                  type="button"
                  key={im.url}
                  aria-label={`${t("gallery")} ${i + 1}`}
                  aria-pressed={i === index}
                  onClick={() => select(i)}
                >
                  <Image
                    unoptimized
                    draggable={false}
                    src={im.url}
                    alt=""
                    width={80}
                    height={80}
                  />
                </button>
              ))}
            </div>
            <span
              className="galleryCount"
              aria-live="polite"
              aria-atomic="true"
            >
              {index + 1} / {images.length}
            </span>
          </>
        )}
      </section>
      <Dialog.Portal>
        <Dialog.Overlay className="galleryOverlay" />
        <Dialog.Content
          className="galleryLightbox"
          aria-describedby={undefined}
          onKeyDown={keyboard}
        >
          <header className="galleryLightboxHeader">
            <Dialog.Title>{product.name}</Dialog.Title>
            <div>
              <button
                type="button"
                className="icon"
                aria-label={t(zoomed ? "zoomOut" : "zoom")}
                aria-pressed={zoomed}
                onClick={() => {
                  setZoomed((v) => !v);
                  viewport.current?.scrollTo(0, 0);
                }}
              >
                {zoomed ? <ZoomOut /> : <ZoomIn />}
              </button>
              <Dialog.Close className="icon" aria-label={t("close")}>
                <X />
              </Dialog.Close>
            </div>
          </header>
          <div className="galleryLightboxStage">
            <div
              ref={viewport}
              className={"galleryViewport" + (zoomed ? " isZoomed" : "")}
              {...gestures}
            >
              <Image
                key={current.url}
                unoptimized
                draggable={false}
                src={current.url}
                alt={current.alt || product.name}
                width={1600}
                height={1600}
                className="galleryLightboxImage"
              />
            </div>
            {multiple && arrows}
          </div>
          {multiple && (
            <span className="galleryCount" aria-live="polite">
              {index + 1} / {images.length}
            </span>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
