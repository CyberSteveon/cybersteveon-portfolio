export function initializeTheme() {

    const themeButton = document.getElementById("theme-toggle");

    if (!themeButton) {
        return;
    }

    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        themeButton.textContent = "Light Mode";
    }

    themeButton.addEventListener("click", () => {

        const darkModeEnabled = document.body.classList.toggle("dark-mode");

        if (darkModeEnabled) {
            themeButton.textContent = "Light Mode";
            localStorage.setItem("theme", "dark");
        } else {
            themeButton.textContent = "Dark Mode";
            localStorage.setItem("theme", "light");
        }

    });

}