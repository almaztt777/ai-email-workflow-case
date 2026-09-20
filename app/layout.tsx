import type { ReactNode } from "react";

export const metadata = {
  title: "Автоматизация разбора писем",
  description: "Технический кейс: письмо в структурированную строку таблицы",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "Arial, sans-serif", margin: 0, background: "#f5f6f8", color: "#111827" }}>
        {children}
      </body>
    </html>
  );
}
