"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./OfferPopupModal.module.css";

export default function OfferPopupModal() {
  const [popups, setPopups] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("offerPopupShown")) return;

    fetch("/api/offer-popups/active")
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          setPopups(data);
          setVisible(true);
          sessionStorage.setItem("offerPopupShown", "true");
        }
      })
      .catch(() => {});
  }, []);

  if (!visible || popups.length === 0) return null;

  const current = popups[currentIndex];

  const handleClose = () => setVisible(false);

  const handleClick = () => {
    if (current.link) {
      handleClose();
      router.push(current.link);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? popups.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === popups.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={handleClose}>
          ✕
        </button>

        {/* Image */}
        <div className={styles.imageWrap} onClick={handleClick}>
          <img
            src={current.imageUrl}
            alt={current.title}
            className={styles.image}
          />
          {current.link && <div className={styles.tapHint}>Tap to shop →</div>}
        </div>

        {/* Dots + Arrows (if multiple) */}
        {popups.length > 1 && (
          <div className={styles.controls}>
            <button className={styles.arrow} onClick={handlePrev}>
              ‹
            </button>
            <div className={styles.dots}>
              {popups.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ""}`}
                  onClick={() => setCurrentIndex(i)}
                />
              ))}
            </div>
            <button className={styles.arrow} onClick={handleNext}>
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}