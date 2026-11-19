import "server-only";
import { redirect } from "next/navigation";
import { sessionAccount, getRepository } from "./appwrite/server";
import { CityService } from "./appwrite/service";
import { appwriteConfig } from "./appwrite/config";

export async function hasVerifiedSession() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    if (!appwriteConfig()) return false;
    const account = await sessionAccount();
    if (!account) return false;
    return await Promise.race([
      account.get().then(() => true),
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), 800);
      }),
    ]);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

type SignInPath = "/sign-in" | "/sign-in?next=discover";

export async function requireUser(signInPath: SignInPath = "/sign-in") {
  const account = await sessionAccount();
  if (!account) redirect(signInPath);
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
      redirect(signInPath);
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
export async function requireService(signInPath?: SignInPath) {
  const context = await requireUser(signInPath);
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
export async function requireResident(signInPath?: SignInPath) {
  const context = await requireService(signInPath);
  const profile = await context.service.ensureProfile();
  if (!profile.onboarded) redirect("/onboarding");
  await context.service.resident();
  return { ...context, profile };
}
