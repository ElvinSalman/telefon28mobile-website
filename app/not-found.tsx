import Link from "next/link";
export default function Missing() {
  return (
    <div className="wrap inner">
      <small>404</small>
      <h1>Səhifə tapılmadı</h1>
      <Link className="button primary" href="/az">
        Ana səhifə
      </Link>
    </div>
  );
}
