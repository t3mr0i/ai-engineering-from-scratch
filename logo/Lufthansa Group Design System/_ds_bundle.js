/* @ds-bundle: {"format":3,"namespace":"LufthansaGroupDesignSystem_70bbed","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Divider","sourcePath":"components/core/Divider.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"SegmentedControl","sourcePath":"components/core/SegmentedControl.jsx"},{"name":"Stat","sourcePath":"components/core/Stat.jsx"},{"name":"Stepper","sourcePath":"components/core/Stepper.jsx"},{"name":"Avatar","sourcePath":"components/data/Avatar.jsx"},{"name":"List","sourcePath":"components/data/List.jsx"},{"name":"Table","sourcePath":"components/data/Table.jsx"},{"name":"Alert","sourcePath":"components/feedback/Alert.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/RadioGroup.jsx"},{"name":"SearchBar","sourcePath":"components/forms/SearchBar.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"Accordion","sourcePath":"components/navigation/Accordion.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Breadcrumb.jsx"},{"name":"NavRail","sourcePath":"components/navigation/NavRail.jsx"},{"name":"Pagination","sourcePath":"components/navigation/Pagination.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Dialog","sourcePath":"components/overlay/Dialog.jsx"},{"name":"FareCard","sourcePath":"components/travel/FareCard.jsx"},{"name":"FlightCard","sourcePath":"components/travel/FlightCard.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"135f32cf44a9","components/core/Button.jsx":"99845f581779","components/core/Card.jsx":"91d545c00c82","components/core/Divider.jsx":"10598b911e3d","components/core/IconButton.jsx":"210d6a69a964","components/core/SegmentedControl.jsx":"401500c0d305","components/core/Stat.jsx":"ea9cad707df8","components/core/Stepper.jsx":"77b9a7b5360a","components/data/Avatar.jsx":"00f4dcab9bd1","components/data/List.jsx":"fae2c11c0c4a","components/data/Table.jsx":"e231aab91ec3","components/feedback/Alert.jsx":"55012fd15e8d","components/feedback/ProgressBar.jsx":"bdb9b0bdaeb6","components/feedback/Toast.jsx":"4aa7d12ea99b","components/feedback/Tooltip.jsx":"fa06cac84310","components/forms/Checkbox.jsx":"1e03d6e298ee","components/forms/Input.jsx":"a5857e3671cb","components/forms/RadioGroup.jsx":"14038ed5a7fc","components/forms/SearchBar.jsx":"1fca637445ea","components/forms/Select.jsx":"525a590a1dad","components/forms/Switch.jsx":"73343ea95b47","components/forms/Textarea.jsx":"41eb4376ef2a","components/navigation/Accordion.jsx":"e877f6d5e713","components/navigation/Breadcrumb.jsx":"930113bbec59","components/navigation/NavRail.jsx":"03a86b8b5ea2","components/navigation/Pagination.jsx":"539431f133c1","components/navigation/Tabs.jsx":"ac38084bc665","components/overlay/Dialog.jsx":"91754151f489","components/travel/FareCard.jsx":"bec1d51d1661","components/travel/FlightCard.jsx":"53438c2e2aed","ui_kits/booking/BookingHeader.jsx":"298515ace15b","ui_kits/booking/CheckoutScreen.jsx":"5fb972865cf3","ui_kits/booking/ConfirmDialog.jsx":"6cd53c01f551","ui_kits/booking/ResultsScreen.jsx":"695f50fb5c6a","ui_kits/booking/SearchScreen.jsx":"8e70e7442d4f","ui_kits/corporate/Header.jsx":"775a6036538f","ui_kits/corporate/Hero.jsx":"e2216725197d","ui_kits/corporate/Sections.jsx":"83e9d748b6e4","ui_kits/corporate/StatBand.jsx":"5a983ed3fcd5","ui_kits/corporate/StoryGrid.jsx":"d232854466a0"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LufthansaGroupDesignSystem_70bbed = window.LufthansaGroupDesignSystem_70bbed || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
/** Small status / category label. Subtle tints; sentence case. */
function Badge({
  children,
  tone = 'neutral',
  icon = null
}) {
  const tones = {
    neutral: {
      bg: 'var(--lhg-grey-200)',
      fg: 'var(--lhg-slate-700)'
    },
    blue: {
      bg: 'var(--lhg-blue-100)',
      fg: 'var(--lhg-blue-600)'
    },
    success: {
      bg: '#e2f3ea',
      fg: 'var(--lhg-success)'
    },
    warning: {
      bg: '#fbeede',
      fg: '#9a5a14'
    },
    error: {
      bg: '#fbe1e5',
      fg: 'var(--lhg-red)'
    },
    teal: {
      bg: '#dcecee',
      fg: 'var(--lhg-teal)'
    },
    purple: {
      bg: '#f3e1ea',
      fg: 'var(--lhg-purple)'
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: t.bg,
      color: t.fg,
      fontFamily: 'var(--font-body)',
      fontWeight: 'var(--weight-medium)',
      fontSize: 12.5,
      lineHeight: 1,
      letterSpacing: '.01em',
      padding: '6px 12px',
      borderRadius: 'var(--radius-pill)'
    }
  }, icon && /*#__PURE__*/React.createElement("i", {
    className: `ph-light ${icon}`,
    style: {
      fontSize: 14
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Lufthansa Group primary control. Pill-shaped, calm, sentence-case label.
 * Variants: primary (Core Blue), accent (Blue 500), secondary (outline),
 * ghost (tinted), tertiary (inline text link with optional arrow).
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconLeft = null,
  iconRight = null,
  full = false,
  disabled = false,
  onClick,
  type = 'button',
  style: styleProp = {},
  ...rest
}) {
  const pads = {
    sm: '8px 18px',
    md: '12px 26px',
    lg: '16px 34px'
  };
  const fontSizes = {
    sm: 14,
    md: 16,
    lg: 18
  };
  const base = {
    display: full ? 'flex' : 'inline-flex',
    width: full ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontFamily: 'var(--font-body)',
    fontWeight: 'var(--weight-light)',
    fontSize: fontSizes[size],
    lineHeight: 1.2,
    padding: variant === 'tertiary' ? 0 : pads[size],
    borderRadius: 'var(--radius-pill)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'background var(--dur-fast) var(--ease-standard), color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
    textDecoration: 'none',
    whiteSpace: 'nowrap'
  };
  const variants = {
    primary: {
      background: 'var(--lhg-core-blue)',
      color: '#fff',
      borderColor: 'var(--lhg-core-blue)'
    },
    accent: {
      background: 'var(--lhg-blue-500)',
      color: '#fff',
      borderColor: 'var(--lhg-blue-500)'
    },
    secondary: {
      background: 'transparent',
      color: 'var(--lhg-core-blue)',
      borderColor: 'var(--lhg-core-blue)'
    },
    ghost: {
      background: 'var(--lhg-blue-100)',
      color: 'var(--lhg-blue-600)',
      borderColor: 'transparent'
    },
    tertiary: {
      background: 'transparent',
      color: 'var(--lhg-blue-500)',
      borderColor: 'transparent',
      borderRadius: 0
    },
    'on-dark': {
      background: 'transparent',
      color: '#fff',
      borderColor: 'rgba(255,255,255,0.65)'
    }
  };
  const hovers = {
    primary: {
      background: 'var(--lhg-blue-600)',
      borderColor: 'var(--lhg-blue-600)'
    },
    accent: {
      background: 'var(--lhg-blue-600)',
      borderColor: 'var(--lhg-blue-600)'
    },
    secondary: {
      background: 'var(--lhg-core-blue)',
      color: '#fff'
    },
    ghost: {
      background: '#d6e4ff'
    },
    tertiary: {
      color: 'var(--lhg-blue-600)'
    },
    'on-dark': {
      background: 'rgba(255,255,255,0.12)',
      borderColor: '#fff'
    }
  };
  const [hover, setHover] = React.useState(false);
  const style = {
    ...base,
    ...variants[variant],
    ...(hover && !disabled ? hovers[variant] : {}),
    ...styleProp
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    style: style,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false)
  }, rest), iconLeft, /*#__PURE__*/React.createElement("span", null, children), iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** White surface card — hairline border or soft shadow, soft radius, generous pad. */
function Card({
  children,
  elevated = false,
  pad = 'md',
  as = 'div',
  style = {},
  ...rest
}) {
  const pads = {
    sm: 16,
    md: 24,
    lg: 32
  };
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: {
      background: 'var(--color-surface)',
      border: elevated ? 'none' : '1px solid var(--border-subtle)',
      boxShadow: elevated ? 'var(--shadow-md)' : 'none',
      borderRadius: 'var(--radius-lg)',
      padding: pads[pad],
      ...style
    }
  }, rest), children);
}

/** Optional structured sub-parts. */
Card.Eyebrow = function Eyebrow({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px var(--font-body)',
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--lhg-blue-500)',
      marginBottom: 10
    }
  }, children);
};
Card.Title = function Title({
  children
}) {
  return /*#__PURE__*/React.createElement("h3", {
    style: {
      font: '300 22px/1.2 var(--font-display)',
      letterSpacing: '-.01em',
      color: 'var(--lhg-core-blue)',
      margin: '0 0 8px'
    }
  }, children);
};
Card.Body = function Body({
  children
}) {
  return /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 16px/1.5 var(--font-body)',
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, children);
};
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Divider.jsx
try { (() => {
/** Hairline divider; optional centered label. */
function Divider({
  label = null,
  spacing = 24
}) {
  if (!label) {
    return /*#__PURE__*/React.createElement("hr", {
      style: {
        border: 'none',
        borderTop: '1px solid var(--border-subtle)',
        margin: `${spacing}px 0`
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      margin: `${spacing}px 0`,
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--border-subtle)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--border-subtle)'
    }
  }));
}
Object.assign(__ds_scope, { Divider });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Divider.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Square/round icon-only button using a Phosphor light glyph class. */
function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  onClick,
  ...rest
}) {
  const dims = {
    sm: 32,
    md: 40,
    lg: 48
  };
  const fs = {
    sm: 18,
    md: 22,
    lg: 26
  };
  const [hover, setHover] = React.useState(false);
  const variants = {
    ghost: {
      background: hover ? 'var(--lhg-grey-200)' : 'transparent',
      color: 'var(--lhg-core-blue)'
    },
    solid: {
      background: hover ? 'var(--lhg-blue-600)' : 'var(--lhg-core-blue)',
      color: '#fff'
    },
    outline: {
      background: hover ? 'var(--lhg-grey-200)' : 'transparent',
      color: 'var(--lhg-core-blue)',
      boxShadow: 'inset 0 0 0 1px var(--border-subtle)'
    }
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    title: label,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      width: dims[size],
      height: dims[size],
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: 'var(--radius-pill)',
      cursor: 'pointer',
      fontSize: fs[size],
      transition: 'background var(--dur-fast) var(--ease-standard)',
      ...variants[variant]
    }
  }, rest), /*#__PURE__*/React.createElement("i", {
    className: `ph-light ${icon}`
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/SegmentedControl.jsx
try { (() => {
/** Segmented control — track of options, active segment lifts to a white pill. */
function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md'
}) {
  const active = value ?? (options[0] && (typeof options[0] === 'string' ? options[0] : options[0].value));
  const pad = size === 'sm' ? '7px 14px' : '10px 20px';
  const fs = size === 'sm' ? 14 : 15.5;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      gap: 4,
      padding: 4,
      background: 'var(--lhg-grey-200)',
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-body)'
    }
  }, options.map(o => {
    const val = typeof o === 'string' ? o : o.value;
    const lab = typeof o === 'string' ? o : o.label;
    const on = val === active;
    return /*#__PURE__*/React.createElement("button", {
      key: val,
      onClick: () => onChange && onChange(val),
      style: {
        border: 'none',
        cursor: 'pointer',
        padding: pad,
        fontSize: fs,
        fontWeight: on ? 400 : 300,
        borderRadius: 'var(--radius-pill)',
        whiteSpace: 'nowrap',
        background: on ? '#fff' : 'transparent',
        color: on ? 'var(--lhg-core-blue)' : 'var(--lhg-slate-500)',
        boxShadow: on ? 'var(--shadow-xs)' : 'none',
        transition: 'background var(--dur-fast), color var(--dur-fast)'
      }
    }, lab);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/core/Stat.jsx
try { (() => {
/** Large thin statistic with optional arc ring — the LHG report hero number. */
function Stat({
  value,
  unit = '',
  label = '',
  tone = 'blue',
  progress = null
}) {
  const colors = {
    blue: 'var(--lhg-blue-500)',
    core: 'var(--lhg-core-blue)',
    red: 'var(--lhg-red)',
    teal: 'var(--lhg-teal)',
    purple: 'var(--lhg-purple)',
    sand: 'var(--lhg-sand)'
  };
  const c = colors[tone] || colors.blue;
  const ring = progress != null;
  const r = 52,
    circ = 2 * Math.PI * r,
    dash = circ * Math.min(Math.max(progress ?? 0, 0), 100) / 100;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 20,
      fontFamily: 'var(--font-body)'
    }
  }, ring && /*#__PURE__*/React.createElement("svg", {
    width: "128",
    height: "128",
    viewBox: "0 0 128 128",
    style: {
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "64",
    cy: "64",
    r: r,
    fill: "none",
    stroke: "var(--lhg-grey-200)",
    strokeWidth: "6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "64",
    cy: "64",
    r: r,
    fill: "none",
    stroke: c,
    strokeWidth: "6",
    strokeLinecap: "round",
    strokeDasharray: `${dash} ${circ}`,
    transform: "rotate(-90 64 64)"
  }), /*#__PURE__*/React.createElement("text", {
    x: "64",
    y: "72",
    textAnchor: "middle",
    style: {
      font: '300 30px var(--font-display)',
      fill: 'var(--lhg-core-blue)'
    }
  }, value)), /*#__PURE__*/React.createElement("div", null, !ring && /*#__PURE__*/React.createElement("div", {
    style: {
      font: '200 56px/1 var(--font-display)',
      letterSpacing: '-.02em',
      color: c
    }
  }, value, unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      color: 'var(--text-muted)',
      marginLeft: 6
    }
  }, unit)), label && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: 'var(--text-secondary)',
      marginTop: ring ? 0 : 8
    }
  }, label)));
}
Object.assign(__ds_scope, { Stat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Stat.jsx", error: String((e && e.message) || e) }); }

// components/core/Stepper.jsx
try { (() => {
/** Horizontal step indicator for multi-step flows (booking, check-in). */
function Stepper({
  steps = [],
  current = 0
}) {
  return /*#__PURE__*/React.createElement("ol", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      listStyle: 'none',
      margin: 0,
      padding: 0,
      fontFamily: 'var(--font-body)'
    }
  }, steps.map((s, i) => {
    const done = i < current;
    const active = i === current;
    const label = typeof s === 'string' ? s : s.label;
    return /*#__PURE__*/React.createElement("li", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        flex: i === steps.length - 1 ? '0 0 auto' : 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 30,
        height: 30,
        borderRadius: '50%',
        flex: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 400,
        background: done ? 'var(--lhg-blue-500)' : active ? 'var(--lhg-core-blue)' : 'var(--lhg-grey-200)',
        color: done || active ? '#fff' : 'var(--lhg-slate-500)',
        border: active ? 'none' : 'none'
      }
    }, done ? /*#__PURE__*/React.createElement("i", {
      className: "ph-bold ph-check",
      style: {
        fontSize: 13
      }
    }) : i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14.5,
        fontWeight: active ? 500 : 300,
        color: active || done ? 'var(--lhg-core-blue)' : 'var(--lhg-slate-500)',
        whiteSpace: 'nowrap'
      }
    }, label)), i < steps.length - 1 && /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        height: 1,
        margin: '0 16px',
        background: done ? 'var(--lhg-blue-500)' : 'var(--border-strong)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Stepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Stepper.jsx", error: String((e && e.message) || e) }); }

// components/data/Avatar.jsx
try { (() => {
/** Avatar — image or initials, circular. Navy ring optional. */
function Avatar({
  src,
  name = '',
  size = 40,
  ring = false
}) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const ringStyle = ring ? {
    boxShadow: '0 0 0 2px #fff, 0 0 0 3px var(--lhg-blue-500)'
  } : {};
  return /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      flex: 'none',
      borderRadius: '50%',
      overflow: 'hidden',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--lhg-core-blue)',
      color: '#fff',
      fontFamily: 'var(--font-body)',
      fontWeight: 400,
      fontSize: size * 0.4,
      ...ringStyle
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : initials);
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data/List.jsx
try { (() => {
/** Branded list — bullet, numbered, or check style; calm spacing. */
function List({
  items = [],
  variant = 'bullet'
}) {
  const Tag = variant === 'numbered' ? 'ol' : 'ul';
  return /*#__PURE__*/React.createElement(Tag, {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      fontFamily: 'var(--font-body)',
      counterReset: 'lhg',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      font: '300 16px/1.5 var(--font-body)',
      color: 'var(--text-secondary)',
      counterIncrement: 'lhg'
    }
  }, variant === 'check' && /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-check",
    style: {
      color: 'var(--lhg-blue-500)',
      fontSize: 20,
      marginTop: 1,
      flex: 'none'
    }
  }), variant === 'bullet' && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--lhg-blue-500)',
      marginTop: 9,
      flex: 'none'
    }
  }), variant === 'numbered' && /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 14px var(--font-body)',
      color: 'var(--lhg-blue-500)',
      minWidth: 22,
      marginTop: 1
    },
    "aria-hidden": true
  }, String(i + 1).padStart(2, '0')), /*#__PURE__*/React.createElement("span", null, typeof it === 'string' ? it : it.label))));
}
Object.assign(__ds_scope, { List });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/List.jsx", error: String((e && e.message) || e) }); }

// components/data/Table.jsx
try { (() => {
/**
 * Quiet data table — light header, hairline rows, generous cells.
 * `columns`: [{ key, label, align, render? }]; `rows`: array of objects.
 */
function Table({
  columns = [],
  rows = []
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: {
      textAlign: c.align || 'left',
      padding: '12px 16px',
      font: '500 12px var(--font-body)',
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      color: 'var(--lhg-slate-500)',
      borderBottom: '1px solid var(--border-strong)',
      whiteSpace: 'nowrap'
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri,
    style: {
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      textAlign: c.align || 'left',
      padding: '14px 16px',
      fontWeight: 300,
      color: 'var(--lhg-core-blue)'
    }
  }, c.render ? c.render(r[c.key], r) : r[c.key])))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Table.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Alert.jsx
try { (() => {
/**
 * Inline notice in the Lufthansa accent style: clean white surface, a solid
 * colour bar on the LEFT edge, a matching icon and dark text. No tinted fill,
 * no rounded pill — calm and editorial.
 */
function Alert({
  tone = 'info',
  title,
  children,
  icon
}) {
  const map = {
    info: {
      bar: 'var(--lhg-blue-500)',
      ic: 'ph-info',
      fg: 'var(--lhg-blue-600)'
    },
    success: {
      bar: 'var(--lhg-success)',
      ic: 'ph-check-circle',
      fg: 'var(--lhg-success)'
    },
    warning: {
      bar: 'var(--lhg-warning)',
      ic: 'ph-warning',
      fg: '#9a5a14'
    },
    error: {
      bar: 'var(--lhg-error)',
      ic: 'ph-warning-circle',
      fg: 'var(--lhg-error)'
    },
    note: {
      bar: 'var(--lhg-sand)',
      ic: 'ph-note',
      fg: 'var(--lhg-sand)'
    }
  };
  const t = map[tone] || map.info;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      background: 'var(--color-surface)',
      borderLeft: `3px solid ${t.bar}`,
      boxShadow: 'var(--shadow-xs)',
      padding: '16px 20px 16px 18px',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ph-light ${icon || t.ic}`,
    style: {
      fontSize: 22,
      color: t.fg,
      marginTop: 1,
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15.5,
      fontWeight: 'var(--weight-medium)',
      color: 'var(--lhg-core-blue)',
      marginBottom: children ? 4 : 0
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 300,
      lineHeight: 1.55,
      color: 'var(--text-secondary)'
    }
  }, children)));
}
Object.assign(__ds_scope, { Alert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Alert.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
/** Thin linear progress bar. */
function ProgressBar({
  value = 0,
  tone = 'blue',
  label = '',
  showValue = false
}) {
  const colors = {
    blue: 'var(--lhg-blue-500)',
    core: 'var(--lhg-core-blue)',
    teal: 'var(--lhg-teal)',
    success: 'var(--lhg-success)'
  };
  const pct = Math.min(Math.max(value, 0), 100);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)'
    }
  }, (label || showValue) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 13,
      color: 'var(--text-secondary)',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, label), showValue && /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: 'tabular-nums',
      color: 'var(--lhg-core-blue)'
    }
  }, pct, "%")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 6,
      borderRadius: 999,
      background: 'var(--lhg-grey-200)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: `${pct}%`,
      height: '100%',
      borderRadius: 999,
      background: colors[tone] || colors.blue,
      transition: 'width var(--dur-slow) var(--ease-out)'
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
/** Toast — white card, soft shadow, tone icon, close affordance. Static (no timer). */
function Toast({
  tone = 'info',
  title,
  children,
  onClose
}) {
  const map = {
    info: {
      ic: 'ph-info',
      fg: 'var(--lhg-blue-500)'
    },
    success: {
      ic: 'ph-check-circle',
      fg: 'var(--lhg-success)'
    },
    warning: {
      ic: 'ph-warning',
      fg: 'var(--lhg-warning)'
    },
    error: {
      ic: 'ph-warning-circle',
      fg: 'var(--lhg-error)'
    }
  };
  const t = map[tone] || map.info;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      minWidth: 300,
      maxWidth: 420,
      background: '#fff',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--border-subtle)',
      padding: '14px 16px',
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ph-light ${t.ic}`,
    style: {
      fontSize: 22,
      color: t.fg,
      marginTop: 1,
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 'var(--weight-medium)',
      color: 'var(--lhg-core-blue)',
      marginBottom: children ? 3 : 0
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 300,
      lineHeight: 1.5,
      color: 'var(--text-secondary)'
    }
  }, children)), onClose && /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Dismiss",
    style: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--lhg-slate-500)',
      fontSize: 18,
      padding: 2,
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-x"
  })));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
/** Tooltip — wraps a trigger; shows a dark navy bubble on hover/focus. */
function Tooltip({
  label,
  children,
  placement = 'top'
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: '100%',
      left: '50%',
      transform: 'translate(-50%, -8px)'
    },
    bottom: {
      top: '100%',
      left: '50%',
      transform: 'translate(-50%, 8px)'
    },
    left: {
      right: '100%',
      top: '50%',
      transform: 'translate(-8px, -50%)'
    },
    right: {
      left: '100%',
      top: '50%',
      transform: 'translate(8px, -50%)'
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    onFocus: () => setShow(true),
    onBlur: () => setShow(false)
  }, children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      ...pos[placement],
      zIndex: 50,
      background: 'var(--lhg-core-blue)',
      color: '#fff',
      font: '300 13px/1.4 var(--font-body)',
      whiteSpace: 'nowrap',
      padding: '7px 11px',
      borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-md)',
      opacity: show ? 1 : 0,
      pointerEvents: 'none',
      transition: 'opacity var(--dur-fast) var(--ease-standard)'
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
/** Checkbox with brand-blue checked fill. */
function Checkbox({
  label,
  checked = false,
  onChange,
  disabled = false
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-body)',
      opacity: disabled ? 0.5 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 20,
      height: 20,
      flex: 'none',
      borderRadius: 'var(--radius-xs)',
      border: `1.5px solid ${checked ? 'var(--lhg-blue-500)' : 'var(--border-strong)'}`,
      background: checked ? 'var(--lhg-blue-500)' : '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all var(--dur-fast) var(--ease-standard)'
    }
  }, checked && /*#__PURE__*/React.createElement("i", {
    className: "ph-bold ph-check",
    style: {
      color: '#fff',
      fontSize: 13
    }
  })), /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    onChange: onChange,
    disabled: disabled,
    style: {
      position: 'absolute',
      opacity: 0,
      width: 0,
      height: 0
    }
  }), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 300,
      color: 'var(--lhg-core-blue)'
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Text input with floating-style label, hairline border, blue focus ring. */
function Input({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  icon = null,
  error = '',
  hint = '',
  disabled = false,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const borderColor = error ? 'var(--lhg-error)' : focus ? 'var(--lhg-blue-500)' : 'var(--border-subtle)';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-body)'
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-secondary)',
      marginBottom: 7
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: disabled ? 'var(--lhg-grey-200)' : '#fff',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-sm)',
      padding: '0 14px',
      height: 48,
      boxShadow: focus && !error ? 'var(--shadow-focus)' : 'none',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)'
    }
  }, icon && /*#__PURE__*/React.createElement("i", {
    className: `ph-light ${icon}`,
    style: {
      fontSize: 20,
      color: 'var(--lhg-slate-500)'
    }
  }), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: '300 16px var(--font-body)',
      color: 'var(--lhg-core-blue)',
      minWidth: 0
    }
  }, rest))), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 12.5,
      marginTop: 6,
      color: error ? 'var(--lhg-error)' : 'var(--text-muted)'
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/RadioGroup.jsx
try { (() => {
/** Radio group. Brand-blue selected dot, vertical or horizontal. */
function RadioGroup({
  name,
  options = [],
  value,
  onChange,
  direction = 'column'
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    style: {
      display: 'flex',
      flexDirection: direction,
      gap: direction === 'row' ? 24 : 14,
      fontFamily: 'var(--font-body)'
    }
  }, options.map(o => {
    const val = typeof o === 'string' ? o : o.value;
    const lab = typeof o === 'string' ? o : o.label;
    const on = val === value;
    return /*#__PURE__*/React.createElement("label", {
      key: val,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 20,
        height: 20,
        flex: 'none',
        borderRadius: '50%',
        border: `1.5px solid ${on ? 'var(--lhg-blue-500)' : 'var(--border-strong)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color var(--dur-fast)'
      }
    }, on && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: 'var(--lhg-blue-500)'
      }
    })), /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: name,
      value: val,
      checked: on,
      onChange: () => onChange && onChange(val),
      style: {
        position: 'absolute',
        opacity: 0,
        width: 0,
        height: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 300,
        color: 'var(--lhg-core-blue)'
      }
    }, lab));
  }));
}
Object.assign(__ds_scope, { RadioGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RadioGroup.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchBar.jsx
try { (() => {
/** Pill search field with leading icon and optional submit affordance. */
function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search',
  width = 360
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSubmit && onSubmit(value);
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width,
      maxWidth: '100%',
      background: '#fff',
      border: `1px solid ${focus ? 'var(--lhg-blue-500)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-pill)',
      padding: '0 8px 0 18px',
      height: 48,
      boxShadow: focus ? 'var(--shadow-focus)' : 'none',
      fontFamily: 'var(--font-body)',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-magnifying-glass",
    style: {
      fontSize: 20,
      color: 'var(--lhg-slate-500)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    value: value,
    placeholder: placeholder,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: '300 16px var(--font-body)',
      color: 'var(--lhg-core-blue)',
      minWidth: 0
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    "aria-label": "Search",
    style: {
      width: 36,
      height: 36,
      flex: 'none',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      background: 'var(--lhg-blue-500)',
      color: '#fff',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-arrow-right",
    style: {
      fontSize: 18
    }
  })));
}
Object.assign(__ds_scope, { SearchBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
/** Native select styled to match Input — hairline, soft radius, chevron. */
function Select({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  hint = ''
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-body)'
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-secondary)',
      marginBottom: 7
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: value,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      height: 48,
      padding: '0 42px 0 14px',
      appearance: 'none',
      background: disabled ? 'var(--lhg-grey-200)' : '#fff',
      border: `1px solid ${focus ? 'var(--lhg-blue-500)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-sm)',
      font: '300 16px var(--font-body)',
      color: 'var(--lhg-core-blue)',
      outline: 'none',
      cursor: 'pointer',
      boxShadow: focus ? 'var(--shadow-focus)' : 'none'
    }
  }, options.map(o => {
    const val = typeof o === 'string' ? o : o.value;
    const lab = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: val,
      value: val
    }, lab);
  })), /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-caret-down",
    style: {
      position: 'absolute',
      right: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--lhg-slate-500)',
      fontSize: 18
    }
  })), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 12.5,
      marginTop: 6,
      color: 'var(--text-muted)'
    }
  }, hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
/** Pill switch — off grey, on Blue 500. */
function Switch({
  checked = false,
  onChange,
  label = '',
  disabled = false
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 12,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-body)',
      opacity: disabled ? 0.5 : 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 44,
      height: 26,
      flex: 'none',
      borderRadius: 999,
      background: checked ? 'var(--lhg-blue-500)' : 'var(--lhg-grey-400)',
      position: 'relative',
      transition: 'background var(--dur-base) var(--ease-standard)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: checked ? 21 : 3,
      width: 20,
      height: 20,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: 'var(--shadow-xs)',
      transition: 'left var(--dur-base) var(--ease-out)'
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 300,
      color: 'var(--lhg-core-blue)'
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
/** Multi-line text field matching Input. */
function Textarea({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  hint = '',
  disabled = false
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'block',
      fontFamily: 'var(--font-body)'
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-secondary)',
      marginBottom: 7
    }
  }, label), /*#__PURE__*/React.createElement("textarea", {
    value: value,
    placeholder: placeholder,
    rows: rows,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: '100%',
      boxSizing: 'border-box',
      resize: 'vertical',
      background: disabled ? 'var(--lhg-grey-200)' : '#fff',
      border: `1px solid ${focus ? 'var(--lhg-blue-500)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-sm)',
      padding: '12px 14px',
      font: '300 16px/1.5 var(--font-body)',
      color: 'var(--lhg-core-blue)',
      outline: 'none',
      boxShadow: focus ? 'var(--shadow-focus)' : 'none',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)'
    }
  }), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 12.5,
      marginTop: 6,
      color: 'var(--text-muted)'
    }
  }, hint));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Accordion.jsx
try { (() => {
/** Accordion — hairline-divided rows, caret rotates, single or multi open. */
function Accordion({
  items = [],
  multi = false,
  defaultOpen = []
}) {
  const [open, setOpen] = React.useState(new Set(defaultOpen));
  const toggle = i => setOpen(prev => {
    const next = new Set(multi ? prev : []);
    if (prev.has(i)) next.delete(i);else next.add(i);
    return next;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-body)',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, items.map((it, i) => {
    const isOpen = open.has(i);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        borderBottom: '1px solid var(--border-subtle)'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => toggle(i),
      style: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '20px 4px',
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        font: '300 18px var(--font-display)',
        color: 'var(--lhg-core-blue)'
      }
    }, it.title), /*#__PURE__*/React.createElement("i", {
      className: "ph-light ph-caret-down",
      style: {
        fontSize: 18,
        color: 'var(--lhg-blue-500)',
        transition: 'transform var(--dur-base) var(--ease-standard)',
        transform: isOpen ? 'rotate(180deg)' : 'none',
        flex: 'none'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        overflow: 'hidden',
        maxHeight: isOpen ? 400 : 0,
        transition: 'max-height var(--dur-base) var(--ease-standard)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '0 4px 22px',
        font: '300 15.5px/1.6 var(--font-body)',
        color: 'var(--text-secondary)'
      }
    }, it.content)));
  }));
}
Object.assign(__ds_scope, { Accordion });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Accordion.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumb.jsx
try { (() => {
/** Breadcrumb trail with caret separators. */
function Breadcrumb({
  items = []
}) {
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Breadcrumb",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
      fontFamily: 'var(--font-body)'
    }
  }, items.map((it, i) => {
    const last = i === items.length - 1;
    const lab = typeof it === 'string' ? it : it.label;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, last ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 400,
        color: 'var(--lhg-core-blue)'
      }
    }, lab) : /*#__PURE__*/React.createElement("a", {
      href: it && it.href || '#',
      style: {
        fontSize: 14,
        fontWeight: 300,
        color: 'var(--lhg-slate-500)',
        textDecoration: 'none'
      }
    }, lab), !last && /*#__PURE__*/React.createElement("i", {
      className: "ph-light ph-caret-right",
      style: {
        fontSize: 13,
        color: 'var(--lhg-grey-400)'
      }
    }));
  }));
}
Object.assign(__ds_scope, { Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumb.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavRail.jsx
try { (() => {
/** Slim left navigation rail — the LHG brand-portal pattern. Icon + label. */
function NavRail({
  items = [],
  active,
  onChange,
  brand = true
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      width: 'var(--nav-rail-width)',
      minHeight: '100%',
      boxSizing: 'border-box',
      background: 'var(--lhg-grey-100)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 0',
      gap: 8,
      fontFamily: 'var(--font-body)'
    }
  }, brand && /*#__PURE__*/React.createElement("img", {
    src: "",
    alt: "",
    "aria-hidden": true,
    style: {
      display: 'none'
    }
  }), items.map(it => {
    const on = it.value === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      onClick: () => onChange && onChange(it.value),
      title: it.label,
      style: {
        width: 72,
        padding: '12px 0',
        border: 'none',
        cursor: 'pointer',
        borderRadius: 'var(--radius-md)',
        background: on ? '#fff' : 'transparent',
        boxShadow: on ? 'var(--shadow-xs)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        color: on ? 'var(--lhg-blue-500)' : 'var(--lhg-slate-500)',
        transition: 'background var(--dur-fast), color var(--dur-fast)'
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: `ph-light ${it.icon}`,
      style: {
        fontSize: 24
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: on ? 400 : 300
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { NavRail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavRail.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Pagination.jsx
try { (() => {
/** Pagination — prev/next arrows with numbered pages; active is Blue 500. */
function Pagination({
  page = 1,
  total = 1,
  onChange
}) {
  const go = p => {
    if (p >= 1 && p <= total && onChange) onChange(p);
  };
  const pages = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - page) <= 1) pages.push(i);else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  const btn = (content, opts = {}) => /*#__PURE__*/React.createElement("button", {
    key: opts.key,
    disabled: opts.disabled,
    onClick: opts.onClick,
    style: {
      minWidth: 40,
      height: 40,
      padding: '0 10px',
      border: 'none',
      cursor: opts.disabled ? 'default' : 'pointer',
      borderRadius: 'var(--radius-pill)',
      font: '300 15px var(--font-body)',
      background: opts.active ? 'var(--lhg-blue-500)' : 'transparent',
      color: opts.active ? '#fff' : opts.disabled ? 'var(--lhg-grey-400)' : 'var(--lhg-core-blue)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, content);
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Pagination",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontFamily: 'var(--font-body)'
    }
  }, btn(/*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-caret-left"
  }), {
    key: 'prev',
    disabled: page === 1,
    onClick: () => go(page - 1)
  }), pages.map((p, i) => p === '…' ? /*#__PURE__*/React.createElement("span", {
    key: `e${i}`,
    style: {
      padding: '0 6px',
      color: 'var(--lhg-grey-400)'
    }
  }, "\u2026") : btn(p, {
    key: p,
    active: p === page,
    onClick: () => go(p)
  })), btn(/*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-caret-right"
  }), {
    key: 'next',
    disabled: page === total,
    onClick: () => go(page + 1)
  }));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Pagination.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
/** Underline tabs — active tab marked by a Blue 500 indicator. */
function Tabs({
  tabs = [],
  value,
  onChange
}) {
  const active = value ?? (tabs[0] && (typeof tabs[0] === 'string' ? tabs[0] : tabs[0].value));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      borderBottom: '1px solid var(--border-subtle)',
      fontFamily: 'var(--font-body)'
    }
  }, tabs.map(t => {
    const val = typeof t === 'string' ? t : t.value;
    const lab = typeof t === 'string' ? t : t.label;
    const on = val === active;
    return /*#__PURE__*/React.createElement("button", {
      key: val,
      onClick: () => onChange && onChange(val),
      style: {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: '12px 16px',
        fontSize: 16,
        fontWeight: 300,
        color: on ? 'var(--lhg-core-blue)' : 'var(--lhg-slate-500)',
        borderBottom: `2px solid ${on ? 'var(--lhg-blue-500)' : 'transparent'}`,
        marginBottom: -1,
        transition: 'color var(--dur-fast), border-color var(--dur-fast)'
      }
    }, lab);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlay/Dialog.jsx
try { (() => {
/** Centered modal dialog with scrim. Controlled via `open`. */
function Dialog({
  open,
  onClose,
  title,
  children,
  primaryLabel = 'Confirm',
  onPrimary,
  secondaryLabel = 'Cancel',
  width = 460
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(5,22,77,0.42)',
      backdropFilter: 'blur(2px)',
      padding: 24,
      fontFamily: 'var(--font-body)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    role: "dialog",
    "aria-modal": "true",
    style: {
      width,
      maxWidth: '100%',
      background: '#fff',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      font: '300 24px/1.2 var(--font-display)',
      letterSpacing: '-.01em',
      color: 'var(--lhg-core-blue)',
      margin: 0
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Close",
    style: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      fontSize: 22,
      color: 'var(--lhg-slate-500)',
      lineHeight: 1,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-x"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 16px/1.6 var(--font-body)',
      color: 'var(--text-secondary)',
      margin: '14px 0 28px'
    }
  }, children), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      justifyContent: 'flex-end'
    }
  }, secondaryLabel && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    size: "sm",
    onClick: onClose
  }, secondaryLabel), primaryLabel && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "primary",
    size: "sm",
    onClick: onPrimary || onClose
  }, primaryLabel))));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlay/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/travel/FareCard.jsx
try { (() => {
/** Fare/cabin option card — name, price, included perks, select state. */
function FareCard({
  name,
  price,
  currency = '€',
  perks = [],
  featured = false,
  selected = false,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      background: '#fff',
      borderRadius: 'var(--radius-lg)',
      border: `1px solid ${selected ? 'var(--lhg-blue-500)' : featured ? 'var(--lhg-core-blue)' : 'var(--border-subtle)'}`,
      boxShadow: selected ? 'var(--shadow-focus)' : featured ? 'var(--shadow-md)' : 'var(--shadow-xs)',
      padding: 24,
      fontFamily: 'var(--font-body)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      minWidth: 220
    }
  }, featured && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: -11,
      left: 24,
      background: 'var(--lhg-core-blue)',
      color: '#fff',
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '.08em',
      textTransform: 'uppercase',
      padding: '4px 12px',
      borderRadius: 'var(--radius-pill)'
    }
  }, "Most flexible"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: 'var(--lhg-blue-500)'
    }
  }, name), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '200 38px var(--font-display)',
      color: 'var(--lhg-core-blue)'
    }
  }, currency, price))), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 9,
      flex: 1
    }
  }, perks.map((p, i) => {
    const inc = typeof p === 'string' ? true : p.included;
    const lab = typeof p === 'string' ? p : p.label;
    return /*#__PURE__*/React.createElement("li", {
      key: i,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        fontSize: 14,
        fontWeight: 300,
        color: inc ? 'var(--text-secondary)' : 'var(--lhg-grey-400)'
      }
    }, /*#__PURE__*/React.createElement("i", {
      className: `ph-light ${inc ? 'ph-check' : 'ph-x'}`,
      style: {
        fontSize: 17,
        color: inc ? 'var(--lhg-success)' : 'var(--lhg-grey-400)',
        flex: 'none'
      }
    }), lab);
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onSelect,
    style: {
      border: selected ? 'none' : '1px solid var(--lhg-core-blue)',
      cursor: 'pointer',
      borderRadius: 'var(--radius-pill)',
      padding: '11px 20px',
      width: '100%',
      background: selected ? 'var(--lhg-blue-500)' : featured ? 'var(--lhg-core-blue)' : 'transparent',
      color: selected || featured ? '#fff' : 'var(--lhg-core-blue)',
      font: '300 15px var(--font-body)'
    }
  }, selected ? 'Selected' : 'Choose'));
}
Object.assign(__ds_scope, { FareCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/travel/FareCard.jsx", error: String((e && e.message) || e) }); }

// components/travel/FlightCard.jsx
try { (() => {
/** Flight result row — times, route, duration, airline, price + select. */
function FlightCard({
  depTime,
  arrTime,
  from,
  to,
  duration,
  stops = 'Direct',
  airline = 'Lufthansa',
  flightNo = '',
  price,
  currency = '€',
  onSelect,
  selected = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      background: '#fff',
      border: `1px solid ${selected ? 'var(--lhg-blue-500)' : 'var(--border-subtle)'}`,
      boxShadow: selected ? 'var(--shadow-focus)' : 'var(--shadow-xs)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      fontFamily: 'var(--font-body)',
      transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flex: 'none',
      width: 120,
      color: 'var(--lhg-slate-500)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-airplane-tilt",
    style: {
      fontSize: 22,
      color: 'var(--lhg-blue-500)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 1.3
    }
  }, airline, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-muted)'
    }
  }, flightNo))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 26px var(--font-display)',
      color: 'var(--lhg-core-blue)',
      lineHeight: 1
    }
  }, depTime), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, from)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      minWidth: 120
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--text-muted)'
    }
  }, duration), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 0,
      margin: '5px 0'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      border: '1.5px solid var(--lhg-blue-500)',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--border-strong)'
    }
  }), /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-airplane",
    style: {
      fontSize: 14,
      color: 'var(--lhg-blue-500)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      height: 1,
      background: 'var(--border-strong)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: 'var(--lhg-blue-500)',
      flex: 'none'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: stops === 'Direct' ? 'var(--lhg-success)' : 'var(--text-muted)'
    }
  }, stops)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 26px var(--font-display)',
      color: 'var(--lhg-core-blue)',
      lineHeight: 1
    }
  }, arrTime), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)',
      marginTop: 4
    }
  }, to))), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: 'right',
      flex: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, "from "), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '300 28px var(--font-display)',
      color: 'var(--lhg-core-blue)'
    }
  }, currency, price)), /*#__PURE__*/React.createElement("button", {
    onClick: onSelect,
    style: {
      border: 'none',
      cursor: 'pointer',
      borderRadius: 'var(--radius-pill)',
      padding: '10px 24px',
      background: selected ? 'var(--lhg-blue-500)' : 'var(--lhg-core-blue)',
      color: '#fff',
      font: '300 15px var(--font-body)'
    }
  }, selected ? 'Selected' : 'Select')));
}
Object.assign(__ds_scope, { FlightCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/travel/FlightCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/booking/BookingHeader.jsx
try { (() => {
/* global React */
const {
  Stepper,
  IconButton
} = window.LufthansaGroupDesignSystem_70bbed;
function BookingHeader({
  step
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      background: '#fff',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1080,
      margin: '0 auto',
      padding: '0 32px',
      height: 70,
      display: 'flex',
      alignItems: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logos/lh-crane.svg",
    alt: "",
    style: {
      height: 24
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logos/lhg-lockup.svg",
    alt: "Lufthansa Group",
    style: {
      height: 13
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: 'auto',
      display: 'flex',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "ph-question",
    label: "Help"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "ph-globe",
    label: "Language"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "ph-user",
    label: "Account",
    variant: "outline"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1080,
      margin: '0 auto',
      padding: '16px 32px'
    }
  }, /*#__PURE__*/React.createElement(Stepper, {
    steps: ['Search', 'Select', 'Passengers', 'Payment'],
    current: step
  }))));
}
window.BookingHeader = BookingHeader;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking/BookingHeader.jsx", error: String((e && e.message) || e) }); }

// ui_kits/booking/CheckoutScreen.jsx
try { (() => {
/* global React */
const {
  Input,
  Select,
  Checkbox,
  Button,
  Card,
  Switch,
  Divider,
  FareCard
} = window.LufthansaGroupDesignSystem_70bbed;
function CheckoutScreen({
  onConfirm,
  onBack
}) {
  const [fare, setFare] = React.useState('flex');
  const [green, setGreen] = React.useState(true);
  const base = 612,
    flexUp = fare === 'flex' ? 130 : 0,
    greenAdd = green ? 18 : 0;
  const total = base + flexUp + greenAdd;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1080,
      margin: '0 auto',
      padding: '32px',
      display: 'grid',
      gridTemplateColumns: '1fr 360px',
      gap: 28,
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--lhg-blue-500)',
      font: '300 14px var(--font-body)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: 0,
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-arrow-left"
  }), " Back to flights"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '300 30px var(--font-display)',
      letterSpacing: '-.01em',
      color: 'var(--lhg-core-blue)',
      margin: '0 0 22px'
    }
  }, "Passenger details"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Title",
    options: ['Mr', 'Ms', 'Mx', 'Dr']
  }), /*#__PURE__*/React.createElement("div", null), /*#__PURE__*/React.createElement(Input, {
    label: "First name",
    placeholder: "As in passport"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Last name",
    placeholder: "As in passport"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Email",
    type: "email",
    icon: "ph-envelope",
    placeholder: "you@example.com"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Frequent flyer (optional)",
    icon: "ph-identification-card",
    placeholder: "Miles & More no."
  })), /*#__PURE__*/React.createElement(Divider, {
    label: "Fare",
    spacing: 28
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(FareCard, {
    name: "Economy Light",
    price: "612",
    perks: [{
      label: 'Carry-on bag',
      included: true
    }, {
      label: 'Checked bag',
      included: false
    }, {
      label: 'Rebooking',
      included: false
    }],
    selected: fare === 'light',
    onSelect: () => setFare('light')
  }), /*#__PURE__*/React.createElement(FareCard, {
    name: "Economy Flex",
    price: "742",
    featured: true,
    perks: [{
      label: 'Carry-on bag',
      included: true
    }, {
      label: 'Checked bag',
      included: true
    }, {
      label: 'Free rebooking',
      included: true
    }],
    selected: fare === 'flex',
    onSelect: () => setFare('flex')
  })), /*#__PURE__*/React.createElement(Divider, {
    label: "Add-ons",
    spacing: 28
  }), /*#__PURE__*/React.createElement(Card, {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-leaf",
    style: {
      fontSize: 26,
      color: 'var(--lhg-teal)'
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '400 16px var(--font-body)',
      color: 'var(--lhg-core-blue)'
    }
  }, "Green Fare \u2014 fly more sustainable"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 14px var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, "20% SAF + 80% verified offset \xB7 \u20AC18"))), /*#__PURE__*/React.createElement(Switch, {
    checked: green,
    onChange: setGreen
  }))), /*#__PURE__*/React.createElement("aside", {
    style: {
      position: 'sticky',
      top: 110
    }
  }, /*#__PURE__*/React.createElement(Card, {
    elevated: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px var(--font-body)',
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color: 'var(--lhg-blue-500)',
      marginBottom: 14
    }
  }, "Your trip"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-airplane-tilt",
    style: {
      fontSize: 20,
      color: 'var(--lhg-blue-500)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '300 17px var(--font-display)',
      color: 'var(--lhg-core-blue)'
    }
  }, "FRA \u2192 JFK")), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '300 14px var(--font-body)',
      color: 'var(--text-muted)',
      marginBottom: 16
    }
  }, "Wed 24 Jun \xB7 10:25 \xB7 LH 400 \xB7 Direct"), /*#__PURE__*/React.createElement(Divider, {
    spacing: 14
  }), [['Base fare', `€${base}`], [fare === 'flex' ? 'Economy Flex' : 'Economy Light', flexUp ? `€${flexUp}` : '—'], ['Green Fare', greenAdd ? `€${greenAdd}` : '—']].map(([k, v], i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      font: '300 15px var(--font-body)',
      color: 'var(--text-secondary)',
      padding: '6px 0'
    }
  }, /*#__PURE__*/React.createElement("span", null, k), /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: 'tabular-nums'
    }
  }, v))), /*#__PURE__*/React.createElement(Divider, {
    spacing: 14
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: '400 16px var(--font-body)',
      color: 'var(--lhg-core-blue)'
    }
  }, "Total"), /*#__PURE__*/React.createElement("span", {
    style: {
      font: '200 34px var(--font-display)',
      color: 'var(--lhg-core-blue)'
    }
  }, "\u20AC", total)), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    full: true,
    onClick: onConfirm
  }, "Confirm & pay"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 12.5px/1.5 var(--font-body)',
      color: 'var(--text-muted)',
      textAlign: 'center',
      margin: '12px 0 0'
    }
  }, "Free cancellation within 24 hours"))));
}
window.CheckoutScreen = CheckoutScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking/CheckoutScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/booking/ConfirmDialog.jsx
try { (() => {
/* global React */
const {
  Dialog
} = window.LufthansaGroupDesignSystem_70bbed;
function ConfirmDialog({
  open,
  onClose
}) {
  return /*#__PURE__*/React.createElement(Dialog, {
    open: open,
    onClose: onClose,
    title: "Booking confirmed",
    primaryLabel: "View e-ticket",
    secondaryLabel: "",
    width: 420,
    onPrimary: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 56,
      height: 56,
      borderRadius: '50%',
      background: '#e2f3ea',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-check",
    style: {
      fontSize: 30,
      color: 'var(--lhg-success)'
    }
  })), /*#__PURE__*/React.createElement("span", null, "Your flight ", /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 500,
      color: 'var(--lhg-core-blue)'
    }
  }, "FRA \u2192 JFK"), " on Wed 24 Jun is booked. We have sent your e-ticket and booking code ", /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 500,
      color: 'var(--lhg-core-blue)'
    }
  }, "LH4XK2"), " to your email.")));
}
window.ConfirmDialog = ConfirmDialog;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking/ConfirmDialog.jsx", error: String((e && e.message) || e) }); }

// ui_kits/booking/ResultsScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* global React */
const {
  FlightCard,
  Button,
  Badge,
  Divider
} = window.LufthansaGroupDesignSystem_70bbed;
function ResultsScreen({
  onSelect,
  onBack
}) {
  const [sel, setSel] = React.useState('lh400');
  const flights = [{
    id: 'lh400',
    depTime: '10:25',
    arrTime: '13:05',
    from: 'FRA',
    to: 'JFK',
    duration: '8h 40m',
    stops: 'Direct',
    airline: 'Lufthansa',
    flightNo: 'LH 400',
    price: '612'
  }, {
    id: 'lx18',
    depTime: '07:15',
    arrTime: '11:30',
    from: 'FRA',
    to: 'JFK',
    duration: '9h 15m',
    stops: '1 stop · ZRH',
    airline: 'SWISS',
    flightNo: 'LX 18',
    price: '548'
  }, {
    id: 'os89',
    depTime: '14:50',
    arrTime: '18:10',
    from: 'FRA',
    to: 'JFK',
    duration: '8h 20m',
    stops: 'Direct',
    airline: 'Austrian',
    flightNo: 'OS 89',
    price: '689'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1080,
      margin: '0 auto',
      padding: '32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--lhg-blue-500)',
      font: '300 14px var(--font-body)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: 0,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "ph-light ph-arrow-left"
  }), " Edit search"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '300 32px var(--font-display)',
      letterSpacing: '-.01em',
      color: 'var(--lhg-core-blue)',
      margin: 0
    }
  }, "Frankfurt \u2192 New York"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 15px var(--font-body)',
      color: 'var(--text-muted)',
      margin: '6px 0 0'
    }
  }, "Wed 24 Jun \xB7 1 Adult \xB7 Economy")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "blue",
    icon: "ph-funnel"
  }, "3 results"), /*#__PURE__*/React.createElement(Badge, {
    tone: "teal",
    icon: "ph-leaf"
  }, "Green fares available"))), /*#__PURE__*/React.createElement(Divider, {
    spacing: 20
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, flights.map(f => /*#__PURE__*/React.createElement(FlightCard, _extends({
    key: f.id
  }, f, {
    selected: sel === f.id,
    onSelect: () => setSel(f.id)
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    onClick: onSelect,
    iconRight: /*#__PURE__*/React.createElement("i", {
      className: "ph-light ph-arrow-right"
    })
  }, "Continue to passengers")));
}
window.ResultsScreen = ResultsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking/ResultsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/booking/SearchScreen.jsx
try { (() => {
/* global React */
const {
  SegmentedControl,
  Input,
  Select,
  Button
} = window.LufthansaGroupDesignSystem_70bbed;
function SearchScreen({
  onSearch
}) {
  const [trip, setTrip] = React.useState('Return');
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--lhg-core-blue)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: '-10%',
      top: '-50%',
      width: '60%',
      height: '200%',
      background: 'radial-gradient(circle at 40% 50%, rgba(63,115,216,.5), rgba(5,22,77,0) 62%)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 1080,
      margin: '0 auto',
      padding: '56px 32px 90px'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '200 46px/1.05 var(--font-display)',
      letterSpacing: '-.02em',
      color: '#fff',
      margin: 0
    }
  }, "Where would you like to go?"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 18px var(--font-body)',
      color: 'rgba(255,255,255,.8)',
      margin: '14px 0 0'
    }
  }, "Book across Lufthansa, SWISS, Austrian, Brussels and Eurowings."))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1080,
      margin: '-56px auto 0',
      padding: '0 32px',
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: '#fff',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      padding: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    options: ['Return', 'One way', 'Multi-city'],
    value: trip,
    onChange: setTrip
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
      gap: 14,
      alignItems: 'flex-end'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "From",
    icon: "ph-airplane-takeoff",
    placeholder: "Frankfurt (FRA)"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "To",
    icon: "ph-airplane-landing",
    placeholder: "New York (JFK)"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Departure",
    icon: "ph-calendar-blank",
    placeholder: "24 Jun 2026"
  }), /*#__PURE__*/React.createElement(Select, {
    label: "Passengers",
    options: ['1 Adult', '2 Adults', '2 Adults · 1 Child', 'Family (4)']
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    size: "lg",
    onClick: onSearch,
    iconRight: /*#__PURE__*/React.createElement("i", {
      className: "ph-light ph-magnifying-glass"
    })
  }, "Search")))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1080,
      margin: '40px auto 0',
      padding: '0 32px 64px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 20
    }
  }, [{
    ic: 'ph-leaf',
    t: 'Fly more sustainable',
    b: 'Add Green Fares and support SAF at checkout.'
  }, {
    ic: 'ph-seat',
    t: 'Choose your cabin',
    b: 'Economy to First — comfort for every journey.'
  }, {
    ic: 'ph-shield-check',
    t: 'Flexible by default',
    b: 'Free rebooking on most fares, up to 24h before.'
  }].map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      background: '#fff',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: `ph-light ${c.ic}`,
    style: {
      fontSize: 30,
      color: 'var(--lhg-blue-500)'
    }
  }), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: '300 20px var(--font-display)',
      color: 'var(--lhg-core-blue)',
      margin: '14px 0 6px'
    }
  }, c.t), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 14.5px/1.55 var(--font-body)',
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, c.b))))));
}
window.SearchScreen = SearchScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/booking/SearchScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate/Header.jsx
try { (() => {
/* global React */
const {
  IconButton
} = window.LufthansaGroupDesignSystem_70bbed;
function Header({
  tab,
  setTab
}) {
  const links = ['Group', 'Responsibility', 'Investors', 'Newsroom', 'Careers'];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '0 40px',
      height: 76,
      display: 'flex',
      alignItems: 'center',
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      setTab('Group');
    },
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logos/lh-crane.svg",
    alt: "",
    style: {
      height: 26
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logos/lhg-lockup.svg",
    alt: "Lufthansa Group",
    style: {
      height: 15
    }
  })), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      gap: 4,
      marginLeft: 'auto'
    }
  }, links.map(l => /*#__PURE__*/React.createElement("button", {
    key: l,
    onClick: () => setTab(l),
    style: {
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      font: '300 15.5px var(--font-body)',
      padding: '8px 14px',
      borderRadius: 'var(--radius-pill)',
      color: tab === l ? 'var(--lhg-blue-500)' : 'var(--lhg-core-blue)',
      transition: 'color var(--dur-fast)'
    },
    onMouseEnter: e => {
      if (tab !== l) e.currentTarget.style.color = 'var(--lhg-blue-500)';
    },
    onMouseLeave: e => {
      if (tab !== l) e.currentTarget.style.color = 'var(--lhg-core-blue)';
    }
  }, l))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "ph-magnifying-glass",
    label: "Search"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "ph-globe",
    label: "Language"
  }))));
}
window.Header = Header;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate/Hero.jsx
try { (() => {
/* global React */
const {
  Button,
  Badge
} = window.LufthansaGroupDesignSystem_70bbed;
function Hero() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--lhg-core-blue)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: '-12%',
      top: '-30%',
      width: '70%',
      height: '160%',
      background: 'radial-gradient(circle at 35% 50%, rgba(63,115,216,.55), rgba(5,22,77,0) 62%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '-10%',
      bottom: '-120%',
      width: '120%',
      height: '180%',
      borderTop: '1px solid rgba(255,255,255,.30)',
      borderRadius: '50%'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 1200,
      margin: '0 auto',
      padding: '110px 40px 120px'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "blue",
    icon: "ph-leaf"
  }, "Connecting a sustainable world"), /*#__PURE__*/React.createElement("h1", {
    style: {
      font: '200 clamp(48px,6.5vw,88px)/1.02 var(--font-display)',
      letterSpacing: '-.02em',
      color: '#fff',
      margin: '26px 0 0',
      maxWidth: 820
    }
  }, "Shaping the future", /*#__PURE__*/React.createElement("br", null), "of aviation."), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 21px/1.6 var(--font-body)',
      color: 'rgba(255,255,255,.82)',
      maxWidth: 540,
      margin: '24px 0 0'
    }
  }, "We are connecting people, cultures and economies in a responsible way \u2014 across five airlines and more than 250 destinations worldwide."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      marginTop: 38
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    iconRight: /*#__PURE__*/React.createElement("i", {
      className: "ph-light ph-arrow-right"
    })
  }, "Discover the Group"), /*#__PURE__*/React.createElement(Button, {
    variant: "on-dark"
  }, "Our responsibility"))));
}
window.Hero = Hero;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate/Hero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate/Sections.jsx
try { (() => {
/* global React */
const {
  Button,
  Input
} = window.LufthansaGroupDesignSystem_70bbed;
function Quote() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: 'var(--lhg-grey-200)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1000,
      margin: '0 auto',
      padding: '96px 40px',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logos/lh-crane.svg",
    alt: "",
    style: {
      height: 34,
      marginBottom: 32
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '400 clamp(26px,3.4vw,40px)/1.32 var(--font-serif)',
      color: 'var(--lhg-core-blue)',
      margin: 0,
      letterSpacing: '-.005em'
    }
  }, "\u201CWe are connecting people, cultures and economies in a sustainable way.\u201D"), /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 13px var(--font-body)',
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      marginTop: 28
    }
  }, "The Lufthansa Group promise")));
}
function CTA() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--lhg-core-blue)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: '-8%',
      top: '-60%',
      width: '55%',
      height: '220%',
      background: 'radial-gradient(circle, rgba(63,115,216,.5), rgba(5,22,77,0) 60%)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      maxWidth: 1200,
      margin: '0 auto',
      padding: '72px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 40,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '200 40px/1.1 var(--font-display)',
      letterSpacing: '-.02em',
      color: '#fff',
      margin: 0
    }
  }, "Stay close to the Group"), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 17px/1.5 var(--font-body)',
      color: 'rgba(255,255,255,.8)',
      margin: '12px 0 0',
      maxWidth: 420
    }
  }, "Quarterly results, sustainability updates and newsroom highlights \u2014 straight to your inbox.")), /*#__PURE__*/React.createElement("form", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'flex-end'
    },
    onSubmit: e => e.preventDefault()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 260
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "",
    placeholder: "your.email@company.com",
    icon: "ph-envelope"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "accent"
  }, "Subscribe"))));
}
function Footer() {
  const cols = {
    Group: ['About us', 'Strategy', 'Brands', 'Fleet'],
    Responsibility: ['Climate', 'People', 'Governance', 'Reports'],
    Investors: ['Share', 'Results', 'Events', 'Bonds'],
    Newsroom: ['Press releases', 'Media library', 'Contacts']
  };
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: '#fff',
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '56px 40px 40px',
      display: 'grid',
      gridTemplateColumns: '1.4fr repeat(4,1fr)',
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logos/lhg-lockup.svg",
    alt: "Lufthansa Group",
    style: {
      height: 16
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 13.5px/1.6 var(--font-body)',
      color: 'var(--text-muted)',
      marginTop: 18,
      maxWidth: 220
    }
  }, "Deutsche Lufthansa AG \xB7 Frankfurt am Main")), Object.entries(cols).map(([h, items]) => /*#__PURE__*/React.createElement("div", {
    key: h
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px var(--font-body)',
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      color: 'var(--lhg-core-blue)',
      marginBottom: 14
    }
  }, h), /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 9
    }
  }, items.map(it => /*#__PURE__*/React.createElement("li", {
    key: it
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      font: '300 14px var(--font-body)',
      color: 'var(--text-secondary)',
      textDecoration: 'none'
    }
  }, it))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '20px 40px',
      display: 'flex',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      font: '300 13px var(--font-body)',
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2025 Deutsche Lufthansa AG"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'var(--text-muted)',
      textDecoration: 'none'
    }
  }, "Imprint"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'var(--text-muted)',
      textDecoration: 'none'
    }
  }, "Privacy"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'var(--text-muted)',
      textDecoration: 'none'
    }
  }, "Cookie settings")))));
}
window.Quote = Quote;
window.CTA = CTA;
window.Footer = Footer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate/Sections.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate/StatBand.jsx
try { (() => {
/* global React */
const {
  Stat
} = window.LufthansaGroupDesignSystem_70bbed;
function StatBand() {
  const stats = [{
    value: '5',
    label: 'Passenger airlines'
  }, {
    value: '250',
    unit: '+',
    label: 'Destinations worldwide'
  }, {
    value: '1.673',
    unit: 'Mio €',
    label: 'Adjusted EBIT 2024'
  }, {
    value: '30',
    unit: '%',
    label: 'Less CO₂ on new aircraft'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: '#fff',
      borderBottom: '1px solid var(--border-subtle)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '54px 40px',
      display: 'grid',
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 32
    }
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      borderLeft: i ? '1px solid var(--border-subtle)' : 'none',
      paddingLeft: i ? 32 : 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '200 52px/1 var(--font-display)',
      letterSpacing: '-.02em',
      color: 'var(--lhg-core-blue)'
    }
  }, s.value, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      color: 'var(--lhg-blue-500)',
      marginLeft: 4
    }
  }, s.unit)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 300,
      color: 'var(--text-secondary)',
      marginTop: 10
    }
  }, s.label)))));
}
window.StatBand = StatBand;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate/StatBand.jsx", error: String((e && e.message) || e) }); }

// ui_kits/corporate/StoryGrid.jsx
try { (() => {
/* global React */
const {
  Card,
  Badge,
  Button
} = window.LufthansaGroupDesignSystem_70bbed;
function StoryGrid() {
  const stories = [{
    img: '../../assets/photography/turquoise-phone.jpg',
    tag: 'Innovation',
    tone: 'blue',
    title: 'Aviation revolutionized by technology',
    body: 'How digital cabins and AI-assisted operations are reshaping every journey.'
  }, {
    img: '../../assets/photography/portrait-red.webp',
    tag: 'People',
    tone: 'purple',
    title: 'The people who keep us flying',
    body: 'More than 100,000 colleagues across the Group, trained to the highest standards.'
  }, {
    img: '../../assets/photography/magenta-portrait.webp',
    tag: 'Responsibility',
    tone: 'teal',
    title: 'Fly more sustainable today',
    body: 'Sustainable aviation fuel and a renewed fleet on the path to net zero by 2050.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: '0 auto',
      padding: '88px 40px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      font: '500 12px var(--font-body)',
      letterSpacing: '.14em',
      textTransform: 'uppercase',
      color: 'var(--lhg-blue-500)'
    }
  }, "Stories"), /*#__PURE__*/React.createElement("h2", {
    style: {
      font: '300 38px/1.1 var(--font-display)',
      letterSpacing: '-.01em',
      color: 'var(--lhg-core-blue)',
      margin: '12px 0 0'
    }
  }, "Taking travel to new heights")), /*#__PURE__*/React.createElement(Button, {
    variant: "tertiary",
    iconRight: /*#__PURE__*/React.createElement("i", {
      className: "ph-light ph-arrow-right"
    })
  }, "All stories")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: 24
    }
  }, stories.map((s, i) => /*#__PURE__*/React.createElement("article", {
    key: i,
    style: {
      cursor: 'pointer'
    },
    onMouseEnter: e => {
      e.currentTarget.querySelector('img').style.transform = 'scale(1.05)';
    },
    onMouseLeave: e => {
      e.currentTarget.querySelector('img').style.transform = 'scale(1)';
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      aspectRatio: '4/3',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: s.img,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      transition: 'transform var(--dur-slow) var(--ease-out)'
    }
  })), /*#__PURE__*/React.createElement(Badge, {
    tone: s.tone
  }, s.tag), /*#__PURE__*/React.createElement("h3", {
    style: {
      font: '300 23px/1.25 var(--font-display)',
      letterSpacing: '-.01em',
      color: 'var(--lhg-core-blue)',
      margin: '14px 0 8px'
    }
  }, s.title), /*#__PURE__*/React.createElement("p", {
    style: {
      font: '300 15.5px/1.55 var(--font-body)',
      color: 'var(--text-secondary)',
      margin: 0
    }
  }, s.body)))));
}
window.StoryGrid = StoryGrid;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/corporate/StoryGrid.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Divider = __ds_scope.Divider;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Stat = __ds_scope.Stat;

__ds_ns.Stepper = __ds_scope.Stepper;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.List = __ds_scope.List;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Alert = __ds_scope.Alert;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.SearchBar = __ds_scope.SearchBar;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Accordion = __ds_scope.Accordion;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.NavRail = __ds_scope.NavRail;

__ds_ns.Pagination = __ds_scope.Pagination;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.FareCard = __ds_scope.FareCard;

__ds_ns.FlightCard = __ds_scope.FlightCard;

})();
