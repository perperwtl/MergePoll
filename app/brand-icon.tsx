/** Overlapping voices coming together in one conversation. */
export function BrandIcon({ size = 23 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 15H6l-4 3V6a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v2" />
      <path d="M13 8h6a3 3 0 0 1 3 3v11l-4-3h-5a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Z" />
    </svg>
  );
}
