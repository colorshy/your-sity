import "./globals.css";
import { translator } from "@/lib/locale";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Your City — Шымкент",
  description: "Қалаңыздағы қауымдастықтар · Сообщества вашего города",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { locale } = await translator();
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
