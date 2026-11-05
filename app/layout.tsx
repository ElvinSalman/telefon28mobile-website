import { cookies } from "next/headers";
import "./globals.css";
export default async function Root({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  return (
    <html
      lang={jar.get("active-language")?.value || "az"}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
