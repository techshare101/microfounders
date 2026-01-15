import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "MicroFounder Network - A calm home for people who build";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "#FAFAFA",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 600,
              color: "#1B1D22",
              letterSpacing: "-0.03em",
            }}
          >
            MicroFounder Network
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#666",
              fontWeight: 400,
            }}
          >
            A calm home for people who build.
          </div>
          <div
            style={{
              width: 60,
              height: 2,
              background: "#D4A754",
              marginTop: 16,
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
