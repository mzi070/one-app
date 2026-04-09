import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OneApp - All-in-One Business Management",
  description: "POS, HR Management, Accounting, and PDF Tools in one powerful application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(JSON.parse(localStorage.getItem('oneapp-theme')||'{}')?.state?.isDark)document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="h-full font-(family-name:--font-inter)">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
