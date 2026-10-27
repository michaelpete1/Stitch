import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stitch",
    short_name: "Stitch",
    description:
      "Organize, track, and excel in your courses with our intuitive platform.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b1026",
    theme_color: "#0b1026",
    icons: [
      {
        src: "/icons/stitch-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/stitch-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
