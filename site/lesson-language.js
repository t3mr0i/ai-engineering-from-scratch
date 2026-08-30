/**
 * LessonLanguage — resolves localized lesson documents with English as the
 * canonical variant. German is preferred only when the learner selected DE;
 * a missing or unavailable German document falls back to docs/en.md.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LessonLanguage = api;
}(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function normalize(language) {
    return language === "de" ? "de" : "en";
  }

  function candidates(language) {
    return normalize(language) === "de" ? ["de", "en"] : ["en"];
  }

  function contentPaths(lessonPath, language) {
    var base = String(lessonPath || "").replace(/\/+$/, "");
    return candidates(language).map(function (candidate) {
      return {
        lang: candidate,
        path: base + "/docs/" + candidate + ".md"
      };
    });
  }

  function load(lessonPath, language, request) {
    if (typeof request !== "function") {
      return Promise.reject(new TypeError("LessonLanguage.load requires a request function"));
    }

    var paths = contentPaths(lessonPath, language);

    function attempt(index) {
      var candidate = paths[index];
      return Promise.resolve()
        .then(function () { return request(candidate.path); })
        .then(function (response) {
          if (!response || !response.ok) {
            var status = response && response.status ? " (HTTP " + response.status + ")" : "";
            throw new Error("Could not load " + candidate.path + status);
          }
          return Promise.resolve(response.text()).then(function (text) {
            return { lang: candidate.lang, path: candidate.path, text: text };
          });
        })
        .catch(function (error) {
          if (index + 1 < paths.length) return attempt(index + 1);
          throw error;
        });
    }

    return attempt(0);
  }

  return {
    normalize: normalize,
    candidates: candidates,
    contentPaths: contentPaths,
    load: load
  };
}));
