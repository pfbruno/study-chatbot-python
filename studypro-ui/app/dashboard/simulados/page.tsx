{entitlement.authenticated ? (
  <button
    type="button"
    onClick={handleLogout}
    className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
  >
    Sair
  </button>
) : (
  <>
    <Link
      href="/login"
      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
    >
      Entrar
    </Link>

    <Link
      href="/register"
      className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
    >
      Criar conta
    </Link>
  </>
)}

{entitlement.user?.plan !== "pro" ? (
  <Link
    href="/pricing"
    className="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black transition hover:brightness-95"
  >
    Upgrade PRO
  </Link>
) : null}