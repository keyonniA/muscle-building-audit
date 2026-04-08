exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const data = JSON.parse(event.body);
  const { email, days, experience, rir, volumeSummary, patternSummary, nextSteps } = data;

  const KIT_API_KEY = process.env.KIT_API_KEY;
  const FORM_ID = '9300432';

  const expLabel = { beginner: 'Beginner (0–2 years)', intermediate: 'Intermediate (2–5 years)', advanced: 'Advanced (5+ years)' }[experience] || experience;
  const rirLabel = ['Absolute failure', '1 rep left', '2 reps left', '3 reps left', '4 reps left', 'Very comfortable', 'Cruising'][Math.min(parseInt(rir), 6)];

  const emailBody = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Georgia', serif; background: #f5f5f3; margin: 0; padding: 2rem 1rem; color: #1a1a1a; }
  .wrap { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
  .header { background: #1a1a1a; padding: 2rem; text-align: center; }
  .header h1 { color: #ffffff; font-size: 22px; margin: 0 0 0.25rem; }
  .header p { color: #999; font-size: 13px; margin: 0; letter-spacing: 0.08em; text-transform: uppercase; }
  .body { padding: 2rem; }
  .section-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #999; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-bottom: 1rem; margin-top: 1.5rem; }
  .stat-row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
  .stat-label { color: #666; }
  .stat-val { font-weight: bold; }
  .muscle-row { margin-bottom: 12px; }
  .muscle-name { font-size: 13px; font-weight: bold; margin-bottom: 3px; }
  .muscle-note { font-size: 13px; color: #555; line-height: 1.5; }
  .tag { display: inline-block; font-size: 10px; font-weight: bold; letter-spacing: 0.06em; text-transform: uppercase; padding: 2px 8px; border-radius: 99px; margin-left: 6px; }
  .tag-green { background: #EAF3DE; color: #3B6D11; }
  .tag-amber { background: #FAEEDA; color: #BA7517; }
  .tag-red { background: #FCEBEB; color: #A32D2D; }
  .next-item { font-size: 14px; color: #333; line-height: 1.65; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
  .next-num { font-weight: bold; margin-right: 8px; color: #185FA5; }
  .footer { background: #f5f5f3; padding: 1.5rem 2rem; text-align: center; font-size: 12px; color: #999; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <p>Your results</p>
    <h1>The Muscle Building Audit</h1>
  </div>
  <div class="body">
    <p style="font-size:15px;line-height:1.7;color:#333;">Here's a full breakdown of your program audit. Save this email so you can refer back to it.</p>

    <div class="section-label">Your inputs</div>
    <div class="stat-row"><span class="stat-label">Training days per week</span><span class="stat-val">${days} days</span></div>
    <div class="stat-row"><span class="stat-label">Experience level</span><span class="stat-val">${expLabel}</span></div>
    <div class="stat-row"><span class="stat-label">Average RIR</span><span class="stat-val">${rir} — ${rirLabel}</span></div>

    <div class="section-label">Volume breakdown by muscle group</div>
    ${volumeSummary}

    <div class="section-label">Movement patterns</div>
    <p style="font-size:14px;color:#555;line-height:1.65;">${patternSummary}</p>

    <div class="section-label">Your next steps</div>
    ${nextSteps}

    <p style="font-size:13px;color:#999;margin-top:1.5rem;line-height:1.6;">These recommendations are based on current hypertrophy research. Volume ranges are calibrated to your experience level. Focus on progressive overload — adding reps or weight over time — and reassess every 6–8 weeks.</p>
  </div>
  <div class="footer">
    The Muscle Building Audit &nbsp;·&nbsp; You're receiving this because you completed the audit.
  </div>
</div>
</body>
</html>
  `;

  try {
    // Subscribe to Kit form
    const kitFormData = new URLSearchParams();
    kitFormData.append('email_address', email);
    kitFormData.append('fields[training_days]', days);
    kitFormData.append('fields[experience]', experience);
    kitFormData.append('fields[rir]', rir);

    await fetch(`https://api.kit.com/v4/forms/${FORM_ID}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Kit-Api-Key': KIT_API_KEY
      },
      body: kitFormData
    });

    // Send results email via Kit broadcast API
    const broadcastRes = await fetch('https://api.kit.com/v4/broadcasts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': KIT_API_KEY
      },
      body: JSON.stringify({
        subject: 'Your Muscle Building Audit Results',
        content: emailBody,
        email_address: email,
        send_at: new Date().toISOString()
      })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
