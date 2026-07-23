"use client";

import Image from "next/image";
import { Product } from "@/lib/products";
import styles from "./ProductImageGallery.module.css";
import { useEffect, useMemo, useRef, useState } from "react";

export default function ProductImageGallery({ product }: { product: Product }) {
  const images = useMemo(() => {
    const galleryImages =
      product.gallery && product.gallery.length > 0
        ? product.gallery
        : [product.image];

    return galleryImages.filter(Boolean);
  }, [product.gallery, product.image]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [zoomOpen, setZoomOpen] = useState(false);
  const userInteractedRef = useRef(false);

  const visibleImages = images.filter((image) => !failedImages.includes(image));
  const activeImage = visibleImages[activeIndex] || product.image;

  useEffect(() => {
    if (zoomOpen) return;
    if (userInteractedRef.current) return;
    if (visibleImages.length <= 1) return;
  
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleImages.length);
    }, 4000);
  
    return () => window.clearInterval(timer);
  }, [visibleImages.length, zoomOpen]);

  function handleImageError(image: string) {
    setFailedImages((current) =>
      current.includes(image) ? current : [...current, image]
    );

    if (activeIndex >= visibleImages.length - 1) {
      setActiveIndex(0);
    }
  }

  function selectImage(index: number) {
    userInteractedRef.current = true;
    setActiveIndex(index);
  }

  if (!activeImage) {
    return (
      <div className={styles.fallback}>
        <div className="detail-bottle">
          <div className="detail-bottle-cap" />
          <div className="detail-bottle-shine" />
          <div className="detail-bottle-label">
            <span>HOUSE OF EON</span>
            <strong>{product.shortName}</strong>
            <small>
              {product.size} · {product.concentration}
            </small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.gallery}>
        <div className={styles.main}>
          <button
            type="button"
            className={styles.imageButton}
            onClick={() => setZoomOpen(true)}
            aria-label={`View ${product.name} image larger`}
          >
            <Image
              src={activeImage}
              alt={`${product.name} perfume by House of Eon`}
              fill
              priority
              className={styles.mainImage}
              sizes="(max-width: 860px) 94vw, 520px"
              onError={() => handleImageError(activeImage)}
            />

            <div className={styles.shade} />

            <div className={styles.badge}>
              <span>{product.tagline}</span>
            </div>

            <div className={styles.zoomHint}>Tap to zoom</div>
          </button>
        </div>

        {visibleImages.length > 1 ? (
          <>
            <div className={styles.dots} aria-label="Product gallery dots">
              {visibleImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={index === activeIndex ? styles.active : ""}
                  onClick={() => selectImage(index)}
                  aria-label={`Show image ${index + 1}`}
                />
              ))}
            </div>

            <div className={styles.thumbs}>
              {visibleImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={index === activeIndex ? styles.active : ""}
                  onClick={() => selectImage(index)}
                  aria-label={`Select ${product.name} image ${index + 1}`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    fill
                    className={styles.thumbImage}
                    sizes="72px"
                    onError={() => handleImageError(image)}
                  />
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {zoomOpen ? (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} image preview`}
        >
          <button
            type="button"
            className={styles.modalClose}
            onClick={() => setZoomOpen(false)}
            aria-label="Close image preview"
          >
            ×
          </button>

          <div className={styles.modalImageWrap}>
            <Image
              src={activeImage}
              alt={`${product.name} perfume large preview`}
              fill
              className={styles.modalImage}
              sizes="100vw"
            />
          </div>

          {visibleImages.length > 1 ? (
            <div className={styles.modalThumbs}>
              {visibleImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={index === activeIndex ? styles.active : ""}
                  onClick={() => selectImage(index)}
                  aria-label={`Preview image ${index + 1}`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} preview thumbnail ${index + 1}`}
                    fill
                    className={styles.thumbImage}
                    sizes="62px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}