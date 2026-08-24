/**
 * Curated course evidence for capability progress.
 *
 * A curriculum phase is not a capability, and a course's audience levels are
 * not proof that it teaches every maturity stage. This matrix is the explicit
 * seam between the learning catalog and Acquire / Deepen / Create progress.
 */
(function (root, factory) {
  "use strict";

  var evidence = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = evidence;
  if (root) root.AIFSCapabilityEvidence = evidence;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  return {
    1: {
      Acquire: ["LRN-01"],
      Deepen: ["LRN-15"],
      Create: ["LRN-41"]
    },
    2: {
      Acquire: ["LRN-05"],
      Deepen: ["LRN-12"],
      Create: ["LRN-35"]
    },
    3: {
      Acquire: ["LRN-02"],
      Deepen: ["LRN-22"],
      Create: ["LRN-27"]
    },
    4: {
      Acquire: ["LRN-03"],
      Deepen: ["LRN-04"],
      Create: ["LRN-39"]
    },
    5: {
      Acquire: ["LRN-06"],
      Deepen: ["LRN-25"],
      Create: ["LRN-42"]
    },
    6: {
      Acquire: ["LRN-06"],
      Deepen: ["LRN-24"],
      Create: ["LRN-26"]
    },
    7: {
      Acquire: ["LRN-06"],
      Deepen: ["LRN-19"],
      Create: ["LRN-29"]
    },
    8: {
      Acquire: ["LRN-06"],
      Deepen: ["LRN-20"],
      Create: ["LRN-26"]
    },
    9: {
      Acquire: ["LRN-11"],
      Deepen: ["LRN-13"],
      Create: ["LRN-37"]
    },
    10: {
      Acquire: ["LRN-08"],
      Deepen: ["LRN-33"],
      Create: ["LRN-42"]
    },
    11: {
      Acquire: ["LRN-21"],
      Deepen: ["LRN-23", "LRN-30"],
      Create: ["LRN-31", "LRN-38"]
    },
    12: {
      Acquire: ["LRN-17"],
      Deepen: ["LRN-23"],
      Create: ["LRN-38"]
    },
    13: {
      Acquire: ["LRN-07"],
      Deepen: ["LRN-23"],
      Create: ["LRN-30"]
    },
    14: {
      Acquire: ["LRN-23"],
      Deepen: ["LRN-33"],
      Create: ["LRN-41"]
    },
    15: {
      Acquire: ["LRN-02"],
      Deepen: ["LRN-21"],
      Create: ["LRN-27"]
    },
    16: {
      Acquire: ["LRN-15"],
      Deepen: ["LRN-41"],
      Create: ["LRN-42"]
    },
    17: {
      Acquire: ["LRN-16"],
      Deepen: ["LRN-38"],
      Create: ["LRN-43"]
    },
    18: {
      Acquire: ["LRN-16"],
      Deepen: ["LRN-38"],
      Create: ["LRN-43"]
    },
    19: {
      Acquire: ["LRN-40"],
      Deepen: ["LRN-32"],
      Create: ["LRN-43"]
    }
  };
});
