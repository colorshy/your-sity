import { CityApp } from "@/components/city-app";
const pages = new Set([
  "feed",
  "communities",
  "community",
  "post",
  "create",
  "profile",
  "saved",
  "about",
]);
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; id?: string }>;
}) {
  const { page = "feed", id = "" } = await searchParams;
  const selected = pages.has(page) ? page : "feed";
  return <CityApp key={`${selected}:${id}`} page={selected} id={id} />;
}
