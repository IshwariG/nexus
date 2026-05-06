"use client";
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  
  if (pathname.startsWith('/admin')) {
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
            <a href="#">2BHK Elite</a>
            <a href="#">3BHK Supreme</a>
            <a href="#">4BHK Penthouse</a>
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
