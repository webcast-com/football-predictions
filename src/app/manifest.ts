import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Predikt — Football Predictions & Expert Tips",
    short_name: "Predikt",
    description:
      "Data-driven football predictions with free daily tips and premium VIP picks.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0f1d",
    theme_color: "#0a0f1d",
    icons: [
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ],
  };
}
