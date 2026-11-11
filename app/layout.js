import { Newsreader, Inter } from "next/font/google";
import "./globals.css";

const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const title = "Eureka Daily: Science, Every Day";
const description =
  "Discover what is special about every day in science: discoveries, scientist birthdays, launches, experiments and official observances, each in a 100-word read.";

export const metadata = {
  title, description,
  openGraph: { title, description, type: "website", siteName: "Eureka Daily" },
  twitter: { card: "summary", title, description },
};

// Runs before paint so the saved theme never flashes.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="font-serif antialiased">{children}</body>
    </html>
  );
}
