import type { ReactNode } from "react";

export const metadata = {
  title: "AI Email Workflow Case",
  description: "Email-to-structured-data automation case",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Arial, sans-serif", margin: 0, background: "#f5f6f8", color: "#111827" }}>
        {children}
      </body>
    </html>
  );
}
