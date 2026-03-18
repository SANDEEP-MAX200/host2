import https from 'https';
import { URL } from 'url';

export async function checkSsl(targetUrl) {
  try {
    const hostname = new URL(targetUrl).hostname;

    // This wraps the older, event-based https.request in a Promise so we can use await with it.
    const certDetails = await new Promise((resolve, reject) => {
      const options = {
        hostname: hostname,
        port: 443,
        method: 'GET',
        rejectUnauthorized: true,
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        const expireDate = new Date(cert.valid_to);
        const daysRemaining = Math.floor((expireDate - new Date()) / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
          return reject(new Error("Certificate has expired."));
        }

        if (daysRemaining < 14) {
          return resolve({
            safe: false,
            reason: `Certificate is valid but expires soon (${daysRemaining} days left).`,
          });
        }

        const issuer = cert.issuer?.O || 'Unknown Issuer';

        resolve({
          safe: true,
          reason: "Certificate is valid and trusted.",
          issuer: issuer,
          days_remaining: daysRemaining,
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error("Connection timed out."));
      });

      req.setTimeout(15000);
      req.end();
    });

    return certDetails;

  } catch (error) {
    return { safe: false, reason: `Certificate check failed: ${error.message}` };
  }
}
