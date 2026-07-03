import { computed } from "vue";
import type { ThemeRegistrationRaw } from "shiki";
import { useSettingsStore } from "@/stores/settings";
import { getSchemeCodeThemes } from "./scheme-code-themes";

export interface CodeThemePair {
  light: ThemeRegistrationRaw;
  dark: ThemeRegistrationRaw;
}

export function useCodeTheme() {
  const settings = useSettingsStore();

  const themes = computed<CodeThemePair>(() =>
    getSchemeCodeThemes(settings.colorScheme)
  );

  const activeThemeName = computed(
    () => (settings.isDark ? themes.value.dark.name : themes.value.light.name) as string
  );

  return {
    activeThemeName,
    isDark: settings.isDark,
    themes,
  };
}
