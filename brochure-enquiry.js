(function () {
    'use strict';

    const SUBMIT_URL = '/.netlify/functions/submit-lead';
    const brochureFiles = { mba: 'mba-brochure.pdf', mca: 'mca-brochure.pdf', msds: 'msds-brochure.pdf' };
    const brochureBase = new URL('./', document.currentScript.src).href;

    async function submitLead(data) {
        let response;
        try {
            response = await fetch(SUBMIT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            throw new Error('Could not reach the server. Please check your connection and try again.');
        }
        let result = null;
        try { result = await response.json(); } catch (error) { /* not JSON */ }
        if (!response.ok || !result || !result.ok) {
            throw new Error((result && result.message) || 'Submission failed. Brochure not downloaded.');
        }
        return result;
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

    const educationOptions = [
        ['bachelor', "Bachelor's Degree"], ['master', "Master's Degree"], ['diploma', 'Diploma'], ['other', 'Other']
    ];
    const experienceOptions = [
        ['Still a Student', 'Still a Student'], ['Less than 5 Years', 'Less than 5 Years'], ['5-10 Years', '5-10 Years'],
        ['10-15 Years', '10-15 Years'], ['16-20 Years', '16-20 Years'], ['>20 Years', '+ 20 Years']
    ];
    const specialisationOptions = {
        mba: [['marketing', 'Marketing'], ['hr', 'Human Resource'], ['finance', 'Finance'], ['operations', 'Operations'], ['general', 'General']],
        mca: [['Artificial intelligence (AI) & Machine learning', 'Artificial intelligence (AI) & Machine learning'], ['Cyber security', 'Cyber security']]
    };

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
        options.map((option) => '<option value="' + option[0].replace(/"/g, '&quot;') + '">' + option[1].replace(/&/g, '&amp;') + '</option>').join('');

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
                        <div class="brochure-modal-field" data-field="education_level">
                            <label for="brochureEducation">Education Level *</label>
                            <select id="brochureEducation" name="education_level" required>${optionMarkup(educationOptions, 'Select Education Level')}</select>
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
                        <div class="brochure-modal-field" data-field="specialisation" id="brochureSpecialisationField" style="display:none">
                            <label for="brochureSpecialisation">Preferred Specialisation *</label>
                            <select id="brochureSpecialisation" name="specialisation"></select>
                            <p class="brochure-modal-error"></p>
                        </div>
                    </div>
                    <div style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden" aria-hidden="true">
                        <label for="brochureWebsite">Leave this field empty</label>
                        <input id="brochureWebsite" name="website" type="text" tabindex="-1" autocomplete="off">
                    </div>
                    <label class="brochure-modal-consent for="brochureConsent">
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

    function updateSpecialisation() {
        const field = document.getElementById('brochureSpecialisationField');
        const select = document.getElementById('brochureSpecialisation');
        const options = specialisationOptions[form.programme.value];
        if (options) {
            select.innerHTML = optionMarkup(options, 'Select Specialisation');
            field.style.display = '';
        } else {
            select.innerHTML = '';
            field.style.display = 'none';
        }
    }
    form.programme.addEventListener('change', updateSpecialisation);

    function openModal(event) {
        event.preventDefault();
        lastFocusedElement = document.activeElement;
        status.textContent = '';
        status.className = 'brochure-modal-status';
        backdrop.classList.add('open');
        backdrop.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (pageProgramme) form.programme.value = pageProgramme;
        updateSpecialisation();
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
        if (!form.education_level.value) {
            setError('education_level', 'Please select your education level.');
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
        if (specialisationOptions[form.programme.value] && !form.specialisation.value) {
            setError('specialisation', 'Please select a specialisation.');
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
            const result = await submitLead({
                fullname: firstName + ' ' + lastName,
                phone: mobile,
                email: email,
                educationLevel: form.education_level.value,
                workExperience: form.work_experience.value,
                programme: form.programme.value,
                specialisation: form.specialisation.value,
                website: form.website.value
            });

            status.className = 'brochure-modal-status success';
            status.textContent = 'Thank you! Your enquiry has been submitted successfully.' +
                (result.referenceNumber ? ' Your reference number is ' + result.referenceNumber + '.' : '') +
                ' Your brochure is downloading.';
            downloadBrochure(form.programme.value);
            window.setTimeout(closeModal, 4000);
        } catch (error) {
            status.className = 'brochure-modal-status';
            status.textContent = error.message || 'Submission failed. Brochure not downloaded.';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Details';
        }
    });
})();
