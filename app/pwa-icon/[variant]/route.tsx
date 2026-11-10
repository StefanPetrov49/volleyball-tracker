import { renderAppIcon } from "@/lib/app-icon";

// Home-screen icons used by app/manifest.ts:
//   /pwa-icon/192, /pwa-icon/512  – normal icons
//   /pwa-icon/maskable            – Android adaptive icon (logo smaller, so cropping never cuts it)
const VARIANTS = {
  "192": { size: 192, scale: 0.86 },
  "512": { size: 512, scale: 0.86 },
  maskable: { size: 512, scale: 0.62 },
} as const;

type Variant = keyof typeof VARIANTS;

// Built once at deploy time, then served as static files
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({ variant }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ variant: string }> }) {
  const { variant } = await ctx.params;
  const v = VARIANTS[variant as Variant];
  if (!v) return new Response("Not found", { status: 404 });
  return renderAppIcon(v.size, v.scale);
}
