import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin esto, Turbopack sube buscando lockfiles y se topa con uno suelto en
  // C:\Users\Oscar, fuera del repositorio.
  turbopack: { root: __dirname },
};

export default nextConfig;
