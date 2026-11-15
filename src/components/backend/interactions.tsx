import { postInteraction, accountConnection } from "@/app/actions";
import { Submit } from "./submit";
import { translator } from "@/lib/locale";
import type { Connection } from "@/lib/appwrite/types";
import type { CityService } from "@/lib/appwrite/service";

export async function PostInteractions({
  service,
  postId,
}: {
  service: CityService;
  postId: string;
}) {
  const { t } = await translator();
  const status = await service.postInteractions(postId);
  return (
    <div className="beta-actions">
      <p>
        {t("Ұнатулар", "Отметки нравится")}: {status.count}
      </p>
      {(["like", "bookmark"] as const).map((kind) => {
        const active = kind === "like" ? status.liked : status.bookmarked;
        return (
          <form action={postInteraction} key={kind}>
            <input type="hidden" name="post" value={postId} />
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="enabled" value={String(!active)} />
            <Submit>
              {kind === "like"
                ? active
                  ? t("Ұнатуды қайтару", "Убрать нравится")
                  : t("Ұнайды", "Нравится")
                : active
                  ? t("Сақталғаннан жою", "Убрать из закладок")
                  : t("Сақтау", "В закладки")}
            </Submit>
          </form>
        );
      })}
    </div>
  );
}
export async function AccountConnections({
  service,
  targetId,
  connections: preferences,
}: {
  service: CityService;
  targetId: string;
  connections?: readonly Connection[];
}) {
  const { t } = await translator();
  if (targetId === service.actor.id) return null;
  const connections = (preferences ?? (await service.connections())).filter(
    (c) => c.target_id === targetId,
  );
  return (
    <div className="beta-actions">
      {(["follow", "mute", "block"] as const).map((kind) => {
        const active = connections.some((c) => c.kind === kind);
        return (
          <form action={accountConnection} key={kind}>
            <input type="hidden" name="target" value={targetId} />
            <input type="hidden" name="kind" value={kind} />
            <input type="hidden" name="enabled" value={String(!active)} />
            <Submit>
              {kind === "follow"
                ? active
                  ? t("Жазылудан бас тарту", "Отписаться")
                  : t("Жазылу", "Подписаться")
                : kind === "mute"
                  ? active
                    ? t("Дыбысты қосу", "Отменить заглушение")
                    : t("Дыбысын өшіру", "Заглушить")
                  : active
                    ? t("Бұғаттан шығару", "Разблокировать")
                    : t("Бұғаттау", "Заблокировать")}
            </Submit>
          </form>
        );
      })}
    </div>
  );
}
