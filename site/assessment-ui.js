/* Native role assessment: one role, five two-question areas, then division. */
(function (root) {
  'use strict';
  var doc = root.document;
  var api = root.AIFSAssessment;
  var host = doc && doc.getElementById('nativeAssessment');
  if (!host || !api) return;
  var AREA_KEYS = ['foundation', 'engineering', 'product', 'advisory', 'leadership'];
  var state = { step: 0, role: '', division: '', answers: {}, error: '' };
  var saved = api.load();
  if (saved) { state.step = 7; state.role = saved.profileId; state.division = saved.divisionId; }
  var COPY = {
    en: {
      roleTitle: 'First, choose your role', roleIntro: 'Your role sets the target level for each area. You can change it before finishing.',
      roleLabel: 'Role profile', rolePlaceholder: 'Select a role', start: 'Start assessment',
      resultRole: 'Your role', resultDivision: 'Your division',
      guideTitle: 'Your route', guideRole: 'Choose your role', guideQuestions: 'Rate ten questions with stars', guidePath: 'Discover your learning path',
      divisionTitle: 'One last detail', divisionIntro: 'Which division do you work in?',
      divisionWhy: 'Your division is saved with your result. It does not change the questions or your score.',
      divisionLabel: 'Division', divisionPlaceholder: 'Select a division', divisionRequired: 'Please select your division.',
      areaProgress: 'Area {current} of 5',
      na: 'Not relevant', starLabel: '{value} of 5 stars',
      back: 'Back', next: 'Next area', finishQuestions: 'Continue', result: 'Show my results',
      required: 'Please answer both questions to continue.', roleRequired: 'Please select your role.',
      saveFailed: 'Your result could not be saved in this browser. Check browser storage and try again.',
      resultsTitle: 'Your starting point', resultsIntro: 'Your self-assessment helps you find a next step. It is not a formal skills certificate.',
      current: 'Your level', target: 'Target for your role', unknown: 'Not assessed',
      ratingExplainer: 'The stars show how you rated yourself in each area.',
      repeat: 'Retake assessment', remove: 'Remove result', removed: 'Your assessment was removed.',
      path: 'See my learning path', local: 'Only your role, division and results are saved in this browser. Individual answers are discarded.',
      foundation: 'Foundation', engineering: 'Engineering Literacy', product: 'Product and Process Literacy',
      advisory: 'Advisory and Business Consulting', leadership: 'Leadership and Strategy'
    },
    de: {
      roleTitle: 'Wähle zuerst deine Rolle', roleIntro: 'Deine Rolle legt die Zielstufe für jeden Bereich fest. Du kannst sie vor dem Abschluss ändern.',
      roleLabel: 'Rollenprofil', rolePlaceholder: 'Rolle auswählen', start: 'Assessment starten',
      resultRole: 'Deine Rolle', resultDivision: 'Deine Division',
      guideTitle: 'Dein Weg', guideRole: 'Rolle auswählen', guideQuestions: 'Zehn Fragen mit Sternen einschätzen', guidePath: 'Lernpfad entdecken',
      divisionTitle: 'Eine letzte Angabe', divisionIntro: 'In welcher Division arbeitest du?',
      divisionWhy: 'Deine Division wird mit dem Ergebnis gespeichert. Sie verändert weder die Fragen noch deine Bewertung.',
      divisionLabel: 'Division', divisionPlaceholder: 'Division auswählen', divisionRequired: 'Bitte wähle deine Division.',
      areaProgress: 'Bereich {current} von 5',
      na: 'Nicht relevant', starLabel: '{value} von 5 Sternen',
      back: 'Zurück', next: 'Nächster Bereich', finishQuestions: 'Weiter', result: 'Ergebnis anzeigen',
      required: 'Bitte beantworte beide Fragen, bevor du fortfährst.', roleRequired: 'Bitte wähle deine Rolle.',
      saveFailed: 'Dein Ergebnis konnte in diesem Browser nicht gespeichert werden. Prüfe den lokalen Speicher und versuche es erneut.',
      resultsTitle: 'Dein Ausgangspunkt', resultsIntro: 'Deine Selbsteinschätzung hilft dir, den nächsten Schritt zu finden. Sie ist kein Kompetenznachweis.',
      current: 'Dein Stand', target: 'Ziel für deine Rolle', unknown: 'Nicht eingeschätzt',
      ratingExplainer: 'Die Sterne zeigen, wie du dich in den einzelnen Bereichen eingeschätzt hast.',
      repeat: 'Assessment wiederholen', remove: 'Ergebnis entfernen', removed: 'Dein Assessment wurde entfernt.',
      path: 'Meinen Lernpfad ansehen', local: 'Nur deine Rolle, Division und Ergebnisse werden in diesem Browser gespeichert. Einzelne Antworten werden verworfen.',
      foundation: 'Grundverständnis', engineering: 'Engineering Literacy', product: 'Produkt & Prozess Verständnis',
      advisory: 'Advisory & Business Consulting', leadership: 'Leadership & Strategy'
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
  function starIcon() {
    var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
    var shape = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    shape.setAttribute('d', 'M12 2.6 14.9 8.5l6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3 1.1-6.5-4.7-4.6 6.5-.9L12 2.6Z');
    svg.appendChild(shape); return svg;
  }
  function go(step) {
    state.step = step; state.error = ''; render();
    var title = host.querySelector('h1, h2'); if (title) title.focus({ preventScroll: true });
    host.scrollIntoView({ block: 'start' });
  }
  function emit(record) { doc.dispatchEvent(new CustomEvent('assessment-import:change', { detail: record })); }
  function progress(index) {
    var wrapper = node('div', 'assessment-stepper');
    wrapper.appendChild(node('p', 'assessment-step-label', t('areaProgress').replace('{current}', index + 1)));
    var track = node('div', 'assessment-step-track');
    track.setAttribute('role', 'progressbar'); track.setAttribute('aria-valuenow', String(index + 1));
    track.setAttribute('aria-valuemin', '1'); track.setAttribute('aria-valuemax', '5');
    track.setAttribute('aria-label', t('areaProgress').replace('{current}', index + 1));
    AREA_KEYS.forEach(function (_, position) { track.appendChild(node('span', position <= index ? 'is-complete' : '')); });
    wrapper.appendChild(track); host.appendChild(wrapper);
  }
  function selectField(labelText, id, placeholderText, values, selected, onChange, parent) {
    var label = node('label', 'assessment-field', labelText);
    var select = node('select'); select.id = id; select.required = true;
    var placeholder = node('option', '', placeholderText); placeholder.value = ''; select.appendChild(placeholder);
    values.forEach(function (value) { var option = node('option', '', value.label); option.value = value.id; select.appendChild(option); });
    select.value = selected;
    select.addEventListener('change', function () { onChange(select.value); state.error = ''; });
    label.appendChild(select); (parent || host).appendChild(label);
  }
  function roleStep() {
    var layout = node('div', 'assessment-start-layout');
    var main = node('div', 'assessment-start-main');
    main.appendChild(heading(t('roleTitle')));
    main.appendChild(node('p', 'assessment-intro', t('roleIntro')));
    selectField(t('roleLabel'), 'assessmentRole', t('rolePlaceholder'), api.PROFILES, state.role, function (value) { state.role = value; }, main);
    var actions = node('div', 'assessment-actions');
    actions.appendChild(button(t('start'), function () {
      if (!state.role) { state.error = t('roleRequired'); render(); host.querySelector('#assessmentRole').focus(); return; }
      go(1);
    }));
    main.appendChild(actions); layout.appendChild(main);
    var guide = node('aside', 'assessment-start-guide');
    guide.appendChild(node('h3', '', t('guideTitle')));
    var list = node('ol', 'assessment-guide-list');
    ['guideRole', 'guideQuestions', 'guidePath'].forEach(function (key, index) {
      var item = node('li');
      var marker = node('span', 'assessment-guide-index', String(index + 1));
      marker.setAttribute('aria-hidden', 'true');
      item.appendChild(marker); item.appendChild(node('span', '', t(key))); list.appendChild(item);
    });
    guide.appendChild(list); layout.appendChild(guide); host.appendChild(layout);
  }
  function questionStep(index) {
    var dimension = api.DIMENSIONS[index];
    progress(index);
    host.appendChild(heading(t(AREA_KEYS[index])));
    dimension.questionIds.forEach(function (id) {
      var question = root.LrnData.questions.find(function (item) { return item.id === id; });
      var field = node('fieldset', 'assessment-question');
      field.appendChild(node('legend', '', lang() === 'de' ? question.textDe : question.text));
      var choices = node('div', 'assessment-choices');
      var stars = node('div', 'assessment-stars');
      var starLabels = [];
      function paint() {
        var value = state.answers[id];
        starLabels.forEach(function (label, position) { label.classList.toggle('is-filled', Number.isInteger(value) && position < value); });
      }
      [1, 2, 3, 4, 5].forEach(function (value) {
        var label = node('label', 'assessment-star');
        var input = node('input'); input.type = 'radio'; input.name = id; input.value = String(value);
        input.setAttribute('aria-label', t('starLabel').replace('{value}', value));
        input.checked = state.answers[id] === value;
        input.addEventListener('change', function () { state.answers[id] = value; state.error = ''; paint(); });
        label.appendChild(input); label.appendChild(starIcon());
        stars.appendChild(label); starLabels.push(label);
      });
      choices.appendChild(stars);
      var naLabel = node('label', 'assessment-choice assessment-choice--na');
      var naInput = node('input'); naInput.type = 'radio'; naInput.name = id; naInput.value = 'na';
      naInput.checked = state.answers[id] === 'na';
      naInput.addEventListener('change', function () { state.answers[id] = 'na'; state.error = ''; paint(); });
      naLabel.appendChild(naInput); naLabel.appendChild(node('span', '', t('na')));
      choices.appendChild(naLabel);
      paint(); field.appendChild(choices); host.appendChild(field);
    });
    var actions = node('div', 'assessment-actions');
    actions.appendChild(button(t('back'), function () { go(index); }, true));
    actions.appendChild(button(index === 4 ? t('finishQuestions') : t('next'), function () {
      var missing = dimension.questionIds.find(function (id) { return !Object.prototype.hasOwnProperty.call(state.answers, id); });
      if (missing) {
        state.error = t('required'); render();
        var first = host.querySelector('[name="' + missing + '"]'); if (first) first.focus();
        return;
      }
      go(index + 2);
    }));
    host.appendChild(actions);
  }
  function divisionStep() {
    host.appendChild(heading(t('divisionTitle')));
    host.appendChild(node('p', 'assessment-intro', t('divisionIntro')));
    host.appendChild(node('p', 'assessment-context', t('divisionWhy')));
    selectField(t('divisionLabel'), 'assessmentDivision', t('divisionPlaceholder'), api.DIVISIONS, state.division, function (value) { state.division = value; });
    var actions = node('div', 'assessment-actions');
    actions.appendChild(button(t('back'), function () { go(5); }, true));
    actions.appendChild(button(t('result'), function () {
      if (!state.division) { state.error = t('divisionRequired'); render(); host.querySelector('#assessmentDivision').focus(); return; }
      try {
        var record = api.evaluate(state.role, state.division, state.answers);
        var savedRecord = api.save(record);
        var previous = root.localStorage.getItem('lhind:lrn-cockpit:v3');
        var cockpit; try { cockpit = JSON.parse(previous) || {}; } catch (_) { cockpit = {}; }
        cockpit.profileId = record.profileId; cockpit.keyAreaId = null; cockpit.specializationId = null;
        root.localStorage.setItem('lhind:lrn-cockpit:v3', JSON.stringify(cockpit));
        saved = savedRecord; emit(savedRecord); go(7);
      } catch (_) { state.error = t('saveFailed'); render(); }
    }));
    host.appendChild(actions);
  }
  function resultStep() {
    saved = api.load();
    if (!saved) { state.step = 0; roleStep(); return; }
    var title = node('h1', 'assessment-result-title', t('resultsTitle')); title.tabIndex = -1; host.appendChild(title);
    host.appendChild(node('p', 'assessment-intro', t('resultsIntro')));
    host.appendChild(root.AIFSAssessmentResult.render(saved, {
      language: lang(), labels: { role: t('resultRole'), division: t('resultDivision'), explainer: t('ratingExplainer'),
        current: t('current'), target: t('target'), unknown: t('unknown'), areas: AREA_KEYS.map(t) }
    }));
    var lead = node('div', 'assessment-primary-next');
    var path = node('a', 'assessment-action', t('path')); path.href = 'index.html#readinessMap'; lead.appendChild(path); host.appendChild(lead);
    host.appendChild(node('p', 'assessment-local', t('local')));
    var actions = node('div', 'assessment-actions');
    actions.appendChild(button(t('repeat'), function () { state.answers = {}; go(0); }, true));
    actions.appendChild(button(t('remove'), function () { api.clear(); saved = null; state.answers = {}; state.role = ''; state.division = ''; emit(null); go(0); state.error = t('removed'); render(); }, true));
    host.appendChild(actions);
  }
  function render() {
    host.replaceChildren(); host.className = 'native-assessment';
    var page = doc.getElementById('main');
    if (page) {
      page.classList.toggle('assess-page--focused', state.step >= 1 && state.step <= 6);
      page.classList.toggle('assess-page--result', state.step === 7);
    }
    if (state.step === 0) roleStep(); else if (state.step >= 1 && state.step <= 5) questionStep(state.step - 1);
    else if (state.step === 6) divisionStep(); else resultStep();
    var recommendations = doc.getElementById('assessRecommendations');
    if (recommendations) recommendations.hidden = state.step !== 7 || !saved;
    if (state.error) {
      var error = node('p', 'assessment-error', state.error); error.setAttribute('role', 'alert');
      var actions = host.querySelector('.assessment-actions');
      actions.parentNode.insertBefore(error, actions);
    }
  }
  doc.addEventListener('sitelang:change', render);
  render();
})(window);
