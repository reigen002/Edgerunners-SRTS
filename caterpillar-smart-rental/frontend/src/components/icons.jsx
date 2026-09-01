// A small authored icon set — single 1.5px stroke, 20px grid. No emoji, no icon-font substitutes.
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" };

export function IconAlert(props) {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} {...props}>
      <path d="M10 2.5 18 17H2L10 2.5Z" />
      <path d="M10 8v4" />
      <circle cx="10" cy="14.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPin(props) {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} {...props}>
      <path d="M10 18s6-5.6 6-10.4A6 6 0 0 0 4 7.6C4 12.4 10 18 10 18Z" />
      <circle cx="10" cy="7.5" r="2" />
    </svg>
  );
}

export function IconGauge(props) {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} {...props}>
      <path d="M3 15a7 7 0 1 1 14 0" />
      <path d="M10 15 13.5 9" />
      <path d="M10 15h.01" />
    </svg>
  );
}

export function IconClock(props) {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} {...props}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6v4l2.6 2.6" />
    </svg>
  );
}

export function IconArrowRight(props) {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} {...props}>
      <path d="M4 10h12" />
      <path d="M11 5l5 5-5 5" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} {...props}>
      <path d="M4 10.5 8 14.5 16 6" />
    </svg>
  );
}

export function IconBelt(props) {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} {...props}>
      <rect x="3" y="8" width="14" height="4" rx="1" />
      <circle cx="10" cy="10" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTrend(props) {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} {...props}>
      <path d="M3 14 8 8l3 3 6-7" />
      <path d="M13 4h4v4" />
    </svg>
  );
}

export function IconTruck(props) {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} {...props}>
      <path d="M2 6h9v8H2z" />
      <path d="M11 9h4l3 3v2h-7z" />
      <circle cx="6" cy="15.5" r="1.4" />
      <circle cx="15" cy="15.5" r="1.4" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} {...props}>
      <path d="M5 5l10 10M15 5 5 15" />
    </svg>
  );
}
