"use client";
import { useState } from "react";

const FEED_PATH = "/calendar.ics";

// URLs are built on click (not during render) so server and browser HTML match.
const feedUrl = () => `${window.location.origin}${FEED_PATH}`;
const webcalUrl = () => feedUrl().replace(/^https?:/, "webcal:");

/** "Subscribe to all matches" box – one-time setup, then the calendar updates itself. */
export default function SubscribeCalendar() {
  const [copied, setCopied] = useState(false);

  // webcal:// opens the "Subscribe" dialog in Apple Calendar (iPhone, iPad, Mac)
  const subscribeApple = () => {
    window.location.href = webcalUrl();
  };

  // opens Google Calendar's "Add calendar from URL" prompt
  const subscribeGoogle = () => {
    window.open(
      `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl())}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  // for Outlook and anything else: paste the link as "subscribe from web"
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Копирай линка:", feedUrl());
    }
  };

  return (
    <div className="subscribe-cal">
      <div className="subscribe-cal-text">
        <strong>📅 Всички мачове в твоя календар</strong>
        <span>Абонирай се веднъж – новите и променените мачове се появяват автоматично.</span>
      </div>
      <div className="add-cal add-cal-light subscribe-cal-actions">
        <button type="button" className="add-cal-btn" onClick={subscribeApple}>
          Apple / iPhone
        </button>
        <button type="button" className="add-cal-btn" onClick={subscribeGoogle}>
          Google
        </button>
        <button type="button" className="add-cal-btn" onClick={copyLink}>
          {copied ? "✓ Копирано" : "Копирай линк"}
        </button>
      </div>
    </div>
  );
}
