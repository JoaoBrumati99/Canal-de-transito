/**
 * Icons — small, reusable outline SVGs.
 * All icons inherit color via `currentColor` and share a consistent
 * 24x24 grid, 1.6 stroke weight and rounded caps/joins.
 */

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export function ShieldIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.2l6.5 2.4v5c0 4.3-2.8 7.4-6.5 8.6-3.7-1.2-6.5-4.3-6.5-8.6v-5L12 3.2z" />
      <path d="M9.3 12.2l1.9 1.9 3.6-3.9" />
    </svg>
  );
}

export function AlertTriangleIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10.3 4.8 2.9 17.7a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4.5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function AngryFaceIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m7.5 8.5 3 1.2m6-1.2-3 1.2" />
      <path d="M9 12h.01M15 12h.01" />
      <path d="M8.5 17c.8-1.6 2-2.4 3.5-2.4s2.7.8 3.5 2.4" />
    </svg>
  );
}

export function ThumbsUpIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 10v11H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3z" />
      <path d="m7 10 4-7a2 2 0 0 1 3 2l-1 5h5.2a2 2 0 0 1 2 2.4l-1.6 7a2 2 0 0 1-2 1.6H7" />
    </svg>
  );
}

export function SteeringWheelIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9V3m-2.5 10.5L4 17m10-3.5L20 17" />
    </svg>
  );
}

export function NoParkingIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 17V7h3a3 3 0 1 1 0 6H9" />
      <path d="m5.6 5.6 12.8 12.8" />
    </svg>
  );
}

export function SpeedometerIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.6 18a9 9 0 1 1 14.8 0" />
      <path className="speedometer-needle" d="m12 13 4-4" />
      <circle cx="12" cy="13" r="1.2" />
      <path d="M5.2 18h13.6" />
    </svg>
  );
}

export function PhoneIcon(props) {
  return (
    <svg {...base} {...props}>
      <g className="phone-handset">
        <rect x="7" y="2.5" width="10" height="19" rx="2" />
        <path d="M10 5.5h4" />
        <path d="M11.5 18.5h1" />
      </g>
    </svg>
  );
}

export function HandshakeIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="m2.5 9 3.8-3.8 4.3 1.1 1.4 1.3 1.8-1.3 3.9.4L21.5 9l-3.9 4-2.3-1.6-2.2 2a1.8 1.8 0 0 1-2.5 0L6.3 9.8l-2 1.3L2.5 9z" />
      <path d="m8.2 9.9 2.1-1.1a1.9 1.9 0 0 1 2 .1l2 1.3-2.6 2.6a1.7 1.7 0 0 1-2.4 0l-1.1-1.1" />
      <path d="m7.2 10.5-2.7 2.7 2.2 2.2 1.7-1.3 1.5 1.5 1.6-1.3 1.4 1.4 1.7-1.6 1.5 1.1 2.4-2.4-1.8-1.8" />
    </svg>
  );
}

export function ClipIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M20 11.5l-7.8 7.8a4.4 4.4 0 0 1-6.2-6.2l8-8a2.9 2.9 0 0 1 4.1 4.1l-8 8a1.4 1.4 0 0 1-2-2l7.3-7.3" />
    </svg>
  );
}

export function UploadCloudIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7.5 17.5a4 4 0 0 1-.5-8 5.2 5.2 0 0 1 10 .8 3.4 3.4 0 0 1 0 6.7" />
      <path d="M12 12v6" />
      <path d="M9.4 14.2 12 11.6l2.6 2.6" />
    </svg>
  );
}

export function ArrowRightIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export function ShieldCheckMini(props) {
  return (
    <svg {...base} {...props} strokeWidth={1.7}>
      <path d="M12 3.4l6 2.2v4.6c0 4-2.6 6.8-6 7.9-3.4-1.1-6-3.9-6-7.9V5.6l6-2.2z" />
      <path d="M9.4 12l1.8 1.8 3.4-3.7" />
    </svg>
  );
}

export function CheckCircleIcon(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.2l2.3 2.3 4.7-4.9" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function FileIcon(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h6.5L18 8v11.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" />
      <path d="M13 3.6V8h4.4" />
    </svg>
  );
}

