import { password } from "../actions";
import { adminDb } from "@/lib/db";
import { redirect } from "next/navigation";
export default async function Password({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  if (!(await adminDb()))
    redirect("/admin/login");
  return (
    <form className="box adminLogin" action={password}>
      <h1>Şifrə təyin et</h1>
      {(await searchParams).error && <p role="alert">Şifrə saxlanmadı.</p>}
      <label>Cari şifrə<input name="current" type="password" autoComplete="current-password" required /></label>
      <label>
        Yeni şifrə · minimum 12 simvol
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
      </label>
      <label>Yeni şifrəni təkrar edin<input name="confirm" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
      <button className="button primary">Saxla</button>
    </form>
  );
}
