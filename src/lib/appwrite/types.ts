export type Base = { id: string; created_at: string };
export type Profile = Base & {
  user_id: string;
  display_name: string;
  city_id: string;
  locale: string;
  onboarded: boolean;
};
export type City = Base & { name_kk: string; name_ru: string };
export type Community = City & {
  city_id: string;
  description_kk: string;
  description_ru: string;
};
export type Membership = Base & { user_id: string; community_id: string };
export type Post = Base & {
  author_id: string;
  community_id: string;
  body: string;
  status: string;
};
export type Comment = Base & {
  author_id: string;
  post_id: string;
  body: string;
  status: string;
};
export type Report = Base & {
  reporter_id: string;
  post_id: string;
  reason: string;
  status: string;
};
export type Rows = {
  cities: City;
  profiles: Profile;
  communities: Community;
  community_memberships: Membership;
  posts: Post;
  comments: Comment;
  reports: Report;
};
export type Table = keyof Rows;
export type Filter = { field: string; value: string | string[] | boolean };
export type Page = { limit?: number; offset?: number; desc?: boolean };
export interface Repository {
  get<K extends Table>(table: K, id: string): Promise<Rows[K] | null>;
  list<K extends Table>(
    table: K,
    filters?: Filter[],
    page?: Page,
  ): Promise<Rows[K][]>;
  create<K extends Table>(
    table: K,
    id: string,
    data: Omit<Rows[K], keyof Base>,
  ): Promise<Rows[K]>;
  update<K extends Table>(
    table: K,
    id: string,
    data: Partial<Omit<Rows[K], keyof Base>>,
  ): Promise<Rows[K]>;
  delete(table: Table, id: string): Promise<void>;
  transaction<T>(work: (repo: Repository) => Promise<T>): Promise<T>;
}
export type Actor = { id: string; name: string };
