export function initializeTheme() {
    const button = document.getElementById("theme-toggle");
    if (!button) return;
    let savedTheme;
    try { savedTheme = localStorage.getItem("theme"); } catch { /* Storage may be blocked. */ }
    if (savedTheme === "dark") document.body.classList.add("dark-mode");

    function updateButton() {
        const dark = document.body.classList.contains("dark-mode");
        button.textContent = dark ? "Light Mode" : "Dark Mode";
        button.setAttribute("aria-pressed", String(dark));
    }
    updateButton();
    button.addEventListener("click", () => {
        const dark = document.body.classList.toggle("dark-mode");
        updateButton();
        try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch { /* Toggle still works. */ }
    });
}
