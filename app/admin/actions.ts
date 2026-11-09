"use server";
import { redirect } from "next/navigation";
import { sessionDb, adminDb } from "@/lib/db";
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
export async function password(form: FormData) {
  const db = await adminDb();
  if (!db) redirect("/admin/login");
  const { data } = await db.auth.getUser();
  const value = String(form.get("password"));
  if (!data.user?.email) redirect("/admin/login");
  if (value !== String(form.get("confirm"))) redirect("/admin/password?error=1");
  const reauth = await db.auth.signInWithPassword({ email: data.user.email, password: String(form.get("current")) });
  if (reauth.error) redirect("/admin/password?error=1");
  if (value.length < 12 || value.length > 128)
    redirect("/admin/password?error=1");
  const r = await db.auth.updateUser({ password: value });
  if (r.error) redirect("/admin/password?error=1");
  redirect("/admin");
}
