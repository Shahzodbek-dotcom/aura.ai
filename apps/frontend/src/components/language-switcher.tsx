"use client";

import { LANGUAGES, useLanguage, type Language } from "@/components/providers/language-provider";

const labels: Record<Language, string> = {
  uz: "O'Z",
  ru: "RU",
  en: "EN",
};

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-full border border-border/70 bg-card/80 p-1">
      {LANGUAGES.map((item) => (
        <button
          key={item}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            item === language
              ? "bg-primary text-primary-foreground"
              : "text-muted hover:text-foreground"
          }`}
          type="button"
          onClick={() => setLanguage(item)}
        >
          {labels[item]}
        </button>
      ))}
    </div>
  );
}
