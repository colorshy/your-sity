"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { serverClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { requireUser, requireResident } from "@/lib/auth";
import { validEmail, validName, uuid } from "@/lib/validation";
const value = (form: FormData, key: string) => String(form.get(key) ?? "");
export async function setLocale(form: FormData) {
  (await cookies()).set(
    "city-locale",
    value(form, "locale") === "ru" ? "ru" : "kk",
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 31536000,
    },
  );
  revalidatePath("/", "layout");
}
export async function authenticate(form: FormData) {
  const signup = value(form, "mode") === "signup",
    target = signup ? "/sign-up" : "/sign-in";
  if (!supabaseConfig()) redirect(target + "?error=config");
  const email = value(form, "email").trim(),
    password = value(form, "password"),
    name = value(form, "name").trim();
  if (
    !validEmail(email) ||
    password.length < 8 ||
    password.length > 128 ||
    (signup && !validName(name))
  )
    redirect(target + "?error=invalid");
  const client = await serverClient();
  let failed = false,
    confirmed = false;
  try {
    if (signup) {
      const site = process.env.NEXT_PUBLIC_SITE_URL;
      if (!site) redirect("/sign-up?error=config");
      const url = new URL("/auth/callback", site).toString();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { display_name: name }, emailRedirectTo: url },
      });
      failed = !!error;
      confirmed = !!data.session;
    } else {
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      failed = !!error;
    }
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    failed = true;
  }
  if (failed) redirect(target + "?error=auth");
  revalidatePath("/", "layout");
  redirect(
    signup ? (confirmed ? "/onboarding" : "/sign-in?message=verify") : "/feed",
  );
}
export async function signOut() {
  const { client } = await requireUser();
  const { error } = await client.auth.signOut();
  if (error) redirect("/profile?error=save");
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
export async function onboard(form: FormData) {
  const { client } = await requireUser();
  const name = value(form, "name").trim(),
    city = value(form, "city"),
    ids = form.getAll("communities").map(String);
  if (!validName(name) || !uuid(city) || ids.length > 30 || !ids.every(uuid))
    redirect("/onboarding?error=invalid");
  const { error } = await client.rpc("complete_onboarding", {
    p_name: name,
    p_city: city,
    p_communities: ids,
  });
  if (error) redirect("/onboarding?error=save");
  revalidatePath("/", "layout");
  redirect("/feed");
}
export async function membership(form: FormData) {
  const { client, user } = await requireResident();
  const id = value(form, "community");
  if (!uuid(id)) redirect("/communities?error=invalid");
  const { error } =
    value(form, "operation") === "leave"
      ? await client
          .from("community_memberships")
          .delete()
          .eq("community_id", id)
          .eq("user_id", user.id)
      : await client
          .from("community_memberships")
          .insert({ user_id: user.id, community_id: id });
  if (error) redirect("/communities?error=save");
  revalidatePath("/", "layout");
}
export async function updateProfile(form: FormData) {
  const { client, user } = await requireResident();
  const name = value(form, "name").trim();
  if (!validName(name)) redirect("/profile?error=invalid");
  const { error } = await client
    .from("profiles")
    .update({ display_name: name })
    .eq("id", user.id);
  if (error) redirect("/profile?error=save");
  revalidatePath("/profile");
}

export async function resendVerification(form: FormData) {
  if (!supabaseConfig() || !process.env.NEXT_PUBLIC_SITE_URL)
    redirect("/sign-in?error=config");
  const email = value(form, "email").trim();
  if (!validEmail(email)) redirect("/sign-in?error=invalid");
  const client = await serverClient();
  try {
    await client.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: new URL(
          "/auth/callback",
          process.env.NEXT_PUBLIC_SITE_URL,
        ).toString(),
      },
    });
  } catch {
    redirect("/sign-in?error=auth");
  }
  // Same response for existing, confirmed and unknown accounts.
  redirect("/sign-in?message=verify");
}
