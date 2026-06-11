import "./globals.css";
import Link from "next/link";
import { Inter, Fraunces, IBM_Plex_Mono } from "next/font/google";
import NavLinks from "./nav-links";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata = {
  title: "GlobalLogistics — GenAI Aangiftecockpit",
  description:
    "PoC: van rommelige intake naar gevalideerde aangifte. AI doet het werk op schaal, de mens stuurt en oordeelt.",
};

export const viewport = { themeColor: "#f6f5f2" };

export default function RootLayout({ children }) {
  return (
    <html lang="nl" className={`${inter.variable} ${fraunces.variable} ${plexMono.variable}`}>
      {/* suppressHydrationWarning: browser-extensies (Grammarly e.d.) injecteren
          attributen op <body> vóór React hydrateert — geen echte mismatch. */}
      <body suppressHydrationWarning>
        <a href="#main" className="skip-link">Direct naar inhoud</a>
        <header className="site-header">
          <div className="wordmark">Waimakers</div>
          <nav className="site-nav">
            <NavLinks />
            <Link href="/uitleg" className="chip-confidential" title="Hoe werkt deze PoC?">PoC — Recruitment use only</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <div className="footer-inner">
            <span>Project GlobalLogistics · GenAI Strategic Transformation · proof-of-concept op steekproef</span>
            <span className="lead-make">Learn. Lead. <em>Make.</em></span>
          </div>
        </footer>
      </body>
    </html>
  );
}
