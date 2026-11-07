# VIT landing page (static version)

Plain HTML/CSS/JS version of the WordPress "VIT-landing-page" theme.
Works on GitHub Pages, Netlify, or any static host. No PHP or database needed.

## Pages
- `/`                      home (programme cards + enquiry form)
- `/mba/`                  VIT Online MBA
- `/mca/`                  VIT Online MCA
- `/ms-data-science/`      VIT M.Sc. in Data Science

All links are relative, so the site also works from a sub-path
(e.g. https://username.github.io/vit-landing-page/).

## Connect Salesforce (required before going live)
Open `assets/js/brochure-enquiry.js` and edit the `SALESFORCE` block at the top:
1. `oid`          your Salesforce Organization ID
2. `customFields` the 00N... field IDs from your generated Web-to-Lead form
                  (programme, work_experience, utm_source, utm_medium, utm_campaign).
                  Leave a value empty to skip that field.
3. `leadSource`   must match a Lead Source picklist value (or set to '')
4. `company`      Lead requires Company by default

Until `oid` is set, the form shows "not connected to Salesforce yet" and sends nothing.

## Deploy
- Netlify: drag this folder onto app.netlify.com/drop, or connect the GitHub repo
  (build command: none, publish directory: /)
- GitHub Pages: push these files to the repo root, then Settings > Pages >
  Deploy from branch > main > / (root)
