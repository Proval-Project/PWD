import React, { useEffect, useMemo, useState } from "react";

type AppLanguage = "ko" | "en";

const getInitialLanguage = (): AppLanguage => {
  const stored = localStorage.getItem("language");
  if (stored === "ko" || stored === "en") return stored;
  // 기본값: 스샷처럼 English(EN) 표시 + 토글 Off
  return "en";
};

const LanguageToggle: React.FC = () => {
  const [language, setLanguage] = useState<AppLanguage>(() => getInitialLanguage());
  const enabled = useMemo(() => language === "en", [language]);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
    window.dispatchEvent(new CustomEvent("languageChange", { detail: { language } }));
  }, [language]);

  const toggle = () => {
    setLanguage(prev => (prev === "en" ? "ko" : "en"));
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="w-20 h-8 flex items-center justify-center bg-white rounded-[15px] shadow-[2px_1px_6px_0px_rgba(0,0,0,0.25)] border border-white text-base font-bold">
        {language === "en" ? "English" : "한국어"}
      </div>

      <button
        onClick={toggle}
        className={`w-16 h-8 rounded-[30px] relative transition ${
          enabled ? "bg-blue-500" : "bg-zinc-300"
        }`}
        type="button"
        aria-label="toggle language"
        aria-pressed={enabled}
      >
        <div
          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition ${
            enabled ? "right-1" : "left-1"
          }`}
        />
      </button>
    </div>
  );
};

export default LanguageToggle;
