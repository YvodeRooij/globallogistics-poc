import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "GlobalLogistics — GenAI Declaratie-werkbank",
  description: "PoC: van rommelige intake naar gevalideerde aangifte. AI doet het werk op schaal, de mens stuurt en oordeelt.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        <header className="site-header">
          <div className="wordmark">Waimakers</div>
          <nav className="site-nav">
            <Link href="/">Werkbank</Link>
            <Link href="/dashboard">Executive dashboard</Link>
            <span className="chip-confidential">PoC — Recruitment use only</span>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <span>Project GlobalLogistics · GenAI Strategic Transformation · proof-of-concept op steekproef</span>
          <span className="lead-make">Learn. Lead. <em>Make.</em></span>
        </footer>
      </body>
    </html>
  );
}
