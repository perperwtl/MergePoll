"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { zh } from "../lib/translations";
type Language = "en" | "zh-CN";
const Context = createContext({
  language: "en" as Language,
  setLanguage: (_: Language) => {},
  t: (text: string, _values?: Record<string, string | number>) => text,
});
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => {
    try {
      if (localStorage.getItem("mergepoll-language") === "zh-CN")
        setLanguage("zh-CN");
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  function change(value: Language) {
    setLanguage(value);
    try {
      localStorage.setItem("mergepoll-language", value);
    } catch {}
  }
  function t(text: string, values?: Record<string, string | number>) {
    const result =
      language === "zh-CN"
        ? zh[text.replace(/\s+/g, " ").trim()] || text
        : text;
    return result.replace(/\{(\w+)\}/g, (match, key: string) =>
      String(values?.[key] ?? match),
    );
  }
  return (
    <Context.Provider value={{ language, setLanguage: change, t }}>
      {children}
    </Context.Provider>
  );
}
export const useLanguage = () => useContext(Context);
export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();
  return (
    <div className="language-switch" role="group" aria-label="Language / 语言">
      <button
        type="button"
        lang="en"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
      <button
        type="button"
        lang="zh-CN"
        aria-pressed={language === "zh-CN"}
        onClick={() => setLanguage("zh-CN")}
      >
        简体中文
      </button>
    </div>
  );
}
