export function initializeTheme() {
  const button = document.getElementById("theme-toggle");
  if (!button) return;
  const label = document.getElementById("theme-label");
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  let preference;
  try {
    preference = localStorage.getItem("theme");
  } catch {
    /* Optional storage. */
  }
  const explicit = () => preference === "dark" || preference === "light";
  const apply = (dark) => {
    root.classList.toggle("dark-mode", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    if (label) label.textContent = dark ? "Light mode" : "Dark mode";
    button.setAttribute(
      "aria-label",
      dark ? "Switch to light mode" : "Switch to dark mode",
    );
    button.setAttribute("aria-pressed", String(dark));
  };
  apply(explicit() ? preference === "dark" : media.matches);
  button.addEventListener("click", () => {
    const dark = !root.classList.contains("dark-mode");
    preference = dark ? "dark" : "light";
    apply(dark);
    try {
      localStorage.setItem("theme", preference);
    } catch {
      /* Toggle still works. */
    }
  });
  media.addEventListener("change", (event) => {
    if (!explicit()) apply(event.matches);
  });
}
