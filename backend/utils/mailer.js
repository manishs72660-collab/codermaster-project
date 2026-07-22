const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_APP_PASSWORD, // Gmail "app password", not your login password
  },
});

/* ------------------------------------------------------------------ */
/*  Shared brand tokens                                               */
/* ------------------------------------------------------------------ */
const BRAND = {
  bg: "#0a0a0a",
  card: "#141414",
  cardBorder: "#262626",
  text: "#f2f2f2",
  muted: "#a3a3a3",
  orange: "#ff7a1a",
  orangeSoft: "#ff9a4d",
  orangeDim: "#3a2312",
};

/* ------------------------------------------------------------------ */
/*  Base HTML wrapper — dark, orange-accented, premium "card" layout  */
/* ------------------------------------------------------------------ */
const baseLayout = ({ preheader = "", eyebrow = "CodeMaster", title, bodyHtml, footerNote = "" }) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="dark" />
<meta name="supported-color-schemes" content="dark" />
<title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:${BRAND.bg}; -webkit-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg}; padding:40px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo / brand -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
                    <span style="font-size:22px; font-weight:800; letter-spacing:0.5px; color:${BRAND.text};">Code</span><span style="font-size:22px; font-weight:800; letter-spacing:0.5px; color:${BRAND.orange};">Master</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:${BRAND.card}; border:1px solid ${BRAND.cardBorder}; border-radius:16px; overflow:hidden;">

              <!-- Accent top bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px; background:linear-gradient(90deg, ${BRAND.orange}, #ffb066, ${BRAND.orange});"></td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:36px 36px 32px 36px;">
                <tr>
                  <td>
                    <p style="margin:0 0 10px 0; font-family:'Segoe UI', Helvetica, Arial, sans-serif; font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:${BRAND.orangeSoft};">
                      ${eyebrow}
                    </p>
                    ${bodyHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0; font-family:'Segoe UI', Helvetica, Arial, sans-serif; font-size:12px; line-height:18px; color:${BRAND.muted};">
                ${footerNote ? footerNote + "<br/>" : ""}
                &copy; ${new Date().getFullYear()} CodeMaster. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const heading = (text) =>
  `<h1 style="margin:0 0 16px 0; font-family:'Segoe UI', Helvetica, Arial, sans-serif; font-size:24px; line-height:32px; font-weight:700; color:${BRAND.text};">${text}</h1>`;

const paragraph = (text) =>
  `<p style="margin:0 0 16px 0; font-family:'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; line-height:24px; color:${BRAND.muted};">${text}</p>`;

const button = (label, url) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px 0;">
  <tr>
    <td style="border-radius:10px; background:linear-gradient(135deg, ${BRAND.orange}, #ff9445);">
      <a href="${url}" target="_blank" style="display:inline-block; padding:13px 28px; font-family:'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; font-weight:700; color:#0a0a0a; text-decoration:none; border-radius:10px;">
        ${label} &rarr;
      </a>
    </td>
  </tr>
</table>
`;

const infoTable = (rows) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px 0; background-color:#1b1b1b; border:1px solid ${BRAND.cardBorder}; border-radius:12px;">
  ${rows
    .map(
      ([label, value], i) => `
  <tr>
    <td style="padding:12px 16px; ${i !== rows.length - 1 ? `border-bottom:1px solid ${BRAND.cardBorder};` : ""}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-family:'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; color:${BRAND.muted}; white-space:nowrap; padding-right:16px;">${label}</td>
          <td align="right" style="font-family:'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; font-weight:600; color:${BRAND.text}; word-break:break-word;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>`
    )
    .join("")}
</table>
`;

const messageBlock = (message) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0; background-color:${BRAND.orangeDim}; border:1px solid #52300f; border-left:3px solid ${BRAND.orange}; border-radius:10px;">
  <tr>
    <td style="padding:14px 18px;">
      <p style="margin:0 0 6px 0; font-family:'Segoe UI', Helvetica, Arial, sans-serif; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:${BRAND.orangeSoft};">Message</p>
      <p style="margin:0; font-family:'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; line-height:22px; color:${BRAND.text}; white-space:pre-wrap;">${message}</p>
    </td>
  </tr>
</table>
`;

const badge = (text, tone = "orange") => {
  const tones = {
    orange: { bg: BRAND.orangeDim, border: "#52300f", color: BRAND.orangeSoft },
    green: { bg: "#0f2417", border: "#1e4a2f", color: "#4ade80" },
    red: { bg: "#2a1414", border: "#4a1e1e", color: "#f87171" },
  };
  const t = tones[tone] || tones.orange;
  return `<span style="display:inline-block; padding:5px 12px; border-radius:999px; background-color:${t.bg}; border:1px solid ${t.border}; font-family:'Segoe UI', Helvetica, Arial, sans-serif; font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:${t.color};">${text}</span>`;
};

/* ------------------------------------------------------------------ */
/*  1) New college registration request (notifies you)                */
/* ------------------------------------------------------------------ */
const sendCollegeRequestNotification = async (request) => {
  const bodyHtml = `
    ${badge("New Request", "orange")}
    ${heading(`New college registration request`)}
    ${paragraph(`A new institution wants to join <strong style="color:${BRAND.text};">CodeMaster</strong>. Review the details below and approve or reject the request.`)}
    ${infoTable([
      ["College", `${request.Collage_name}`],
      ["College Code", `${request.collegeCode}`],
      ["Requested By", `${request.adminFirstName} ${request.adminLastName || ""}`],
      ["Admin Email", `${request.adminEmail}`],
    ])}
    ${messageBlock(request.message || "(no message)")}
    ${button("Review Request", `${process.env.FRONTEND_URL}/admin/college-requests`)}
    ${paragraph(`You can also reply directly to this email — replies go to <strong style="color:${BRAND.text};">${request.adminEmail}</strong>.`)}
  `;

  await transporter.sendMail({
    from: `"CodeMaster" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_USER, // lands in your own inbox
    replyTo: request.adminEmail,
    subject: `New college registration request: ${request.Collage_name}`,
    text: `
College: ${request.Collage_name} (${request.collegeCode})
Requested by: ${request.adminFirstName} ${request.adminLastName || ""} <${request.adminEmail}>

Message:
${request.message || "(no message)"}

Review it: ${process.env.FRONTEND_URL}/admin/college-requests
    `.trim(),
    html: baseLayout({
      preheader: `New registration request from ${request.Collage_name}`,
      eyebrow: "Admin Notification",
      title: "New College Registration Request",
      bodyHtml,
    }),
  });
};

/* ------------------------------------------------------------------ */
/*  2) College approved                                                */
/* ------------------------------------------------------------------ */
const sendCollegeApprovedEmail = async ({ toEmail, collegeName, collegeCode, tempPassword, loginUrl }) => {
  const bodyHtml = `
    ${badge("Approved", "green")}
    ${heading(`${collegeName} is live on CodeMaster 🎉`)}
    ${paragraph(`Great news — your institution has been reviewed and approved. Your College Admin account is ready to go.`)}
    ${infoTable([
      ["College", `${collegeName}`],
      ["College Code", `${collegeCode}`],
      ["Login Email", `${toEmail}`],
      ["Temporary Password", `<span style="font-family:Consolas, monospace; color:${BRAND.orangeSoft};">${tempPassword}</span>`],
    ])}
    ${button("Log In to CodeMaster", loginUrl)}
    ${paragraph(`For security, please log in and change your password as soon as possible.`)}
  `;

  await transporter.sendMail({
    from: `"CodeMaster" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: `${collegeName} is registered on CodeMaster 🎉`,
    text: `
Good news — ${collegeName} (code: ${collegeCode}) has been approved and registered on CodeMaster.

Log in as the College Admin with:
  Email: ${toEmail}
  Temporary password: ${tempPassword}

Log in and change your password here: ${loginUrl}
    `.trim(),
    html: baseLayout({
      preheader: `${collegeName} has been approved on CodeMaster`,
      eyebrow: "Registration Approved",
      title: "College Approved",
      bodyHtml,
      footerNote: "Keep your temporary password private — change it after your first login.",
    }),
  });
};

/* ------------------------------------------------------------------ */
/*  3) College rejected                                                */
/* ------------------------------------------------------------------ */
const sendCollegeRejectedEmail = async ({ toEmail, collegeName, reason }) => {
  const bodyHtml = `
    ${badge("Not Approved", "red")}
    ${heading(`Update on your registration request`)}
    ${paragraph(`Thanks for your interest in registering <strong style="color:${BRAND.text};">${collegeName}</strong> on CodeMaster.`)}
    ${paragraph(`We're not able to approve this request right now${reason ? "." : "."}`)}
    ${reason ? messageBlock(reason) : ""}
    ${paragraph(`If you believe this was a mistake or you'd like to provide more information, feel free to reply to this email.`)}
  `;

  await transporter.sendMail({
    from: `"CodeMaster" <${process.env.MAIL_USER}>`,
    to: toEmail,
    subject: `Update on your CodeMaster registration request`,
    text: `
Thanks for your interest in registering ${collegeName} on CodeMaster.

We're not able to approve this request right now${reason ? `: ${reason}` : "."}
    `.trim(),
    html: baseLayout({
      preheader: `An update on your CodeMaster registration request`,
      eyebrow: "Registration Update",
      title: "Registration Not Approved",
      bodyHtml,
    }),
  });
};

module.exports = { sendCollegeRequestNotification, sendCollegeApprovedEmail, sendCollegeRejectedEmail };