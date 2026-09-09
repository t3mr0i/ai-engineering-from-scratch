/* Local PDF intake: preview validated results before changing the learner baseline. */
(function (root) {
  'use strict';
  var api = root.AIFSAssessmentImport;
  if (!api || !root.document) return;
  // Official AI Self-Assessment (SharePoint) — source of truth. This widget
  // only imports the exported result PDF; no rating happens here.
  var SHAREPOINT_URL = 'https://lufthansagroup.sharepoint.com/sites/LHIND_APP_AISelfAssessment/SitePages/de/TopicHome.aspx';
  var copy = {
    en: {
      title: 'Add your assessment', active: 'Your assessment result is connected',
      intro: 'Already completed your self-assessment in SharePoint? You can add your result PDF here.',
      local: 'Your PDF is read on this device. Only the extracted assessment is saved in this browser.',
      upload: 'Upload assessment PDF', replace: 'Upload a newer PDF', alternative: 'Open official self-assessment',
      dropHint: 'Or drag your PDF file onto this section.',
      helpTitle: 'Which PDF is the right one?',
      helpStep1: 'Finish the official self-assessment in SharePoint and open your result page.',
      helpStep2: 'Export or print the result page as PDF – keep all five result rows (Foundation, Engineering Literacy, Product and Process Literacy, Advisory and Biz Literacy, Leadership Strategy).',
      helpStep3: 'Upload that original export here – screenshots or edited files cannot be read.',
      reading: 'Reading your assessment…', review: 'Review your starting point',
      reviewIntro: 'Check the five areas before applying them to your recommendations.',
      dimension: 'Area', current: 'Your level', target: 'Role target', score: 'Score',
      apply: 'Use these results', cancel: 'Cancel', remove: 'Remove assessment',
      saved: 'Assessment applied. Your recommendations now use these starting levels.',
      removed: 'Assessment removed. Recommendations use your selected role profile again.',
      details: 'View levels and role targets', note: 'Imported starting levels from your SharePoint result. Course completion and earned evidence stay separate.',
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
      title: 'Dein Assessment ergänzen', active: 'Dein Assessment-Ergebnis ist verbunden',
      intro: 'Du hast dein Self-Assessment in SharePoint bereits gemacht? Hier kannst du deine Ergebnis-PDF hinzufügen.',
      local: 'Deine PDF wird auf diesem Gerät gelesen. Nur die ausgelesene Einstufung wird in diesem Browser gespeichert.',
      upload: 'Assessment-PDF hochladen', replace: 'Neuere PDF hochladen', alternative: 'Zum Self-Assessment in SharePoint',
      dropHint: 'Oder ziehe deine PDF-Datei in diesen Bereich.',
      helpTitle: 'Welche PDF ist die richtige?',
      helpStep1: 'Schließe das offizielle Self-Assessment in SharePoint ab und öffne deine Ergebnisseite.',
      helpStep2: 'Exportiere oder drucke die Ergebnisseite als PDF – behalte alle fünf Ergebniszeilen (Foundation, Engineering Literacy, Product and Process Literacy, Advisory and Biz Literacy, Leadership Strategy).',
      helpStep3: 'Lade diesen originalen Export hier hoch – Screenshots oder bearbeitete Dateien können nicht gelesen werden.',
      reading: 'Dein Assessment wird gelesen…', review: 'Deine Ergebnisse ansehen',
      reviewIntro: 'Schau in Ruhe, ob die Ergebnisse zu deinem Assessment passen. Danach übernehmen wir sie für deine Empfehlungen.',
      dimension: 'Bereich', current: 'Dein Level', target: 'Rollenziel', score: 'Wert',
      apply: 'Ergebnisse übernehmen', cancel: 'Abbrechen', remove: 'Assessment entfernen',
      saved: 'Assessment übernommen. Deine Empfehlungen knüpfen jetzt an dein Wissen an.',
      removed: 'Assessment entfernt. Empfehlungen nutzen wieder dein gewähltes Rollenprofil.',
      details: 'Level und Rollenziele ansehen', note: 'Diese Stufen stammen aus deinem SharePoint-Ergebnis. Deine Kurse und praktischen Nachweise findest du weiterhin in deinem Lernfortschritt.',
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
    function focusStatus(preventScroll) {
      // Home advances to role confirmation after applying a result. Do not
      // move focus back into the now-hidden import step.
      if (host.closest('[hidden]')) return;
      var status = host.querySelector('.assessment-import__status');
      if (status && status.textContent) {
        try { status.focus({ preventScroll: !!preventScroll }); }
        catch (e) { status.focus(); }
      }
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
    var LEVEL_RANK = { Acquire: 1, Deepen: 2, Create: 3 };
    // Compact level bars: dark = your imported level, outlined = still to go
    // towards the role target. Rendered above the detail table, both in the
    // review preview and in the saved state.
    function resultViz(record) {
      var viz = el('div', '', 'assessment-import__viz');
      Object.keys(record.dimensions).forEach(function (name) {
        var item = record.dimensions[name];
        var currentRank = LEVEL_RANK[item.currentLevel] || 0;
        var targetRank = LEVEL_RANK[item.targetLevel] || 0;
        var row = el('div', '', 'assessment-import__viz-row');
        row.appendChild(el('span', name, 'assessment-import__viz-name'));
        var bars = el('div', '', 'assessment-import__bars');
        ['Acquire', 'Deepen', 'Create'].forEach(function (level, index) {
          var rank = index + 1;
          var seg = el('span', '', 'assessment-import__bar');
          seg.setAttribute('aria-hidden', 'true');
          seg.title = level;
          if (rank <= currentRank) seg.dataset.current = 'true';
          else if (rank <= targetRank) seg.dataset.gap = 'true';
          bars.appendChild(seg);
        });
        row.appendChild(bars);
        row.appendChild(el('span', item.currentLevel + ' → ' + item.targetLevel, 'assessment-import__viz-meta'));
        viz.appendChild(row);
      });
      viz.appendChild(el('p', t('current') + ' ■ · ' + t('target') + ' □', 'assessment-import__viz-legend'));
      return viz;
    }
    function resultView(record) {
      var frag = root.document.createDocumentFragment();
      frag.appendChild(resultViz(record));
      frag.appendChild(table(record));
      return frag;
    }
    function helpBlock() {
      var help = el('details', '', 'assessment-import__help');
      help.appendChild(el('summary', t('helpTitle')));
      var list = el('ul');
      ['helpStep1', 'helpStep2', 'helpStep3'].forEach(function (key) { list.appendChild(el('li', t(key))); });
      help.appendChild(list);
      return help;
    }
    // After applying a result, jump to where the recommendations live: the
    // journey slot on assessment.html, the cockpit on the home page.
    function jumpToRecommendations() {
      var setup = root.document.getElementById('readinessSetup');
      if (setup && !setup.hidden) {
        var roleHeading = root.document.querySelector('#readinessRoleStep h3');
        setup.scrollIntoView({ behavior: 'auto', block: 'start' });
        if (roleHeading) roleHeading.focus({ preventScroll: true });
        return;
      }
      var target = root.document.getElementById('assessmentJourney') || root.document.getElementById('journeyCockpit');
      if (!target || !target.scrollIntoView) return;
      try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      catch (e) { target.scrollIntoView(); }
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
      var heading = el(root.document.getElementById('readinessSetup') ? 'h4' : 'h2', t(record ? 'active' : 'title')); heading.id = 'assessmentImportTitle'; host.appendChild(heading);
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
        var details = el('details'); details.appendChild(el('summary', t('details'))); details.appendChild(resultView(record));
        details.appendChild(el('p', t('date') + ': ' + new Date(record.importedAt).toLocaleDateString(language()))); host.appendChild(details);
      }
      var actions = el('div', '', 'assessment-import__actions');
      var input = el('input'); input.type = 'file'; input.accept = '.pdf,application/pdf'; input.hidden = true;
      input.addEventListener('change', function () { selectFile(input.files[0]); input.value = ''; }); host.appendChild(input);
      actions.appendChild(button(record ? 'replace' : 'upload', function () { input.click(); }));
      if (record) {
        actions.appendChild(button('remove', function () {
          try { api.clear(); pending = null; message = 'removed'; error = false; emit(null); render(); focusStatus(); }
          catch (e) { message = 'storage'; error = true; render(); }
        }, true));
        var view = el('a', t('view'));
        view.href = /\/(?:index\.html)?$/.test(root.location.pathname) ? '#readinessSetup' : 'index.html#readinessDashboard';
        if (root.document.getElementById('readinessSetup')) view.dataset.readyAction = 'role';
        actions.appendChild(view);
      } else if (!/assessment\.html$/.test(root.location.pathname)) {
        // No manual rating exists anywhere in the catalog: the official
        // assessment lives in SharePoint, so link there directly.
        var alternative = el('a', t('alternative')); alternative.href = SHAREPOINT_URL;
        alternative.target = '_blank'; alternative.rel = 'noopener'; actions.appendChild(alternative);
      }
      host.appendChild(actions);
      host.appendChild(el('p', t('dropHint'), 'assessment-import__drop-hint'));
      host.appendChild(helpBlock());
      host.appendChild(el('p', t('local'), 'assessment-import__privacy'));
      var status = el('p', message ? t(message) : '', 'assessment-import__status');
      status.tabIndex = -1;
      status.setAttribute('role', error ? 'alert' : 'status'); host.appendChild(status);
      if (pending) {
        var preview = el('div', '', 'assessment-import__preview');
        var title = el('h3', t('review')); title.tabIndex = -1; title.dataset.reviewHeading = ''; preview.appendChild(title);
        preview.appendChild(el('p', t('reviewIntro'))); preview.appendChild(resultView(pending));
        var controls = el('div', '', 'assessment-import__actions');
        controls.appendChild(button('apply', function () {
          try { var saved = apply(pending); pending = null; message = 'saved'; error = false; emit(saved); render(); jumpToRecommendations(); focusStatus(true); }
          catch (e) { message = 'storage'; error = true; render(); }
        }));
        controls.appendChild(button('cancel', function () { pending = null; message = ''; render(); focusStatus(); }, true));
        preview.appendChild(controls); host.appendChild(preview);
      }
    }
    // Drag & drop enhancement: the upload button stays the primary,
    // keyboard-accessible path; dropping a file anywhere on this section
    // feeds the same validation as the file picker.
    var dragDepth = 0;
    function hasFiles(event) {
      var types = event.dataTransfer && event.dataTransfer.types;
      return !!types && Array.prototype.indexOf.call(types, 'Files') !== -1;
    }
    host.addEventListener('dragenter', function (event) {
      if (busy || !hasFiles(event)) return;
      event.preventDefault();
      dragDepth++;
      host.classList.add('assessment-import--drop-over');
    });
    host.addEventListener('dragover', function (event) { if (!busy && hasFiles(event)) event.preventDefault(); });
    host.addEventListener('dragleave', function () {
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) host.classList.remove('assessment-import--drop-over');
    });
    host.addEventListener('drop', function (event) {
      dragDepth = 0;
      host.classList.remove('assessment-import--drop-over');
      if (busy) return;
      var files = event.dataTransfer && event.dataTransfer.files;
      if (!files || !files.length) return;
      event.preventDefault();
      selectFile(files[0]);
    });
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
