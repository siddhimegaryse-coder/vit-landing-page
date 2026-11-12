# VIT landing page (static version + secure lead relay)

Plain HTML/CSS/JS pages. The enquiry form posts to a small Netlify Function
(netlify/functions/submit-lead.js) which forwards the lead to Emeritus.
The service provider ID and API key are NOT in this repo. They are stored only in
Netlify (Site configuration > Environment variables):

- SERVICE_PROVIDER_ID   your service provider ID from Emeritus
- EMERITUS_API_KEY      your API key from Emeritus

## Pages
- index.html            home (programme cards + enquiry form)
- mba.html              VIT Online MBA        (also works as /mba)
- mca.html              VIT Online MCA        (also works as /mca)
- ms-data-science.html  VIT M.Sc. in Data Science (also works as /ms-data-science)

## Hosting
Deploy on Netlify from this repository (no build command, publish directory: /).
The form needs Netlify: it does not work on GitHub Pages.
