"use client";

import Link from "next/link";
import { ReactNode } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/providers/language-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent } from "@/components/ui/card";

type AuthShellProps = {
  variant: "login" | "signup";
  footerHref: string;
  children: ReactNode;
};

export function AuthShell({ variant, footerHref, children }: AuthShellProps) {
  const { t } = useLanguage();
  const title = variant === "signup" ? t("signupTitle") : t("loginTitle");
  const subtitle = variant === "signup" ? t("signupSubtitle") : t("loginSubtitle");
  const footerText = variant === "signup" ? t("signupFooter") : t("loginFooter");
  const footerLinkText = variant === "signup" ? t("signIn") : t("createAccount");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="absolute inset-0 bg-paper-grid bg-[size:36px_36px] opacity-40" />
      <div className="absolute left-[-8rem] top-[-8rem] h-72 w-72 rounded-full bg-secondary/60 blur-3xl" />
      <div className="absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-4 top-4 z-10 flex items-center gap-3">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="relative grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden rounded-[32px] border border-border/70 bg-secondary/35 p-10 lg:block">
          <p className="text-sm uppercase tracking-[0.35em] text-muted">
            {t("brand")}
          </p>
          <h1 className="mt-6 max-w-xl font-display text-5xl leading-tight text-foreground">
            {t("heroTitle")}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted">
            {t("heroBody")}
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-2 gap-4 text-sm text-foreground/85">
            <div className="rounded-3xl border border-border/70 bg-card/60 p-5">
              <p className="text-muted">{t("monthlyOverview")}</p>
              <p className="mt-2 text-3xl font-display">$12,480</p>
              <p className="mt-1 text-xs text-muted">{t("cashFlow")}</p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card/60 p-5">
              <p className="text-muted">{t("savingsStreak")}</p>
              <p className="mt-2 text-3xl font-display">18 weeks</p>
              <p className="mt-1 text-xs text-muted">{t("steadyProgress")}</p>
            </div>
          </div>
        </section>

        <Card className="border-border/70">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-muted">
                {t("secureAccess")}
              </p>
              <h2 className="mt-4 font-display text-4xl text-foreground">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">{subtitle}</p>
            </div>

            {children}

            <p className="text-sm text-muted">
              {footerText}{" "}
              <Link
                className="font-semibold text-primary transition hover:text-primary/80"
                href={footerHref}
              >
                {footerLinkText}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
