import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasToken = Boolean(cookieStore.get("access_token")?.value);

  if (!hasToken) {
    redirect("/login");
  }

  return <DashboardClient />;
}
