/* ===========================================================================
   app.js  —  applies config.js to the page. You don't need to edit this.
   ========================================================================= */

(function () {
  "use strict";
  const cfg = window.siteConfig || {};
  const addressFull = cfg.address
    ? `${cfg.address.street}, ${cfg.address.postcode} ${cfg.address.city}`
    : "";

  // ---- Helper: derived text values ----------------------------------------
  const values = {
    businessName: cfg.businessName || "",
    tagline: cfg.tagline || "",
    heroSubtitle: cfg.heroSubtitle || "",
    phoneDisplay: cfg.phoneDisplay || "",
    email: cfg.email || "",
    primaryCtaText: cfg.primaryCtaText || "Ring nu",
    secondaryCtaText: cfg.secondaryCtaText || "",
    addressFull: addressFull,
  };

  // ---- Fill text placeholders: <span data-cfg="phoneDisplay"> --------------
  document.querySelectorAll("[data-cfg]").forEach((el) => {
    const key = el.getAttribute("data-cfg");
    if (key in values && values[key]) el.textContent = values[key];
  });

  // ---- Wire tel: and mailto: links ----------------------------------------
  if (cfg.phoneDial) {
    document.querySelectorAll("[data-tel]").forEach((a) => {
      a.setAttribute("href", "tel:" + cfg.phoneDial);
    });
  }
  if (cfg.email) {
    document.querySelectorAll("[data-email]").forEach((a) => {
      a.setAttribute("href", "mailto:" + cfg.email);
    });
  }

  // ---- Page title / lang already in HTML; update <title> & meta name -------
  if (cfg.businessName) {
    const city = cfg.address ? cfg.address.city : "";
    document.title = `${cfg.businessName}${city ? " – " + city : ""}`;
  }

  // ---- Apply theme colors -------------------------------------------------
  if (cfg.theme) {
    const root = document.documentElement.style;
    const map = {
      primary: "--primary",
      primaryDark: "--primary-dark",
      accent: "--accent",
      text: "--text",
      bg: "--bg",
      bgAlt: "--bg-alt",
    };
    Object.keys(map).forEach((k) => {
      if (cfg.theme[k]) root.setProperty(map[k], cfg.theme[k]);
    });
  }

  // ---- Opening hours table ------------------------------------------------
  const hoursTable = document.getElementById("hoursTable");
  if (hoursTable && Array.isArray(cfg.hours)) {
    hoursTable.innerHTML = cfg.hours
      .map((h) => {
        const val = h.open && h.close ? `${h.open}–${h.close}` : "Lukket";
        return `<tr><td>${h.day}</td><td>${val}</td></tr>`;
      })
      .join("");
  }

  // ---- Map embed (no API key needed) --------------------------------------
  const mapFrame = document.getElementById("mapFrame");
  if (mapFrame && (cfg.mapsQuery || addressFull)) {
    const q = encodeURIComponent(cfg.mapsQuery || addressFull);
    mapFrame.src = `https://www.google.com/maps?q=${q}&output=embed`;
  }

  // ---- Footer: social, CVR, year ------------------------------------------
  const social = document.getElementById("footerSocial");
  if (social && cfg.social) {
    const links = [];
    if (cfg.social.facebook) links.push(`<a href="${cfg.social.facebook}" target="_blank" rel="noopener">Facebook</a>`);
    if (cfg.social.instagram) links.push(`<a href="${cfg.social.instagram}" target="_blank" rel="noopener">Instagram</a>`);
    social.innerHTML = links.join("");
  }
  const cvrLine = document.getElementById("cvrLine");
  if (cvrLine && cfg.cvr) cvrLine.textContent = "CVR: " + cfg.cvr;
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ---- Structured data for Google (local business) ------------------------
  try {
    const ld = {
      "@context": "https://schema.org",
      "@type": cfg.businessType || "LocalBusiness",
      name: cfg.businessName,
      telephone: cfg.phoneDial,
      email: cfg.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: cfg.address && cfg.address.street,
        postalCode: cfg.address && cfg.address.postcode,
        addressLocality: cfg.address && cfg.address.city,
        addressCountry: cfg.address && cfg.address.country,
      },
      openingHours: (cfg.hours || [])
        .filter((h) => h.open && h.close)
        .map((h) => `${h.day.slice(0, 2)} ${h.open}-${h.close}`),
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
  } catch (e) { /* non-critical */ }

  // ---- Mobile nav toggle --------------------------------------------------
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => nav.classList.remove("open"))
    );
  }

  // ---- Contact form -------------------------------------------------------
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());

      // Option A: a configured form endpoint (e.g. Formspree)
      if (cfg.formEndpoint) {
        status.textContent = "Sender…";
        try {
          const res = await fetch(cfg.formEndpoint, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: new FormData(form),
          });
          if (res.ok) {
            form.reset();
            status.textContent = "Tak! Vi vender tilbage hurtigst muligt.";
          } else {
            status.textContent = "Noget gik galt — ring til os i stedet.";
          }
        } catch {
          status.textContent = "Noget gik galt — ring til os i stedet.";
        }
        return;
      }

      // Option B: fallback to the visitor's email app
      const subject = encodeURIComponent(`Henvendelse via hjemmesiden — ${data.name || ""}`);
      const body = encodeURIComponent(
        `Navn: ${data.name || ""}\nKontakt: ${data.contact || ""}\n\n${data.message || ""}`
      );
      window.location.href = `mailto:${cfg.email}?subject=${subject}&body=${body}`;
      status.textContent = "Åbner din e-mail…";
    });
  }
})();
