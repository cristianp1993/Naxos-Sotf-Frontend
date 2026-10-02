import type { MetadataRoute } from "next";

// Manifest PWA: permite instalar la web como app standalone en celulares
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Naxos Coctels",
    short_name: "Naxos",
    description: "Sistema de gestión - Naxos Coctels",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#581c87",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
