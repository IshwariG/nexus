"use client";
import { usePathname } from 'next/navigation';

import { useState, useEffect } from 'react';

export default function Footer() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  
  if (pathname?.startsWith('/admin') || pathname === '/login') {
    return null;
  }
  
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h2 className="serif">VANYA RESIDENCES</h2>
          <p>Heritage Collection</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Residences</h4>
            <a href="/inventory">2BHK Elite</a>
            <a href="/inventory">3BHK Supreme</a>
            <a href="/inventory">Heritage Collection</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">RERA Disclaimers</a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Vanya Residences. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
