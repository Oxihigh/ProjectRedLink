import os
import smtplib
import html
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from datetime import datetime

# Environment Variables
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME") or os.getenv("EMAIL_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("EMAIL_PASS", "")
SENDER_NAME = os.getenv("SENDER_NAME", "Project Red-Link Emergency Network")

def send_donation_certificate(
    donor_name: str,
    donor_email: str,
    blood_group: str,
    hospital_name: str = "Emergency Medical Response",
    donation_date: str = None,
    lifesaver_points: int = 10,
    certificate_id: str = None
):
    """
    Sends an official co-branded Blood Donation Certificate via SMTP.
    Includes Rotary International and Maahiiverse logos.
    """
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("[EmailService] Warning: SMTP credentials not set in .env. Skipping email dispatch.")
        return False

    if not donor_email:
        print("[EmailService] Warning: Donor email is empty. Skipping email dispatch.")
        return False

    # HTML escape user-supplied strings to prevent HTML injection
    donor_name = html.escape(str(donor_name))
    blood_group = html.escape(str(blood_group))
    hospital_name = html.escape(str(hospital_name))

    if not donation_date:
        donation_date = datetime.now().strftime("%B %d, %Y")

    if not certificate_id:
        certificate_id = f"REDLINK-{datetime.now().strftime('%Y%m%d')}-{os.urandom(2).hex().upper()}"

    # Build MIME message
    msg = MIMEMultipart("related")
    msg["Subject"] = f"🩸 Official Blood Donation Certificate - Hero {donor_name}"
    msg["From"] = f"{SENDER_NAME} <{SMTP_USERNAME}>"
    msg["To"] = donor_email

    # HTML Body with embedded CID images
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Blood Donation Certificate of Valor</title>
      <style>
        body {{
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #0f172a;
          margin: 0;
          padding: 20px;
          color: #1e293b;
        }}
        .certificate-container {{
          max-width: 680px;
          margin: 0 auto;
          background: #ffffff;
          border: 10px solid #dc2626;
          border-radius: 16px;
          padding: 35px 30px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          text-align: center;
          position: relative;
        }}
        .inner-border {{
          border: 2px dashed #e2e8f0;
          padding: 25px 20px;
          border-radius: 8px;
        }}
        .logo-header {{
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f1f5f9;
        }}
        .logo-img {{
          max-height: 55px;
          max-width: 140px;
          object-fit: contain;
        }}
        .center-brand {{
          font-size: 18px;
          font-weight: 900;
          color: #dc2626;
          letter-spacing: 2px;
          text-transform: uppercase;
        }}
        .cert-title {{
          font-size: 26px;
          font-weight: 800;
          color: #991b1b;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-top: 10px;
          margin-bottom: 5px;
        }}
        .cert-subtitle {{
          font-size: 13px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 3px;
          margin-bottom: 25px;
        }}
        .presented-to {{
          font-size: 14px;
          color: #475569;
          font-style: italic;
          margin-bottom: 8px;
        }}
        .donor-name {{
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          border-bottom: 2px solid #dc2626;
          display: inline-block;
          padding-bottom: 4px;
          margin-bottom: 20px;
          text-transform: capitalize;
        }}
        .cert-body {{
          font-size: 15px;
          line-height: 1.7;
          color: #334155;
          margin-bottom: 25px;
          padding: 0 15px;
        }}
        .details-grid {{
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 15px;
          margin: 0 auto 25px auto;
          max-width: 480px;
        }}
        .detail-item {{
          display: inline-block;
          margin: 5px 15px;
          font-size: 14px;
        }}
        .detail-label {{
          color: #64748b;
          font-weight: 600;
        }}
        .detail-value {{
          color: #dc2626;
          font-weight: 800;
        }}
        .badge-box {{
          background: linear-gradient(135deg, #dc2626, #991b1b);
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          padding: 8px 20px;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 30px;
        }}
        .signatures-row {{
          margin-top: 25px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }}
        .sig-block {{
          display: inline-block;
          width: 42%;
          vertical-align: top;
          text-align: center;
        }}
        .sig-line {{
          border-top: 1px solid #94a3b8;
          width: 80%;
          margin: 10px auto 4px auto;
        }}
        .sig-title {{
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
        }}
        .cert-footer {{
          margin-top: 20px;
          font-size: 11px;
          color: #94a3b8;
        }}
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <div class="inner-border">
          
          <!-- Header with Rotary & Maahiiverse logos -->
          <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
            <tr>
              <td align="left" width="30%">
                <img src="cid:rotary_logo" alt="Rotary Club" class="logo-img" style="height: 50px;" />
              </td>
              <td align="center" width="40%">
                <div class="center-brand">PROJECT RED-LINK</div>
                <div style="font-size: 10px; color: #64748b; letter-spacing: 1px;">EMERGENCY NETWORK</div>
              </td>
              <td align="right" width="30%">
                <img src="cid:maahiiverse_logo" alt="Maahiiverse Foundation" class="logo-img" style="height: 50px;" />
              </td>
            </tr>
          </table>

          <div class="cert-title">Certificate of Valor</div>
          <div class="cert-subtitle">Honorary Life-Saver Award</div>

          <div class="presented-to">This certificate is proudly conferred upon</div>
          <div class="donor-name">{donor_name}</div>

          <div class="cert-body">
            For selflessly answering the emergency call and donating life-saving blood at 
            <strong>{hospital_name}</strong>. Your courageous contribution has restored hope and saved a human life.
          </div>

          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Blood Group:</span> 
              <span class="detail-value">{blood_group}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date:</span> 
              <span class="detail-value">{donation_date}</span>
            </div>
          </div>

          <div class="badge-box">
            🌟 +{lifesaver_points} Lifesaver Points Earned
          </div>

          <!-- Signatures -->
          <table width="100%" cellspacing="0" cellpadding="0" class="signatures-row">
            <tr>
              <td align="center" width="50%">
                <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 20px; color: #1e293b;">Rotary Club Partner</div>
                <div class="sig-line"></div>
                <div class="sig-title">Rotary International Representative</div>
              </td>
              <td align="center" width="50%">
                <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 20px; color: #1e293b;">Maahiiverse Core</div>
                <div class="sig-line"></div>
                <div class="sig-title">Maahiiverse Foundation Director</div>
              </td>
            </tr>
          </table>

          <div class="cert-footer">
            Certificate ID: <strong>{certificate_id}</strong> &bull; Authenticated by Project Red-Link Security Protocol
          </div>

        </div>
      </div>
    </body>
    </html>
    """

    msg_alt = MIMEMultipart("alternative")
    msg_alt.attach(MIMEText(html_content, "html"))
    msg.attach(msg_alt)

    # Attach Rotary & Maahiiverse logos as CIDs
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    rotary_path = os.path.join(root_dir, "frontend", "public", "logos", "rotary.png")
    maahiiverse_path = os.path.join(root_dir, "frontend", "public", "logos", "maahiiverse.png")

    if os.path.exists(rotary_path):
        with open(rotary_path, "rb") as f:
            img_rotary = MIMEImage(f.read())
            img_rotary.add_header("Content-ID", "<rotary_logo>")
            img_rotary.add_header("Content-Disposition", "inline", filename="rotary.png")
            msg.attach(img_rotary)

    if os.path.exists(maahiiverse_path):
        with open(maahiiverse_path, "rb") as f:
            img_maahii = MIMEImage(f.read())
            img_maahii.add_header("Content-ID", "<maahiiverse_logo>")
            img_maahii.add_header("Content-Disposition", "inline", filename="maahiiverse.png")
            msg.attach(img_maahii)

    # Send Email via SMTP
    try:
        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        else:
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()

        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_USERNAME, donor_email, msg.as_string())
        server.quit()
        print(f"[EmailService] Certificate successfully sent to {donor_email} for donation {certificate_id}")
        return True
    except Exception as e:
        print(f"[EmailService] Failed to send email certificate: {str(e)}")
        return False
