import { supabaseConfig } from "@/lib/supabase/config";
import { requireUser } from "@/lib/auth";
import { translator } from "@/lib/locale";
import { Shell, Configuration, Notice } from "@/components/backend/shell";
import { Submit } from "@/components/backend/submit";
import { onboard } from "@/app/actions";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!supabaseConfig()) return <Configuration />;
  const { client, user } = await requireUser();
  const { locale, t } = await translator();
  const [cities, communities, profile, memberships] = await Promise.all([
    client.from("cities").select("*").eq("slug", "shymkent"),
    client.from("communities").select("*"),
    client
      .from("profiles")
      .select("display_name,city_id")
      .eq("id", user.id)
      .single(),
    client
      .from("community_memberships")
      .select("community_id")
      .eq("user_id", user.id),
  ]);
  if (cities.error || communities.error || profile.error || memberships.error)
    throw new Error("Onboarding data unavailable");
  const city = cities.data[0];
  if (!city) throw new Error("City unavailable");
  const selected = memberships.data.map((m) => m.community_id);
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
              defaultValue={profile.data.display_name}
            />
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
            {communities.data
              .filter((c) => c.city_id === city.id)
              .map((c) => (
                <label key={c.id} className="choice">
                  <input
                    type="checkbox"
                    name="communities"
                    value={c.id}
                    defaultChecked={selected.includes(c.id)}
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
