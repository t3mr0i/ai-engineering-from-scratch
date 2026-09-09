/** Personal competence tracks rendered as an editable, staged learning route. */
(function (root) {
  'use strict';

  var copy = {
    en: {
      title: 'Your learning path', intro: 'Choose an area to see the courses and preparation that support your role target.',
      current: 'Your level', unknown: 'Not assessed', target: 'Role target', noTarget: 'No target for this role',
      pathDetails: 'About this learning path', selectArea: 'Choose a learning area', syllabus: 'Syllabus', beyond: 'Beyond role target', coverage: 'More course coverage is needed',
      learned: 'Courses completed; assessment still needed', blocked: 'Preparation open', evidenced: 'Evidenced', selfAssessed: 'Self-assessed',
      complete: 'Completed', progress: 'In progress', ready: 'Available now', unavailable: 'Not available yet', recommendedNext: 'Recommended next', focus: 'Focus',
      start: 'Start course', continue: 'Continue course', open: 'Open course', preparation: 'Complete {course} first', coursePreview: 'View course', units: 'Course units', lessons: '{count} lessons', contributes: 'Also supports', prerequisites: 'Complete first', details: 'Course details', noCourses: 'No matching course is currently available at this stage.',
      targetReached: 'Target reached', noCourseCoverage: 'No course is mapped for this capability yet.',
      courseProgress: '{percent}% complete', note: 'Course completion records learning activity. Assessment or demonstrated evidence is required to establish a competency level.'
    },
    de: {
      title: 'Dein Lernpfad', intro: 'Wähle einen Bereich, um passende Kurse und vorbereitende Schritte für dein Rollenziel zu sehen.',
      current: 'Dein Stand', unknown: 'Noch nicht eingeschätzt', target: 'Empfohlenes Ziel', noTarget: 'Kein Ziel für diese Rolle',
      pathDetails: 'Hinweise zu diesem Lernpfad', selectArea: 'Lernbereich wählen', syllabus: 'Kursübersicht', beyond: 'Über Rollenempfehlung', coverage: 'Hier fehlt noch ein passender Kurs',
      learned: 'Kurse geschafft; Assessment offen', blocked: 'Vorbereitung offen', evidenced: 'Nachgewiesen', selfAssessed: 'Selbsteingeschätzt',
      complete: 'Abgeschlossen', progress: 'Begonnen', ready: 'Jetzt verfügbar', unavailable: 'Noch nicht verfügbar', recommendedNext: 'Hier weiterlernen', focus: 'Schwerpunkt',
      start: 'Kurs starten', continue: 'Kurs fortsetzen', open: 'Kurs öffnen', preparation: '{course} zuerst abschließen', coursePreview: 'Kurs ansehen', units: 'Kurseinheiten', lessons: '{count} Lektionen', contributes: 'Unterstützt auch', prerequisites: 'Zuerst abschließen', details: 'Kursdetails', noCourses: 'Für diese Stufe ist derzeit kein passender Kurs verfügbar.',
      targetReached: 'Ziel erreicht', noCourseCoverage: 'Für diese Fähigkeit ist noch kein Kurs hinterlegt.',
      courseProgress: '{percent}% abgeschlossen', note: 'Abgeschlossene Kurse dokumentieren Lernfortschritt. Ein Assessment oder praktische Nachweise halten Kompetenzstufen fest.'
    }
  };

  function el(tag, cls, text) { var node = root.document.createElement(tag); if (cls) node.className = cls; if (text != null) node.textContent = text; return node; }
  function arr(value) { return Array.isArray(value) ? value : []; }
  function href(value) { try { if (typeof value !== 'string' || !value.trim()) return null; var url = new URL(value, root.location.href); return /^https?:$/.test(url.protocol) ? url.href : null; } catch (_) { return null; } }
  function iconFor(dimension) {
    var name = /foundation/i.test(dimension.id || dimension.name) ? 'foundation' : /engineering/i.test(dimension.id || dimension.name) ? 'engineering' : /product/i.test(dimension.id || dimension.name) ? 'product' : /advisory/i.test(dimension.id || dimension.name) ? 'advisory' : 'leadership';
    return root.LrnLearningIcons && root.LrnLearningIcons.create ? root.LrnLearningIcons.create(name) : null;
  }
  function stageText(stage, t) { return ({ 'beyond-target': t.beyond, evidenced: t.evidenced, 'self-assessed': t.selfAssessed, 'courses-completed': t.learned, available: '', blocked: t.blocked, unavailable: t.unavailable })[stage.status] || ''; }
  function stepText(step, t) { return ({ completed: t.complete, 'in-progress': t.progress, ready: t.ready, 'prerequisite-open': t.blocked, unavailable: t.unavailable })[step.status] || t.ready; }
  function value(value, fallback) { return value || fallback; }
  function branchForNext(branches, next) { return !next ? null : branches.find(function (branch) { return arr(next.matches).some(function (match) { return match.dimensionId === branch.id; }); }) || null; }

  function render(model, options) {
    model = model || {}; options = options || {};
    var lang = root.SiteLang && root.SiteLang.get() === 'de' ? 'de' : 'en';
    var t = copy[lang], dimensions = arr(model.dimensions), branches = arr(model.branches), byId = {}, stepsById = {}, courseMaps = options.courseMaps || {};
    branches.forEach(function (branch) { byId[branch.id] = branch; });
    arr(model.steps).forEach(function (step) { stepsById[step.courseId] = step; });
    var requestedId = options.activeDimensionId || model.focusDimensionId;
    var active = byId[requestedId] || branchForNext(branches, model.next) || branches[0] || null;
    if (options.activeDimensionId === '__all__') active = null;
    var section = el('section', 'readiness-map');
    if (options.embedded) section.setAttribute('aria-label', t.title);
    else {
      section.setAttribute('aria-labelledby', 'readinessMapTitle');
      var title = el('h2', 'readiness-map__title', t.title); title.id = 'readinessMapTitle';
      section.append(title, el('p', 'readiness-map__intro', t.intro));
    }

    var selector = el('div', 'readiness-map__selector'); selector.setAttribute('role', 'group'); selector.setAttribute('aria-label', t.selectArea);
    dimensions.forEach(function (dimension) {
      var branch = byId[dimension.id], button = el('button', 'readiness-map__area');
      button.type = 'button'; button.dataset.focus = dimension.id; button.dataset.selected = String(active && active.id === dimension.id); button.setAttribute('aria-pressed', String(active && active.id === dimension.id));
      if (!branch) button.disabled = true;
      var icon = iconFor(dimension); if (icon) button.append(icon);
      var labels = el('span', 'readiness-map__area-copy');
      labels.append(el('strong', '', dimension.name));
      var levels = el('span', 'readiness-map__area-levels');
      [[lang === 'de' ? 'Stand' : 'Current', value(dimension.currentLevel, t.unknown), 'current'], [lang === 'de' ? 'Ziel' : 'Target', dimension.targetLevel || t.noTarget, 'target']].forEach(function (entry) {
        if (entry[2] === 'target') {
          var arrow = el('span', 'readiness-map__level-arrow'); arrow.setAttribute('aria-hidden', 'true');
          arrow.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
          levels.append(arrow);
        }
        var field = el('span', 'readiness-map__level-field'); field.title = entry[0] + ': ' + entry[1];
        field.append(el('span', 'readiness-map__level-label', entry[0]), el('span', 'readiness-map__level-value readiness-map__level-value--' + entry[2], entry[1])); levels.append(field);
      });
      labels.append(levels);
      var rail = el('span', 'readiness-map__area-rail'); rail.setAttribute('aria-hidden', 'true');
      ['Acquire', 'Deepen', 'Create'].forEach(function (level, index) {
        var segment = el('span', '');
        segment.dataset.reached = String(index <= ['Acquire', 'Deepen', 'Create'].indexOf(dimension.currentLevel));
        segment.dataset.target = String(level === dimension.targetLevel);
        rail.append(segment);
      });
      labels.append(rail);
      button.append(labels);
      button.addEventListener('click', function () { if (typeof options.onSelect === 'function') options.onSelect(dimension.id); else if (root.LrnJourneyState && root.LrnJourneyState.setFocus) root.LrnJourneyState.setFocus(dimension.id); });
      selector.append(button);
    });
    section.append(selector);
    if (options.selectorOnly) return section;
    if (!active) { section.append(el('p', 'readiness-map__empty', t.noCourses)); return section; }

    var route = el('div', 'readiness-map__route'), routeHead = el('header', 'readiness-map__route-head'), identity = el('div', 'readiness-map__route-identity'), activeIcon = iconFor(active);
    route.dataset.dimension = active.id;
    if (activeIcon) { var iconHost = el('span', 'readiness-map__area-icon'); iconHost.append(activeIcon); identity.append(iconHost); }
    var routeCopy = el('div', '');
    routeCopy.append(el('h3', '', active.name), el('p', '', t.current + ': ' + value(active.currentLevel, t.unknown) + ' · ' + t.target + ': ' + (active.targetLevel || t.noTarget)));
    identity.append(routeCopy); routeHead.append(identity, el('p', 'readiness-map__syllabus', t.syllabus)); route.append(routeHead);

    var rail = el('ol', 'readiness-map__stages'), displayed = {}, nextStep = active.next || arr(active.steps).find(function (step) { return step.status === 'ready' || step.status === 'in-progress'; }) || null;
    arr(active.stages).forEach(function (stage) {
      var item = el('li', 'readiness-map__stage'); item.dataset.status = stage.status || ''; item.dataset.target = String(!!stage.isTarget);
      var labels = [];
      if (active.currentLevel === stage.level) labels.push(t.current);
      if (stage.isTarget) labels.push(t.target);
      if (stageText(stage, t)) labels.push(stageText(stage, t));
      var reached = stage.status === 'evidenced' || stage.status === 'self-assessed';
      var header = el('header', 'readiness-map__stage-head');
      var heading = el('h4', '', stage.level);
      if (reached && root.LrnLearningIcons) { var check = root.LrnLearningIcons.create('check'); check.setAttribute('class', 'learning-icon readiness-map__reached-icon'); heading.prepend(check); }
      header.append(heading, el('p', '', labels.filter(function (label, index, all) { return all.indexOf(label) === index; }).join(' · '))); item.append(header);
      item.dataset.reached = String(reached);
      var stageSteps = arr(reached ? stage.reviewCourses : stage.steps).filter(function (step) { if (displayed[step.courseId]) return false; displayed[step.courseId] = true; return true; });
      var container = item;
      if (reached) {
        var completedDetails = el('details', 'readiness-map__completed-details'); completedDetails.dataset.stage = stage.level;
        completedDetails.append(el('summary', '', t.targetReached + ' · ' + (lang === 'de' ? 'Kurse ansehen' : 'View courses')));
        item.append(completedDetails); container = completedDetails;
      }
      if (stageSteps.length) { var courseList = el('ol', 'readiness-map__courses'); stageSteps.forEach(function (step) { courseList.append(courseItem(step, stepsById, courseMaps, active.id, !reached && nextStep && nextStep.courseId === step.courseId, t)); }); container.append(courseList); }
      else if (stage.status === 'beyond-target') container.append(el('p', 'readiness-map__stage-note', t.beyond));
      else container.append(el('p', 'readiness-map__stage-note', t.noCourses));
      rail.append(item);
    });
    route.append(rail);
    var pathDetails = el('details', 'readiness-map__path-details');
    pathDetails.append(el('summary', '', t.pathDetails));
    var gaps = arr(active.coverageGaps);
    if (gaps.length) {
      var coverage = el('section', 'readiness-map__coverage'); coverage.append(el('h4', '', t.coverage), el('p', '', t.noCourseCoverage));
      var coverageList = el('ul', 'readiness-map__coverage-list');
      gaps.map(function (gap) { return [gap.capability, gap.targetLevel].filter(Boolean).join(' · '); }).filter(function (label, index, all) { return label && all.indexOf(label) === index; }).forEach(function (label) { coverageList.append(el('li', '', label)); });
      coverage.append(coverageList); pathDetails.append(coverage);
    }
    pathDetails.append(el('p', 'readiness-map__note', t.note));
    section.append(route, pathDetails); return section;
  }

  function courseItem(step, stepsById, courseMaps, activeDimensionId, isNext, t) {
    var item = el('li', 'readiness-map__course'), row = el('div', 'readiness-map__course-row'), courseCopy = el('div', 'readiness-map__course-copy');
    item.dataset.status = step.status || '';
    if (root.LrnLearningIcons) { var courseIcon = root.LrnLearningIcons.forCourse ? root.LrnLearningIcons.forCourse(step.courseId) : root.LrnLearningIcons.create('book'); courseIcon.setAttribute('class', 'learning-icon readiness-map__course-icon'); row.append(courseIcon); }
    courseCopy.append(el('h5', '', step.title || step.courseId));
    if (isNext) courseCopy.prepend(el('span', 'readiness-map__course-next', t.recommendedNext));
    var meta = el('p', 'readiness-map__course-meta', stepText(step, t));
    if (step.status === 'in-progress' && Number.isFinite(step.percent)) meta.append(' · ' + t.courseProgress.replace('{percent}', step.percent));
    if (step.status !== 'ready' && !step.reviewOnly) courseCopy.append(meta);
    var activeMatch = arr(step.matches).find(function (match) { return match.dimensionId === activeDimensionId; });
    row.append(courseCopy);
    var actionHref = href(step.status === 'in-progress' && step.activityHref || step.href);
    if (actionHref && (step.status === 'ready' || step.status === 'in-progress' || step.status === 'completed')) {
      var action = el('a', 'readiness-map__action' + (isNext ? ' readiness-map__action--primary' : ''), step.status === 'in-progress' ? t.continue : step.status === 'completed' || step.reviewOnly ? t.open : t.start); action.href = actionHref; row.append(action);
    }
    var firstPrerequisite = arr(step.prerequisiteCourseIds).map(function (id) { return stepsById[id]; }).find(Boolean);
    if (step.status === 'prerequisite-open' && firstPrerequisite && href(firstPrerequisite.href)) { var prep = el('a', 'readiness-map__action', t.preparation.replace('{course}', firstPrerequisite.title)); prep.href = href(firstPrerequisite.href); row.append(prep); }
    item.append(row);
    var prerequisites = arr(step.prerequisiteCourseIds).map(function (id) { return stepsById[id]; }).filter(Boolean), contributions = arr(step.matches).map(function (match) { return [match.dimension, match.targetLevel].filter(Boolean).join(' · '); }).filter(function (label, index, all) { return label && all.indexOf(label) === index; });
    var units = arr(courseMaps[step.courseId]);
    if (activeMatch || prerequisites.length || contributions.length > 1 || units.length) {
      var details = el('details', 'readiness-map__course-details'), body = el('div', 'readiness-map__course-details-body'); details.dataset.course = step.courseId; var summary = el('summary', '', t.details); if (root.LrnLearningIcons) summary.append(root.LrnLearningIcons.create('chevron')); details.append(summary);
      if (activeMatch && activeMatch.capability) body.append(el('p', 'readiness-map__course-reason', t.focus + ': ' + activeMatch.capability));
      if (prerequisites.length) {
        body.append(el('strong', '', t.prerequisites)); var prerequisiteList = el('ul', 'readiness-map__prerequisites');
        prerequisites.forEach(function (prerequisite) { var listItem = el('li', ''), prerequisiteHref = href(prerequisite.href); if (prerequisiteHref) { var link = el('a', 'text-link', prerequisite.title); link.href = prerequisiteHref; listItem.append(link); } else listItem.textContent = prerequisite.title; if (prerequisite.status) listItem.append(' · ' + stepText(prerequisite, t)); prerequisiteList.append(listItem); });
        body.append(prerequisiteList);
      }
      if (contributions.length > 1) { body.append(el('strong', '', t.contributes)); var contributionList = el('ul', 'readiness-map__contributions'); contributions.forEach(function (label) { contributionList.append(el('li', '', label)); }); body.append(contributionList); }
      if (units.length) {
        body.append(el('strong', '', t.units)); var unitList = el('ol', 'readiness-map__units');
        var linkLessons = !step.reviewOnly && (step.status === 'ready' || step.status === 'in-progress' || step.status === 'completed') || step.status === 'completed';
        units.forEach(function (unit) {
          var unitItem = el('li', 'readiness-map__unit'), lessons = arr(unit.lessons), unitTitle = unit.title || unit.name || step.title;
          unitItem.append(el('span', 'readiness-map__unit-title', unitTitle), el('span', 'readiness-map__unit-count', t.lessons.replace('{count}', lessons.length)));
          if (lessons.length) {
            var lessonList = el('ol', 'readiness-map__lessons');
            lessons.forEach(function (lesson) {
              var lessonItem = el('li', ''), lessonTitle = lesson.title || lesson.path || step.title;
              if (linkLessons && lesson.path) { var lessonLink = el('a', 'text-link', lessonTitle); lessonLink.href = 'lesson.html?path=' + encodeURIComponent(lesson.path) + '&course=' + encodeURIComponent(step.courseId); lessonItem.append(lessonLink); }
              else lessonItem.textContent = lessonTitle;
              lessonList.append(lessonItem);
            });
            unitItem.append(lessonList);
          }
          unitList.append(unitItem);
        });
        body.append(unitList);
        if (!linkLessons && href(step.href)) { var preview = el('a', 'text-link readiness-map__preview', t.coursePreview); preview.href = href(step.href); body.append(preview); }
      }
      details.append(body); item.append(details);
    }
    return item;
  }
  root.LrnReadinessMap = { render: render };
})(window);
