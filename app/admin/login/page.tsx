import { login, recover } from "../actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const q = await searchParams;
  return (
    <section className="adminLogin box">
      <h1>İdarəetməyə giriş</h1>
      <p>Telefon28Mobile</p>
      {q.error && (
        <p role="alert">
          Giriş mümkün olmadı. Məlumatları və idarəçi icazəsini yoxlayın.
        </p>
      )}
      {q.reset && <p role="status">Uyğun hesab varsa, e-poçtunuzu yoxlayın.</p>}
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
      <details>
        <summary>Şifrəni bərpa et</summary>
        <form action={recover}>
          <label>
            E-poçt
            <input required name="email" type="email" />
          </label>
          <button className="button outline">Bərpa keçidi göndər</button>
        </form>
      </details>
    </section>
  );
}
