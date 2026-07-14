import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import InstallPWA from "../components/InstallPWA";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-outfit" });

export const metadata = {
  title: "PROJECT RED LINK",
  description: "detect · direct · protect",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`}>
        <InstallPWA />
        {children}
      </body>
    </html>
  );
}
