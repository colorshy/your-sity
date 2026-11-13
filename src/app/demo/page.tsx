import { CityApp } from "@/components/city-app";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return <CityApp page={page === "communities" ? "communities" : "feed"} />;
}
