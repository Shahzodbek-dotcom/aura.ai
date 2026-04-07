"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/language-provider";
import { getCurrentUser, signup } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredAccessToken } from "@/lib/auth";

type SignupFormValues = {
  full_name: string;
  email: string;
  password: string;
};

export function SignupForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>();

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
      await signup(values);
      toast.success(t("signupSuccess"));
      router.push("/dashboard");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : t("signupError");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="full_name">{t("fullName")}</Label>
        <Input
          id="full_name"
          placeholder="Aurora Smith"
          {...register("full_name", {
            required: t("nameRequired"),
            minLength: {
              value: 2,
              message: t("nameMin"),
            },
          })}
        />
        {errors.full_name ? (
          <p className="text-sm text-accent">{errors.full_name.message}</p>
        ) : null}
      </div>

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
        <Label htmlFor="password">{t("password")}</Label>
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
        {isSubmitting ? t("signupCreating") : t("signupSubmit")}
      </Button>
    </form>
  );
}
