(function () {
    'use strict';

    // =====================================================================
    // SALESFORCE WEB-TO-LEAD SETTINGS  -  fill these in before going live
    // =====================================================================
    const SALESFORCE = {
        endpoint: 'https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8',
        // Org ID: Setup > Company Information > Salesforce.com Organization ID
        // (or copy the value of the hidden "oid" field from the generated Web-to-Lead form)
        oid: 'REPLACE_WITH_SALESFORCE_ORG_ID',
        // Lead requires a Company value by default. Change if your org does not require it.
        company: 'Web enquiry (VIT landing page)',
        // Must match a value in your Lead Source picklist. Set to '' to leave blank.
        leadSource: 'Web',
        // Custom Lead fields: paste the field IDs (00N...) from the generated Web-to-Lead form.
        // Leave a value as '' to skip that field.
        customFields: {
            programme: '',
            work_experience: '',
            utm_source: '',
            utm_medium: '',
            utm_campaign: ''
        }
    };
    // =====================================================================

    const programmeNames = { mba: 'MBA', mca: 'MCA', msds: 'MS Data Science' };
    const brochureFiles = { mba: 'mba-brochure.pdf', mca: 'mca-brochure.pdf', msds: 'msds-brochure.pdf' };
    const brochureBase = new URL('./', document.currentScript.src).href;

    // Remember UTM parameters for the visit, so they survive moving from the home page to a programme page.
    const utm = {};
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (key) {
        let value = new URLSearchParams(window.location.search).get(key) || '';
        try {
            if (value) sessionStorage.setItem(key, value);
            else value = sessionStorage.getItem(key) || '';
        } catch (e) { /* storage unavailable */ }
        utm[key] = value;
    });

    async function sendToSalesforce(data) {
        if (!SALESFORCE.oid || SALESFORCE.oid.indexOf('REPLACE_') === 0) {
            console.error('Salesforce org ID is not set in brochure-enquiry.js');
            throw new Error('This form is not connected to Salesforce yet.');
        }
        const params = new URLSearchParams();
        params.append('oid', SALESFORCE.oid);
        params.append('first_name', data.firstName);
        params.append('last_name', data.lastName);
        params.append('email', data.email);
        params.append('mobile', data.mobile);
        params.append('state', data.state);
        if (SALESFORCE.company) params.append('company', SALESFORCE.company);
        if (SALESFORCE.leadSource) params.append('lead_source', SALESFORCE.leadSource);
        const values = {
            programme: programmeNames[data.programme] || data.programme,
            work_experience: data.workExperience,
            utm_source: utm.utm_source,
            utm_medium: utm.utm_medium,
            utm_campaign: utm.utm_campaign
        };
        Object.keys(SALESFORCE.customFields).forEach(function (key) {
            if (SALESFORCE.customFields[key]) params.append(SALESFORCE.customFields[key], values[key] || '');
        });
        // Salesforce does not allow cross-site reads, so the response is opaque (no-cors).
        // A network failure still throws; a rejected lead can only be seen inside Salesforce.
        await fetch(SALESFORCE.endpoint, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
    }

    function downloadBrochure(programme) {
        const file = brochureFiles[programme];
        if (!file) return;
        const link = document.createElement('a');
        link.href = brochureBase + file;
        link.download = file;
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    const pageProgramme = (document.body.dataset.programme || '');

    const states = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
        'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
        'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
        'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry', 'Outside India', 'Other'
    ];
    const experienceOptions = ['Fresher', '0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'];

    const styles = document.createElement('style');
    styles.textContent = `
        .brochure-modal-backdrop{position:fixed;inset:0;z-index:9998;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.78);box-sizing:border-box}
        .brochure-modal-backdrop.open{display:flex}
        .brochure-modal{width:min(620px,100%);max-height:calc(100vh - 32px);overflow-y:auto;background:#fff;color:#1e293b;border-radius:12px;box-shadow:0 24px 60px rgba(15,23,42,.38);font-family:-apple-system,BlinkMacSystemFont,"Arial",sans-serif}
        .brochure-modal-header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #e2e8f0}
        .brochure-modal-header h2{margin:0;color:#1e3a8a;font-size:24px}
        .brochure-modal-close{border:0;background:transparent;color:#64748b;font-size:30px;line-height:1;cursor:pointer}
        .brochure-modal-body{padding:18px 22px 22px}
        .brochure-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px}
        .brochure-modal-field label{display:block;margin-bottom:6px;color:#334155;font-size:14px;font-weight:700}
        .brochure-modal-field input,.brochure-modal-field select{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:7px;background:#fff;padding:11px 12px;color:#0f172a;font-size:15px;outline:none}
        .brochure-modal-field input:focus,.brochure-modal-field select:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
        .brochure-modal-field.invalid input,.brochure-modal-field.invalid select{border-color:#dc2626}
        .brochure-modal-error{min-height:17px;margin:4px 0 0;color:#dc2626;font-size:12px}
        .brochure-modal-consent{display:flex;align-items:flex-start;gap:9px;margin-top:12px;color:#475569;font-size:13px;line-height:1.4}
        .brochure-modal-consent input{width:17px;height:17px;margin:2px 0 0;accent-color:#2563eb}
        .brochure-modal-status{min-height:21px;margin:10px 0;color:#dc2626;font-size:14px}
        .brochure-modal-status.success{color:#166534}
        .brochure-modal-submit{width:100%;border:0;border-radius:7px;padding:13px 16px;background:#2563eb;color:#fff;font-size:16px;font-weight:700;cursor:pointer}
        .brochure-modal-submit:hover{background:#1d4ed8}
        .brochure-modal-submit:disabled{opacity:.65;cursor:not-allowed}
        @media(max-width:600px){.brochure-modal-backdrop{padding:8px}.brochure-modal{max-height:calc(100vh - 16px)}.brochure-modal-grid{grid-template-columns:1fr}.brochure-modal-header{padding:15px 16px}.brochure-modal-header h2{font-size:20px}.brochure-modal-body{padding:14px 16px 16px}}
    `;
    document.head.appendChild(styles);

    const optionMarkup = (options, placeholder) =>
        '<option value="">' + placeholder + '</option>' +
        options.map((option) => '<option value="' + option.replace(/"/g, '&quot;') + '">' + option + '</option>').join('');

    document.body.insertAdjacentHTML('beforeend', `
        <div class="brochure-modal-backdrop" id="brochureModalBackdrop" role="dialog" aria-modal="true" aria-labelledby="brochureModalTitle" aria-hidden="true">
            <div class="brochure-modal">
                <div class="brochure-modal-header">
                    <h2 id="brochureModalTitle">Download Brochure</h2>
                    <button class="brochure-modal-close" type="button" aria-label="Close enquiry form">&times;</button>
                </div>
                <form class="brochure-modal-body" id="brochureEnquiryForm" novalidate>
                    <div class="brochure-modal-grid">
                        <div class="brochure-modal-field" data-field="first_name">
                            <label for="brochureFirstName">First Name *</label>
                            <input id="brochureFirstName" name="first_name" type="text" autocomplete="given-name" maxlength="50" required>
                            <p class="brochure-modal-error"></p>
                        </div>
                        <div class="brochure-modal-field" data-field="last_name">
                            <label for="brochureLastName">Last Name *</label>
                            <input id="brochureLastName" name="last_name" type="text" autocomplete="family-name" maxlength="50" required>
                            <p class="brochure-modal-error"></p>
                        </div>
                        <div class="brochure-modal-field" data-field="mobile">
                            <label for="brochureMobile">Mobile Number *</label>
                            <input id="brochureMobile" name="mobile" type="tel" autocomplete="tel" inputmode="numeric" maxlength="10" required>
                            <p class="brochure-modal-error"></p>
                        </div>
                        <div class="brochure-modal-field" data-field="email">
                            <label for="brochureEmail">Email Address *</label>
                            <input id="brochureEmail" name="email" type="email" autocomplete="email" maxlength="254" required>
                            <p class="brochure-modal-error"></p>
                        </div>
                        <div class="brochure-modal-field" data-field="state">
                            <label for="brochureState">State/Province *</label>
                            <select id="brochureState" name="state" required>${optionMarkup(states, 'Select State/Province')}</select>
                            <p class="brochure-modal-error"></p>
                        </div>
                        <div class="brochure-modal-field" data-field="programme">
                            <label for="brochureProgramme">Choose a Program *</label>
                            <select id="brochureProgramme" name="programme" required>
                                <option value="">Select Program</option>
                                <option value="mba">MBA</option>
                                <option value="mca">MCA</option>
                                <option value="msds">MS Data Science</option>
                            </select>
                            <p class="brochure-modal-error"></p>
                        </div>
                        <div class="brochure-modal-field" data-field="work_experience">
                            <label for="brochureExperience">Work Experience *</label>
                            <select id="brochureExperience" name="work_experience" required>${optionMarkup(experienceOptions, 'Select Work Experience')}</select>
                            <p class="brochure-modal-error"></p>
                        </div>
                    </div>
                    <label class="brochure-modal-consent" for="brochureConsent">
                        <input id="brochureConsent" name="consent" type="checkbox" required>
                        <span>I consent to be contacted by phone and/or email regarding this programme.</span>
                    </label>
                    <p class="brochure-modal-error" data-consent-error></p>
                    <p class="brochure-modal-status" id="brochureModalStatus" role="status" aria-live="polite"></p>
                    <button class="brochure-modal-submit" type="submit">Submit Details</button>
                </form>
            </div>
        </div>
    `);

    const backdrop = document.getElementById('brochureModalBackdrop');
    const form = document.getElementById('brochureEnquiryForm');
    const status = document.getElementById('brochureModalStatus');
    const submitButton = form.querySelector('button[type="submit"]');
    let lastFocusedElement = null;

    function openModal(event) {
        event.preventDefault();
        lastFocusedElement = document.activeElement;
        status.textContent = '';
        status.className = 'brochure-modal-status';
        backdrop.classList.add('open');
        backdrop.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (pageProgramme) form.programme.value = pageProgramme;
        document.getElementById('brochureFirstName').focus();
    }

    function closeModal() {
        backdrop.classList.remove('open');
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lastFocusedElement) lastFocusedElement.focus();
    }

    function isBrochureButton(element) {
        const text = (element.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        return text.includes('download brochure') ||
            text.includes('download programme brochure') ||
            text.includes('enquire now') ||
            text.includes('apply now') ||
            text.includes('request a call back') ||
            text.includes('speak to a counsellor');
    }

    document.querySelectorAll('button, a').forEach((element) => {
        if (isBrochureButton(element)) element.addEventListener('click', openModal);
    });

    document.querySelectorAll('.brochure-modal-close').forEach((button) => button.addEventListener('click', closeModal));
    backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) closeModal();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && backdrop.classList.contains('open')) closeModal();
    });

    form.querySelectorAll('input, select').forEach((input) => {
        input.addEventListener('input', () => {
            const field = input.closest('[data-field]');
            if (field) {
                field.classList.remove('invalid');
                field.querySelector('.brochure-modal-error').textContent = '';
            }
            status.textContent = '';
        });
        input.addEventListener('change', () => {
            const field = input.closest('[data-field]');
            if (field) {
                field.classList.remove('invalid');
                field.querySelector('.brochure-modal-error').textContent = '';
            }
        });
    });

    function setError(name, message) {
        const field = form.querySelector('[data-field="' + name + '"]');
        field.classList.add('invalid');
        field.querySelector('.brochure-modal-error').textContent = message;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        form.querySelectorAll('[data-field]').forEach((field) => {
            field.classList.remove('invalid');
            field.querySelector('.brochure-modal-error').textContent = '';
        });
        form.querySelector('[data-consent-error]').textContent = '';
        status.className = 'brochure-modal-status';
        status.textContent = '';

        const firstName = form.first_name.value.trim();
        const lastName = form.last_name.value.trim();
        const mobile = form.mobile.value.trim();
        const email = form.email.value.trim();
        let valid = true;

        if (firstName.length < 2 || !/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,49}$/u.test(firstName)) {
            setError('first_name', 'Please enter a valid first name.');
            valid = false;
        }
        if (lastName.length < 2 || !/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,49}$/u.test(lastName)) {
            setError('last_name', 'Please enter a valid last name.');
            valid = false;
        }
        if (!/^[0-9]{10}$/.test(mobile)) {
            setError('mobile', 'Please enter a valid 10-digit mobile number.');
            valid = false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
            setError('email', 'Please enter a valid email address.');
            valid = false;
        }
        if (!form.state.value) {
            setError('state', 'Please select your state or province.');
            valid = false;
        }
        if (!form.programme.value) {
            setError('programme', 'Please select a programme.');
            valid = false;
        }
        if (!form.work_experience.value) {
            setError('work_experience', 'Please select your work experience.');
            valid = false;
        }
        if (!form.consent.checked) {
            form.querySelector('[data-consent-error]').textContent = 'Consent is required before submission.';
            valid = false;
        }
        if (!valid) return;

        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';

        try {
            await sendToSalesforce({
                firstName: firstName,
                lastName: lastName,
                mobile: mobile,
                email: email,
                state: form.state.value,
                programme: form.programme.value,
                workExperience: form.work_experience.value
            });

            status.className = 'brochure-modal-status success';
            status.textContent = 'Thank you! Your enquiry has been submitted successfully. Your brochure is downloading.';
            downloadBrochure(form.programme.value);
            window.setTimeout(closeModal, 1400);
        } catch (error) {
            status.className = 'brochure-modal-status';
            status.textContent = error.message || 'Submission failed. Brochure not downloaded.';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Details';
        }
    });
})();
