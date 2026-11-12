'use strict';

// Receives an enquiry from the landing page and forwards it to Emeritus.
// The service provider ID and API key are read from Netlify environment
// variables (SERVICE_PROVIDER_ID and EMERITUS_API_KEY). Never type them in this file.

const API_URL = process.env.EMERITUS_API_URL ||
    'https://emeritus-degree.my.salesforce-sites.com/services/apexrest/leadservice/v1';

// Values below are exactly the ones used in Emeritus's own landing page files.
const PROGRAMMES = {
    mba: { program: 'VIT-MBA', specialisations: ['marketing', 'hr', 'finance', 'operations', 'general'] },
    mca: { program: 'VIT-MCA', specialisations: ['Artificial intelligence (AI) & Machine learning', 'Cyber security'] },
    msds: { program: 'VIT-Data Science', specialisations: null }
};
const EDUCATION = ['bachelor', 'master', 'diploma', 'other'];
const EXPERIENCE = ['Still a Student', 'Less than 5 Years', '5-10 Years', '10-15 Years', '16-20 Years', '>20 Years'];

function reply(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify(body)
    };
}

exports.handler = async function (event) {
    if (event.httpMethod !== 'POST') {
        return reply(405, { ok: false, message: 'Method not allowed.' });
    }
    if ((event.body || '').length > 5000) {
        return reply(413, { ok: false, message: 'Request too large.' });
    }

    let data;
    try {
        data = JSON.parse(event.body || '{}');
    } catch (error) {
        return reply(400, { ok: false, message: 'Invalid request.' });
    }

    // Spam trap: real visitors never see or fill this hidden field.
    if (typeof data.website === 'string' && data.website.trim() !== '') {
        return reply(200, { ok: true, referenceNumber: null });
    }

    const text = (value) => (typeof value === 'string' ? value.trim() : '');
    const fullname = text(data.fullname);
    const email = text(data.email);
    const phone = text(data.phone);
    const educationLevel = text(data.educationLevel);
    const workExperience = text(data.workExperience);
    const specialisation = text(data.specialisation);
    const programme = PROGRAMMES[text(data.programme)];

    const valid = Boolean(programme) &&
        fullname.length >= 2 && fullname.length <= 100 &&
        email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
        /^[0-9]{10}$/.test(phone) &&
        EDUCATION.indexOf(educationLevel) !== -1 &&
        EXPERIENCE.indexOf(workExperience) !== -1 &&
        (!programme.specialisations || programme.specialisations.indexOf(specialisation) !== -1);

    if (!valid) {
        return reply(400, { ok: false, message: 'Please fill all fields correctly including a valid email and 10-digit phone number.' });
    }

    const serviceProviderId = process.env.SERVICE_PROVIDER_ID;
    const apiKey = process.env.EMERITUS_API_KEY;
    if (!serviceProviderId || !apiKey) {
        console.error('SERVICE_PROVIDER_ID or EMERITUS_API_KEY is not set in Netlify.');
        return reply(500, { ok: false, message: 'The enquiry form is not available right now. Please try again later.' });
    }

    const payload = { fullname: fullname, email: email, phone: phone, educationLevel: educationLevel, workExperience: workExperience };
    if (programme.specialisations) payload.specialisation = specialisation;
    payload.program = programme.program;
    payload.serviceProviderId = serviceProviderId;
    payload.apiKey = apiKey;

    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, 8500);
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        const body = await response.text();
        let json = null;
        try { json = JSON.parse(body); } catch (error) { /* not JSON */ }

        if (response.ok && json && json.referenceNumber) {
            return reply(200, { ok: true, referenceNumber: String(json.referenceNumber).trim() });
        }
        console.error('Emeritus API did not accept the lead. HTTP ' + response.status + '. ' + body.slice(0, 300));
        return reply(502, { ok: false, message: 'We could not submit your details right now. Please try again in a few minutes.' });
    } catch (error) {
        console.error('Emeritus API request failed: ' + (error && error.name));
        return reply(502, { ok: false, message: 'We could not submit your details right now. Please try again in a few minutes.' });
    } finally {
        clearTimeout(timer);
    }
};
