import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const alt = "Predikt — Football Predictions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const logoBuf = await readFile(path.join(process.cwd(), "public", "logo.png"));
  const logoSrc = `data:image/png;base64,${logoBuf.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #0a0f1d 0%, #0e1b33 60%, #0a2a22 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 44,
            fontWeight: 800,
            color: "#ffffff",
          }}
        >
          <img
            src={logoSrc}
            width={84}
            height={84}
            style={{ borderRadius: 20 }}
          />
          Predikt
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 64,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Win more with smarter football predictions
        </div>
        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 16,
            fontSize: 26,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              padding: "10px 26px",
              borderRadius: 999,
              background: "#10b981",
              color: "#0a0f1d",
            }}
          >
            Free daily tips
          </div>
          <div
            style={{
              padding: "10px 26px",
              borderRadius: 999,
              background: "#fbbf24",
              color: "#0a0f1d",
            }}
          >
            Premium 24h · KES 100
          </div>
        </div>
        <div style={{ marginTop: 22, fontSize: 22, color: "#8aa0bf" }}>
          Secured by Paystack · M-Pesa & cards
        </div>
      </div>
    ),
    { ...size }
  );
}
