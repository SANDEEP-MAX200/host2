import validator from 'validator';
import * as https from 'https';
import * as http from 'http';
import {URL} from 'url';

function checkIpInUrl(targetUrl) {
    try {
        const parsedUrl = new URL(targetUrl);
        const hostname = parsedUrl.hostname;

        // Check for IPv4 or IPv6
        return validator.isIP(hostname, 4) || validator.isIP(hostname, 6);
    } catch (e) {
        console.log('Error parsing URL in checkIpInUrl:', e.message);
        return false;
    }
}

function checkRidParameter(targetUrl) {
    try {
        const parsedUrl = new URL(targetUrl);
        return parsedUrl.searchParams.has('rid');
    } catch (e) {
        console.log('Error parsing URL in checkRidParameter:', e.message);
        return false;
    }
}

function checkGophishHeader(headers) {
    if (!headers) return false;

    const serverHeader = headers['x-server'] || headers['X-Server'] || '';
    return serverHeader.toLowerCase().includes('gophish');
}

async function fetchHeaders(targetUrl) {
    try {
        const cleanedUrl = targetUrl.trim();
        const urlObject = new URL(cleanedUrl);

        const protocol = urlObject.protocol === 'https:' ? https : http;

        const options = {
            method: 'HEAD',
            timeout: 5000,
        };

        return new Promise((resolve) => {
            const req = protocol.request({
                hostname: urlObject.hostname,
                port: urlObject.port || (urlObject.protocol === 'https:' ? 443 : 80),
                path: urlObject.pathname + urlObject.search,
                ...options
            }, (res) => {
                res.destroy();
                resolve(res.headers);
            });

            req.on('error', (e) => {
                console.log(`Native request error for ${targetUrl}:`, e.message);
                resolve(null);
            });

            req.on('timeout', () => {
                req.destroy();
                resolve(null);
            });

            req.end();

        });

    } catch (e) {
        console.log(`URL or network error in fetchHeaders for ${targetUrl}:`, e.message);
        return null;
    }
}

function analyzeSuspiciousUrl(targetUrl, headers = null) {
    const analysis = {
        isSuspiciousIP: false,
        isSuspiciousRid: false,
        isSuspiciousHeader: false,
        reasons: [],
    };
    try {
        if (checkIpInUrl(targetUrl)) {
            analysis.isSuspiciousIP = true;
            analysis.reasons.push('Host is an IP address (not a registered domain)');
        }
        if (checkRidParameter(targetUrl)) {
            analysis.isSuspiciousRid = true;
            analysis.reasons.push('Contains a common campaign tracking parameter (rid)');
        }
        if (headers && checkGophishHeader(headers)) {
            analysis.isSuspiciousHeader = true;
            analysis.reasons.push('GoPhish server header detected');
        }
    } catch (e) {
        analysis.reasons.push('URL format is invalid or malformed', e);
    }

    return analysis;
}

export {
    checkIpInUrl,
    checkRidParameter,
    checkGophishHeader,
    analyzeSuspiciousUrl,
    fetchHeaders
};

export default analyzeSuspiciousUrl;
