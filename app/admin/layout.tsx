import type { Metadata } from "next";
import "@/app/shop.css";
export const metadata: Metadata = {
  title: "Telefon28Mobile · İdarəetmə",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main lang="az" className="adminArea">
      {children}
    </main>
  );
}
