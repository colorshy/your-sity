import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Your City — Шымкент",
  description: "Қалаңыздағы қауымдастықтар · Сообщества вашего города",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="kk">
      <body>{children}</body>
    </html>
  );
}
