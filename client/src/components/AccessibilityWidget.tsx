import React, { useState, useEffect, useRef } from "react";
import {
  Accessibility,
  Contrast,
  Type,
  Underline,
  Sparkles,
  Eye,
  RotateCcw,
  X,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { useAccessibility, type FontSize } from "../context/AccessibilityContext";
import "./AccessibilityWidget.css";

interface AccessibilityWidgetProps {
  variant?: "floating" | "compact";
}

export const AccessibilityWidget: React.FC<AccessibilityWidgetProps> = ({ variant = "floating" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const {
    theme,
    toggleTheme,
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

  // Close on Escape key press & handle focus trapping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Optional: focus first interactive element in modal
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        'button, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  const fontOptions: { label: string; value: FontSize; sizeLabel: string }[] = [
    { label: "Default", value: "normal", sizeLabel: "100%" },
    { label: "Medium", value: "medium", sizeLabel: "115%" },
    { label: "Large", value: "large", sizeLabel: "130%" },
    { label: "Extra Large", value: "xlarge", sizeLabel: "145%" },
  ];

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        className={`a11y-trigger-btn ${variant === "compact" ? "compact" : "floating"}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Accessibility and PWD Options"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Accessibility & PWD Settings"
      >
        <Accessibility className="a11y-icon" size={24} aria-hidden="true" />
        <span className="a11y-label">Accessibility</span>
      </button>

      {/* Accessibility Dialog Modal */}
      {isOpen && (
        <div className="a11y-modal-backdrop" role="presentation">
          <div
            ref={modalRef}
            className="a11y-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-dialog-title"
          >
            {/* Header */}
            <div className="a11y-modal-header">
              <div className="a11y-header-title">
                <Accessibility size={22} className="a11y-header-icon" aria-hidden="true" />
                <h2 id="a11y-dialog-title">Accessibility & PWD Settings</h2>
              </div>
              <button
                type="button"
                className="a11y-close-btn"
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close accessibility options"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <p className="a11y-modal-subtitle">
              Adjust visual, typography, and motor settings to best suit your needs. Preferences are saved automatically.
            </p>

            <div className="a11y-modal-body">
              {/* Theme & High Contrast Section */}
              <section className="a11y-section" aria-labelledby="a11y-sec-visual">
                <h3 id="a11y-sec-visual">Display & Contrast</h3>
                <div className="a11y-cards-row">
                  {/* Theme Mode */}
                  <button
                    type="button"
                    className={`a11y-toggle-card ${theme === "dark" ? "active" : ""}`}
                    onClick={toggleTheme}
                    aria-pressed={theme === "dark"}
                  >
                    <div className="a11y-card-icon">
                      {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
                    </div>
                    <div className="a11y-card-text">
                      <strong>{theme === "dark" ? "Dark Mode" : "Light Mode"}</strong>
                      <span>Toggle theme</span>
                    </div>
                    {theme === "dark" && <Check size={16} className="a11y-check" />}
                  </button>

                  {/* High Contrast Mode */}
                  <button
                    type="button"
                    className={`a11y-toggle-card ${highContrast ? "active" : ""}`}
                    onClick={toggleHighContrast}
                    aria-pressed={highContrast}
                  >
                    <div className="a11y-card-icon">
                      <Contrast size={20} />
                    </div>
                    <div className="a11y-card-text">
                      <strong>High Contrast</strong>
                      <span>WCAG AAA (7:1)</span>
                    </div>
                    {highContrast && <Check size={16} className="a11y-check" />}
                  </button>
                </div>
              </section>

              {/* Text Sizing Section */}
              <section className="a11y-section" aria-labelledby="a11y-sec-text">
                <div className="a11y-section-title-wrap">
                  <h3 id="a11y-sec-text">Text Size</h3>
                  <span className="a11y-current-val">
                    {fontOptions.find((o) => o.value === fontSize)?.sizeLabel}
                  </span>
                </div>
                <div className="a11y-font-grid" role="group" aria-label="Text sizing options">
                  {fontOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`a11y-font-btn ${fontSize === opt.value ? "selected" : ""}`}
                      onClick={() => setFontSize(opt.value)}
                      aria-pressed={fontSize === opt.value}
                    >
                      <Type size={16} aria-hidden="true" />
                      <span>{opt.label}</span>
                      <small>{opt.sizeLabel}</small>
                    </button>
                  ))}
                </div>
              </section>

              {/* Reading & Typography Section */}
              <section className="a11y-section" aria-labelledby="a11y-sec-readability">
                <h3 id="a11y-sec-readability">Reading & Typography</h3>

                {/* Dyslexia-friendly Font */}
                <div className="a11y-row-item">
                  <div className="a11y-row-label">
                    <Type size={18} aria-hidden="true" />
                    <div>
                      <strong>Dyslexia-Friendly Font</strong>
                      <p>Enhances character spacing, word spacing, and line height for easier reading</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={dyslexiaFont}
                    className={`a11y-switch-btn ${dyslexiaFont ? "on" : "off"}`}
                    onClick={toggleDyslexiaFont}
                    aria-label="Toggle dyslexia-friendly font"
                  >
                    <span className="a11y-switch-knob" />
                  </button>
                </div>

                {/* Underline Links */}
                <div className="a11y-row-item">
                  <div className="a11y-row-label">
                    <Underline size={18} aria-hidden="true" />
                    <div>
                      <strong>Underline Interactive Links</strong>
                      <p>Clearly highlights all clickable links and navigation items</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={underlineLinks}
                    className={`a11y-switch-btn ${underlineLinks ? "on" : "off"}`}
                    onClick={toggleUnderlineLinks}
                    aria-label="Toggle underline interactive links"
                  >
                    <span className="a11y-switch-knob" />
                  </button>
                </div>
              </section>

              {/* Motor & Visual Navigation Section */}
              <section className="a11y-section" aria-labelledby="a11y-sec-motor">
                <h3 id="a11y-sec-motor">Motor & Visual Navigation</h3>

                {/* Focus Guide */}
                <div className="a11y-row-item">
                  <div className="a11y-row-label">
                    <Eye size={18} aria-hidden="true" />
                    <div>
                      <strong>Focus Guide (Keyboard Highlighting)</strong>
                      <p>High-visibility borders for keyboard Tab and switch navigation</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={focusGuide}
                    className={`a11y-switch-btn ${focusGuide ? "on" : "off"}`}
                    onClick={toggleFocusGuide}
                    aria-label="Toggle keyboard focus guide"
                  >
                    <span className="a11y-switch-knob" />
                  </button>
                </div>

                {/* Reduced Motion */}
                <div className="a11y-row-item">
                  <div className="a11y-row-label">
                    <Sparkles size={18} aria-hidden="true" />
                    <div>
                      <strong>Reduce Motion & Animations</strong>
                      <p>Disables animated transitions to prevent dizziness and vestibular discomfort</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={reduceMotion}
                    className={`a11y-switch-btn ${reduceMotion ? "on" : "off"}`}
                    onClick={toggleReduceMotion}
                    aria-label="Toggle reduced motion"
                  >
                    <span className="a11y-switch-knob" />
                  </button>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="a11y-modal-footer">
              <button
                type="button"
                className="a11y-reset-btn"
                onClick={resetToDefaults}
              >
                <RotateCcw size={16} aria-hidden="true" />
                Reset All to Defaults
              </button>
              <button
                type="button"
                className="a11y-done-btn"
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
