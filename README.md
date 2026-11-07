# VIT landing page (static version)

Plain HTML/CSS/JS. No folders, no PHP, no database. Works on Netlify, GitHub Pages or any static host.

## Pages
- index.html            home (programme cards + enquiry form)
- mba.html              VIT Online MBA        (also works as /mba)
- mca.html              VIT Online MCA        (also works as /mca)
- ms-data-science.html  VIT M.Sc. in Data Science (also works as /ms-data-science)

## Connect Salesforce (required before going live)
Open brochure-enquiry.js and edit the SALESFORCE block at the top:
1. oid           your Salesforce Organization ID
2. customFields  the 00N... field IDs (programme, work_experience, utm_source, utm_medium, utm_campaign). Leave '' to skip a field.
3. leadSource    must match a Lead Source picklist value (or '')
4. company       Lead requires Company by default

Until oid is set, the form shows "not connected to Salesforce yet" and sends nothing.
