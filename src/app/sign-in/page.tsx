import { AuthPage } from "@/components/backend/auth-page";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  return <AuthPage signup={false} params={await searchParams} />;
}
