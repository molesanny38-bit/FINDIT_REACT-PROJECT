import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";
export type FontSize = "normal" | "medium" | "large" | "xlarge";

export interface AccessibilitySettings {
  theme: ThemeMode;
  highContrast: boolean;
  fontSize: FontSize;
  dyslexiaFont: boolean;
  underlineLinks: boolean;
  reduceMotion: boolean;
  focusGuide: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  setFontSize: (size: FontSize) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setDyslexiaFont: (enabled: boolean) => void;
  toggleDyslexiaFont: () => void;
  setUnderlineLinks: (enabled: boolean) => void;
  toggleUnderlineLinks: () => void;
  setReduceMotion: (enabled: boolean) => void;
  toggleReduceMotion: () => void;
  setFocusGuide: (enabled: boolean) => void;
  toggleFocusGuide: () => void;
  resetToDefaults: () => void;
}

const STORAGE_KEYS = {
  theme: "findit_theme",
  highContrast: "findit_high_contrast",
  fontSize: "findit_font_size",
  dyslexiaFont: "findit_dyslexia_font",
  underlineLinks: "findit_underline_links",
  reduceMotion: "findit_reduce_motion",
  focusGuide: "findit_focus_guide",
};

const fontSizes: FontSize[] = ["normal", "medium", "large", "xlarge"];

const defaultSettings: AccessibilitySettings = {
  theme: "light",
  highContrast: false,
  fontSize: "normal",
  dyslexiaFont: false,
  underlineLinks: false,
  reduceMotion: false,
  focusGuide: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.theme) || localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.highContrast);
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-contrast: more)").matches;
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.fontSize) as FontSize;
    return fontSizes.includes(saved) ? saved : "normal";
  });

  const [dyslexiaFont, setDyslexiaFontState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.dyslexiaFont) === "true";
  });

  const [underlineLinks, setUnderlineLinksState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.underlineLinks) === "true";
  });

  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.reduceMotion);
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  const [focusGuide, setFocusGuideState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.focusGuide) === "true";
  });

  // Synchronize with DOM attributes on root <html>
  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    localStorage.setItem("theme", theme); // Keep backward compatibility with existing code

    root.setAttribute("data-contrast", highContrast ? "high" : "normal");
    localStorage.setItem(STORAGE_KEYS.highContrast, String(highContrast));

    root.setAttribute("data-font-size", fontSize);
    localStorage.setItem(STORAGE_KEYS.fontSize, fontSize);

    root.setAttribute("data-dyslexia", dyslexiaFont ? "true" : "false");
    localStorage.setItem(STORAGE_KEYS.dyslexiaFont, String(dyslexiaFont));

    root.setAttribute("data-underline-links", underlineLinks ? "true" : "false");
    localStorage.setItem(STORAGE_KEYS.underlineLinks, String(underlineLinks));

    root.setAttribute("data-reduce-motion", reduceMotion ? "true" : "false");
    localStorage.setItem(STORAGE_KEYS.reduceMotion, String(reduceMotion));

    root.setAttribute("data-focus-guide", focusGuide ? "true" : "false");
    localStorage.setItem(STORAGE_KEYS.focusGuide, String(focusGuide));
  }, [theme, highContrast, fontSize, dyslexiaFont, underlineLinks, reduceMotion, focusGuide]);

  const setTheme = (newTheme: ThemeMode) => setThemeState(newTheme);
  const toggleTheme = () => setThemeState((prev) => (prev === "dark" ? "light" : "dark"));

  const setHighContrast = (enabled: boolean) => setHighContrastState(enabled);
  const toggleHighContrast = () => setHighContrastState((prev) => !prev);

  const setFontSize = (size: FontSize) => setFontSizeState(size);
  const increaseFontSize = () => {
    setFontSizeState((prev) => {
      const idx = fontSizes.indexOf(prev);
      return idx < fontSizes.length - 1 ? fontSizes[idx + 1] : prev;
    });
  };
  const decreaseFontSize = () => {
    setFontSizeState((prev) => {
      const idx = fontSizes.indexOf(prev);
      return idx > 0 ? fontSizes[idx - 1] : prev;
    });
  };

  const setDyslexiaFont = (enabled: boolean) => setDyslexiaFontState(enabled);
  const toggleDyslexiaFont = () => setDyslexiaFontState((prev) => !prev);

  const setUnderlineLinks = (enabled: boolean) => setUnderlineLinksState(enabled);
  const toggleUnderlineLinks = () => setUnderlineLinksState((prev) => !prev);

  const setReduceMotion = (enabled: boolean) => setReduceMotionState(enabled);
  const toggleReduceMotion = () => setReduceMotionState((prev) => !prev);

  const setFocusGuide = (enabled: boolean) => setFocusGuideState(enabled);
  const toggleFocusGuide = () => setFocusGuideState((prev) => !prev);

  const resetToDefaults = () => {
    setThemeState(defaultSettings.theme);
    setHighContrastState(defaultSettings.highContrast);
    setFontSizeState(defaultSettings.fontSize);
    setDyslexiaFontState(defaultSettings.dyslexiaFont);
    setUnderlineLinksState(defaultSettings.underlineLinks);
    setReduceMotionState(defaultSettings.reduceMotion);
    setFocusGuideState(defaultSettings.focusGuide);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        highContrast,
        fontSize,
        dyslexiaFont,
        underlineLinks,
        reduceMotion,
        focusGuide,
        setTheme,
        toggleTheme,
        setHighContrast,
        toggleHighContrast,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        setDyslexiaFont,
        toggleDyslexiaFont,
        setUnderlineLinks,
        toggleUnderlineLinks,
        setReduceMotion,
        toggleReduceMotion,
        setFocusGuide,
        toggleFocusGuide,
        resetToDefaults,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
};
