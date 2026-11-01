import { initializeNavigation } from "./navigation.js";
import { initializeTheme } from "./theme.js";

initializeTheme();
initializeNavigation();

// A contact-module load failure must not disable navigation or the theme toggle.
if (document.getElementById("contact-form")) {
    import("./contact.js").then(({ initializeContact }) => initializeContact()).catch(() => {
        const status = document.getElementById("form-status");
        if (status) status.textContent = "The form is unavailable. Please email contact@cybersteveon.dev.";
    });
}
