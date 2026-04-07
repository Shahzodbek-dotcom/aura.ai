"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/language-provider";
import { login } from "@/lib/api";
import { getCurrentUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredAccessToken } from "@/lib/auth";

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  useEffect(() => {
    if (!getStoredAccessToken()) {
      return;
    }

    void getCurrentUser()
      .then(() => router.replace("/dashboard"))
      .catch(() => undefined);
  }, [router]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(values);
      toast.success(t("loginSuccess"));
      router.push("/dashboard");
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : t("loginError");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email", {
            required: t("emailRequired"),
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: t("emailInvalid"),
            },
          })}
        />
        {errors.email ? (
          <p className="text-sm text-accent">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("password")}</Label>
          <Link className="text-sm text-primary hover:text-primary/80" href="/signup">
            {t("createAccount")}
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder={t("passwordHint")}
          {...register("password", {
            required: t("passwordRequired"),
            minLength: {
              value: 8,
              message: t("passwordMin"),
            },
          })}
        />
        {errors.password ? (
          <p className="text-sm text-accent">{errors.password.message}</p>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("loginCreating") : t("loginSubmit")}
      </Button>
    </form>
  );
}
