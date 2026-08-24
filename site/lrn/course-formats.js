(function () {
  "use strict";

  // One visual language for learning formats across the catalog and course
  // detail page. A course may pin `formatType`; otherwise the first matching
  // format/title rule wins. Icons are Phosphor Light names already used by LRN.
  var DEFINITIONS = {
    experiment: { icon: "test-tube", labelKey: "course_format_experiment", label: "Experiment" },
    deck: { icon: "presentation-chart", labelKey: "course_format_deck", label: "Deck" },
    elearning: { icon: "book-open", labelKey: "course_format_elearning", label: "E-learning" },
    workshop: { icon: "users-three", labelKey: "course_format_workshop", label: "Workshop" },
    lab: { icon: "terminal-window", labelKey: "course_format_lab", label: "Hands-on lab" },
    toolkit: { icon: "wrench", labelKey: "course_format_toolkit", label: "Toolkit" }
  };

  // Rules describe the learning mechanic, not the subject. Keep concrete
  // formats ahead of broad toolkit words so, for example, a prompt lab does
  // not become a generic checklist course.
  var RULES = [
    [/\bexperiment|mini-games|real gpt tokenizer/, "experiment"],
    [/\bdeck\b|\bslides?\b|presentation|architecture cards/, "deck"],
    [/self-paced|text-based lrn module|text lesson|knowledge checks?|certificate quiz/, "elearning"],
    [/\bworkshop\b|prompt clinic|prioritization board|facilitation script|brown-bag|peer review/, "workshop"],
    [/\blab\b|code task|sandboxed implementation|project labs|escalation drill/, "lab"]
  ];

  function resolve(course) {
    var explicit = String((course && course.formatType) || "").toLowerCase();
    if (DEFINITIONS[explicit]) return withId(explicit);

    var haystack = [course && course.title, course && course.format]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    for (var i = 0; i < RULES.length; i += 1) {
      if (RULES[i][0].test(haystack)) return withId(RULES[i][1]);
    }
    return withId("toolkit");
  }

  function withId(id) {
    return {
      id: id,
      icon: DEFINITIONS[id].icon,
      labelKey: DEFINITIONS[id].labelKey,
      label: DEFINITIONS[id].label
    };
  }

  window.LrnCourseFormats = {
    definitions: DEFINITIONS,
    resolve: resolve
  };
})();
