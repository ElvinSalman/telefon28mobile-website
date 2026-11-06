"use server";
import { redirect } from "next/navigation";
import { sessionDb } from "@/lib/db";
import { origin } from "@/lib/config";
export async function login(form: FormData) {
  const db = await sessionDb();
  const { error } = await db.auth.signInWithPassword({
    email: String(form.get("email")),
    password: String(form.get("password")),
  });
  if (error) redirect("/admin/login?error=login");
  const role = await db.rpc("shop_admin");
  if (role.data !== true) {
    await db.auth.signOut();
    redirect("/admin/login?error=role");
  }
  redirect("/admin");
}
export async function logout() {
  await (await sessionDb()).auth.signOut();
  redirect("/admin/login");
}
export async function recover(form: FormData) {
  const db = await sessionDb();
  await db.auth.resetPasswordForEmail(String(form.get("email")), {
    redirectTo: origin + "/auth/callback",
  });
  redirect("/admin/login?reset=1");
}
export async function password(form: FormData) {
  const db = await sessionDb();
  const { data } = await db.auth.getClaims();
  const value = String(form.get("password"));
  if (!data?.claims.sub) redirect("/admin/login");
  if (value.length < 12 || value.length > 128)
    redirect("/admin/password?error=1");
  const r = await db.auth.updateUser({ password: value });
  if (r.error) redirect("/admin/password?error=1");
  redirect("/admin");
}
