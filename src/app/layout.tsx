import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/Toast";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "IT ServiceDesk - Quản lý yêu cầu & Giao việc CNTT Bệnh viện",
  description:
    "Hệ thống tiếp nhận yêu cầu, phân công điều phối SLA 6 bước và tự động tính điểm KPI nhân sự CNTT.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface antialiased min-h-screen flex flex-col selection:bg-primary-fixed">
        <AuthProvider>
          <ToastProvider>
            <AuthGate>{children}</AuthGate>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
