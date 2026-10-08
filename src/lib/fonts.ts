import { Inter } from "next/font/google";

/** UI face for the staff app and sign-in pages. The public site keeps Nunito. */
export const uiFont = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});
