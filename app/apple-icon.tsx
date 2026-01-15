import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 72,
          background: "#1B1D22",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#D4A754",
          fontWeight: 600,
          fontFamily: "system-ui, sans-serif",
          borderRadius: 32,
        }}
      >
        MF
      </div>
    ),
    {
      ...size,
    }
  );
}
