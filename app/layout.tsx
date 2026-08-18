import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ItukuApp | One Community. Nine Villages. One Voice.",
  description: "The official digital platform for Ituku Community.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
