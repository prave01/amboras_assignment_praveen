import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginTemplate } from "@/components/atomic/templates/login-template";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const hasToken = Boolean(cookieStore.get("access_token")?.value);

  if (hasToken) {
    redirect("/dashboard");
  }

  return <LoginTemplate />;
}
