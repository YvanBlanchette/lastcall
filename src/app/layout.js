import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "LastCall — La marketplace des dernières places de groupes",
    template: "%s · LastCall",
  },
  description:
    "Publiez et trouvez les dernières places disponibles sur des groupes déjà confirmés, avant qu'elles ne soient relâchées.",
  openGraph: {
    type: "website",
    locale: "fr_CA",
    siteName: "LastCall",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr-CA" className={inter.variable}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
