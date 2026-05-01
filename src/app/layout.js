import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata = {
  title: "Vanya Residences | Ancestral Wisdom, Modern Grace",
  description: "Experience unparalleled luxury with Vanya Residences. Where heritage meets minimalism in modern architectural design.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <nav className="main-nav">
          <div className="nav-container">
            <div className="logo">
              <a href="/">VANYA RESIDENCES</a>
            </div>
            <div className="nav-links">
              <a href="/inventory">GALLERY</a>
              <a href="/">AMENITIES</a>
              <a href="/">LIFESTYLE</a>
              <a href="/">CONTACT</a>
            </div>
            <div className="nav-actions">
              <a href="/admin" className="portal-login">Portal Login</a>
              <a href="/inquiry" className="btn btn-primary">ENQUIRE NOW</a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="main-footer">
          <div className="footer-content">
            <h3 className="footer-logo">VANYA RESIDENCES</h3>
            <div className="footer-links">
              <a href="#">PRIVACY POLICY</a>
              <a href="#">RERA DISCLOSURE</a>
              <a href="#">SUSTAINABILITY</a>
              <a href="#">PRESS KIT</a>
            </div>
            <p className="copyright">© 2024 VANYA RESIDENCES. ANCESTRAL CRAFTSMANSHIP, CONTEMPORARY MINIMALISM.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
