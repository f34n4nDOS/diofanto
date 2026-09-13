"""
Envío de emails transaccionales usando la API de Resend
(https://resend.com). Se usa requests directo en vez del SDK oficial
para no sumar una dependencia más, manteniendo el mismo estilo que ya
usa el proyecto para llamar a OpenRouter.
"""
import os
import logging
import requests

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_API_URL = "https://api.resend.com/emails"

# Tiene que ser una dirección del dominio que verificaste en Resend
# (Domains -> diofanto.xyz). Antes de verificar el dominio, Resend
# solo te deja mandar a tu propio email de cuenta, para pruebas.
EMAIL_FROM = os.getenv("EMAIL_FROM", "Diofanto <no-reply@diofanto.xyz>")

REQUEST_TIMEOUT_SECONDS = 15


def send_email(to_email: str, subject: str, html_body: str) -> None:
    """
    Envía un email vía Resend. Levanta una excepción si falla —
    el llamador decide cómo manejarlo (por ejemplo, en el flujo de
    "olvidé mi contraseña" conviene no revelarle al usuario si el
    envío falló o si el email directamente no existía, para no dar
    pistas de qué cuentas existen).
    """
    if not RESEND_API_KEY:
        raise ValueError("Falta configurar RESEND_API_KEY en las variables de entorno")

    response = requests.post(
        RESEND_API_URL,
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": EMAIL_FROM,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """Arma y envía el email de 'recuperar contraseña' con el link al frontend."""
    subject = "Recuperá tu contraseña en Diofanto"
    html_body = f"""
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1e2340;">
      <h2 style="margin-bottom: 4px;">Recuperar contraseña</h2>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Diofanto.</p>
      <p>
        <a href="{reset_link}"
           style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 10px 20px;
                  border-radius: 6px; text-decoration: none; margin: 12px 0;">
          Elegir nueva contraseña
        </a>
      </p>
      <p style="font-size: 13px; color: #6b7280;">
        Este enlace expira en 30 minutos. Si no pediste este cambio, podés ignorar
        este email tranquilamente — tu contraseña actual sigue funcionando sin cambios.
      </p>
      <p style="font-size: 12px; color: #9ca3af;">
        Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
        {reset_link}
      </p>
    </div>
    """
    send_email(to_email, subject, html_body)