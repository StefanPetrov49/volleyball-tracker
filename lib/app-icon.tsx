import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const LOGO = join(process.cwd(), "public", "teams", "yakite-pichove.png");
const FONT = join(process.cwd(), "assets", "fonts", "Inter_800ExtraBold.ttf");

/**
 * Square app icon: the team logo centred on white.
 * @param size  icon size in px
 * @param logoScale  how much of the square the logo fills (lower for "maskable" icons,
 *                   which Android crops to a circle/squircle)
 */
export async function renderAppIcon(size: number, logoScale: number): Promise<ImageResponse> {
  const logo = await readFile(LOGO).then(
    (b) => `data:image/png;base64,${b.toString("base64")}`,
    () => null, // logo missing → fall back to a letter
  );
  const px = Math.round(size * logoScale);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: logo ? "#ffffff" : "#f55e1e",
        }}
      >
        {logo ? (
          // next/image can't be used inside ImageResponse
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={px} height={px} style={{ objectFit: "contain" }} alt="" />
        ) : (
          <span style={{ fontFamily: "Inter", fontSize: size * 0.55, fontWeight: 800, color: "#fff" }}>Я</span>
        )}
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: logo ? undefined : [{ name: "Inter", data: await readFile(FONT), weight: 800, style: "normal" }],
    },
  );
}
