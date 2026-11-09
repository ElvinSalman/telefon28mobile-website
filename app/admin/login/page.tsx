import Link from "next/link";
import { login } from "../actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const q = await searchParams;
  return (
    <section className="adminLogin box">
      <h1>İdarəetməyə giriş</h1>
      <p>Telefon28Mobile mağazasının idarəçiləri üçün.</p><small>Hesab mağaza sahibi tərəfindən yaradılır. Sizə ayrıca verilmiş e-poçt və şifrə ilə daxil olun.</small>
      {q.error && (
        <p role="alert">
          Giriş mümkün olmadı. Məlumatları və idarəçi icazəsini yoxlayın.
        </p>
      )}
      <form action={login}>
        <label>
          E-poçt
          <input required name="email" type="email" autoComplete="username" />
        </label>
        <label>
          Şifrə
          <input
            required
            name="password"
            type="password"
            autoComplete="current-password"
          />
        </label>
        <button className="button primary">Daxil ol</button>
      </form>
      <Link className="textlink" href="/az">← Mağazaya qayıt</Link>
      <p className="muted">E-poçtla şifrə bərpası hazırda aktiv deyil. Şifrəni unutmusunuzsa, mağaza sahibi hesabınızı Supabase-də təhlükəsiz yeniləməlidir.</p>
    </section>
  );
}
