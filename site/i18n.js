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
  skills_progress_overline: { en: "Learning progress", de: "Lernfortschritt" },
  skills_progress_title: { en: "Your capability progress", de: "Dein Kompetenzfortschritt" },
  skills_progress_intro: { en: "Assigned courses move you through Acquire, Deepen, and Create — with every contribution visible.", de: "Zugeordnete Kurse bringen dich durch Acquire, Deepen und Create – jeder Beitrag bleibt nachvollziehbar." },
  skills_progress_towards_target: { en: "towards your role target", de: "auf dem Weg zu deinem Rollenziel" },
  skills_progress_levels_label: { en: "Capability levels", de: "Kompetenzlevel" },
  skills_progress_sort_label: { en: "Sort by", de: "Sortieren nach" },
  skills_progress_sort_aria: { en: "Sort capabilities", de: "Kompetenzen sortieren" },
  skills_progress_sort_progress: { en: "Most progress", de: "Meiste Fortschritte" },
  skills_progress_sort_order: { en: "Capability order", de: "Kompetenzreihenfolge" },
  skills_progress_sort_name: { en: "Name", de: "Name" },
  skills_progress_show_all: { en: "Show all capabilities", de: "Alle Kompetenzen anzeigen" },
  skills_progress_show_less: { en: "Show fewer capabilities", de: "Weniger Kompetenzen anzeigen" },
  skills_progress_target: { en: "Target", de: "Ziel" },
  skills_progress_complete: { en: "complete", de: "abgeschlossen" },
  skills_progress_courses: { en: "{count} contributing courses", de: "{count} beitragende Kurse" },
  skills_progress_one_course: { en: "1 contributing course", de: "1 beitragender Kurs" },
  skills_progress_evidence_courses: { en: "{count} courses", de: "{count} Kurse" },
  skills_progress_no_lessons: { en: "No course mapped yet", de: "Noch kein Kurs zugeordnet" },
  skills_progress_coverage: { en: "{tracked} linked · {unmapped} awaiting courses", de: "{tracked} verknüpft · {unmapped} noch ohne Kurse" },
  skills_progress_details_open: { en: "Show level details for {title}", de: "Leveldetails für {title} anzeigen" },
  skills_progress_details_close: { en: "Hide level details for {title}", de: "Leveldetails für {title} ausblenden" },
  skills_progress_about: { en: "What this capability covers", de: "Was diese Kompetenz umfasst" },
  skills_progress_evidence_note: { en: "Only the courses shown below contribute to this capability.", de: "Die Capability-Beschreibung ist derzeit auf Englisch. Nur die unten gezeigten Kurse fließen in den Fortschritt ein." },
  skills_progress_path_title: { en: "Your level path", de: "Dein Levelpfad" },
  skills_progress_path_intro: { en: "Course progress is averaged within each level and then towards your role target.", de: "Kursfortschritte werden je Level und anschließend bis zu deinem Rollenziel gemittelt." },
  skills_progress_level_definition: { en: "What this level means", de: "Was dieses Level bedeutet" },
  skills_progress_open_course: { en: "Open {title}: {percent}% complete", de: "{title} öffnen: {percent}% abgeschlossen" },
  skills_progress_details_label: { en: "Capability progress details", de: "Details zum Kompetenzfortschritt" },
  skills_page_back: { en: "Back to course catalog", de: "Zurück zum Kurskatalog" },
  skills_page_catalog: { en: "Course catalog", de: "Kurskatalog" },
  skills_page_profile: { en: "Role profile · Technology Consulting", de: "Rollenprofil · Technology Consulting" },
  nav_skills: { en: "Capability progress", de: "Kompetenzfortschritt" },

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
  // Tiefenachse des Katalogs (Acquire/Deepen/Create). Ersetzt die frueheren
  // L1-L4-Senioritaetscodes (und davor LV1-LV5), siehe 00_REPORT.md Teil B1.
  lrn_depth_acquire: { en: "Acquire", de: "Acquire" },
  lrn_depth_deepen: { en: "Deepen", de: "Deepen" },
  lrn_depth_create: { en: "Create", de: "Create" },
  // Auspraegungen der ASE-Rolle
  ase_role_spec: { en: "Spec Owner", de: "Spezifizieren (Spec Owner)" },
  ase_role_orch: { en: "Agent Orchestrator", de: "Orchestrieren (Agent Orchestrator)" },
  ase_role_verify: { en: "Verification Lead", de: "Verifizieren (Verification Lead)" },
  ase_role_integrate: { en: "Integration Engineer", de: "Integrieren (Integration Engineer)" },
  ase_role_operate: { en: "Operations & Reliability Lead", de: "Betreiben (Operations & Reliability Lead)" },
  ase_matrix_heading: { en: "ASE role matrix", de: "ASE-Rollenmatrix" },
  ase_all_roles: { en: "All five roles", de: "Alle fuenf Auspraegungen" },

  // lrn/data.js tracks[LP03].bundles — the three Academy bundles (online
  // self-study, Module 1, to a live Module 2 course). 00_REPORT.md Teil B3.
  bundle_ai01_title: { en: "Introduction to GitHub Copilot", de: "Introduction to GitHub Copilot" },
  bundle_ai02_title: { en: "Agentic Software Engineering", de: "Agentic Software Engineering" },
  bundle_ai04_title: { en: "Requirement Engineering with AI", de: "Requirement Engineering with AI" },

  // lrn/lrn.js — status filter tabs
  lrn_status_recommended: { en: "Recommended", de: "Empfohlen" },
  lrn_status_optional: { en: "Optional", de: "Optional" },
  lrn_status_started: { en: "Started", de: "Begonnen" },
  lrn_status_completed: { en: "Completed", de: "Abgeschlossen" },
  lrn_status_all: { en: "All", de: "Alle" },

  // catalog.html topic dropdown (ids shared with LrnData.interests)
  topic_filter_all: { en: "All topics", de: "Alle Themen" },
  topic_foundation: { en: "Foundations", de: "Grundlagen" },
  topic_productivity: { en: "Productivity", de: "Produktivität" },
  topic_consulting: { en: "Consulting", de: "Consulting" },
  topic_engineering: { en: "Engineering", de: "Engineering" },
  topic_governance: { en: "Governance", de: "Governance" },
  topic_leadership: { en: "Leadership", de: "Leadership" },
  profile_label: { en: "Profile", de: "Profil" },
  level_label: { en: "Level", de: "Level" },
  selector_group_label: { en: "Choose profile and level, then search courses", de: "Profil und Level auswählen und Kurse durchsuchen" },
  profile_select_label: { en: "Choose profile", de: "Profil auswählen" },
  level_select_label: { en: "Choose level", de: "Level auswählen" },
  course_filters_label: { en: "Course filters", de: "Kursfilter" },
  course_status_filters_label: { en: "Filter course status", de: "Kursstatus filtern" },
  reset_filters_label: { en: "Reset all filters and selections", de: "Alle Filter und Auswahl zurücksetzen" },
  reset_btn: { en: "Reset", de: "Zurücksetzen" },

  // lrn/lrn.js — hybrid course search
  lrn_search_label: { en: "Search courses", de: "Kurse durchsuchen" },
  lrn_search_placeholder: { en: "Try “data protection”, “test agents”, or “RAG”…", de: "Zum Beispiel „Datenschutz“, „Agenten testen“ oder „RAG“…" },
  lrn_search_hint: { en: "Matches titles, topics, formats, related terms, and common typos in German and English.", de: "Findet Titel, Themen, Formate, verwandte Begriffe und häufige Tippfehler auf Deutsch und Englisch." },
  lrn_search_clear: { en: "Clear search", de: "Suche löschen" },
  lrn_search_one: { en: "1 match for “{query}”", de: "1 Treffer für „{query}“" },
  lrn_search_many: { en: "{count} matches for “{query}”", de: "{count} Treffer für „{query}“" },
  lrn_courses_one: { en: "1 course", de: "1 Kurs" },
  lrn_courses_many: { en: "{count} courses", de: "{count} Kurse" },
  lrn_search_empty_title: { en: "No matching courses", de: "Keine passenden Kurse" },
  lrn_search_empty_body: { en: "Try a broader topic, a German or English synonym, or clear the search.", de: "Versuche ein allgemeineres Thema, ein deutsches oder englisches Synonym – oder lösche die Suche." },

  // lrn/lrn.js — empty-state copy
  lrn_empty_no_match: { en: "No match.", de: "Kein Treffer." },
  lrn_empty_no_onpath: { en: "No on-path match. Try the All filter.", de: "Keine passenden Kurse im Lernpfad. Versuche den Filter „Alle“." },
  lrn_empty_no_matches: { en: "No matches. Try All or clear the search.", de: "Keine Treffer. Versuche „Alle“ oder lösche die Suche." },

  // lrn/lrn.js — aria-live announcements
  lrn_announce_profile_set: { en: "Profile set: {profile}.", de: "Profil festgelegt: {profile}." },
  lrn_announce_level_set: { en: "Level set: {level}.", de: "Level festgelegt: {level}." },
  lrn_announce_reset: { en: "Selection reset. Activity progress is preserved in the activity tracker.", de: "Auswahl zurückgesetzt. Der Aktivitätsfortschritt bleibt im Aktivitäts-Tracker erhalten." },

  // <title> per page — English text matches what was already shipped so
  // switching to English never changes the tab title; German added here.
  title_index: { en: "LHIND AI Learning Catalog", de: "LHIND AI Learning Catalog" },
  title_catalog: { en: "Lesson Catalog · LHIND AI Learning Catalog", de: "Lektionskatalog · LHIND AI Learning Catalog" },
  title_glossary: { en: "AI Glossary · LHIND AI Learning Catalog", de: "KI-Glossar · LHIND AI Learning Catalog" },
  title_dictionary: { en: "AI Coding Dictionary · LHIND AI Learning Catalog", de: "KI-Coding-Wörterbuch · LHIND AI Learning Catalog" },
  title_about: { en: "About · LHIND AI Learning Catalog", de: "Über uns · LHIND AI Learning Catalog" },
  title_assessment: { en: "LHIND · AI-Literacy Self-Assessment", de: "LHIND · KI-Kompetenz-Selbsteinschätzung" },
  title_prereqs: { en: "Roadmap · LHIND AI Learning Catalog", de: "Roadmap · LHIND AI Learning Catalog" },
  title_badges: { en: "Badges · LHIND AI Learning", de: "Deine Erfolge · LHIND AI Learning" },
  title_course: { en: "Course · LHIND AI Learning Catalog", de: "Kurs · LHIND AI Learning Catalog" },
  title_lesson: { en: "Lesson · LHIND AI Learning Catalog", de: "Lektion · LHIND AI Learning Catalog" },
  title_notes: { en: "My Merkzettel · LHIND AI Learning Catalog", de: "Meine Merkzettel · LHIND AI Learning Catalog" },
  title_skills: { en: "Capability Progress · LHIND AI Learning Catalog", de: "Kompetenzfortschritt · LHIND AI Learning Catalog" },
  title_gate: { en: "Enter passcode · LHIND Learning Catalog", de: "Passcode eingeben · LHIND Learning Catalog" },
  title_403: { en: "Access restricted · LHIND Learning Catalog", de: "Zugriff eingeschränkt · LHIND Learning Catalog" },

  // skip links not covered by the shared skip_content/skip_catalog keys —
  // each page names its own landmark.
  skip_badges: { en: "Skip to badges", de: "Zu den Badges springen" },
  skip_course_detail: { en: "Skip to course detail", de: "Zum Kursdetail springen" },

  // badges.html — dialog progress-header label (STR in badges.js already
  // covers the rest of the dialog; this one static label had no key).
  badge_progress_label: { en: "Progress", de: "Fortschritt" },

  // glossary.html — subtitle, sort options, column labels, empty state.
  // The 46 term/definition pairs themselves live in GLOSSARY_DE in
  // glossary.html (site/data.js, which builds GLOSSARY, is generated by
  // site/build.js from glossary/terms.md — outside this pass's file scope —
  // so the German text sits next to the page that renders it instead).
  glossary_sub_html: { en: "What people <em>say</em> vs what things actually <em>mean</em>", de: "Was Leute <em>sagen</em> – und was es wirklich <em>bedeutet</em>" },
  glossary_sort_term: { en: "Term", de: "Begriff" },
  glossary_sort_says: { en: "What people say", de: "Was Leute sagen" },
  glossary_sort_means: { en: "What it means", de: "Was es bedeutet" },
  glossary_col_says: { en: "What people say", de: "Was Leute sagen" },
  glossary_col_means: { en: "What it actually means", de: "Was es tatsächlich bedeutet" },
  glossary_count: { en: "{count} of {total} terms", de: "{count} von {total} Begriffen" },
  glossary_empty: { en: "No terms match your search.", de: "Keine Begriffe passen zu deiner Suche." },

  // ai-coding-dictionary.html — dictionary_title/dictionary_search_ph were
  // already referenced via data-i18n but had no entry here (silently never
  // translated); the rest of the page chrome had no keys at all. The ~64
  // dictionary entries themselves stay English, same as lesson content.
  dictionary_title: { en: "AI Coding Dictionary", de: "KI-Coding-Wörterbuch" },
  dictionary_search_ph: { en: "Search terms...", de: "Begriffe suchen..." },
  dictionary_sub: { en: "Every term explained once. The vocabulary of AI coding, translated into plain English.", de: "Jeder Begriff einmal erklärt. Das Vokabular des KI-gestützten Programmierens, verständlich erläutert." },
  dictionary_count: { en: "{count} of {total} terms", de: "{count} von {total} Begriffen" },
  dictionary_empty: { en: "No terms match your search.", de: "Keine Begriffe passen zu deiner Suche." },
  dictionary_col_label: { en: "Explanation", de: "Erklärung" },

  // lrn/course.js — course detail page. No i18n() helper existed there
  // before this pass (lrn.js has one; course.js didn't).
  course_not_found: { en: "Course not found. Return to the catalog.", de: "Kurs nicht gefunden. Zurück zum Katalog." },
  course_units_one: { en: "1 unit", de: "1 Einheit" },
  course_units_many: { en: "{count} units", de: "{count} Einheiten" },
  course_activities_one: { en: "1 activity", de: "1 Aktivität" },
  course_activities_many: { en: "{count} activities", de: "{count} Aktivitäten" },
  course_percent_shipped: { en: "{percent}% shipped", de: "{percent}% abgeschlossen" },
  course_resume: { en: "Resume", de: "Fortsetzen" },
  course_open_first_task: { en: "Open first task", de: "Erste Aufgabe öffnen" },
  course_all_shipped: { en: "All shipped", de: "Alles abgeschlossen" },
  course_progress_label: { en: "Progress {title}", de: "Fortschritt {title}" },
  course_progress_heading: { en: "Course progress", de: "Kursfortschritt" },
  course_includes_title: { en: "This course includes", de: "Dieser Kurs enthält" },
  course_facts_label: { en: "Course facts", de: "Kursdetails" },
  course_fact_level: { en: "Level", de: "Niveau" },
  course_fact_units: { en: "Units", de: "Einheiten" },
  course_fact_activities: { en: "Activities", de: "Aktivitäten" },
  course_fact_focus: { en: "Focus", de: "Schwerpunkt" },
  course_fact_not_specified: { en: "Not specified", de: "Nicht angegeben" },
  course_about_title: { en: "About this course", de: "Über diesen Kurs" },
  course_format_label: { en: "Format", de: "Format" },
  course_format_experiment: { en: "Experiment", de: "Experiment" },
  course_format_deck: { en: "Deck", de: "Deck" },
  course_format_elearning: { en: "E-learning", de: "E-Learning" },
  course_format_workshop: { en: "Workshop", de: "Workshop" },
  course_format_lab: { en: "Hands-on lab", de: "Praxislabor" },
  course_format_toolkit: { en: "Toolkit", de: "Toolkit" },
  course_modules_label: { en: "Modules", de: "Module" },
  course_outcomes_title: { en: "After this, you can ship:", de: "Danach kannst du liefern:" },
  course_tasks_title: { en: "Tasks", de: "Aufgaben" },
  course_no_map: { en: "No curriculum mapping has been maintained for this course yet.", de: "Für diesen Kurs wurde noch keine Lehrplan-Zuordnung gepflegt." },
  course_unit_progress: { en: "{completed} of {total} completed", de: "{completed} von {total} abgeschlossen" },
  course_activity_type_lab: { en: "Lab", de: "Labor" },
  course_activity_completed: { en: "completed", de: "abgeschlossen" },
  course_activity_started: { en: "started", de: "begonnen" },

  // assessment.html — self-assessment flow (role → rate → result).
  assess_score_label: { en: "AI-Literacy Score", de: "KI-Kompetenz-Score" },
  assess_intro: { en: "Pick your role, rate yourself across the {count} capabilities, and get an AI-Literacy score plus a learning path built from the lessons you actually need.", de: "Wähle deine Rolle, bewerte dich über die {count} Kompetenzen hinweg und erhalte einen KI-Kompetenz-Score sowie einen Lernpfad aus genau den Lektionen, die du brauchst." },
  assess_role_ph: { en: "— Select your role —", de: "— Rolle auswählen —" },
  assess_path_hint: { en: "Capabilities below your role's target come first. Each links to the lessons that build it.", de: "Kompetenzen unterhalb des Zielwerts deiner Rolle stehen zuerst. Jede verlinkt zu den Lektionen, die sie aufbauen." },
  assess_target_for_role: { en: "Target for your role: {level}", de: "Zielwert für deine Rolle: {level}" },
  assess_not_required: { en: "Not required for your role", de: "Für deine Rolle nicht erforderlich" },
  assess_no_lessons_yet: { en: "No in-curriculum lessons yet", de: "Noch keine Lektionen im Curriculum" },
  assess_level_none: { en: "None", de: "Keine" },
  assess_level_basic: { en: "Basic", de: "Basis" },
  assess_level_advanced: { en: "Advanced", de: "Fortgeschritten" },
  assess_level_expert: { en: "Expert", de: "Experte" },
  assess_band_none: { en: "—", de: "—" },
  assess_band_in_progress: { en: "In progress", de: "In Bearbeitung" },
  assess_band_role_ready: { en: "Role-ready", de: "Rollenbereit" },
  assess_band_on_track: { en: "On track", de: "Auf Kurs" },
  assess_band_developing: { en: "Developing", de: "Im Aufbau" },
  assess_band_getting_started: { en: "Getting started", de: "Am Anfang" },
  assess_score_sub_complete: { en: "You meet {met} of {total} capability targets for {role}.", de: "Du erfüllst {met} von {total} Kompetenzzielen für {role}." },
  assess_score_sub_incomplete: { en: "Rate all {total} required capabilities for a score — {rated} done. Your path is ready below.", de: "Bewerte alle {total} erforderlichen Kompetenzen für einen Score — {rated} erledigt. Dein Lernpfad steht unten bereit." },
  assess_no_gaps: { en: "No gaps — you meet every target for your role.", de: "Keine Lücken – du erfüllst jedes Ziel für deine Rolle." },
  assess_no_dedicated_lessons: { en: "No dedicated lessons in this curriculum yet — a business/literacy capability covered through external training.", de: "Noch keine eigenen Lektionen in diesem Curriculum — eine Business-/Literacy-Kompetenz, die über externe Schulungen abgedeckt wird." },

  // index.html footer — added alongside the new footer so about.html and
  // assessment.html become reachable (see nav gap in the plan's §6).
  nav_assessment: { en: "Self-Assessment", de: "Selbsteinschätzung" }
};
