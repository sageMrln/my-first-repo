/* ===========================================================================
   config.js  —  THE ONLY FILE YOU MUST EDIT FOR EACH CLIENT
   ---------------------------------------------------------------------------
   Change the values below and the whole site updates: header, hero, contact
   section, footer, the floating call button, every "call now" link, the page
   title, and the Google "local business" data (helps them rank in search).

   Tip: keep one clean copy of this whole `template/` folder, then duplicate it
   per client and only edit this file (+ swap the photos in /assets).
   ========================================================================= */

const siteConfig = {
  // --- Core business info --------------------------------------------------
  businessName: "Salon Nordlys",
  tagline: "Din lokale frisør i hjertet af Aarhus",
  // Short sentence shown under the big headline on the hero:
  heroSubtitle:
    "Klip, farve og styling med omhu — book din tid i dag, eller ring og hør nærmere.",

  // Google search description (1-2 sentences with town + service):
  metaDescription:
    "Salon Nordlys er din lokale frisør i Aarhus. Klip, farve og styling. Ring og book tid i dag.",

  // What kind of business is this? Used for Google's structured data.
  // Common options: "HairSalon", "Restaurant", "BeautySalon", "Plumber",
  // "Electrician", "Bakery", "AutoRepair", "Store", "LocalBusiness"
  businessType: "HairSalon",

  // --- Contact -------------------------------------------------------------
  phoneDisplay: "+45 12 34 56 78",   // shown to visitors
  phoneDial: "+4512345678",          // used in tel: links (no spaces)
  email: "kontakt@salonnordlys.dk",

  address: {
    street: "Mejlgade 50",
    postcode: "8000",
    city: "Aarhus C",
    country: "Danmark",
  },
  // Used for the embedded map (just the address is fine):
  mapsQuery: "Mejlgade 50, 8000 Aarhus C, Danmark",

  // --- Opening hours (use "" for closed days) ------------------------------
  hours: [
    { day: "Mandag",  open: "09:00", close: "17:30" },
    { day: "Tirsdag", open: "09:00", close: "17:30" },
    { day: "Onsdag",  open: "09:00", close: "17:30" },
    { day: "Torsdag", open: "09:00", close: "18:00" },
    { day: "Fredag",  open: "09:00", close: "18:00" },
    { day: "Lørdag",  open: "09:00", close: "14:00" },
    { day: "Søndag",  open: "",      close: "" },
  ],

  // --- Call-to-action buttons ---------------------------------------------
  primaryCtaText: "Ring og book tid",   // calls the phone number
  secondaryCtaText: "Se ydelser",       // scrolls to services

  // --- Social links (leave "" to hide) -------------------------------------
  social: {
    facebook: "",
    instagram: "",
  },

  // --- Contact form --------------------------------------------------------
  // Easiest option: create a free form at https://formspree.io and paste the
  // endpoint URL here. If left "", the form falls back to opening the
  // visitor's email app addressed to you.
  formEndpoint: "",

  // --- Legal / footer ------------------------------------------------------
  cvr: "",  // Danish CVR number, optional

  // --- Look & feel (brand colors) -----------------------------------------
  theme: {
    primary: "#1f6f5c",      // main brand color (buttons, accents)
    primaryDark: "#164f42",  // hover / darker shade
    accent: "#e7b75f",       // highlight color
    text: "#1d2421",         // body text
    bg: "#ffffff",           // page background
    bgAlt: "#f4f7f5",        // alternating section background
  },
};
