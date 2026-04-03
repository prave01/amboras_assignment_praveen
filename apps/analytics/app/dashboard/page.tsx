import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardTemplate } from "@/components/atomic/templates/dashboard-template";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const hasToken = Boolean(cookieStore.get("access_token")?.value);

  if (!hasToken) {
    redirect("/login");
  }

  return <DashboardTemplate />;
}
