import { validId } from "./policy";
import { Query, type TablesDB } from "node-appwrite";
import type { Base, Filter, Page, Repository, Rows, Table } from "./types";
import type { Schema } from "./schema";
export class AppwriteRepository implements Repository {
  constructor(
    private db: TablesDB,
    private databaseId: string,
    private schemas: Record<Table, Schema>,
    private transactionId?: string,
  ) {}
  private normalize<K extends Table>(
    table: K,
    row: Record<string, unknown>,
  ): Rows[K] {
    const value: Record<string, unknown> = {
      id: row.$id,
      created_at: row.$createdAt,
    };
    for (const [field, key] of Object.entries(this.schemas[table].keys))
      value[field] = row[key];
    if (table === "communities") {
      value.description_kk ??= "";
      value.description_ru ??= "";
    }
    return value as Rows[K];
  }
  private encode(table: Table, data: object) {
    const out: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(data)) {
      const key = this.schemas[table].keys[field];
      if (!key) throw new Error("Unmapped write field");
      out[key] = value;
    }
    return out;
  }
  async get<K extends Table>(table: K, id: string): Promise<Rows[K] | null> {
    if (!validId(id)) throw new Error("Invalid row ID");
    try {
      return this.normalize(
        table,
        await this.db.getRow({
          databaseId: this.databaseId,
          tableId: table,
          rowId: id,
          transactionId: this.transactionId,
        }),
      );
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        error.code === 404
      )
        return null;
      throw error;
    }
  }
  async list<K extends Table>(
    table: K,
    filters: Filter[] = [],
    page: Page = {},
  ): Promise<Rows[K][]> {
    const queries = filters.map((f) =>
      Query.equal(
        this.schemas[table].keys[f.field] ?? f.field,
        Array.isArray(f.value) ? f.value : [f.value],
      ),
    );
    queries.push(
      Query.limit(page.limit ?? 100),
      Query.offset(page.offset ?? 0),
    );
    if (page.desc)
      queries.push(Query.orderDesc("$createdAt"), Query.orderDesc("$id"));
    const result = await this.db.listRows({
      databaseId: this.databaseId,
      tableId: table,
      queries,
      transactionId: this.transactionId,
    });
    return result.rows.map((r) => this.normalize(table, r));
  }
  async create<K extends Table>(
    table: K,
    id: string,
    data: Omit<Rows[K], keyof Base>,
  ): Promise<Rows[K]> {
    if (!validId(id)) throw new Error("Invalid row ID");
    return this.normalize(
      table,
      await this.db.createRow({
        databaseId: this.databaseId,
        tableId: table,
        rowId: id,
        data: this.encode(table, data),
        permissions: [],
        transactionId: this.transactionId,
      }),
    );
  }
  async update<K extends Table>(
    table: K,
    id: string,
    data: Partial<Omit<Rows[K], keyof Base>>,
  ): Promise<Rows[K]> {
    if (!validId(id)) throw new Error("Invalid row ID");
    return this.normalize(
      table,
      await this.db.updateRow({
        databaseId: this.databaseId,
        tableId: table,
        rowId: id,
        data: this.encode(table, data),
        permissions: [],
        transactionId: this.transactionId,
      }),
    );
  }
  async delete(table: Table, id: string) {
    if (!validId(id)) throw new Error("Invalid row ID");
    await this.db.deleteRow({
      databaseId: this.databaseId,
      tableId: table,
      rowId: id,
      transactionId: this.transactionId,
    });
  }
  async transaction<T>(work: (repo: Repository) => Promise<T>): Promise<T> {
    if (this.transactionId) return work(this);
    const tx = await this.db.createTransaction({ ttl: 60 });
    try {
      const result = await work(
        new AppwriteRepository(this.db, this.databaseId, this.schemas, tx.$id),
      );
      await this.db.updateTransaction({ transactionId: tx.$id, commit: true });
      return result;
    } catch (error) {
      try {
        await this.db.updateTransaction({
          transactionId: tx.$id,
          rollback: true,
        });
      } catch {}
      throw error;
    }
  }
}
