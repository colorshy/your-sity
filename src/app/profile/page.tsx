import { AccountConnections } from "@/components/backend/interactions";
import Link from "next/link";
import { appwriteConfig } from "@/lib/appwrite/config";
import { requireResident } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { CommunityCards, PostList } from "@/components/backend/data";
import { Pagination, pageNumber } from "@/components/backend/pagination";
import { Submit } from "@/components/backend/submit";
import { updateProfile, signOut, resendVerification } from "@/app/actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; page?: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service, user, profile } = await requireResident();
  const { locale, t } = await translator();
  const params = await searchParams,
    page = pageNumber(params.page);
  const [communities, members, city, posts] = await Promise.all([
    service.communities(),
    service.memberships(),
    service.repo.get("cities", profile.city_id),
    service.ownPosts(page),
  ]);
  const ids = members.map((m) => m.community_id);
  const connections = await service.connections();
  const connected = await service.authors(
    connections.map((c) => ({ author_id: c.target_id })),
  );
  return (
    <Shell>
      <h1>{profile.display_name}</h1>
      <p>{city?.[locale === "kk" ? "name_kk" : "name_ru"]}</p>
      <Notice {...params} />
      {!user.emailVerification && (
        <form action={resendVerification}>
          <p>{t("Email мекенжайын растаңыз", "Подтвердите email")}</p>
          <Submit>
            {t("Растау хатын жіберу", "Отправить письмо подтверждения")}
          </Submit>
        </form>
      )}
      <form action={updateProfile} className="form-panel">
        <label>
          {t("Атыңыз", "Имя")}
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={profile.display_name}
          />
        </label>
        <label>
          {t("Тіл", "Язык")}
          <select name="locale" defaultValue={profile.locale}>
            <option value="kk">Қазақша</option>
            <option value="ru">Русский</option>
          </select>
        </label>
        <Submit>{t("Сақтау", "Сохранить")}</Submit>
      </form>
      <form action={signOut}>
        <Submit>{t("Аккаунттан шығу", "Выйти из аккаунта")}</Submit>
      </form>
      {service.isModerator() && (
        <Link className="all-link" href="/moderation">
          {t("Модерация", "Модерация")}
        </Link>
      )}
      <h2>
        {t(
          "Жазылымдар және жасырылған аккаунттар",
          "Подписки и скрытые аккаунты",
        )}
      </h2>
      {Array.from(new Set(connections.map((c) => c.target_id))).map((uid) => (
        <section key={uid} className="form-panel" data-connection-target={uid}>
          <p>
            {connected.find((a) => a.id === uid)?.display_name ??
              t("Тұрғын", "Житель")}
          </p>
          <AccountConnections
            service={service}
            targetId={uid}
            connections={connections}
          />
        </section>
      ))}
      <h2>{t("Қауымдастықтар", "Сообщества")}</h2>
      <CommunityCards
        communities={communities.filter((c) => ids.includes(c.id))}
        joined={ids}
      />
      <Link className="all-link" href="/communities">
        {t("Қауымдастық табу", "Найти сообщество")}
      </Link>
      <h2>{t("Менің жазбаларым", "Мои публикации")}</h2>
      <PostList
        posts={posts.slice(0, 20)}
        authors={[{ id: user.id, display_name: profile.display_name }]}
      />
      <Pagination page={page} more={posts.length > 20} path="/profile?page=" />
    </Shell>
  );
}
