type MinhAprovacaoLogoMarkProps = {
  className?: string
  title?: string
}

export function MinhAprovacaoLogoMark({
  className = "size-10",
  title = "MinhAprovação",
}: MinhAprovacaoLogoMarkProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>

      <rect width="512" height="512" rx="104" fill="#06184A" />

      <path
        fill="#FFFFFF"
        d="M96 394V118h64l96 91 96-91h64v276h-58V235l-102 94-102-94v159H96Z"
      />

      <path
        fill="#FFFFFF"
        d="M139 404 224 226h64l85 178h-66l-16-39h-70l-16 39h-66Zm104-91h26l-13-33-13 33Z"
      />

      <path
        fill="#06184A"
        d="M217 260 256 222l39 38v105h-41v-67l-37 67h-41l41-105Z"
      />

      <path
        fill="#FFFFFF"
        d="M238 252h36v119h-36V252Z"
      />
    </svg>
  )
}