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

  // shared hybrid search / command palette
  global_search_label: { en: "Search learning catalog", de: "Lernkatalog durchsuchen" },
  global_search_short: { en: "Search", de: "Suche" },
  global_search_dialog: { en: "Search lessons and glossary", de: "Lektionen und Glossar durchsuchen" },
  global_search_placeholder: { en: "Try “data protection”, “test agents”, or “RAG”…", de: "Zum Beispiel „Datenschutz“, „Agenten testen“ oder „RAG“…" },
  global_search_results: { en: "Search results", de: "Suchergebnisse" },
  global_search_navigate: { en: "navigate", de: "navigieren" },
  global_search_open: { en: "open", de: "öffnen" },
  global_search_close: { en: "close", de: "schließen" },
  global_search_intro: { en: "Search {lessons} lessons, {artifacts} reusable outputs, and glossary terms", de: "Durchsuche {lessons} Lektionen, {artifacts} wiederverwendbare Ergebnisse und Glossarbegriffe" },
  global_search_empty: { en: "No results for", de: "Keine Treffer für" },
  global_search_try: { en: "Try instead:", de: "Versuche stattdessen:" },
  global_search_empty_hint: { en: "Try a broader German or English term.", de: "Versuche einen allgemeineren deutschen oder englischen Begriff." },

  // index.html — hero title + resume button are rendered dynamically
  // (time-of-day greeting + last lesson name) in index.html's inline script.

  // catalog.html
  catalog_title: { en: "Lesson Catalog", de: "Lektionskatalog" },
  catalog_sub: { en: "Every lesson backing a Technology Consulting course. Search, filter, sort.", de: "Jede Lektion hinter einem Technology-Consulting-Kurs. Suchen, filtern, sortieren." },
  catalog_primer_link: { en: "Interactive LLM Primer — ~75 min, 20 mini-games →", de: "Interaktiver LLM-Primer — ~75 Min, 20 Minispiele →" },
  catalog_search_ph: { en: "Search lessons...", de: "Lektionen suchen..." },
  catalog_search_label: { en: "Search the curriculum", de: "Lehrplan durchsuchen" },
  catalog_topic_label: { en: "Topic", de: "Thema" },
  catalog_count: { en: "{count} of {total} lessons", de: "{count} von {total} Lektionen" },
  catalog_count_topic: { en: "{count} of {total} lessons in {topic}", de: "{count} von {total} Lektionen in {topic}" },
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
  badges_reset_confirm: { en: "Reset all learning progress and badges? This cannot be undone.", de: "Gesamten Lern-Fortschritt und alle Badges zurücksetzen? Das kann nicht rückgängig gemacht werden." },

  // lrn/lrn.js — level select options
  lrn_level_basic: { en: "Basic", de: "Basis" },
  lrn_level_foundation: { en: "Foundation", de: "Grundlagen" },
  lrn_level_practitioner: { en: "Practitioner", de: "Praktiker" },
  lrn_level_advanced: { en: "Advanced", de: "Fortgeschritten" },
  lrn_level_lead: { en: "Lead / Principal", de: "Lead / Principal" },

  // lrn/lrn.js — status filter tabs
  lrn_status_recommended: { en: "Recommended", de: "Empfohlen" },
  lrn_status_optional: { en: "Optional", de: "Optional" },
  lrn_status_started: { en: "Started", de: "Begonnen" },
  lrn_status_completed: { en: "Completed", de: "Abgeschlossen" },
  lrn_status_all: { en: "All", de: "Alle" },

  // lrn/lrn.js — structured topic scope (labels come from LrnData ids)
  topic_filter_label: { en: "Browse by topic", de: "Nach Thema stöbern" },
  topic_filter_hint: { en: "Choose one topic to scope results; text search stays inside it.", de: "Wähle ein Thema für die Ergebnisse; die Textsuche bleibt darin." },
  topic_filter_all: { en: "All topics", de: "Alle Themen" },
  topic_filter_clear: { en: "Clear topic", de: "Thema löschen" },
  topic_foundation: { en: "Foundations", de: "Grundlagen" },
  topic_foundation_hint: { en: "Core AI concepts and literacy", de: "KI-Grundlagen und Verständnis" },
  topic_productivity: { en: "Productivity", de: "Produktivität" },
  topic_productivity_hint: { en: "Prompts, assistants, and office work", de: "Prompts, Assistenten und Büroarbeit" },
  topic_consulting: { en: "Consulting", de: "Consulting" },
  topic_consulting_hint: { en: "Use cases, requirements, and value", de: "Use Cases, Anforderungen und Nutzen" },
  topic_engineering: { en: "Engineering", de: "Engineering" },
  topic_engineering_hint: { en: "Agents, architecture, and QA", de: "Agenten, Architektur und Qualitätssicherung" },
  topic_governance: { en: "Governance", de: "Governance" },
  topic_governance_hint: { en: "GDPR, responsible AI, and controls", de: "DSGVO, verantwortungsvolle KI und Kontrollen" },
  topic_leadership: { en: "Leadership", de: "Leadership" },
  topic_leadership_hint: { en: "Change, workforce, and strategy", de: "Veränderung, Workforce und Strategie" },
  profile_label: { en: "Profile", de: "Profil" },
  level_label: { en: "Level", de: "Level" },
  selector_group_label: { en: "Choose profile and level", de: "Profil und Level auswählen" },
  interests_label: { en: "Interests", de: "Interessen" },
  profile_select_label: { en: "Choose profile", de: "Profil auswählen" },
  level_select_label: { en: "Choose level", de: "Level auswählen" },
  course_filters_label: { en: "Course filters", de: "Kursfilter" },
  course_status_filters_label: { en: "Filter course status", de: "Kursstatus filtern" },
  reset_filters_label: { en: "Reset all filters and selections", de: "Alle Filter und Auswahl zurücksetzen" },
  interests_hint: { en: "Choose several interests to shape which courses are recommended.", de: "Wähle mehrere Interessen, um die empfohlenen Kurse zu gewichten." },
  reset_btn: { en: "Reset", de: "Zurücksetzen" },

  // lrn/lrn.js — hybrid course search
  lrn_search_label: { en: "Search courses", de: "Kurse durchsuchen" },
  lrn_search_placeholder: { en: "Try “data protection”, “test agents”, or “RAG”…", de: "Zum Beispiel „Datenschutz“, „Agenten testen“ oder „RAG“…" },
  lrn_search_hint: { en: "Matches titles, topics, related terms, and common typos in German and English.", de: "Findet Titel, Themen, verwandte Begriffe und häufige Tippfehler auf Deutsch und Englisch." },
  lrn_search_clear: { en: "Clear search", de: "Suche löschen" },
  lrn_search_one: { en: "1 match for “{query}”", de: "1 Treffer für „{query}“" },
  lrn_search_many: { en: "{count} matches for “{query}”", de: "{count} Treffer für „{query}“" },
  lrn_search_topic_one: { en: "1 match for “{query}” in {topic}", de: "1 Treffer für „{query}“ in {topic}" },
  lrn_search_topic_many: { en: "{count} matches for “{query}” in {topic}", de: "{count} Treffer für „{query}“ in {topic}" },
  lrn_courses_one: { en: "1 course", de: "1 Kurs" },
  lrn_courses_many: { en: "{count} courses", de: "{count} Kurse" },
  lrn_topic_one: { en: "1 matching course in {topic}", de: "1 passender Kurs in {topic}" },
  lrn_topic_many: { en: "{count} matching courses in {topic}", de: "{count} passende Kurse in {topic}" },
  lrn_search_empty_title: { en: "No matching courses", de: "Keine passenden Kurse" },
  lrn_search_empty_body: { en: "Try a broader topic, a German or English synonym, or clear the search.", de: "Versuche ein allgemeineres Thema, ein deutsches oder englisches Synonym – oder lösche die Suche." },
  lrn_topic_empty_body: { en: "No course in this topic matches the current level, interests, or status. Try another topic, adjust interests, or clear the topic.", de: "Kein Kurs in diesem Thema passt zu aktuellem Level, Interessen oder Status. Wähle ein anderes Thema, passe Interessen an oder lösche das Thema." },
  lrn_search_topic_empty_body: { en: "No course matches this search and the current filters. Try another term, adjust the filters, or clear the topic.", de: "Kein Kurs passt zu dieser Suche und den aktuellen Filtern. Versuche einen anderen Begriff, passe die Filter an oder lösche das Thema." },

  // lrn/lrn.js — empty-state copy
  lrn_empty_no_match: { en: "No match.", de: "Kein Treffer." },
  lrn_empty_no_onpath: { en: "No on-path match. Try the All filter.", de: "Keine passenden Kurse im Lernpfad. Versuche den Filter „Alle“." },
  lrn_empty_no_matches: { en: "No matches. Try All or clear the search.", de: "Keine Treffer. Versuche „Alle“ oder lösche die Suche." },

  // lrn/lrn.js — aria-live announcements
  lrn_announce_profile_set: { en: "Profile set: {profile}.", de: "Profil festgelegt: {profile}." },
  lrn_announce_level_set: { en: "Level set: {level}.", de: "Level festgelegt: {level}." },
  lrn_announce_topic_set: { en: "Topic filter set: {topic}.", de: "Themenfilter gesetzt: {topic}." },
  lrn_announce_topic_clear: { en: "Topic filter cleared.", de: "Themenfilter gelöscht." },
  lrn_announce_reset: { en: "Selection reset. Activity progress is preserved in the activity tracker.", de: "Auswahl zurückgesetzt. Der Aktivitätsfortschritt bleibt im Aktivitäts-Tracker erhalten." }
};
