/* Small authored SVG icon set for the learning home. Decorative, consistent
   24px geometry, round caps and 1.6px strokes; no remote font dependency. */
(function (root) {
  'use strict';
  var paths = {
    spark: 'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
    target: 'M12 3a9 9 0 1 0 .1 0ZM12 7a5 5 0 1 0 .1 0ZM12 10v4M10 12h4',
    flask: 'M9 2h6M10 2v7L4 19c-1 2 1 3 2 3h12c1 0 3-1 2-3L14 9V2M7 15h10',

    code: 'M8 6 2 12l6 6M16 6l6 6-6 6M14 3l-4 18',
    harness: 'M3 4h18v16H3ZM6 8l3 3-3 3M12 15l2 2 4-5',
    data: 'M3 6c0-4 18-4 18 0s-18 4-18 0ZM3 6v12c0 4 18 4 18 0V6M3 12c0 4 18 4 18 0',
    shield: 'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM8 12l3 3 5-6',
    workflow: 'M3 3h6v6H3ZM15 15h6v6h-6ZM9 6h9v6M15 10l3 3 3-3M6 9v9h6M10 15l3 3-3 3',
    architecture: 'M9 2h6v6H9ZM2 16h6v6H2ZM16 16h6v6h-6ZM12 8v4M5 16v-4h14v4',
    conversation: 'M3 3h18v14H9l-6 4ZM7 7h10M7 11h7',
    people: 'M9 6a3 3 0 1 0 0 .1ZM2 21v-3a7 7 0 0 1 14 0v3M17 3a3 3 0 0 1 0 6M18 13a5 5 0 0 1 4 5v3',
    document: 'M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8M8 16h8',
    cloud: 'M6 18a5 5 0 1 1 0-10 6 6 0 0 1 12 0 5 5 0 0 1 0 10ZM9 12l3-3 3 3M12 9v7',
    leaf: 'M20 3C8 2 2 7 4 16c9 7 18 0 16-13ZM3 22 16 9',
    support: 'M3 14v-3a9 9 0 0 1 18 0v3M3 12h4v7H3ZM17 12h4v7h-4ZM21 19c0 3-5 3-9 3',

    settings: 'M4 7h16M4 17h16M8 4v6M16 14v6',
    check: 'M4 4h16v16H4ZM7 12l3 3 7-7',
    home: 'M3 10 12 3 21 10M5 9v12h5v-7h4v7h5V9',
    book: 'M12 5v16M12 5C8 2 4 3 2 4v15c4-2 7-1 10 2 3-3 6-4 10-2V4c-2-1-6-2-10 1',
    map: 'M3 5 9 3 15 5 21 3v16l-6 2-6-2-6 2ZM9 3v16M15 5v16',
    search: 'M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
    calendar: 'M4 5h16v16H4ZM4 10h16M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2',
    chart: 'M4 3v18h17M8 16l4-5 4 2 5-7',
    arrow: 'M4 12h16M14 6l6 6-6 6',
    upload: 'M12 16V3M7 8l5-5 5 5M4 15v6h16v-6',
    chevron: 'M6 9l6 6 6-6',
    foundation: 'M12 3 3 8l9 5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5',
    engineering: 'M8 6 2 12l6 6M16 6l6 6-6 6M14 3l-4 18',
    product: 'M3 4h7v6H3ZM14 14h7v6h-7ZM10 7h7v7M7 10v7h7',
    advisory: 'M3 4h18v13H9l-6 4ZM7 8h10M7 12h6',
    leadership: 'M12 3v18M12 4h8l-2 3 2 3h-8M6 21h12'
  };
  // Course identity is stable; topic icons do not depend on translated titles.
  var courseIcons = {};
  var topicCourses = {
    spark: ['PRIMER-01', 'LRN-01', 'LRN-02', 'LRN-21', 'LRN-22', 'LRN-27'],
    shield: ['LRN-03', 'LRN-04', 'LRN-14', 'LRN-28', 'LRN-39'],
    target: ['LRN-07', 'LRN-15', 'LRN-23', 'LRN-33', 'LRN-41', 'LRN-45'],
    code: ['LRN-06', 'LRN-08', 'LRN-20'],
    foundation: ['LRN-25', 'LRN-35', 'LRN-46'],
    harness: ['LRN-24', 'LRN-26'],
    data: ['LRN-05', 'LRN-12', 'LRN-29', 'LRN-40'],
    flask: ['LRN-19'],
    book: ['LRN-11', 'LRN-13', 'LRN-18'],
    support: ['LRN-09', 'LRN-37'],
    architecture: ['LRN-42'],
    people: ['LRN-10', 'LRN-16', 'LRN-17', 'LRN-30', 'LRN-31', 'LRN-32', 'LRN-34', 'LRN-36', 'LRN-38', 'LRN-43', 'LRN-44']
  };
  Object.keys(topicCourses).forEach(function (name) { topicCourses[name].forEach(function (id) { courseIcons[id] = name; }); });
  function create(name) {
    var svg = root.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', '24'); svg.setAttribute('height', '24');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor'); svg.setAttribute('stroke-width', '1.6');
    svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false'); svg.classList.add('learning-icon');
    var path = root.document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('d', paths[name] || paths.book); svg.appendChild(path); return svg;
  }
  root.LrnLearningIcons = { create: create, forCourse: function (id) { return create(courseIcons[id] || 'book'); } };
})(window);
