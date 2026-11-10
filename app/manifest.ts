import type { MetadataRoute } from "next";

// Makes the site installable: "Add to Home Screen" on iPhone, "Install app" on Android/Chrome.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Яките пичове – волейболен отбор",
    short_name: "Яките пичове",
    description: "Програма на мачовете, резултати и анкети на волейболен отбор Яките пичове.",
    lang: "bg",
    start_url: "/",
    scope: "/",
    display: "standalone", // opens without the browser bar
    orientation: "portrait",
    background_color: "#f7f4ef", // splash screen while loading (site background)
    theme_color: "#f55e1e", // status bar / title bar
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
