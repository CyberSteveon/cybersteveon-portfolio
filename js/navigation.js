export function initializeNavigation() {
    // Workers' HTML handling can serve /about instead of /about.html.
    const pageName = (path) => path.replace(/\/$/, "").split("/").pop().replace(/\.html$/, "") || "index";
    const current = pageName(window.location.pathname);
    document.querySelectorAll(".nav-list a").forEach((link) => {
        const active = pageName(new URL(link.getAttribute("href"), window.location.href).pathname) === current;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
    });
}
