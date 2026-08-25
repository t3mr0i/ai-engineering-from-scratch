/**
 * Shared read access to the course schedule (catalog.json: trainers, sessions).
 * The cockpit and the course page both need the same "next date" logic and the
 * same date formatting, so it lives here instead of in either of them.
 */
(function () {
  "use strict";

  function catalog() {
    return window.LrnData || {};
  }

  function moment(value) {
    if (typeof value !== "string" || !value) return null;
    var stamp = Date.parse(value.length === 10 ? value + "T00:00" : value);
    return isNaN(stamp) ? null : new Date(stamp);
  }

  function bySortKey(left, right) {
    return String(left.start || "").localeCompare(String(right.start || ""));
  }

  function sessions(courseId) {
    var all = Array.isArray(catalog().sessions) ? catalog().sessions : [];
    return all.filter(function (session) {
      return session && session.courseId === courseId;
    }).sort(bySortKey);
  }

  // "Upcoming" counts a running multi-day session as upcoming until its end.
  function upcoming(courseId, limit) {
    var now = Date.now();
    var open = sessions(courseId).filter(function (session) {
      if (session.status === "cancelled" || session.status === "done") return false;
      var end = moment(session.end) || moment(session.start);
      return !end || end.getTime() >= now;
    });
    return typeof limit === "number" ? open.slice(0, limit) : open;
  }

  function next(courseId) {
    return upcoming(courseId, 1)[0] || null;
  }

  function trainer(trainerId) {
    var all = Array.isArray(catalog().trainers) ? catalog().trainers : [];
    for (var index = 0; index < all.length; index += 1) {
      if (all[index] && all[index].id === trainerId) return all[index];
    }
    return null;
  }

  function trainers(session) {
    return ((session && session.trainerIds) || []).map(function (id) {
      var entry = trainer(id);
      return entry || { id: id, name: id };
    });
  }

  function trainerNames(session) {
    return trainers(session).map(function (entry) {
      return entry.name || entry.id;
    });
  }

  function formatRange(session, locale) {
    var start = moment(session && session.start);
    if (!start) return "";
    var end = moment(session.end);
    var withTime = String(session.start).length > 10;
    var dayOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
    var timeOptions = { hour: "2-digit", minute: "2-digit" };
    var startDay = start.toLocaleDateString(locale, dayOptions);
    if (!end || startDay === end.toLocaleDateString(locale, dayOptions)) {
      if (!withTime) return startDay;
      return startDay + ", " + start.toLocaleTimeString(locale, timeOptions)
        + (end ? "–" + end.toLocaleTimeString(locale, timeOptions) : "");
    }
    return startDay + " – " + end.toLocaleDateString(locale, dayOptions);
  }

  function formatShort(session, locale) {
    var start = moment(session && session.start);
    if (!start) return "";
    return start.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  }

  function seatsFree(session) {
    var seats = Number(session && session.seats);
    if (!isFinite(seats) || seats <= 0) return null;
    return Math.max(0, seats - (Number(session.seatsTaken) || 0));
  }

  window.LrnSchedule = {
    moment: moment,
    sessions: sessions,
    upcoming: upcoming,
    next: next,
    trainer: trainer,
    trainers: trainers,
    trainerNames: trainerNames,
    formatRange: formatRange,
    formatShort: formatShort,
    seatsFree: seatsFree,
  };
})();
