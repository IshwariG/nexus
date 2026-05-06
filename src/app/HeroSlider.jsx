"use client";
import { useState, useEffect } from "react";

const images = [
  "/images/cb4.png","/images/ic1.png",
  "/images/c1.png","/images/l1.png","/images/m1.png"
  
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-slider-wrapper" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, overflow: 'hidden' }}>
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`Vanya Residences Slider ${idx + 1}`}
          style={{
            position: 'absolute',
            top: '80px',
            left: 0,
            width: '100%',
            height: 'calc(100% - 80px)',
            objectFit: "cover",
            objectPosition: "center",
            opacity: idx === currentIndex ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out',
            zIndex: idx === currentIndex ? 1 : 0
          }}
        />
      ))}
      <div className="hero-slider-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)', zIndex: 5 }}></div>
      
      {/* Cursor Dots */}
      <div style={{
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        zIndex: 10
      }}>
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              border: '2px solid white',
              backgroundColor: idx === currentIndex ? 'white' : 'transparent',
              cursor: 'pointer',
              padding: 0,
              transition: 'all 0.3s ease'
            }}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
