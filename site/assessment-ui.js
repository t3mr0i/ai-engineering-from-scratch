/* Role → ten bilingual questions → five dimension results → learning path. */
(function (root) {
  'use strict';
  var doc = root.document;
  var api = root.AIFSAssessment;
  var host = doc && doc.getElementById('nativeAssessment');
  if (!host || !api) return;
  var state = { step: 0, role: '', division: '', answers: {}, error: '' };
  var saved = api.load();
  if (saved) { state.step = 2; state.role = saved.profileId; state.division = saved.divisionId; }
  var COPY = {
    en: {
      roleTitle: 'Choose your role and division', roleIntro: 'Your role determines the recommended target in each area.',
      roleLabel: 'Role profile', rolePlaceholder: 'Select a role', next: 'Continue to the questions',
      divisionLabel: 'Division', divisionPlaceholder: 'Select a division', divisionRequired: 'Please select your division.',
      questionsTitle: 'Assess your starting point', questionsIntro: 'Answer all ten questions. Choose 1–5 or Not relevant for each one.',
      scale: 'How would you rate yourself?', na: 'Not relevant', back: 'Back to role', result: 'Show my results',
      required: 'Please answer every question before continuing.', roleRequired: 'Please select your role.',
      saveFailed: 'Your result could not be saved in this browser. Check browser storage and try again.',
      resultsTitle: 'Your results', resultsIntro: 'Your self-assessment is a starting point, not a formal skills certificate.',
      area: 'Area', score: 'Score', current: 'Your level', target: 'Role target', unknown: 'Not assessed',
      repeat: 'Retake assessment', remove: 'Remove result', removed: 'Your assessment was removed.',
      path: 'See my learning path', local: 'Only your role, division and results are saved in this browser. Individual answers are discarded.',
      foundation: 'Foundation', engineering: 'Engineering Literacy', product: 'Product and Process Literacy',
      advisory: 'Advisory and Business Consulting', leadership: 'Leadership and Strategy',
      questionsCount: 'questions answered'
    },
    de: {
      roleTitle: 'Wähle deine Rolle und Division', roleIntro: 'Deine Rolle bestimmt das empfohlene Ziel in jedem Bereich.',
      roleLabel: 'Rollenprofil', rolePlaceholder: 'Rolle auswählen', next: 'Weiter zu den Fragen',
      divisionLabel: 'Division', divisionPlaceholder: 'Division auswählen', divisionRequired: 'Bitte wähle deine Division.',
      questionsTitle: 'Schätze deinen Ausgangspunkt ein', questionsIntro: 'Beantworte alle zehn Fragen. Wähle jeweils 1–5 oder Nicht relevant.',
      scale: 'Wie schätzt du dich ein?', na: 'Nicht relevant', back: 'Zurück zur Rolle', result: 'Meine Ergebnisse anzeigen',
      required: 'Bitte beantworte alle Fragen, bevor du fortfährst.', roleRequired: 'Bitte wähle deine Rolle.',
      saveFailed: 'Dein Ergebnis konnte in diesem Browser nicht gespeichert werden. Prüfe den lokalen Speicher und versuche es erneut.',
      resultsTitle: 'Deine Ergebnisse', resultsIntro: 'Deine Selbsteinschätzung ist ein Ausgangspunkt, kein formaler Kompetenznachweis.',
      area: 'Bereich', score: 'Wert', current: 'Dein Level', target: 'Rollenziel', unknown: 'Nicht bewertet',
      repeat: 'Assessment wiederholen', remove: 'Ergebnis entfernen', removed: 'Dein Assessment wurde entfernt.',
      path: 'Meinen Lernpfad ansehen', local: 'Nur deine Rolle, Division und Ergebnisse werden in diesem Browser gespeichert. Einzelne Antworten werden verworfen.',
      foundation: 'Grundverständnis', engineering: 'Engineering', product: 'Produkt & Prozess Verständnis',
      advisory: 'Advisory & Business Consulting', leadership: 'Leadership & Strategy',
      questionsCount: 'Fragen beantwortet'
    }
  };
  function lang() { return root.SiteLang && root.SiteLang.get() === 'de' ? 'de' : 'en'; }
  function t(key) { return COPY[lang()][key]; }
  function node(tag, cls, content) { var item = doc.createElement(tag); if (cls) item.className = cls; if (content != null) item.textContent = content; return item; }
  function button(label, action, secondary) {
    var item = node('button', secondary ? 'assessment-action assessment-action--secondary' : 'assessment-action', label);
    item.type = 'button'; item.addEventListener('click', action); return item;
  }
  function heading(text) { var item = node('h2', '', text); item.tabIndex = -1; return item; }
  function go(step) { state.step = step; state.error = ''; render(); var title = host.querySelector('h2'); if (title) title.focus({ preventScroll: true }); host.scrollIntoView({ block: 'start' }); }
  function emit(record) { doc.dispatchEvent(new CustomEvent('assessment-import:change', { detail: record })); }
  function roleStep() {
    host.appendChild(heading(t('roleTitle')));
    host.appendChild(node('p', 'assessment-intro', t('roleIntro')));
    var label = node('label', 'assessment-field', t('roleLabel'));
    var select = node('select'); select.id = 'assessmentRole'; select.required = true;
    var placeholder = node('option', '', t('rolePlaceholder')); placeholder.value = ''; select.appendChild(placeholder);
    api.PROFILES.forEach(function (profile) { var option = node('option', '', profile.label); option.value = profile.id; select.appendChild(option); });
    select.value = state.role;
    select.addEventListener('change', function () { state.role = select.value; state.error = ''; });
    label.appendChild(select); host.appendChild(label);
    var divisionLabel = node('label', 'assessment-field', t('divisionLabel'));
    var divisionSelect = node('select'); divisionSelect.id = 'assessmentDivision'; divisionSelect.required = true;
    var divisionPlaceholder = node('option', '', t('divisionPlaceholder')); divisionPlaceholder.value = ''; divisionSelect.appendChild(divisionPlaceholder);
    api.DIVISIONS.forEach(function (division) { var option = node('option', '', division.label); option.value = division.id; divisionSelect.appendChild(option); });
    divisionSelect.value = state.division;
    divisionSelect.addEventListener('change', function () { state.division = divisionSelect.value; state.error = ''; });
    divisionLabel.appendChild(divisionSelect); host.appendChild(divisionLabel);
    var actions = node('div', 'assessment-actions');
    actions.appendChild(button(t('next'), function () {
      if (!state.role || !state.division) {
        state.error = t(!state.role ? 'roleRequired' : 'divisionRequired'); render();
        host.querySelector(!state.role ? '#assessmentRole' : '#assessmentDivision').focus(); return;
      }
      go(1);
    }));
    host.appendChild(actions);
  }
  function questionStep() {
    host.appendChild(heading(t('questionsTitle')));
    host.appendChild(node('p', 'assessment-intro', t('questionsIntro')));
    var count = Object.keys(state.answers).length;
    var progress = node('p', 'assessment-progress', count + ' / 10 ' + t('questionsCount'));
    host.appendChild(progress);
    var questions = root.LrnData.questions;
    api.DIMENSIONS.forEach(function (dimension, areaIndex) {
      var section = node('section', 'assessment-area');
      section.appendChild(node('h3', '', t(['foundation', 'engineering', 'product', 'advisory', 'leadership'][areaIndex])));
      dimension.questionIds.forEach(function (id) {
        var question = questions.find(function (item) { return item.id === id; });
        var field = node('fieldset', 'assessment-question');
        var legend = node('legend', '', (Number(id.slice(1))) + '. ' + (lang() === 'de' ? question.textDe : question.text));
        field.appendChild(legend);
        var choices = node('div', 'assessment-choices');
        [1, 2, 3, 4, 5, 'na'].forEach(function (value) {
          var label = node('label', 'assessment-choice');
          var input = node('input'); input.type = 'radio'; input.name = id; input.value = String(value);
          input.checked = state.answers[id] === value;
          input.addEventListener('change', function () { state.answers[id] = value; state.error = ''; progress.textContent = Object.keys(state.answers).length + ' / 10 ' + t('questionsCount'); });
          label.appendChild(input); label.appendChild(node('span', '', value === 'na' ? t('na') : String(value)));
          choices.appendChild(label);
        });
        field.appendChild(choices); section.appendChild(field);
      });
      host.appendChild(section);
    });
    var actions = node('div', 'assessment-actions');
    actions.appendChild(button(t('back'), function () { go(0); }, true));
    actions.appendChild(button(t('result'), function () {
      var unanswered = questions.find(function (item) { return !Object.prototype.hasOwnProperty.call(state.answers, item.id); });
      if (unanswered) {
        state.error = t('required'); render();
        var field = host.querySelector('[name="' + unanswered.id + '"]'); if (field) field.focus();
        return;
      }
      try {
        var record = api.evaluate(state.role, state.division, state.answers);
        var savedRecord = api.save(record);
        var previous = root.localStorage.getItem('lhind:lrn-cockpit:v3');
        var cockpit; try { cockpit = JSON.parse(previous) || {}; } catch (_) { cockpit = {}; }
        cockpit.profileId = record.profileId; cockpit.keyAreaId = null; cockpit.specializationId = null;
        root.localStorage.setItem('lhind:lrn-cockpit:v3', JSON.stringify(cockpit));
        saved = savedRecord; emit(savedRecord); go(2);
      } catch (_) { state.error = t('saveFailed'); render(); }
    }));
    host.appendChild(actions);
  }
  function resultStep() {
    saved = api.load();
    if (!saved) { state.step = 0; roleStep(); return; }
    host.appendChild(heading(t('resultsTitle')));
    host.appendChild(node('p', 'assessment-intro', t('resultsIntro')));
    host.appendChild(node('p', 'assessment-meta', t('roleLabel') + ': ' + saved.role + ' · ' + t('divisionLabel') + ': ' + saved.division));
    var wrap = node('div', 'assessment-table-wrap');
    var table = node('table', 'assessment-table');
    var thead = node('thead'); var header = node('tr');
    ['area', 'score', 'current', 'target'].forEach(function (key) { var th = node('th', '', t(key)); th.scope = 'col'; header.appendChild(th); });
    thead.appendChild(header); table.appendChild(thead);
    var body = node('tbody');
    api.DIMENSIONS.forEach(function (dimension, index) {
      var row = saved.dimensions[dimension.name]; var tr = node('tr');
      var th = node('th', '', t(['foundation', 'engineering', 'product', 'advisory', 'leadership'][index])); th.scope = 'row'; tr.appendChild(th);
      [row.score == null ? '—' : row.score.toLocaleString(lang(), { maximumFractionDigits: 1 }), row.currentLevel || t('unknown'), row.targetLevel].forEach(function (value, cellIndex) {
        var cell = node('td', '', value);
        cell.setAttribute('data-label', t(['score', 'current', 'target'][cellIndex]));
        tr.appendChild(cell);
      });
      body.appendChild(tr);
    });
    table.appendChild(body); wrap.appendChild(table); host.appendChild(wrap);
    host.appendChild(node('p', 'assessment-local', t('local')));
    var actions = node('div', 'assessment-actions');
    var path = node('a', 'assessment-action', t('path')); path.href = 'index.html#readinessMap'; actions.appendChild(path);
    actions.appendChild(button(t('repeat'), function () { state.answers = {}; go(0); }, true));
    actions.appendChild(button(t('remove'), function () { api.clear(); saved = null; state.answers = {}; state.role = ''; state.division = ''; emit(null); go(0); state.error = t('removed'); render(); }, true));
    host.appendChild(actions);
  }
  function render() {
    host.replaceChildren(); host.className = 'native-assessment';
    if (state.step === 0) roleStep(); else if (state.step === 1) questionStep(); else resultStep();
    var recommendations = doc.getElementById('assessRecommendations');
    if (recommendations) recommendations.hidden = state.step !== 2 || !saved;
    if (state.error) { var error = node('p', 'assessment-error', state.error); error.setAttribute('role', 'alert'); host.insertBefore(error, host.querySelector('.assessment-actions')); }
  }
  doc.addEventListener('sitelang:change', render);
  render();
})(window);
