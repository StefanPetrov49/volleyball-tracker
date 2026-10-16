export function toYouTubeEmbed(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    let id: string | null = null;

    if (host === "youtu.be") {
      id = url.pathname.slice(1);
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
      else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2];
      else if (url.pathname.startsWith("/live/")) id = url.pathname.split("/")[2];
    }

    return id && /^[\w-]{6,}$/.test(id)
      ? `https://www.youtube.com/embed/${id}`
      : null;
  } catch {
    return null;
  }
}

export function youtubeWatchUrl(embedUrl: string): string {
  const id = embedUrl.split("/embed/")[1]?.split(/[?#]/)[0];
  return id ? `https://www.youtube.com/watch?v=${id}` : embedUrl;
}