(function (root) {
  'use strict';
  function formatOutput(text) {
    text = String(text == null ? '' : text);
    try { return JSON.stringify(JSON.parse(text), null, 2); }
    catch (_) { return text; }
  }
  function present(container, text, state) {
    var de = document.documentElement.lang.indexOf('de') === 0;
    var labels = de
      ? { pass: 'Prüfung bestanden', fail: 'Noch nicht ganz', error: 'Ausführung fehlgeschlagen', done: 'Ausgabe', view: 'Ergebnis ansehen', close: 'Schließen', copy: 'Ausgabe kopieren', copied: 'Kopiert', retry: 'Kopieren fehlgeschlagen', hint: 'Schau dir die Ausgabe an und passe deinen Code bei Bedarf an.', success: 'Der ausgeführte Code hat das erwartete Ergebnis geliefert.', technical: 'Technische Ausgabe' }
      : { pass: 'Check passed', fail: 'Not quite yet', error: 'Execution failed', done: 'Output', view: 'View result', close: 'Close', copy: 'Copy output', copied: 'Copied', retry: 'Copy failed', hint: 'Review the output and adjust your code if needed.', success: 'The executed code produced the expected result.', technical: 'Technical output' };
    var title = labels[state] || labels.done;
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'lesson-output-open';
    button.textContent = labels.view;
    button.setAttribute('aria-haspopup', 'dialog');
    var status = document.createElement('span');
    status.className = 'lesson-output-status';
    status.setAttribute('role', 'status');
    status.textContent = title;
    var row = document.createElement('div');
    row.className = 'lesson-output-result';
    row.append(status, button);
    container.replaceChildren(row);
    button.addEventListener('click', function () { open(); });
    function open() {
      // One result at a time, even when two independent runs finish together.
      var previous = document.querySelector('dialog.lesson-output-dialog');
      if (previous) previous.close();
      var dialog = document.createElement('dialog');
      dialog.className = 'lesson-output-dialog';
      dialog.dataset.state = state || 'done';
      dialog.setAttribute('aria-labelledby', 'lesson-output-title');
      var head = document.createElement('header');
      var heading = document.createElement('h2');
      heading.id = 'lesson-output-title';
      heading.textContent = title;
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'lesson-output-close';
      close.textContent = labels.close;
      close.autofocus = true;
      close.onclick = function () { dialog.close(); };
      head.append(heading, close);
      var hint = document.createElement('p');
      hint.textContent = state === 'pass' ? labels.success : labels.hint;
      var pre = document.createElement('pre');
      // Output is untrusted, including strings that resemble HTML.
      pre.textContent = formatOutput(text);
      var footer = document.createElement('footer');
      var copy = document.createElement('button');
      copy.type = 'button';
      copy.textContent = labels.copy;
      copy.onclick = function () {
        if (!navigator.clipboard) { copy.textContent = labels.retry; return; }
        navigator.clipboard.writeText(String(text)).then(function () { copy.textContent = labels.copied; }, function () { copy.textContent = labels.retry; });
      };
      footer.append(copy);
      dialog.append(head, hint);
      if (state === 'pass' || state === 'fail' || state === 'error') {
        var details = document.createElement('details');
        details.className = 'lesson-output-technical';
        details.open = state !== 'pass';
        var summary = document.createElement('summary');
        summary.textContent = labels.technical;
        details.append(summary, pre, footer);
        dialog.append(details);
      } else {
        dialog.append(pre, footer);
      }
      dialog.addEventListener('click', function (event) {
        var r = dialog.getBoundingClientRect();
        if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
      });
      dialog.addEventListener('close', function () { dialog.remove(); if (button.isConnected) button.focus(); });
      document.body.append(dialog);
      dialog.showModal();
    }
    open();
  }
  root.LessonOutput = { present: present, formatOutput: formatOutput };
  if (typeof module !== 'undefined') module.exports = root.LessonOutput;
})(typeof window !== 'undefined' ? window : globalThis);
