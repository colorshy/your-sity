import "server-only";
import { redirect } from "next/navigation";
import { serverClient } from "./supabase/server";
export async function requireUser() {
  const client = await serverClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect("/sign-in");
  return { client, user: data.user };
}
export async function requireResident() {
  const context = await requireUser();
  const { data: profile, error } = await context.client
    .from("profiles")
    .select("id,display_name,city_id,onboarded")
    .eq("id", context.user.id)
    .single();
  if (error) throw new Error("Profile unavailable");
  if (!profile.onboarded) redirect("/onboarding");
  return { ...context, profile };
}
