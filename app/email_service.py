import json
import logging
import os
from urllib import error, request

LOGGER = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
EMAIL_FROM = os.getenv(
    "EMAIL_FROM",
    "noreply@emails.minhaprovacao.com.br",
).strip()
APP_NAME = os.getenv("APP_NAME", "MinhAprovação").strip()


def _send_email_via_resend(to_email: str, subject: str, html: str) -> bool:
    if not RESEND_API_KEY:
        LOGGER.warning("email.resend.missing_api_key")
        return False

    payload = {
        "from": EMAIL_FROM,
        "to": [to_email],
        "subject": subject,
        "html": html,
    }

    req = request.Request(
        url="https://api.resend.com/emails",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "minhaprovacao-backend/1.0",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=20) as response:
            status_code = getattr(response, "status", 200)
            response_body = response.read().decode("utf-8", errors="ignore")

            if 200 <= status_code < 300:
                LOGGER.info(
                    "email.resend.sent status_code=%s to_email=%s response_body=%s",
                    status_code,
                    to_email,
                    response_body,
                )
                return True

            LOGGER.warning(
                "email.resend.bad_status status_code=%s to_email=%s response_body=%s",
                status_code,
                to_email,
                response_body,
            )
            return False

    except error.HTTPError as exc:
        try:
            response_body = exc.read().decode("utf-8", errors="ignore")
        except Exception:
            response_body = ""

        LOGGER.warning(
            "email.resend.http_error status_code=%s to_email=%s email_from=%s response_body=%s",
            exc.code,
            to_email,
            EMAIL_FROM,
            response_body,
        )
        return False

    except Exception as exc:  # noqa: BLE001
        LOGGER.warning(
            "email.resend.unexpected_error to_email=%s email_from=%s error=%s",
            to_email,
            EMAIL_FROM,
            str(exc),
        )
        return False


def send_verification_email(
    *,
    to_email: str,
    user_name: str,
    verification_url: str,
) -> bool:
    subject = f"Confirme seu e-mail no {APP_NAME}"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
      <div style="padding: 24px 0;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Bem-vindo ao {APP_NAME}</h1>

        <p style="font-size: 16px; line-height: 1.7;">
          Olá, {user_name}.
        </p>

        <p style="font-size: 16px; line-height: 1.7;">
          Sua conta foi criada com sucesso. Para liberar o acesso à plataforma,
          confirme seu e-mail clicando no botão abaixo.
        </p>

        <div style="margin: 28px 0;">
          <a
            href="{verification_url}"
            style="
              display: inline-block;
              background: #2563eb;
              color: white;
              text-decoration: none;
              padding: 14px 22px;
              border-radius: 12px;
              font-weight: bold;
            "
          >
            Confirmar e-mail
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.7; color: #4b5563;">
          Se o botão não funcionar, copie e cole este link no navegador:
        </p>

        <p style="font-size: 14px; line-height: 1.7; color: #2563eb; word-break: break-all;">
          {verification_url}
        </p>

        <hr style="margin: 28px 0; border: none; border-top: 1px solid #e5e7eb;" />

        <p style="font-size: 14px; line-height: 1.7; color: #6b7280;">
          Este link expira automaticamente por segurança. Se você não criou uma conta no {APP_NAME},
          ignore este e-mail.
        </p>
      </div>
    </div>
    """

    return _send_email_via_resend(to_email, subject, html)


def send_welcome_email(
    *,
    to_email: str,
    user_name: str,
) -> bool:
    subject = f"Sua conta no {APP_NAME} está pronta"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111827;">
      <div style="padding: 24px 0;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Conta confirmada com sucesso</h1>

        <p style="font-size: 16px; line-height: 1.7;">
          Olá, {user_name}.
        </p>

        <p style="font-size: 16px; line-height: 1.7;">
          Seu e-mail foi confirmado e sua conta no {APP_NAME} já está pronta para uso.
        </p>

        <p style="font-size: 16px; line-height: 1.7;">
          Agora você já pode entrar na plataforma, fazer treinos, resolver simulados
          e acompanhar sua evolução.
        </p>

        <p style="font-size: 14px; line-height: 1.7; color: #6b7280; margin-top: 28px;">
          Bons estudos.
        </p>
      </div>
    </div>
    """

    return _send_email_via_resend(to_email, subject, html)