function loadTurnstile() {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const timer = setTimeout(() => reject(new Error("Verification timed out")), 15000);
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.onload = () => { clearTimeout(timer); resolve(window.turnstile); };
        script.onerror = () => { clearTimeout(timer); reject(new Error("Verification unavailable")); };
        document.head.append(script);
    });
}

export async function initializeContact() {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("form-status");
    if (!form || !status) return;
    const button = form.querySelector('button[type="submit"]');
    let busy = false;
    let token = "";
    let widget;
    let turnstile;
    const updateButton = () => { button.disabled = busy || !token; };
    const clearToken = () => { token = ""; updateButton(); };
    updateButton();

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (busy || !form.reportValidity()) return;
        if (!token) { status.textContent = "Please complete the spam check."; return; }
        busy = true;
        updateButton();
        form.setAttribute("aria-busy", "true");
        status.textContent = "Submitting your message…";
        const data = Object.fromEntries(new FormData(form));
        try {
            const response = await fetch("/api/contact", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, token }), signal: AbortSignal.timeout(25000)
            });
            const result = await response.json();
            if (!response.ok || result.ok !== true) {
                status.textContent = result.message || "Unable to submit your message. Please try again.";
                return;
            }
            status.textContent = result.message;
            if (result.code === "accepted") form.reset();
        } catch {
            status.textContent = "Unable to confirm submission. Check your connection and try again; your message is still here.";
        } finally {
            busy = false;
            form.setAttribute("aria-busy", "false");
            clearToken();
            // Tokens are single-use, including after provider errors. Keep fields for retries.
            turnstile.reset(widget);
        }
    });

    try {
        status.textContent = "Loading spam protection…";
        const response = await fetch("/api/contact/config", { signal: AbortSignal.timeout(10000) });
        const config = await response.json();
        if (!response.ok || !config.siteKey) throw new Error("Contact unavailable");
        turnstile = await loadTurnstile();
        widget = turnstile.render("#contact-verification", {
            sitekey: config.siteKey, action: "contact", theme: "auto", size: "compact",
            callback: (value) => { token = value; updateButton(); },
            "expired-callback": clearToken,
            "error-callback": () => {
                clearToken();
                status.textContent = "Spam protection could not load. Refresh the page or email contact@cybersteveon.dev.";
            }
        });
        status.textContent = config.dryRun ? "Local test mode: no email will be sent." : "";
    } catch {
        status.textContent = "The form is temporarily unavailable. You can email contact@cybersteveon.dev instead.";
    }
}
