import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trip Planner",
    short_name: "Trips",
    description:
      "Plan trips together with friends. Split expenses and share moments.",
    start_url: "/",
    display: "standalone",
    background_color: "#1c1917",
    theme_color: "#f97316",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable" as const,
      },
    ],
  };
}
