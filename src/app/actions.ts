"use server";
import { guardAction } from "@/lib/operations/abuse";
import { applicationOrigin } from "@/lib/operations/config";
import { operationLog } from "@/lib/operations/log";
import { Account, ID } from "node-appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { appwriteConfig, sessionCookie } from "@/lib/appwrite/config";
import {
  anonymousAccount,
  apiClient,
  getRepository,
} from "@/lib/appwrite/server";
import {
  BackendUnavailableError,
  providerCall,
} from "@/lib/appwrite/provider-boundary";
import { CityService } from "@/lib/appwrite/service";
import { requireUser, requireService, requireResident } from "@/lib/auth";
import { validEmail, validName } from "@/lib/validation";
import { validId } from "@/lib/appwrite/policy";
const value = (f: FormData, key: string) => String(f.get(key) ?? "");
async function saveLocale(locale: "ru" | "kk") {
  (await cookies()).set("city-locale", locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 31536000,
  });
}
export async function setPublicLocale(form: FormData) {
  await saveLocale(value(form, "locale") === "ru" ? "ru" : "kk");
}
export async function setLocale(form: FormData) {
  await guardAction("write");
  const locale = value(form, "locale") === "ru" ? "ru" : "kk";
  await saveLocale(locale);
  const account = appwriteConfig()
    ? await import("@/lib/appwrite/server").then((m) => m.sessionAccount())
    : null;
  if (account) {
    try {
      const user = await account.get();
      const repo = await getRepository();
      const service = new CityService(repo, { id: user.$id, name: user.name });
      const p = await service.profile();
      if (p) await repo.update("profiles", p.id, { locale });
    } catch {
      /* Locale preference still works during backend outages. */
    }
  }
  revalidatePath("/", "layout");
}
export async function authenticate(form: FormData) {
  const signup = value(form, "mode") === "signup";
  const resumeDiscover = !signup && value(form, "next") === "discover";
  const target = signup ? "/sign-up" : "/sign-in";
  const errorPath = (code: string) =>
    target + "?error=" + code + (resumeDiscover ? "&next=discover" : "");
  await guardAction("auth", errorPath);
  const email = value(form, "email").trim(),
    password = value(form, "password"),
    name = value(form, "name").trim();
  if (
    !validEmail(email) ||
    password.length < 8 ||
    password.length > 128 ||
    (signup && !validName(name))
  )
    redirect(errorPath("invalid"));

  let openedSession: Account | null = null;
  let sessionStored = false;
  let failure: "auth" | "unavailable" | undefined;
  let submittingCredentials = false;
  try {
    const repo = await getRepository();
    submittingCredentials = true;
    if (signup)
      await providerCall(() =>
        anonymousAccount().create({
          userId: ID.unique(),
          email,
          password,
          name,
        }),
      );
    const session = await providerCall(() =>
      new Account(apiClient()).createEmailPasswordSession({ email, password }),
    );
    submittingCredentials = false;
    if (!session.secret || !Number.isFinite(Date.parse(session.expire)))
      throw new Error("Invalid session");
    (await cookies()).set(sessionCookie(), session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(session.expire),
    });
    sessionStored = true;
    openedSession = await (
      await import("@/lib/appwrite/server")
    ).sessionAccount();
    if (!openedSession) throw new Error("Missing session");
    const identity = await openedSession.get();
    let profile = await new CityService(repo, {
      id: identity.$id,
      name: identity.name,
    }).ensureProfile();
    if (signup) {
      const locale =
        (await cookies()).get("city-locale")?.value === "ru" ? "ru" : "kk";
      profile = await repo.update("profiles", profile.id, { locale });
    }
    await saveLocale(profile.locale === "ru" ? "ru" : "kk");
  } catch (error) {
    failure =
      submittingCredentials &&
      error instanceof BackendUnavailableError &&
      [400, 401, 403, 409, 422].includes(error.code ?? 0)
        ? "auth"
        : "unavailable";
    if (openedSession) {
      try {
        await openedSession.deleteSession({ sessionId: "current" });
      } catch {}
    }
    if (sessionStored) (await cookies()).delete(sessionCookie());
  }
  operationLog("auth_attempt", failure ? "failed" : "success", "auth");
  if (failure) redirect(errorPath(failure));
  revalidatePath("/", "layout");
  redirect(signup ? "/onboarding" : resumeDiscover ? "/discover" : "/feed");
}
export async function signOut() {
  const { account } = await requireUser();
  try {
    await account.deleteSession({ sessionId: "current" });
  } catch {
    redirect("/profile?error=save");
  }
  (await cookies()).delete(sessionCookie());
  revalidatePath("/", "layout");
  redirect("/sign-in");
}
export async function onboard(form: FormData) {
  await guardAction("write");
  const { service } = await requireService();
  const locale = value(form, "locale") === "ru" ? "ru" : "kk";
  try {
    await service.onboard(
      value(form, "name"),
      value(form, "city"),
      form.getAll("communities").map(String),
      locale,
    );
  } catch {
    redirect("/onboarding?error=save");
  }
  (await cookies()).set("city-locale", locale, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 31536000,
  });
  revalidatePath("/", "layout");
  redirect("/feed");
}
export async function membership(form: FormData) {
  await guardAction("write");
  const { service } = await requireResident();
  const id = value(form, "community");
  try {
    if (!validId(id)) throw new Error();
    await service.membership(id, value(form, "operation") === "join");
  } catch {
    redirect("/communities?error=save");
  }
  revalidatePath("/", "layout");
}
export async function updateProfile(form: FormData) {
  await guardAction("write");
  const { service } = await requireResident();
  try {
    await service.updateProfile(
      value(form, "name"),
      value(form, "locale") === "ru" ? "ru" : "kk",
    );
  } catch {
    redirect("/profile?error=save");
  }
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
export async function resendVerification() {
  await guardAction("auth");
  const { account } = await requireUser();
  let site: string;
  try {
    site = applicationOrigin(process.env);
  } catch {
    redirect("/profile?error=config");
  }
  try {
    await account.createVerification({
      url: new URL("/auth/confirm", site).toString(),
    });
  } catch {
    redirect("/profile?error=save");
  }
  redirect("/profile?message=verify");
}
export async function savePost(form: FormData) {
  await guardAction("write");
  const { service } = await requireResident();
  let id = "";
  try {
    const current = value(form, "post");
    const post = current
      ? await service.editPost(current, value(form, "body"))
      : await service.createPost(value(form, "community"), value(form, "body"));
    id = post.id;
  } catch {
    redirect("/create?error=save");
  }
  revalidatePath("/", "layout");
  redirect("/posts/" + id);
}
export async function deletePost(form: FormData) {
  await guardAction("write");
  const { service } = await requireResident();
  try {
    await service.deletePost(value(form, "post"));
  } catch {
    redirect("/feed?error=save");
  }
  revalidatePath("/", "layout");
  redirect("/feed");
}
export async function saveComment(form: FormData) {
  await guardAction("write");
  const { service } = await requireResident();
  const pid = value(form, "post");
  if (!validId(pid)) redirect("/feed");
  try {
    const cid = value(form, "comment");
    if (cid) await service.editComment(cid, value(form, "body"));
    else
      await service.createComment(
        pid,
        value(form, "body"),
        value(form, "parent"),
      );
  } catch {
    redirect("/posts/" + pid + "?error=save");
  }
  revalidatePath("/", "layout");
  redirect("/posts/" + pid);
}
export async function deleteComment(form: FormData) {
  await guardAction("write");
  const { service } = await requireResident();
  const pid = value(form, "post");
  if (!validId(pid)) redirect("/feed");
  try {
    await service.deleteComment(value(form, "comment"));
  } catch {
    redirect("/posts/" + pid + "?error=save");
  }
  revalidatePath("/", "layout");
  redirect("/posts/" + pid);
}
export async function reportPost(form: FormData) {
  await guardAction("write");
  const { service } = await requireResident();
  const pid = value(form, "post");
  if (!validId(pid)) redirect("/feed");
  try {
    await service.report(pid, value(form, "reason"), value(form, "comment"));
  } catch {
    redirect("/posts/" + pid + "?error=save");
  }
  redirect("/posts/" + pid + "?message=reported");
}

export async function resolveReport(form: FormData) {
  await guardAction("write");
  const { service } = await requireResident();
  try {
    await service.resolveReport(value(form, "report"), value(form, "decision"));
  } catch {
    redirect("/moderation?error=save");
  }
  revalidatePath("/", "layout");
  redirect("/moderation");
}

export async function postInteraction(form: FormData) {
  await guardAction("write");
  const { service } = await requireResident();
  const pid = value(form, "post");
  if (!validId(pid)) redirect("/feed");
  try {
    const kind = value(form, "kind");
    if (kind !== "like" && kind !== "bookmark") throw new Error();
    await service.interact(pid, kind, value(form, "enabled") === "true");
  } catch {
    redirect("/posts/" + pid + "?error=save");
  }
  revalidatePath("/", "layout");
}
export async function accountConnection(form: FormData) {
  await guardAction("write");
  const { service } = await requireResident();
  const uid = value(form, "target");
  if (!validId(uid)) redirect("/profile");
  const enabled = value(form, "enabled") === "true";
  try {
    const kind = value(form, "kind");
    if (kind !== "follow" && kind !== "mute" && kind !== "block")
      throw new Error();
    await service.connection(uid, kind, enabled);
  } catch {
    redirect("/profile?error=save");
  }
  revalidatePath("/", "layout");
  if (enabled) redirect("/profile");
}
export async function readNotification(form: FormData) {
  await guardAction("write");
  const { service } = await requireResident();
  try {
    await service.readNotification(value(form, "notification"));
  } catch {
    redirect("/notifications?error=save");
  }
  revalidatePath("/notifications");
}
