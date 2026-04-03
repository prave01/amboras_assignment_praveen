import { LoginForm } from "../molecules/login-form";

export function LoginTemplate() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(35,132,183,0.22),transparent_34%),radial-gradient(circle_at_88%_7%,rgba(50,186,159,0.24),transparent_25%)]" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-72 w-72 rounded-full border border-foreground/10" />
      <div className="pointer-events-none absolute -right-12 top-14 h-48 w-48 rounded-full border border-foreground/10" />
      <section className="panel-surface fade-up relative z-10 w-full max-w-md rounded-3xl p-7 md:p-9">
        <p className="text-xs font-semibold tracking-[0.34em] text-muted-foreground">AMBORAS ANALYTICS</p>
        <h1 className="mt-4 font-heading text-4xl leading-tight">Sign in to your store intelligence</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Track revenue trends, product velocity, and event performance in one cockpit.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
