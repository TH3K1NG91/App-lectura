import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en";
import es from "./locales/es";
import de from "./locales/de";
import ru from "./locales/ru";
import fr from "./locales/fr";
import pt from "./locales/pt";
import it from "./locales/it";
import ja from "./locales/ja";
import ko from "./locales/ko";
import zhCN from "./locales/zh-CN";
import zhTW from "./locales/zh-TW";
import ar from "./locales/ar";
import hi from "./locales/hi";
import tr from "./locales/tr";
import pl from "./locales/pl";
import nl from "./locales/nl";
import sv from "./locales/sv";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      ru: { translation: ru },
      fr: { translation: fr },
      pt: { translation: pt },
      it: { translation: it },
      ja: { translation: ja },
      ko: { translation: ko },
      "zh-CN": { translation: zhCN },
      "zh-TW": { translation: zhTW },
      ar: { translation: ar },
      hi: { translation: hi },
      tr: { translation: tr },
      pl: { translation: pl },
      nl: { translation: nl },
      sv: { translation: sv },
    },
    fallbackLng: "es",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lumina-lang",
    },
  });

export default i18n;
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "nl", label: "Nederlands" },
  { code: "sv", label: "Svenska" },
  { code: "pl", label: "Polski" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh-CN", label: "中文(简体)" },
  { code: "zh-TW", label: "中文(繁體)" },
];
