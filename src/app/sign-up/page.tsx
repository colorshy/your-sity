import { AuthPage } from "@/components/backend/auth-page";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  return <AuthPage signup={true} params={await searchParams} />;
}
