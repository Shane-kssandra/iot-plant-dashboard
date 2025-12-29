// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plant Watering Dashboard",
  description: "IoT-Based Plant Watering System (ESP32 + Firebase)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <div className="max-w-6xl mx-auto p-4">{children}</div>
      </body>
    </html>
  );
}
