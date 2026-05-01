import os
import resend

resend.api_key = os.getenv("RESEND_API_KEY", "")


def send_verification_email(to_email: str, token: str):
    base_url = os.getenv("BACKEND_URL", "https://truevision-api-production.up.railway.app")
    verify_url = f"{base_url}/auth/verify?token={token}"

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
                    Вы почти у цели! Нажмите кнопку ниже, чтобы активировать ваш аккаунт.
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
                <td align="center" style="padding: 20px; border-top: 1px solid #1E2530;">
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

    resend.Emails.send({
        "from": "TrueVision <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "TrueVision — Подтвердите email",
        "html": html,
    })
