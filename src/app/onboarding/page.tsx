import { appwriteConfig } from "@/lib/appwrite/config";
import { requireService } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { Submit } from "@/components/backend/submit";
import { onboard } from "@/app/actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!appwriteConfig()) return <Configuration />;
  const { service } = await requireService();
  const { locale, t } = await translator();
  const profile = await service.ensureProfile();
  const cities = await service.cities();
  const city = cities.find((c) => c.id === "shymkent");
  if (!city) throw new Error("Existing Shymkent row unavailable");
  const communities = await service.repo.list(
    "communities",
    [{ field: "city_id", value: city.id }],
    { limit: 100 },
  );
  const memberships = await service.memberships();
  return (
    <Shell>
      <section className="form-panel">
        <h1>{t("Қош келдіңіз", "Добро пожаловать")}</h1>
        <Notice {...await searchParams} />
        <form action={onboard}>
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
            <select name="locale" defaultValue={profile.locale || locale}>
              <option value="kk">Қазақша</option>
              <option value="ru">Русский</option>
            </select>
          </label>
          <label>
            {t("Қала", "Город")}
            <select name="city">
              <option value={city.id}>
                {city[locale === "kk" ? "name_kk" : "name_ru"]}
              </option>
            </select>
          </label>
          <fieldset>
            <legend>
              {t("Қауымдастықтарды таңдаңыз", "Выберите сообщества")}
            </legend>
            {communities.map((c) => (
              <label key={c.id} className="choice">
                <input
                  type="checkbox"
                  name="communities"
                  value={c.id}
                  defaultChecked={memberships.some(
                    (m) => m.community_id === c.id,
                  )}
                />
                {c[locale === "kk" ? "name_kk" : "name_ru"]}
              </label>
            ))}
          </fieldset>
          <Submit>{t("Сақтау", "Сохранить")}</Submit>
        </form>
      </section>
    </Shell>
  );
}
