"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Close mobile menu on page changes
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  if (pathname?.startsWith('/admin') || pathname === '/login') return null;

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="logo">
          <Link href="/">VANYA RESIDENCES</Link>
        </div>

        {/* Desktop links */}
        <div className="nav-links desktop-only">
          <Link href="/inventory">GALLERY</Link>
          <Link href="/#amenities">AMENITIES</Link>
          <Link href="/lifestyle">LIFESTYLE</Link>
          <Link href="/contact">CONTACT</Link>
        </div>

        {/* Desktop actions */}
        <div className="nav-actions desktop-only">
          <Link href="/login" className="portal-login">Portal Login</Link>
          <Link href="/inquiry" className="btn btn-primary">ENQUIRE NOW</Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button 
          className="mobile-nav-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile navigation drawer */}
      <div className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-links">
          <Link href="/inventory" onClick={() => setIsMobileMenuOpen(false)}>GALLERY</Link>
          <Link href="/#amenities" onClick={() => setIsMobileMenuOpen(false)}>AMENITIES</Link>
          <Link href="/lifestyle" onClick={() => setIsMobileMenuOpen(false)}>LIFESTYLE</Link>
          <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>CONTACT</Link>
          <Link href="/login" className="mobile-portal-login" onClick={() => setIsMobileMenuOpen(false)}>PORTAL LOGIN</Link>
          <Link href="/inquiry" className="btn btn-primary mobile-enquire-btn" onClick={() => setIsMobileMenuOpen(false)}>ENQUIRE NOW</Link>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </nav>
  );
}