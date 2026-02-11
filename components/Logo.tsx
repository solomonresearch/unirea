export function Logo({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#7E191B" />
      <path
        d="M14 14V30C14 34.4183 17.5817 38 22 38H26C30.4183 38 34 34.4183 34 30V14"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}
