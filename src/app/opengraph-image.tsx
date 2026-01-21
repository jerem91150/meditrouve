import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "MediTrouve - Suivi des ruptures de médicaments en France";
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
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d9488 0%, #0891b2 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo pill icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            backgroundColor: "white",
            borderRadius: 24,
            marginBottom: 40,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0d9488"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.5 20.5 3.8 13.8a2.4 2.4 0 0 1 3.4-3.4l6.7 6.7" />
            <path d="m13.5 3.5 6.7 6.7a2.4 2.4 0 0 1-3.4 3.4L10 6.8" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            textAlign: "center",
            marginBottom: 20,
            textShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        >
          MediTrouve
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 500,
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          Suivi des ruptures de médicaments en France
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            marginTop: 50,
            gap: 40,
          }}
        >
          {["Alertes gratuites", "Données ANSM", "Pharmacies proches"].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "12px 24px",
                  borderRadius: 50,
                  fontSize: 20,
                  fontWeight: 600,
                  color: "white",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {feature}
              </div>
            )
          )}
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            fontSize: 24,
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          www.meditrouve.fr
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
