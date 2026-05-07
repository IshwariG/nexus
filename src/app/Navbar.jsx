"use client";
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="logo">
          <Link href="/">VANYA RESIDENCES</Link>
        </div>

        {/* Desktop links */}
        <div className="nav-links">
          <Link href="/inventory">GALLERY</Link>
          <Link href="/#amenities">AMENITIES</Link>
          <Link href="/lifestyle">LIFESTYLE</Link>
          <Link href="/contact">CONTACT</Link>
        </div>

        {/* Desktop actions */}
        <div className="nav-actions">
          <Link href="/login" className="portal-login">Portal Login</Link>
          <Link href="/inquiry" className="btn btn-primary">ENQUIRE NOW</Link>
        </div>

        {/* Hamburger */}
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link href="/inventory" onClick={() => setMenuOpen(false)}>GALLERY</Link>
          <Link href="/#amenities" onClick={() => setMenuOpen(false)}>AMENITIES</Link>
          <Link href="/lifestyle" onClick={() => setMenuOpen(false)}>LIFESTYLE</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>CONTACT</Link>
          <div className="mobile-actions">
            <Link href="/login" onClick={() => setMenuOpen(false)}>Portal Login</Link>
            <Link href="/inquiry" className="btn btn-primary" onClick={() => setMenuOpen(false)}>ENQUIRE NOW</Link>
          </div>
        </div>
      )}
    </nav>
  );
}