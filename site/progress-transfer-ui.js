/**
 * DOM wiring for the export/import controls on notes.html. Pure logic
 * (encoding, validation) lives in progress-transfer.js and is unit-tested
 * there; this file only wires clicks to it.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();

  function init() {
    var transfer = window.AIFSProgressTransfer;
    var exportBtn = document.getElementById('progressExportBtn');
    var copyBtn = document.getElementById('progressCopyBtn');
    var output = document.getElementById('progressExportOutput');
    var importInput = document.getElementById('progressImportInput');
    var importBtn = document.getElementById('progressImportBtn');
    var status = document.getElementById('progressTransferStatus');
    if (!transfer || !exportBtn || !importBtn) return;

    function setStatus(message, isError) {
      if (!status) return;
      status.textContent = message;
      status.classList.toggle('progress-transfer__status--error', Boolean(isError));
    }

    exportBtn.addEventListener('click', function () {
      var code = transfer.exportCode();
      output.value = code;
      output.hidden = false;
      copyBtn.hidden = false;
      output.focus();
      output.select();
      setStatus('Export-Code erzeugt.', false);
    });

    copyBtn.addEventListener('click', function () {
      var done = function () { setStatus('In die Zwischenablage kopiert.', false); };
      var fail = function () {
        output.focus();
        output.select();
        setStatus('Automatisches Kopieren nicht möglich — Text ist markiert, selbst kopieren (Strg/Cmd+C).', true);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(output.value).then(done, fail);
      } else {
        fail();
      }
    });

    importBtn.addEventListener('click', function () {
      var code = importInput.value;
      if (!code.trim()) {
        setStatus('Bitte zuerst einen Export-Code einfügen.', true);
        return;
      }
      var confirmed = window.confirm(
        'Das überschreibt deinen aktuellen Fortschritt auf diesem Gerät. Fortfahren?'
      );
      if (!confirmed) return;
      try {
        transfer.importCode(code);
        setStatus('Fortschritt importiert. Seite wird neu geladen …', false);
        window.location.reload();
      } catch (error) {
        setStatus(error.message, true);
      }
    });
  }
})();
