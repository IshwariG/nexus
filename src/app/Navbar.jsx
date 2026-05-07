"use client";
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) return null;

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
      </div>
    </nav>
  );
}