/* Exploratory assessment interface. The questions and saved result contract are shared with V1. */
(function (root) {
  'use strict';
  var doc = root.document;
  var host = doc.getElementById('assessmentV2');
  var api = root.AIFSAssessment;
  if (!host || !api || !root.LrnData || !Array.isArray(root.LrnData.questions)) return;
  var questions = root.LrnData.questions;
  var areaKeys = ['foundation', 'engineering', 'product', 'advisory', 'leadership'];
  var reviewLabels = {
    de: ['Erwartungen an meine Rolle', 'AI und klassische Software erklären', 'AI-Tools im Arbeitsalltag nutzen', 'Prompts verbessern und Ergebnisse prüfen', 'AI-Use-Cases und Business Value einschätzen', 'Datenbedarf und Datenqualität einschätzen', 'Leitplanken für verantwortungsvolle AI', 'AI in Teams und Prozesse einbinden', 'AI-Initiativen strukturieren', 'AI-Lösungen gestalten und Wissen teilen'],
    en: ['Expectations for my role', 'Explain AI and traditional software', 'Use AI tools in daily work', 'Improve prompts and check results', 'Assess AI use cases and business value', 'Assess data needs and quality', 'Guidelines for responsible AI', 'Bring AI into teams and processes', 'Structure AI initiatives', 'Create AI solutions and share knowledge']
  };
  var state = { page: 'start', index: 0, role: '', division: '', answers: {}, editing: false, error: '', saved: null };
  var previousResult = api.load();
  if (previousResult) { state.role = previousResult.profileId; state.division = previousResult.divisionId; }
  var COPY = {
    de: {
      backCatalog: 'Zum Lernkatalog', original: 'Bisheriges Assessment', themeLight: 'Helles Farbschema wählen', themeDark: 'Dunkles Farbschema wählen',
      title: 'Sieh, wo du gerade stehst.', intro: 'Mit zehn Fragen schätzt du deine AI-Fähigkeiten ein und findest einen passenden Einstieg in deinen Lernweg.',
      startTitle: 'Was passt zu deiner Arbeit?', startIntro: 'Wähle deine Rolle und Division. Die Rolle bestimmt dein Zielbild. Die Division verändert weder Fragen noch Bewertung.',
      role: 'Deine Rolle', roleEmpty: 'Rolle auswählen', division: 'Deine Division', divisionEmpty: 'Division auswählen', start: 'Einschätzung beginnen',
      seeSaved: 'Gespeichertes Ergebnis ansehen',
      overviewTitle: 'Fünf Bereiche. Dein eigener Ausgangspunkt.', overviewIntro: 'Die Fragen stammen aus dem bestehenden AI Self Assessment. Du kannst jede Antwort vor dem Abschluss ändern.', railTitle: 'Deine Themen',
      foundation: 'Grundverständnis', engineering: 'Engineering Literacy', product: 'Produkt & Prozesse', advisory: 'Advisory & Business', leadership: 'Leadership & Strategie',
      resultAreas: ['Grundverständnis', 'Engineering Literacy', 'Produkt & Prozess Verständnis', 'Advisory & Business Consulting', 'Leadership & Strategy'],
      questionProgress: 'von 10', low: 'Gering', high: 'Hoch', na: 'Kann ich nicht einschätzen', continue: 'Weiter', review: 'Antworten ansehen', previous: 'Zurück',
      roleError: 'Bitte wähle eine Rolle und eine Division.', answerError: 'Wähle eine Einschätzung oder „Kann ich nicht einschätzen“.',
      reviewTitle: 'Passt das für dich?', reviewIntro: 'Du kannst jede Einschätzung noch ändern. Erst wenn du dein Ergebnis anzeigen lässt, wird es in diesem Browser gespeichert.',
      change: 'Ändern', finish: 'Mein Ergebnis anzeigen', resultTitle: 'Dein Ausgangspunkt', resultIntro: 'Deine Selbsteinschätzung hilft dir, den nächsten Schritt zu finden. Sie ist kein Kompetenznachweis.',
      current: 'Dein Stand', target: 'Ziel für deine Rolle', unknown: 'Nicht eingeschätzt', ratingExplainer: 'Die Sterne zeigen, wie du dich in den einzelnen Bereichen eingeschätzt hast.', path: 'Meinen Lernpfad ansehen', again: 'Noch einmal starten',
      savedNote: 'Nur deine Rolle, Division und Ergebnisse werden in diesem Browser gespeichert. Einzelne Antworten werden verworfen.',
      saveError: 'Dein Ergebnis konnte in diesem Browser nicht gespeichert werden. Bitte prüfe den lokalen Speicher und versuche es erneut.',
      existing: 'Es gibt bereits ein Assessment-Ergebnis. Wenn du V2 abschließt, ersetzt dein neues Ergebnis das bisherige.'
    },
    en: {
      backCatalog: 'Back to learning catalog', original: 'Current assessment', themeLight: 'Switch to light theme', themeDark: 'Switch to dark theme',
      title: 'See where you stand today.', intro: 'Answer ten questions to assess your AI skills and find a good place to start learning.',
      startTitle: 'What fits your work?', startIntro: 'Choose your role and division. Your role sets your targets. Division does not change the questions or scores.',
      role: 'Your role', roleEmpty: 'Select a role', division: 'Your division', divisionEmpty: 'Select a division', start: 'Begin assessment',
      seeSaved: 'View saved result',
      overviewTitle: 'Five areas. Your own starting point.', overviewIntro: 'The questions come from the current AI Self Assessment. You can change any answer before finishing.', railTitle: 'Your areas',
      foundation: 'Foundation', engineering: 'Engineering Literacy', product: 'Product & Process', advisory: 'Advisory & Business', leadership: 'Leadership & Strategy',
      resultAreas: ['Foundation', 'Engineering Literacy', 'Product and Process Literacy', 'Advisory and Business Consulting', 'Leadership and Strategy'],
      questionProgress: 'of 10', low: 'Low', high: 'High', na: 'I cannot assess this yet', continue: 'Continue', review: 'Review answers', previous: 'Back',
      roleError: 'Please choose a role and a division.', answerError: 'Choose a rating or “I cannot assess this yet”.',
      reviewTitle: 'Does this look right?', reviewIntro: 'You can change any answer. Your result is saved in this browser only when you choose to see it.',
      change: 'Change', finish: 'Show my result', resultTitle: 'Your starting point', resultIntro: 'Your self-assessment helps you find a next step. It is not a formal skills certificate.',
      current: 'Your level', target: 'Target for your role', unknown: 'Not assessed', ratingExplainer: 'The stars show how you rated yourself in each area.', path: 'See my learning path', again: 'Start again',
      savedNote: 'Only your role, division and results are saved in this browser. Individual answers are discarded.',
      saveError: 'Your result could not be saved in this browser. Check browser storage and try again.',
      existing: 'An assessment result already exists. Finishing V2 will replace that result.'
    }
  };
  function lang() { return root.SiteLang && root.SiteLang.get() === 'de' ? 'de' : 'en'; }
  function t(key) { return COPY[lang()][key]; }
  function el(tag, className, content) { var item = doc.createElement(tag); if (className) item.className = className; if (content != null) item.textContent = content; return item; }
  function action(label, handler, secondary) { var item = el('button', secondary ? 'v2-action v2-action--secondary' : 'v2-action', label); item.type = 'button'; item.addEventListener('click', handler); return item; }
  function go(page, index, editing) { state.page = page; if (typeof index === 'number') state.index = index; state.editing = !!editing; state.error = ''; render(); var title = host.querySelector('h1'); if (title) title.focus({ preventScroll: true }); root.scrollTo({ top: 0, behavior: 'instant' }); }
  function theme() {
    var explicit; try { explicit = root.localStorage.getItem('theme'); } catch (_) {}
    return explicit === 'dark' || explicit === 'light' ? explicit : root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function renderHeader() {
    doc.getElementById('v2BackLink').textContent = t('backCatalog');
    doc.getElementById('v2OriginalLink').textContent = t('original');
    var toggle = doc.getElementById('darkModeToggle');
    toggle.setAttribute('aria-label', t(theme() === 'dark' ? 'themeLight' : 'themeDark'));
    toggle.title = toggle.getAttribute('aria-label');
    toggle.setAttribute('aria-pressed', String(theme() === 'dark'));
  }
  function select(labelText, empty, rows, value, update) {
    var label = el('label', 'v2-field'); label.appendChild(el('span', '', labelText));
    var input = el('select'); input.required = true;
    var placeholder = el('option', '', empty); placeholder.value = ''; input.appendChild(placeholder);
    rows.forEach(function (row) { var option = el('option', '', row.label); option.value = row.id; input.appendChild(option); });
    input.value = value; input.addEventListener('change', function () { update(input.value); }); label.appendChild(input); return label;
  }
  function progress() {
    var area = Math.floor(state.index / 2);
    var line = el('div', 'v2-progress-line');
    line.appendChild(el('span', '', t(areaKeys[area])));
    line.appendChild(el('span', '', String(state.index + 1) + ' ' + t('questionProgress')));
    var bar = el('div', 'v2-progress-bar'); bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-label', String(state.index + 1) + ' ' + t('questionProgress'));
    bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '10'); bar.setAttribute('aria-valuenow', String(state.index + 1));
    for (var i = 0; i < 10; i++) bar.appendChild(el('span', i <= state.index ? 'is-on' : ''));
    host.appendChild(line); host.appendChild(bar);
  }
  function startPage() {
    var lead = el('div', 'v2-lead');
    lead.appendChild(el('h1', '', t('title'))); lead.appendChild(el('p', 'v2-lead-copy', t('intro')));
    host.appendChild(lead);
    var layout = el('div', 'v2-start-layout'); var form = el('form', 'v2-start-form'); form.noValidate = true;
    form.appendChild(el('h2', '', t('startTitle'))); form.appendChild(el('p', '', t('startIntro')));
    form.appendChild(select(t('role'), t('roleEmpty'), api.PROFILES, state.role, function (value) { state.role = value; }));
    form.appendChild(select(t('division'), t('divisionEmpty'), api.DIVISIONS, state.division, function (value) { state.division = value; }));
    if (state.error) { var error = el('p', 'v2-error', state.error); error.setAttribute('role', 'alert'); form.appendChild(error); }
    var startActions = el('div', 'v2-start-actions');
    var submit = el('button', 'v2-action', t('start')); submit.type = 'submit'; startActions.appendChild(submit);
    var existing = api.load();
    if (existing) startActions.appendChild(action(t('seeSaved'), function () { state.saved = existing; go('result'); }, true));
    form.appendChild(startActions);
    if (existing) form.appendChild(el('p', 'v2-existing', t('existing')));
    form.addEventListener('submit', function (event) { event.preventDefault(); if (!state.role || !state.division) { state.error = t('roleError'); render(); host.querySelector('select').focus(); return; } go('question', 0); });
    layout.appendChild(form);
    var overview = el('aside', 'v2-overview'); overview.appendChild(el('h2', '', t('overviewTitle'))); overview.appendChild(el('p', '', t('overviewIntro')));
    var list = el('ol'); areaKeys.forEach(function (key) { var li = el('li'); li.appendChild(el('span', 'v2-overview-mark')); li.appendChild(el('span', '', t(key))); list.appendChild(li); }); overview.appendChild(list);
    layout.appendChild(overview); host.appendChild(layout);
  }
  function questionPage() {
    progress();
    var question = questions[state.index]; var area = Math.floor(state.index / 2);
    var layout = el('div', 'v2-question-layout');
    var rail = el('aside', 'v2-area-rail'); rail.appendChild(el('h2', '', t('railTitle')));
    var list = el('ol'); areaKeys.forEach(function (key, i) { var li = el('li', i === area ? 'is-current' : i < area ? 'is-past' : '', t(key)); if (i === area) li.setAttribute('aria-current', 'step'); list.appendChild(li); }); rail.appendChild(list); layout.appendChild(rail);
    var main = el('section', 'v2-question-panel');
    main.appendChild(el('p', 'v2-area-name', t(areaKeys[area])));
    var title = el('h1', '', lang() === 'de' ? question.textDe : question.text); title.tabIndex = -1; main.appendChild(title);
    var field = el('fieldset', 'v2-rating'); field.appendChild(el('legend', '', lang() === 'de' ? 'Wie schätzt du dich ein?' : 'How would you rate yourself?'));
    var scale = el('div', 'v2-scale');
    [1, 2, 3, 4, 5].forEach(function (value) {
      var label = el('label', 'v2-scale-option' + (state.answers[question.id] === value ? ' is-selected' : ''));
      var input = el('input'); input.type = 'radio'; input.name = question.id; input.value = String(value); input.checked = state.answers[question.id] === value;
      input.setAttribute('aria-label', String(value) + ' ' + (lang() === 'de' ? 'von fünf' : 'of five'));
      input.addEventListener('change', function () { state.answers[question.id] = value; state.error = ''; scale.querySelectorAll('.v2-scale-option').forEach(function (option) { option.classList.toggle('is-selected', option === label); }); });
      label.appendChild(input); label.appendChild(el('span', '', String(value))); scale.appendChild(label);
    });
    field.appendChild(scale); var anchors = el('div', 'v2-scale-anchors'); anchors.appendChild(el('span', '', t('low'))); anchors.appendChild(el('span', '', t('high'))); field.appendChild(anchors);
    var na = el('label', 'v2-na'); var naInput = el('input'); naInput.type = 'radio'; naInput.name = question.id; naInput.value = 'na'; naInput.checked = state.answers[question.id] === 'na';
    naInput.addEventListener('change', function () { state.answers[question.id] = 'na'; state.error = ''; scale.querySelectorAll('.v2-scale-option').forEach(function (option) { option.classList.remove('is-selected'); }); });
    na.appendChild(naInput); na.appendChild(el('span', '', t('na'))); field.appendChild(na); main.appendChild(field);
    if (state.error) { var error = el('p', 'v2-error', state.error); error.setAttribute('role', 'alert'); main.appendChild(error); }
    var actions = el('div', 'v2-actions'); actions.appendChild(action(t('previous'), function () { go(state.editing ? 'review' : state.index === 0 ? 'start' : 'question', state.index - 1); }, true));
    actions.appendChild(action(state.editing ? t('review') : state.index === 9 ? t('review') : t('continue'), function () {
      if (!Object.prototype.hasOwnProperty.call(state.answers, question.id)) { state.error = t('answerError'); render(); return; }
      go(state.editing || state.index === 9 ? 'review' : 'question', state.index + 1);
    })); main.appendChild(actions); layout.appendChild(main); host.appendChild(layout);
  }
  function reviewPage() {
    var lead = el('div', 'v2-lead v2-lead--compact'); var title = el('h1', '', t('reviewTitle')); title.tabIndex = -1; lead.appendChild(title); lead.appendChild(el('p', '', t('reviewIntro'))); host.appendChild(lead);
    var review = el('div', 'v2-review');
    areaKeys.forEach(function (key, area) {
      var section = el('section', 'v2-review-area'); section.appendChild(el('h2', '', t(key)));
      api.DIMENSIONS[area].questionIds.forEach(function (id, offset) {
        var row = el('div', 'v2-review-row'); var summary = reviewLabels[lang()][area * 2 + offset];
        row.appendChild(el('p', '', summary));
        var value = state.answers[id]; row.appendChild(el('strong', '', value === 'na' ? t('unknown') : String(value) + ' / 5'));
        var change = action(t('change'), function () { go('question', area * 2 + offset, true); }, true);
        change.setAttribute('aria-label', t('change') + ': ' + summary); row.appendChild(change); section.appendChild(row);
      }); review.appendChild(section);
    }); host.appendChild(review);
    if (state.error) { var error = el('p', 'v2-error', state.error); error.setAttribute('role', 'alert'); host.appendChild(error); }
    var actions = el('div', 'v2-actions v2-actions--end'); actions.appendChild(action(t('previous'), function () { go('question', 9); }, true));
    actions.appendChild(action(t('finish'), function () {
      try {
        var record = api.evaluate(state.role, state.division, state.answers);
        state.saved = api.save(record);
        var cockpit; try { cockpit = JSON.parse(root.localStorage.getItem('lhind:lrn-cockpit:v3')) || {}; } catch (_) { cockpit = {}; }
        cockpit.profileId = record.profileId; cockpit.keyAreaId = null; cockpit.specializationId = null;
        root.localStorage.setItem('lhind:lrn-cockpit:v3', JSON.stringify(cockpit));
        state.answers = {}; go('result');
      } catch (_) { state.error = t('saveError'); render(); }
    })); host.appendChild(actions);
  }
  function resultPage() {
    var record = state.saved || api.load(); if (!record) { go('start'); return; }
    var lead = el('div', 'v2-lead v2-lead--compact'); var title = el('h1', '', t('resultTitle')); title.tabIndex = -1; lead.appendChild(title); lead.appendChild(el('p', '', t('resultIntro'))); host.appendChild(lead);
    host.appendChild(root.AIFSAssessmentResult.render(record, {
      language: lang(), labels: { role: t('role'), division: t('division'), explainer: t('ratingExplainer'),
        current: t('current'), target: t('target'), unknown: t('unknown'), areas: t('resultAreas') }
    }));
    var actions = el('div', 'v2-actions v2-actions--end'); var path = el('a', 'v2-action', t('path')); path.href = 'index.html#readinessMap'; actions.appendChild(path);
    actions.appendChild(action(t('again'), function () { state.answers = {}; state.saved = null; go('start'); }, true)); host.appendChild(actions);
    host.appendChild(el('p', 'v2-data-note', t('savedNote')));
  }
  function render() {
    renderHeader(); host.replaceChildren(); host.dataset.page = state.page;
    if (state.page === 'start') startPage(); else if (state.page === 'question') questionPage(); else if (state.page === 'review') reviewPage(); else resultPage();
  }
  doc.getElementById('darkModeToggle').addEventListener('click', function () { var next = theme() === 'dark' ? 'light' : 'dark'; try { root.localStorage.setItem('theme', next); } catch (_) {} doc.documentElement.dataset.theme = next; renderHeader(); });
  doc.addEventListener('sitelang:change', render);
  render();
})(window);
