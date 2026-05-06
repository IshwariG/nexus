import { Playfair_Display, Cormorant_Garamond, Jost } from "next/font/google";
import Navbar from "./Navbar";
import Footer from "./Footer";
import "./globals.css";


const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jost = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export default function RootLayout({ children }) {
  return (
    // in the html tag — replace the className
<html lang="en" className={`${playfair.variable} ${cormorant.variable} ${jost.variable}`}>
      <body>
       
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
