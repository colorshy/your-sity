import { CityApp } from "@/components/city-app";
import { communities } from "@/lib/demo";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!communities.some((c) => c.id === id)) notFound();
  return <CityApp page="community" id={id} />;
}
