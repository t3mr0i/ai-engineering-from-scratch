(function (root, factory) {
  var runtime = factory();
  if (typeof module === "object" && module.exports) module.exports = runtime;
  if (root) root.LessonPythonRuntime = runtime;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // The retired JupyterLite environment installed this helper before a learner
  // ran any cell. Inline lesson blocks rely on the same contract, so initialize
  // it once per Pyodide session instead of requiring every lesson to be run
  // top-to-bottom just to make the shared LLM client available.
  var LRN_LLM_BOOTSTRAP = [
    "import json, types",
    "from pyodide.http import pyfetch as _lrn_pyfetch",
    "lrn_llm = types.ModuleType('lrn_llm')",
    "lrn_llm.API_BASE = '/api/llm'",
    "lrn_llm.DEFAULT_MODEL = 'azure/gpt-5.4-mini'",
    "lrn_llm.API_KEY = ''",
    "",
    "async def _lrn_call(messages, *, system=None, max_tokens=400, model=None):",
    "    if system is not None:",
    "        messages = [{'role': 'system', 'content': system}] + list(messages)",
    "    payload = {'model': model or lrn_llm.DEFAULT_MODEL, 'messages': messages,",
    "               'max_completion_tokens': max_tokens}",
    "    headers = {'content-type': 'application/json'}",
    "    if lrn_llm.API_KEY:",
    "        headers['Authorization'] = 'Bearer ' + lrn_llm.API_KEY",
    "    url = lrn_llm.API_BASE.rstrip('/') + '/chat/completions'",
    "    response = await _lrn_pyfetch(url, method='POST', headers=headers,",
    "                                  body=json.dumps(payload))",
    "    data = await response.json()",
    "    if 'error' in data:",
    "        raise RuntimeError('LLM error: ' + str(data['error']))",
    "    return data",
    "",
    "def _lrn_text(response):",
    "    choices = (response or {}).get('choices') or []",
    "    return (choices[0].get('message', {}) or {}).get('content', '') if choices else ''",
    "",
    "async def _lrn_ping():",
    "    response = await _lrn_call(",
    "        [{'role': 'user', 'content': 'Reply with exactly: OK'}], max_tokens=5)",
    "    return {'ok': _lrn_text(response).strip().upper().startswith('OK'),",
    "            'model': response.get('model')}",
    "",
    "lrn_llm.call = _lrn_call",
    "lrn_llm.text = _lrn_text",
    "lrn_llm.ping = _lrn_ping"
  ].join("\n");

  var sessions = new WeakMap();

  function initialize(pyodide) {
    if (!pyodide || typeof pyodide.runPythonAsync !== "function") {
      return Promise.reject(new TypeError("A Pyodide instance is required"));
    }

    var existing = sessions.get(pyodide);
    if (existing) return existing;

    var ready = Promise.resolve(pyodide.runPythonAsync(LRN_LLM_BOOTSTRAP))
      .then(function () { return pyodide; })
      .catch(function (error) {
        sessions.delete(pyodide);
        throw error;
      });
    sessions.set(pyodide, ready);
    return ready;
  }

  return {
    initialize: initialize
  };
});
