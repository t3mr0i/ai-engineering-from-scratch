/* Local PDF intake: preview validated results before changing the learner baseline. */
(function (root) {
  'use strict';
  var api = root.AIFSAssessmentImport;
  if (!api || !root.document) return;
  var copy = {
    en: {
      title: 'Start with your self-assessment', active: 'Your self-assessment is connected',
      intro: 'Upload your result PDF to start at your existing skill level in each area.',
      local: 'Your PDF is read on this device. Only the extracted assessment is saved in this browser.',
      upload: 'Upload assessment PDF', replace: 'Upload a newer PDF', alternative: 'Take an assessment here',
      reading: 'Reading your assessment…', review: 'Review your starting point',
      reviewIntro: 'Check the five areas before applying them to your recommendations.',
      dimension: 'Area', current: 'Your level', target: 'Role target', score: 'Score',
      apply: 'Use these results', cancel: 'Cancel', remove: 'Remove assessment',
      saved: 'Assessment applied. Your recommendations now use these starting levels.',
      removed: 'Assessment removed. Recommendations use your manual profile and level again.',
      details: 'View levels and role targets', note: 'Self-assessed starting levels. Course completion and earned evidence stay separate.',
      failed: 'This PDF could not be read. Choose an original self-assessment export with all five result rows.',
      storage: 'The result could not be saved in this browser. Allow local storage and try again.',
      file: 'Choose a PDF file up to 10 MB.', role: 'Profile', date: 'Imported',
      view: 'View recommendations', inactive: 'You are browsing a different role. This assessment applies only to its own profile.',
      encrypted: 'This PDF is password-protected. Upload the original unencrypted assessment export.',
      browser: 'Your browser cannot read this PDF. Try a current version of Chrome, Edge, Firefox or Safari.',
      complex: 'This PDF is too large or complex. Upload the original assessment export, up to 10 MB.',
      ambiguous: 'The result contains conflicting rows or an unknown role target. Export the assessment again and try that PDF.'
    },
    de: {
      title: 'Mit deinem Self-Assessment einsteigen', active: 'Dein Self-Assessment ist verbunden',
      intro: 'Lade deine Ergebnis-PDF hoch und setze in jedem Bereich bei deinem bisherigen Kenntnisstand an.',
      local: 'Deine PDF wird auf diesem Gerät gelesen. Nur die ausgelesene Einstufung wird in diesem Browser gespeichert.',
      upload: 'Assessment-PDF hochladen', replace: 'Neuere PDF hochladen', alternative: 'Assessment hier durchführen',
      reading: 'Dein Assessment wird gelesen…', review: 'Deinen Ausgangspunkt prüfen',
      reviewIntro: 'Prüfe die fünf Bereiche, bevor du sie für deine Empfehlungen übernimmst.',
      dimension: 'Bereich', current: 'Dein Level', target: 'Rollenziel', score: 'Wert',
      apply: 'Ergebnisse übernehmen', cancel: 'Abbrechen', remove: 'Assessment entfernen',
      saved: 'Assessment übernommen. Deine Empfehlungen berücksichtigen jetzt diese Ausgangslevel.',
      removed: 'Assessment entfernt. Empfehlungen nutzen wieder dein manuell gewähltes Profil und Level.',
      details: 'Level und Rollenziele ansehen', note: 'Ausgangslevel aus deiner Selbsteinschätzung. Kursabschlüsse und erworbene Nachweise bleiben separat.',
      failed: 'Diese PDF konnte nicht gelesen werden. Wähle einen originalen Self-Assessment-Export mit allen fünf Ergebniszeilen.',
      storage: 'Das Ergebnis konnte in diesem Browser nicht gespeichert werden. Erlaube lokalen Speicher und versuche es erneut.',
      file: 'Wähle eine PDF-Datei mit höchstens 10 MB.', role: 'Profil', date: 'Importiert',
      view: 'Empfehlungen ansehen', inactive: 'Du siehst gerade eine andere Rolle. Dieses Assessment gilt nur für sein eigenes Profil.',
      encrypted: 'Diese PDF ist passwortgeschützt. Lade den originalen, unverschlüsselten Assessment-Export hoch.',
      browser: 'Dein Browser kann diese PDF nicht lesen. Versuche es mit einer aktuellen Version von Chrome, Edge, Firefox oder Safari.',
      complex: 'Diese PDF ist zu groß oder zu komplex. Lade den originalen Assessment-Export mit höchstens 10 MB hoch.',
      ambiguous: 'Das Ergebnis enthält widersprüchliche Zeilen oder ein unbekanntes Rollenziel. Exportiere das Assessment erneut und wähle diese PDF.'
    }
  };
  function language() { return root.SiteLang && root.SiteLang.get() === 'de' ? 'de' : 'en'; }
  function t(key) { return copy[language()][key]; }
  function el(tag, text, className) {
    var node = root.document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function mount(host) {
    var pending = null;
    var busy = false;
    var message = '';
    var error = false;
    var requestId = 0;
    function apply(record) {
      var cockpitKey = 'lhind:lrn-cockpit:v3';
      var previous = root.localStorage.getItem(cockpitKey);
      var cockpit;
      try { cockpit = JSON.parse(previous) || {}; } catch (e) { cockpit = {}; }
      cockpit.profileId = record.profileId;
      cockpit.keyAreaId = null;
      cockpit.specializationId = null;
      root.localStorage.setItem(cockpitKey, JSON.stringify(cockpit));
      try { return api.save(record); }
      catch (e) {
        if (previous === null) root.localStorage.removeItem(cockpitKey);
        else root.localStorage.setItem(cockpitKey, previous);
        throw e;
      }
    }
    function focusStatus() {
      var status = host.querySelector('.assessment-import__status');
      if (status && status.textContent) status.focus();
      else host.querySelector('button').focus();
    }
    function button(key, action, secondary) {
      var b = el('button', t(key), 'assessment-import__button' + (secondary ? ' assessment-import__button--secondary' : ''));
      b.type = 'button'; b.disabled = busy; b.addEventListener('click', action); return b;
    }
    function emit(record) {
      root.document.dispatchEvent(new CustomEvent('assessment-import:change', { detail: record }));
    }
    function table(record) {
      var wrapper = el('div', '', 'assessment-import__table-wrap');
      var grid = el('table');
      var caption = el('caption', t('role') + ': ' + record.role);
      grid.appendChild(caption);
      var head = el('thead'), row = el('tr');
      ['dimension', 'score', 'current', 'target'].forEach(function (key) { var th = el('th', t(key)); th.scope = 'col'; row.appendChild(th); });
      head.appendChild(row); grid.appendChild(head);
      var body = el('tbody');
      Object.keys(record.dimensions).forEach(function (name) {
        var item = record.dimensions[name]; var tr = el('tr'); var label = el('th', name); label.scope = 'row'; tr.appendChild(label);
        tr.appendChild(el('td', Number(item.score).toLocaleString(language(), { minimumFractionDigits: 2, maximumFractionDigits: 2 })));
        tr.appendChild(el('td', item.currentLevel)); tr.appendChild(el('td', item.targetLevel)); body.appendChild(tr);
      });
      grid.appendChild(body); wrapper.appendChild(grid); return wrapper;
    }
    async function selectFile(file) {
      if (!file || busy) return;
      var id = ++requestId;
      pending = null; error = false;
      if (!/\.pdf$/i.test(file.name) || !file.size || file.size > 10 * 1024 * 1024) {
        message = 'file'; error = true; render(); return;
      }
      busy = true; message = 'reading'; render();
      try {
        var result = await api.parsePdfBytes(new Uint8Array(await file.arrayBuffer()));
        if (id !== requestId) return;
        pending = result; message = '';
      } catch (e) {
        message = ({ PDF_ENCRYPTED: 'encrypted', BROWSER_UNSUPPORTED: 'browser', PDF_TOO_LARGE: 'complex', PDF_TOO_COMPLEX: 'complex', AMBIGUOUS_ASSESSMENT: 'ambiguous', AMBIGUOUS_PROFILE: 'ambiguous' })[e.code] || 'failed'; error = true;
      }
      finally { if (id === requestId) { busy = false; render(); var focus = host.querySelector('[data-review-heading]'); if (focus) focus.focus(); } }
    }
    function render() {
      var record = api.load();
      host.replaceChildren(); host.className = 'assessment-import';
      host.setAttribute('aria-busy', String(busy));
      var heading = el('h2', t(record ? 'active' : 'title')); heading.id = 'assessmentImportTitle'; host.appendChild(heading);
      host.setAttribute('aria-labelledby', heading.id);
      host.appendChild(el('p', record ? t('note') : t('intro'), 'assessment-import__intro'));
      if (record) {
        var summary = ['Create', 'Deepen', 'Acquire'].map(function (level) {
          return Object.keys(record.dimensions).filter(function (key) { return record.dimensions[key].currentLevel === level; }).length + ' ' + level;
        }).join(' · ');
        host.appendChild(el('p', record.role + ' — ' + summary, 'assessment-import__levels'));
        try {
          var cockpit = JSON.parse(root.localStorage.getItem('lhind:lrn-cockpit:v3'));
          if (cockpit && cockpit.profileId && cockpit.profileId !== record.profileId) host.appendChild(el('p', t('inactive')));
        } catch (e) {}
        var details = el('details'); details.appendChild(el('summary', t('details'))); details.appendChild(table(record));
        details.appendChild(el('p', t('date') + ': ' + new Date(record.importedAt).toLocaleDateString(language()))); host.appendChild(details);
      }
      var actions = el('div', '', 'assessment-import__actions');
      var input = el('input'); input.type = 'file'; input.accept = '.pdf,application/pdf'; input.hidden = true;
      input.addEventListener('change', function () { selectFile(input.files[0]); }); host.appendChild(input);
      actions.appendChild(button(record ? 'replace' : 'upload', function () { input.click(); }));
      if (record) {
        actions.appendChild(button('remove', function () {
          try { api.clear(); pending = null; message = 'removed'; error = false; emit(null); render(); focusStatus(); }
          catch (e) { message = 'storage'; error = true; render(); }
        }, true));
        var view = el('a', t('view')); view.href = /\/(?:index\.html)?$/.test(root.location.pathname) ? '#journeyCockpit' : 'index.html#journeyCockpit'; actions.appendChild(view);
      } else if (!/assessment\.html$/.test(root.location.pathname)) {
        var alternative = el('a', t('alternative')); alternative.href = 'assessment.html'; actions.appendChild(alternative);
      }
      host.appendChild(actions);
      host.appendChild(el('p', t('local'), 'assessment-import__privacy'));
      var status = el('p', message ? t(message) : '', 'assessment-import__status');
      status.tabIndex = -1;
      status.setAttribute('role', error ? 'alert' : 'status'); host.appendChild(status);
      if (pending) {
        var preview = el('div', '', 'assessment-import__preview');
        var title = el('h3', t('review')); title.tabIndex = -1; title.dataset.reviewHeading = ''; preview.appendChild(title);
        preview.appendChild(el('p', t('reviewIntro'))); preview.appendChild(table(pending));
        var controls = el('div', '', 'assessment-import__actions');
        controls.appendChild(button('apply', function () {
          try { var saved = apply(pending); pending = null; message = 'saved'; error = false; emit(saved); render(); focusStatus(); }
          catch (e) { message = 'storage'; error = true; render(); }
        }));
        controls.appendChild(button('cancel', function () { pending = null; message = ''; render(); focusStatus(); }, true));
        preview.appendChild(controls); host.appendChild(preview);
      }
    }
    root.document.addEventListener('sitelang:change', render);
    root.document.addEventListener('change', function (event) {
      if (event.target.id === 'roleSelect' || event.target.id === 'capabilityProfileSelect') render();
    });
    root.addEventListener('storage', function (event) { if (event.key === 'aifs:external-assessment:v1') { pending = null; emit(api.load()); render(); } });
    render();
  }
  function start() { root.document.querySelectorAll('[data-assessment-import]').forEach(mount); }
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start); else start();
})(window);
