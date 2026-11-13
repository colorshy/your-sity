import "server-only";
import { redirect } from "next/navigation";
import { sessionAccount, getRepository } from "./appwrite/server";
import { CityService } from "./appwrite/service";
export async function requireUser() {
  const account = await sessionAccount();
  if (!account) redirect("/sign-in");
  let user;
  try {
    user = await account.get();
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error.code === 401 || error.code === 403)
    )
      redirect("/sign-in");
    throw new Error("Authentication service unavailable");
  }
  return {
    account,
    user: {
      id: user.$id,
      name: user.name,
      emailVerification: user.emailVerification,
    },
  };
}
export async function requireService() {
  const context = await requireUser();
  const service = new CityService(
    await getRepository(),
    context.user,
    (process.env.APPWRITE_MODERATOR_IDS ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  );
  return { ...context, service };
}
export async function requireResident() {
  const context = await requireService();
  const profile = await context.service.ensureProfile();
  if (!profile.onboarded) redirect("/onboarding");
  return { ...context, profile };
}
