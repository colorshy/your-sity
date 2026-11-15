import { notFound, redirect } from "next/navigation";
import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { AccessError } from "@/lib/appwrite/policy";
import { Shell, Configuration } from "@/components/backend/shell";
import { AccountConnections } from "@/components/backend/interactions";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service, user } = await requireResident();
  const { id } = await params;
  if (id === user.id) redirect("/profile");
  const { t } = await translator();
  let profile;
  try {
    profile = await service.target(id);
    if ((await service.hiddenAuthors()).has(id)) throw new AccessError();
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  return (
    <Shell>
      <h1>{profile.display_name}</h1>
      <p>{t("Шымкент тұрғыны", "Житель Шымкента")}</p>
      <AccountConnections service={service} targetId={id} />
    </Shell>
  );
}
