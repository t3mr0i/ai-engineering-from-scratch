/**
 * UI-chrome translation dictionary — DE/EN. Lesson content stays English;
 * this only covers nav, buttons, labels and short headings tagged with
 * data-i18n in the HTML. Loaded before lang.js on every subpage.
 */
window.SITE_I18N = {
  // shared header / footer
  nav_courses: { en: "Courses", de: "Kurse" },
  nav_curriculum: { en: "Curriculum", de: "Lehrplan" },
  nav_overview: { en: "Overview", de: "Übersicht" },
  back_to_courses: { en: "Back to courses", de: "Zurück zu den Kursen" },
  badges_link_title: { en: "Your badges", de: "Deine Badges" },
  lang_toggle_title: { en: "Switch language", de: "Sprache wechseln" },
  skip_content: { en: "Skip to content", de: "Zum Inhalt springen" },
  skip_catalog: { en: "Skip to course catalog", de: "Zum Kurskatalog springen" },
  footer_tagline: { en: "LHIND AI Learning Catalog · open source · free forever.", de: "LHIND AI Learning Catalog · Open Source · für immer kostenlos." },
  footer_home: { en: "Home", de: "Startseite" },
  footer_glossary: { en: "Glossary", de: "Glossar" },
  footer_notes: { en: "My Merkzettel", de: "Meine Merkzettel" },
  footer_report: { en: "Report / Suggest", de: "Melden / Vorschlagen" },
  footer_about: { en: "About", de: "Über uns" },
  footer_report_short: { en: "Report", de: "Melden" },

  // index.html — hero title + resume button are rendered dynamically
  // (time-of-day greeting + last lesson name) in index.html's inline script.

  // catalog.html
  catalog_title: { en: "Lesson Catalog", de: "Lektionskatalog" },
  catalog_sub: { en: "Every lesson backing a Technology Consulting course. Search, filter, sort.", de: "Jede Lektion hinter einem Technology-Consulting-Kurs. Suchen, filtern, sortieren." },
  catalog_primer_link: { en: "Interactive LLM Primer — ~75 min, 20 mini-games →", de: "Interaktiver LLM-Primer — ~75 Min, 20 Minispiele →" },
  catalog_search_ph: { en: "Search lessons...", de: "Lektionen suchen..." },
  catalog_all_phases: { en: "All Phases", de: "Alle Phasen" },
  catalog_all_status: { en: "All Status", de: "Alle Status" },
  catalog_complete: { en: "Complete", de: "Abgeschlossen" },
  catalog_planned: { en: "Planned", de: "Geplant" },
  th_phase: { en: "Phase", de: "Phase" },
  th_lesson: { en: "Lesson", de: "Lektion" },
  th_type: { en: "Type", de: "Typ" },
  th_lang: { en: "Language", de: "Sprache" },
  th_status: { en: "Status", de: "Status" },

  // glossary.html
  glossary_title: { en: "AI Glossary", de: "KI-Glossar" },
  glossary_search_ph: { en: "Search terms...", de: "Begriffe suchen..." },
  nav_glossary: { en: "Glossary", de: "Glossar" },
  sort_label: { en: "Sort by", de: "Sortieren nach" },
  hide_underline: { en: "Hide term underlines in documents", de: "Begriffe-Unterstreichung in Dokumenten ausblenden" },

  // about.html (headings only — body paragraphs stay English)
  about_eyebrow: { en: "About", de: "Über uns" },
  about_title: { en: "About the LHIND AI Learning Catalog", de: "Über den LHIND AI Learning Catalog" },
  about_h2_why: { en: "Why it exists", de: "Warum es das gibt" },
  about_h2_how: { en: "How the lessons are made", de: "Wie die Lektionen entstehen" },
  about_h2_who: { en: "Who builds it", de: "Wer es baut" },
  about_h2_involved: { en: "Get involved", de: "Mitmachen" },

  // assessment.html
  assess_title: { en: "AI-Literacy Self-Assessment", de: "KI-Kompetenz-Selbsteinschätzung" },
  assess_role_label: { en: "Your role", de: "Deine Rolle" },
  btn_start_assessment: { en: "Start assessment →", de: "Assessment starten →" },
  btn_back_role: { en: "← Role", de: "← Rolle" },
  btn_see_path: { en: "See my path →", de: "Meinen Lernpfad ansehen →" },
  assess_your_path: { en: "Your learning path", de: "Dein Lernpfad" },
  btn_adjust_ratings: { en: "← Adjust ratings", de: "← Bewertungen anpassen" },
  btn_start_over: { en: "Start over", de: "Neu starten" },

  // prereqs.html
  prereqs_title: { en: "Roadmap", de: "Roadmap" },
  prereqs_sub: { en: "Click any phase to see its prerequisites and what it unlocks downstream.", de: "Klicke auf eine Phase, um ihre Voraussetzungen und Folgephasen zu sehen." },
  legend_complete: { en: "Complete", de: "Abgeschlossen" },
  legend_progress: { en: "In Progress", de: "In Bearbeitung" },
  legend_planned: { en: "Planned", de: "Geplant" },
  btn_clear_selection: { en: "&#10005; Clear selection", de: "&#10005; Auswahl löschen" },
  scroll_hint: { en: "&#8596; Scroll to explore the full graph", de: "&#8596; Scrollen, um den ganzen Graph zu erkunden" },

  // badges.html (source page was German-only — English added here)
  badges_title: { en: "Your achievements", de: "Deine Erfolge" },
  badges_sub: { en: "Collect badges as you work through the curriculum — fully local in your browser.", de: "Sammle Badges, während du das Curriculum durcharbeitest — komplett lokal in deinem Browser." },
  badges_reset_btn: { en: "Reset progress &amp; badges", de: "Fortschritt &amp; Badges zurücksetzen" },
  dialog_close_aria: { en: "Close", de: "Schließen" },

  // badges.html — reset-progress confirm()
  badges_reset_confirm: { en: "Reset all learning progress and badges? This cannot be undone.", de: "Gesamten Lern-Fortschritt und alle Badges zurücksetzen? Das kann nicht rückgängig gemacht werden." }
};
