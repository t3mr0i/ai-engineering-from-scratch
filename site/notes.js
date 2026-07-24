(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();

  var inited = false;

  function init() {
    if (inited) return;
    inited = true;
    render();
    updateNotesNavCount();

    var exportBtn = document.getElementById("notesExportBtn");
    if (exportBtn) exportBtn.addEventListener("click", exportMarkdown);

    var printBtn = document.getElementById("notesPrintBtn");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
  }

  function lessonIndex() {
    var index = {};
    var phases = (typeof PHASES !== "undefined" && PHASES) || [];
    phases.forEach(function (phase) {
      (phase.lessons || []).forEach(function (lesson) {
        var m = (lesson.url || "").match(/(phases\/[^/]+\/[^/]+)\/?/);
        if (!m) return;
        index[m[1]] = { title: lesson.name, phase: phase.name };
      });
    });
    return index;
  }

  function render() {
    var list = document.getElementById("notesList");
    var actions = document.getElementById("notesActions");
    if (!list || !window.AIFSProgress) return;

    var saved = window.AIFSProgress.getAllSavedKeyTerms();
    var snippets = window.AIFSProgress.getAllSnippets
      ? window.AIFSProgress.getAllSnippets() : [];

    if (!saved.length && !snippets.length) {
      actions.hidden = true;
      list.innerHTML = '<div class="notes-empty">Noch nichts gespeichert. '
        + 'Markiere in einer Lektion eine Textstelle und klicke auf '
        + '<strong>"+ Merkzettel"</strong>, oder speichere unten die '
        + '<strong>"Key Terms"</strong> einer Lektion.</div>';
      return;
    }

    actions.hidden = false;
    var index = lessonIndex();
    var html = "";

    // Notizen: free-text snippets, chronological across all lessons. Only
    // shown when at least one snippet exists (kept separate from Key Terms).
    if (snippets.length) {
      html += '<section class="notes-snippets">';
      html += '<h2 class="notes-section-title">Notizen</h2>';
      snippets.forEach(function (s) {
        var meta = index[s.path] || { title: s.path, phase: "" };
        html += '<div class="notes-snippet" data-id="' + escapeAttr(s.id) + '">';
        html += '<blockquote class="notes-snippet__text">' + escapeHtml(s.text) + '</blockquote>';
        html += '<div class="notes-snippet__meta">';
        html += '<a class="notes-snippet__source" href="lesson.html?path=' + encodeURIComponent(s.path) + '">'
          + escapeHtml(meta.title) + '</a>';
        html += '<span class="notes-snippet__date">' + escapeHtml(shortDate(s.savedAt)) + '</span>';
        html += '<button type="button" class="notes-lesson__remove notes-snippet__remove" data-id="' + escapeAttr(s.id) + '">Entfernen</button>';
        html += '</div></div>';
      });
      html += '</section>';
    }

    if (saved.length) html += '<h2 class="notes-section-title">Key Terms</h2>';
    saved.forEach(function (entry) {
      var meta = index[entry.path] || { title: entry.path, phase: "" };
      html += '<div class="notes-lesson" data-path="' + escapeAttr(entry.path) + '">';
      html += '<div class="notes-lesson__head">';
      html += '<div>';
      if (meta.phase) html += '<div class="notes-lesson__phase">' + escapeHtml(meta.phase) + '</div>';
      html += '<p class="notes-lesson__title"><a href="lesson.html?path=' + encodeURIComponent(entry.path) + '">'
        + escapeHtml(meta.title) + '</a></p>';
      html += '</div>';
      html += '<button type="button" class="notes-lesson__remove" data-path="' + escapeAttr(entry.path) + '">Entfernen</button>';
      html += '</div>';
      html += '<table class="notes-terms"><thead><tr><th>Term</th><th>Was man sagt</th><th>Was es bedeutet</th></tr></thead><tbody>';
      entry.terms.forEach(function (t) {
        html += '<tr><td>' + escapeHtml(t.term) + '</td><td class="notes-term-says">' + escapeHtml(t.says) + '</td><td>' + escapeHtml(t.means) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    });
    list.innerHTML = html;

    list.querySelectorAll(".notes-lesson__remove[data-path]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.AIFSProgress.removeKeyTerms(btn.getAttribute("data-path"));
        render();
        updateNotesNavCount();
      });
    });

    list.querySelectorAll(".notes-snippet__remove").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.AIFSProgress.removeSnippet(btn.getAttribute("data-id"));
        render();
        updateNotesNavCount();
      });
    });
  }

  function shortDate(ts) {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleDateString("de-DE",
        { day: "2-digit", month: "short", year: "numeric" });
    } catch (e) { return ""; }
  }

  function updateNotesNavCount() {
    var el = document.getElementById("navNotesCount");
    if (!el || !window.AIFSProgress) return;
    var n = window.AIFSProgress.getAllSavedKeyTerms().length;
    if (window.AIFSProgress.getAllSnippets) n += window.AIFSProgress.getAllSnippets().length;
    if (n > 0) { el.textContent = String(n); el.setAttribute("data-show", "true"); }
    else { el.setAttribute("data-show", "false"); }
  }

  function exportMarkdown() {
    if (!window.AIFSProgress) return;
    var saved = window.AIFSProgress.getAllSavedKeyTerms();
    var snippets = window.AIFSProgress.getAllSnippets
      ? window.AIFSProgress.getAllSnippets() : [];
    if (!saved.length && !snippets.length) return;
    var index = lessonIndex();
    var md = "# Meine Merkzettel\n\n";
    saved.forEach(function (entry) {
      var meta = index[entry.path] || { title: entry.path, phase: "" };
      md += "## " + meta.title + "\n\n";
      md += "| Term | Was man sagt | Was es bedeutet |\n";
      md += "|------|--------------|------------------|\n";
      entry.terms.forEach(function (t) {
        md += "| " + t.term + " | " + t.says + " | " + t.means + " |\n";
      });
      md += "\n";
    });

    if (snippets.length) {
      md += "## Notizen\n\n";
      snippets.forEach(function (s) {
        var meta = index[s.path] || { title: s.path, phase: "" };
        md += "> " + String(s.text).replace(/\n+/g, " ").trim() + "\n>\n";
        md += "> — [" + meta.title + "](lesson.html?path=" + encodeURIComponent(s.path) + ")"
          + " · " + shortDate(s.savedAt) + "\n\n";
      });
    }

    var blob = new Blob([md], { type: "text/markdown" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "meine-merkzettel.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
})();
