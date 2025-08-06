import express from 'express';

const router = express.Router();

// OAuth2 callback handler
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).json({ error: 'Missing code parameter' });
  }
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { google } = await import('googleapis');
    const credentials = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'credentials.json')));
    const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(path.join(process.cwd(), 'token_google.json'), JSON.stringify(tokens));
    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <script>
            setTimeout(function() { window.close(); }, 1000);
          </script>
        </head>
        <body>
          <h2>Authentication successful! Tokens have been saved. You can close this window.</h2>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Failed to exchange code for tokens' });
  }
});

export default router;