/* Shared visual result for both assessment journeys. Scores stay in the saved record. */
(function (root) {
  'use strict';
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var STAR_PATH = 'M12 2.6 14.9 8.5l6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3 1.1-6.5-4.7-4.6 6.5-.9L12 2.6Z';
  function fills(score) {
    if (score == null) return null;
    return [0, 1, 2, 3, 4].map(function (index) { return Math.max(0, Math.min(1, score - index)); });
  }
  function element(doc, tag, className, content) {
    var item = doc.createElement(tag);
    if (className) item.className = className;
    if (content != null) item.textContent = content;
    return item;
  }
  function starSvg(doc, filled) {
    var svg = doc.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    var path = doc.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', STAR_PATH);
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.6');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('fill', filled ? 'currentColor' : 'none');
    svg.appendChild(path);
    return svg;
  }
  function rating(doc, score, language, unknown) {
    if (score == null) return element(doc, 'span', 'assessment-result-unrated', unknown);
    var locale = language === 'de' ? 'de-DE' : 'en-US';
    var label = language === 'de' ? ' von 5 Sternen' : ' out of 5 stars';
    var group = element(doc, 'span', 'assessment-result-stars');
    group.setAttribute('role', 'img');
    group.setAttribute('aria-label', score.toLocaleString(locale, { maximumFractionDigits: 1 }) + label);
    fills(score).forEach(function (fill) {
      var star = element(doc, 'span', 'assessment-result-star');
      star.setAttribute('aria-hidden', 'true');
      star.appendChild(starSvg(doc, false));
      if (fill > 0) {
        var overlay = element(doc, 'span', 'assessment-result-star__fill');
        overlay.style.width = String(fill * 100) + '%';
        overlay.appendChild(starSvg(doc, true));
        star.appendChild(overlay);
      }
      group.appendChild(star);
    });
    return group;
  }
  function render(record, options) {
    var doc = options.document || root.document;
    var language = options.language === 'de' ? 'de' : 'en';
    var labels = options.labels;
    var block = element(doc, 'div', 'assessment-result-content');
    var identity = element(doc, 'dl', 'assessment-result-identity');
    [[labels.role, record.role], [labels.division, record.division]].forEach(function (pair) {
      var item = element(doc, 'div');
      item.appendChild(element(doc, 'dt', '', pair[0]));
      item.appendChild(element(doc, 'dd', '', pair[1]));
      identity.appendChild(item);
    });
    block.appendChild(identity);
    block.appendChild(element(doc, 'p', 'assessment-result-explainer', labels.explainer));
    var list = element(doc, 'div', 'assessment-result-list');
    root.AIFSAssessment.DIMENSIONS.forEach(function (dimension, index) {
      var data = record.dimensions[dimension.name];
      var row = element(doc, 'section', 'assessment-result-row');
      var left = element(doc, 'div', 'assessment-result-row__main');
      left.appendChild(element(doc, 'h2', '', labels.areas[index]));
      left.appendChild(rating(doc, data.score, language, labels.unknown));
      row.appendChild(left);
      var levels = element(doc, 'dl', 'assessment-result-row__levels');
      [[labels.current, data.currentLevel || labels.unknown], [labels.target, data.targetLevel]].forEach(function (pair) {
        var item = element(doc, 'div');
        item.appendChild(element(doc, 'dt', '', pair[0]));
        item.appendChild(element(doc, 'dd', '', pair[1]));
        levels.appendChild(item);
      });
      row.appendChild(levels);
      list.appendChild(row);
    });
    block.appendChild(list);
    return block;
  }
  var api = { fills: fills, rating: rating, render: render };
  root.AIFSAssessmentResult = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
