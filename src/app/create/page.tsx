import Link from "next/link";
import { supabaseConfig } from "@/lib/supabase/config";
import { requireResident } from "@/lib/auth";
import { Shell, Configuration } from "@/components/backend/shell";
export default async function Page() {
  if (!supabaseConfig()) return <Configuration />;
  await requireResident();
  return (
    <Shell>
      <h1>Жазба жасау · Создание публикаций</h1>
      <p>Келесі кезеңде қосылады · Будет доступно на следующем этапе.</p>
      <Link href="/feed">Лента →</Link>
    </Shell>
  );
}
