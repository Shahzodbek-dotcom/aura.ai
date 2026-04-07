"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ExpenseParserFormProps = {
  onSubmit: (message: string) => Promise<void>;
};

const SUGGESTIONS = [
  "Bugun kofe va sendvich uchun 48 ming so'm sarfladim",
  "Yandex taxi ga 27 ming ketdi",
  "Marketdan oziq-ovqat oldim, 215000 so'm bo'ldi",
];

export function ExpenseParserForm({ onSubmit }: ExpenseParserFormProps) {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) {
      toast.error(t("expenseEmpty"));
      return;
    }

    if (message.trim().length < 5) {
      toast.error(t("expenseShort"));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(message);
      toast.success(t("expenseSuccess"));
      setMessage("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Textarea
        placeholder={t("expensePlaceholder")}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((item) => (
          <button
            key={item}
            className="rounded-full border border-border bg-white/70 px-3 py-1.5 text-xs text-muted transition hover:border-primary hover:text-foreground"
            type="button"
            onClick={() => setMessage(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <Button size="lg" type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("expenseSubmitting") : t("expenseSubmit")}
      </Button>
    </form>
  );
}
