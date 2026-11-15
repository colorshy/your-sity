import { CityService } from "../../src/lib/appwrite/service";
import type {
  Repository,
  Rows,
  Table,
  Base,
  Filter,
  Page,
} from "../../src/lib/appwrite/types";
export class Memory implements Repository {
  rows = new Map<string, Base & Record<string, unknown>>();
  async get<K extends Table>(table: K, id: string) {
    return (this.rows.get(table + ":" + id) as Rows[K]) ?? null;
  }
  async list<K extends Table>(
    table: K,
    filters: Filter[] = [],
    page: Page = {},
  ) {
    let rows = [...this.rows.entries()]
      .filter(([key]) => key.startsWith(table + ":"))
      .map(([, value]) => value)
      .filter((r) =>
        filters.every((f) =>
          Array.isArray(f.value)
            ? f.value.includes(String(r[f.field]))
            : r[f.field] === f.value,
        ),
      );
    if (page.desc) rows = rows.reverse();
    return rows.slice(
      page.offset ?? 0,
      (page.offset ?? 0) + (page.limit ?? 100),
    ) as Rows[K][];
  }
  async create<K extends Table>(
    table: K,
    id: string,
    data: Omit<Rows[K], keyof Base>,
  ) {
    if (this.rows.has(table + ":" + id)) throw new Error("Conflict");
    const row = { ...data, id, created_at: new Date().toISOString() };
    this.rows.set(table + ":" + id, row);
    return row as Rows[K];
  }
  async update<K extends Table>(
    table: K,
    id: string,
    data: Partial<Omit<Rows[K], keyof Base>>,
  ) {
    const row = await this.get(table, id);
    if (!row) throw new Error("Missing row");
    const updated = { ...row, ...data };
    this.rows.set(table + ":" + id, updated);
    return updated;
  }
  async delete(table: Table, id: string) {
    this.rows.delete(table + ":" + id);
  }
  async transaction<T>(work: (repo: Repository) => Promise<T>): Promise<T> {
    // Conservative optimistic fixture isolation; never overwrite another commit.
    const baseline = JSON.stringify([...this.rows]);
    const isolated = Object.create(Object.getPrototypeOf(this)) as Memory;
    isolated.rows = structuredClone(this.rows);
    const result = await work(isolated);
    if (JSON.stringify([...this.rows]) !== baseline)
      throw new Error("Transaction conflict");
    this.rows = isolated.rows;
    return result;
  }
}
export async function setup(repo = new Memory()) {
  await repo.create("cities", "shymkent", {
    name_kk: "Шымкент",
    name_ru: "Шымкент",
  });
  await repo.create("cities", "other", { name_kk: "Other", name_ru: "Other" });
  await repo.create("communities", "events", {
    city_id: "shymkent",
    name_kk: "Іс-шаралар",
    name_ru: "События",
    description_kk: "",
    description_ru: "",
  });
  await repo.create("communities", "foreign", {
    city_id: "other",
    name_kk: "Other",
    name_ru: "Other",
    description_kk: "",
    description_ru: "",
  });
  const alice = new CityService(repo, { id: "alice", name: "Alice" }),
    bob = new CityService(repo, { id: "bob", name: "Bob" });
  await alice.onboard("Alice", "shymkent", ["events"], "kk");
  await bob.onboard("Bob", "shymkent", [], "ru");
  return { repo, alice, bob };
}
