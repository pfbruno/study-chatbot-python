import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "@/lib/api"

export function clearAuthSession() {
  if (typeof window === "undefined") return

  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export function redirectToLoginAfterSessionEnded() {
  if (typeof window === "undefined") return

  clearAuthSession()

  const currentPath =
    window.location.pathname + window.location.search + window.location.hash

  const redirect = encodeURIComponent(currentPath || "/dashboard")

  window.location.href = `/login?session=ended&redirect=${redirect}`
}

export function isInvalidSessionStatus(status: number) {
  return status === 401
}
