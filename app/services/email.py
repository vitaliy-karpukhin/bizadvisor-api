import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_verification_email(to_email: str, token: str):
    # Ссылка на бэкенд-метод подтверждения
    base_url = os.getenv("BACKEND_URL", "https://truevision-api-production.up.railway.app")
    verify_url = f"{base_url}/auth/verify?token={token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "TrueVision — Подтвердите email"
    msg["From"] = f"TrueVision <{SMTP_EMAIL}>"
    msg["To"] = to_email

    # Стилизованный HTML под твой дизайн
    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; background-color: #0B0F17; font-family: 'Inter', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B0F17; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width: 500px; background-color: #151B28; border: 1px solid #1E2530; border-radius: 24px; overflow: hidden;">
              <tr>
                <td align="center" style="padding: 40px 0 20px 0;">
                  <h1 style="color: #00E5FF; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">
                    True<span style="color: #FFFFFF;">Vision</span>
                  </h1>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 0 40px 40px 40px;">
                  <h2 style="color: #FFFFFF; font-size: 20px; font-weight: 700; margin-bottom: 12px;">Подтвердите ваш Email</h2>
                  <p style="color: #6B7280; font-size: 15px; line-height: 22px; margin-bottom: 30px;">
                    Вы почти у цели! Нажмите кнопку ниже, чтобы активировать ваш аккаунт в финансовой системе.
                  </p>

                  <a href="{verify_url}" style="display: inline-block; padding: 14px 32px; background-color: #00E5FF; color: #0B0F17; font-weight: 700; text-decoration: none; border-radius: 12px; font-size: 16px;">
                    Подтвердить почту
                  </a>

                  <p style="margin-top: 40px; color: #4B5563; font-size: 12px;">
                    Если вы не регистрировались — просто проигнорируйте это письмо.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px; border-top: 1px solid #1E2530; background-color: rgba(0, 229, 255, 0.02);">
                   <p style="color: #4A5568; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Контроль. Рост. Уверенность.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False