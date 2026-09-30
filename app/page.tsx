import Schedule from "@/components/Schedule";
import NextMatch from "@/components/NextMatch";
import { matches } from "@/data/matches";
import Footer from "@/components/Footer";

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <nav className="topbar">
        <div className="topbar-inner">
          <a href="/" className="brand">
            <img src="/logo.svg" alt="Яките пичове logo" className="brand-logo" />
          </a>
          <a
            href="https://www.instagram.com/yakite.pichove/"
            target="_blank"
            rel="noopener noreferrer"
            className="insta-btn"
            aria-label="Instagram @yakite.pichove"
          >
            <InstagramIcon />
            <span className="insta-handle">@yakite.pichove</span>
          </a>
        </div>
      </nav>

      <main className="container">
        <NextMatch matches={matches} />
        <Schedule matches={matches} />
      </main>
      <Footer />
    </>
  );
}