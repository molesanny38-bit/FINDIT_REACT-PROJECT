import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  Bell,
  Shield,
  Info,
  Check,
  Accessibility,
  Contrast,
  Type,
  Underline,
  Sparkles,
  Eye,
  RotateCcw,
} from "lucide-react";
import { useAccessibility, type FontSize } from "../context/AccessibilityContext";
import "./Settings.css";

function Settings() {
  const {
    theme,
    setTheme,
    highContrast,
    toggleHighContrast,
    fontSize,
    setFontSize,
    dyslexiaFont,
    toggleDyslexiaFont,
    underlineLinks,
    toggleUnderlineLinks,
    reduceMotion,
    toggleReduceMotion,
    focusGuide,
    toggleFocusGuide,
    resetToDefaults,
  } = useAccessibility();

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem("notificationsEnabled") !== "false";
  });

  // Save notification preference
  useEffect(() => {
    localStorage.setItem("notificationsEnabled", String(notificationsEnabled));
  }, [notificationsEnabled]);

  const fontOptions: { label: string; value: FontSize; sizeLabel: string }[] = [
    { label: "Default", value: "normal", sizeLabel: "100%" },
    { label: "Medium", value: "medium", sizeLabel: "115%" },
    { label: "Large", value: "large", sizeLabel: "130%" },
    { label: "Extra Large", value: "xlarge", sizeLabel: "145%" },
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div>
          <h1>Settings & Preferences</h1>
          <p>Customize your FindIt Campus visual experience and accessibility preferences.</p>
        </div>
        <SettingsIcon size={32} className="settings-header-icon" aria-hidden="true" />
      </div>

      {/* ACCESSIBILITY & PWD OPTIONS */}
      <section className="settings-card" aria-labelledby="a11y-heading">
        <div className="settings-section-header">
          <div className="settings-icon a11y-accent-icon" aria-hidden="true">
            <Accessibility size={24} />
          </div>
          <div>
            <h2 id="a11y-heading">Accessibility & PWD Settings</h2>
            <p>Inclusive accommodations for visual, cognitive, reading, and motor needs.</p>
          </div>
        </div>

        <div className="settings-a11y-grid">
          {/* High Contrast Mode */}
          <div className="settings-toggle-row">
            <div className="toggle-info">
              <div className="toggle-title-wrap">
                <Contrast size={18} className="toggle-icon" aria-hidden="true" />
                <strong>High Contrast Mode (WCAG AAA)</strong>
              </div>
              <p>Enhances borders, text contrast, and eliminates subtle grays for high visibility.</p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={highContrast}
                onChange={toggleHighContrast}
                aria-label="Toggle High Contrast Mode"
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          {/* Dyslexia-Friendly Font */}
          <div className="settings-toggle-row">
            <div className="toggle-info">
              <div className="toggle-title-wrap">
                <Type size={18} className="toggle-icon" aria-hidden="true" />
                <strong>Dyslexia-Friendly Typography</strong>
              </div>
              <p>Applies high-legibility letterforms with enhanced letter, word, and line spacing.</p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={dyslexiaFont}
                onChange={toggleDyslexiaFont}
                aria-label="Toggle Dyslexia-Friendly Typography"
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          {/* Underline Links */}
          <div className="settings-toggle-row">
            <div className="toggle-info">
              <div className="toggle-title-wrap">
                <Underline size={18} className="toggle-icon" aria-hidden="true" />
                <strong>Underline Interactive Links</strong>
              </div>
              <p>Ensures links and navigation items are clearly recognizable without relying solely on color.</p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={underlineLinks}
                onChange={toggleUnderlineLinks}
                aria-label="Toggle Underline Interactive Links"
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          {/* Focus Guide */}
          <div className="settings-toggle-row">
            <div className="toggle-info">
              <div className="toggle-title-wrap">
                <Eye size={18} className="toggle-icon" aria-hidden="true" />
                <strong>Keyboard Focus Guide</strong>
              </div>
              <p>Provides prominent, high-contrast focus rings for keyboard Tab and switch navigation.</p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={focusGuide}
                onChange={toggleFocusGuide}
                aria-label="Toggle Keyboard Focus Guide"
              />
              <span className="settings-slider"></span>
            </label>
          </div>

          {/* Reduced Motion */}
          <div className="settings-toggle-row">
            <div className="toggle-info">
              <div className="toggle-title-wrap">
                <Sparkles size={18} className="toggle-icon" aria-hidden="true" />
                <strong>Reduce Motion & Animations</strong>
              </div>
              <p>Stops animated transitions to assist users with vestibular disorders or motion sensitivity.</p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={toggleReduceMotion}
                aria-label="Toggle Reduced Motion"
              />
              <span className="settings-slider"></span>
            </label>
          </div>
        </div>

        {/* Text Size Stepper */}
        <div className="settings-sub-section">
          <strong>Text Size Scaling</strong>
          <p className="settings-sub-desc">Adjust the base text scaling across all pages.</p>
          <div className="theme-options font-size-options" role="group" aria-label="Text sizing">
            {fontOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`theme-option font-size-option ${
                  fontSize === opt.value ? "selected" : ""
                }`}
                onClick={() => setFontSize(opt.value)}
                aria-pressed={fontSize === opt.value}
              >
                <Type size={22} aria-hidden="true" />
                <span>{opt.label}</span>
                <small>{opt.sizeLabel}</small>
                {fontSize === opt.value && <Check className="theme-check" size={18} />}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Accessibility */}
        <div className="settings-reset-row">
          <button
            type="button"
            className="settings-reset-button"
            onClick={resetToDefaults}
          >
            <RotateCcw size={16} aria-hidden="true" />
            <span>Reset All Accessibility Settings to Default</span>
          </button>
        </div>
      </section>

      {/* APPEARANCE SETTINGS */}
      <section className="settings-card" aria-labelledby="appearance-heading">
        <div className="settings-section-header">
          <div className="settings-icon" aria-hidden="true">
            <Sun size={24} />
          </div>
          <div>
            <h2 id="appearance-heading">Appearance</h2>
            <p>Choose your preferred interface theme.</p>
          </div>
        </div>

        <div className="theme-options">
          <button
            type="button"
            className={`theme-option ${theme === "light" ? "selected" : ""}`}
            onClick={() => setTheme("light")}
            aria-pressed={theme === "light"}
          >
            <Sun size={28} aria-hidden="true" />
            <span>Light Mode</span>
            {theme === "light" && <Check className="theme-check" size={20} />}
          </button>

          <button
            type="button"
            className={`theme-option ${theme === "dark" ? "selected" : ""}`}
            onClick={() => setTheme("dark")}
            aria-pressed={theme === "dark"}
          >
            <Moon size={28} aria-hidden="true" />
            <span>Dark Mode</span>
            {theme === "dark" && <Check className="theme-check" size={20} />}
          </button>
        </div>
      </section>

      {/* NOTIFICATION PREFERENCES */}
      <section className="settings-card" aria-labelledby="notifications-heading">
        <div className="settings-section-header">
          <div className="settings-icon" aria-hidden="true">
            <Bell size={24} />
          </div>
          <div>
            <h2 id="notifications-heading">Notification Preferences</h2>
            <p>Manage your notification alerts and badges.</p>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div className="toggle-info">
            <strong>Enable Notification Badges</strong>
            <p>Display unread count badges in navigation bars and headers.</p>
          </div>
          <label className="settings-switch">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              aria-label="Enable Notification Badges"
            />
            <span className="settings-slider"></span>
          </label>
        </div>
      </section>

      {/* SECURITY */}
      <section className="settings-card" aria-labelledby="security-heading">
        <div className="settings-section-header">
          <div className="settings-icon" aria-hidden="true">
            <Shield size={24} />
          </div>
          <div>
            <h2 id="security-heading">Account Security</h2>
            <p>Manage your login credentials and personal information.</p>
          </div>
        </div>

        <div className="settings-information">
          <p>
            You can modify your password, email address, and profile details anytime in the{" "}
            <strong>My Profile</strong> section.
          </p>
        </div>
      </section>

      {/* SYSTEM INFORMATION */}
      <section className="settings-card" aria-labelledby="system-info-heading">
        <div className="settings-section-header">
          <div className="settings-icon" aria-hidden="true">
            <Info size={24} />
          </div>
          <div>
            <h2 id="system-info-heading">System Information</h2>
            <p>FindIt Campus system version and accessibility details.</p>
          </div>
        </div>

        <div className="settings-information">
          <div className="system-info-row">
            <span>Platform Name</span>
            <strong>FindIt Campus</strong>
          </div>
          <div className="system-info-row">
            <span>Accessibility Standard</span>
            <strong>WCAG 2.1 AA / AAA High Contrast Ready</strong>
          </div>
          <div className="system-info-row">
            <span>Responsive Layout</span>
            <strong>Active (Mobile, Tablet & Desktop)</strong>
          </div>
          <div className="system-info-row">
            <span>Current Theme</span>
            <strong>{theme === "dark" ? "Dark Mode" : "Light Mode"}</strong>
          </div>
        </div>
      </section>

      <div className="settings-footer">
        <Monitor size={16} aria-hidden="true" />
        <span>FindIt Campus - Accessibility & User Preferences</span>
      </div>
    </div>
  );
}

export default Settings;
