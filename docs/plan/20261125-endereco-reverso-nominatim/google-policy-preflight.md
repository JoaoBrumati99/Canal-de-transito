# Google Maps Geocoding API policy preflight

**Verification date:** 2026-11-26  
**Decision:** **PENDING / NO-GO for real Geocoding API calls or Wave 2/3.** Public Google documentation confirms some permitted use and safeguards, but the applicable billing-region terms and the treatment of precise user-linked coordinates and complaint records are not confirmed. Do not enable the API or transmit coordinates until the blocking items below are resolved.

No Geocoding API request was made and no user coordinates were used during this review.

## Executive decision

Google's published terms permit use of Geocoding API content in a customer application without a Google Map, subject to attribution, location-privacy, and content storage restrictions. They also explicitly require advance notice and express, prior, revocable user consent before obtaining or caching a user's location.

However, both the standard and EEA terms restrict providing end-user personally identifiable information/personal data to Google. The documents say Google may collect latitude and longitude in normal service use, but do not determine whether precise coordinates linked to this user's report are such data, nor do they clearly resolve a backend-submitted coordinate in this scenario. Consent does not itself waive the separate restriction. The account's billing address is also unknown, so the applicable terms cannot be selected.

The terms permit indefinite caching of Geocoding API address and coordinate fields only for narrowly described, direct end-user-facing functionality, with data isolated to that end user and not used to replace another API call. It is not clear from the public terms alone whether persisting the returned address in a complaint record for operational or staff-facing use falls within that exception. Treat that storage/use as unapproved pending the necessary account and privacy/legal determinations.

## Official sources checked

All sources below were checked on 2026-11-26. Google may update documentation and terms; re-check before any activation.

| Official source | Relevant finding |
|---|---|
| [Geocoding API policies](https://developers.google.com/maps/documentation/geocoding/policies) | Geocoding API use is governed by the customer's agreement. Google Maps content is subject to storage/caching restrictions; attribution requirements apply. The page directs EEA billing-address customers to EEA terms and others to standard terms. |
| [Standard Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms) | Applies where the billing account address is outside the EEA, subject to the stated grandfathering exception for an unmodified project integration existing before 2025-07-08. Sections 3.2.2, 3.2.3, and 4.4 cover application notices, no caching except express permissions, data use, end-user data restrictions, and location privacy. |
| [Standard Maps Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) | Section 6 covers Geocoding API use without a map, use with maps, and caching. |
| [EEA Google Maps Platform Terms of Service](https://cloud.google.com/terms/maps-platform/eea) | Applies when the billing account address is in the EEA, except the stated grandfathering case. Sections 3.2.2 and 4.1-4.5 cover notices, privacy, end-user data, location consent, Google's data collection, and controller terms. |
| [EEA Maps Service Specific Terms](https://cloud.google.com/terms/maps-platform/eea/maps-service-terms) | Section 6 covers Geocoding API use with maps and caching. |
| [Geocoding API reverse geocoding](https://developers.google.com/maps/documentation/geocoding/reverse-geocoding) | Defines reverse geocoding as translating latitude/longitude into a human-readable address and warns the result is an estimate. |
| [Google Privacy Policy](https://policies.google.com/privacy) | The page retrieved on the verification date stated an effective date of 2026-10-16. Its general information collection and retention descriptions do not establish a Geocoding-specific retention period; use the Maps terms and Service Specific Terms for the product-specific rules. |
| [Google Maps Platform API security best practices](https://developers.google.com/maps/api-security-best-practices) | Recommends application and API restrictions for keys, including IP restrictions for server-side web service calls, and monitoring key use. These are configuration recommendations, not evidence that this project's key is restricted. |
| [Geocoding API usage and billing](https://developers.google.com/maps/documentation/geocoding/usage-and-billing) | Says daily quotas refresh at midnight Pacific time, reaching a quota limit stops service responses, and quota values can be modified in Google Maps Platform > Quotas. |
| [Google Maps Platform manage costs](https://developers.google.com/maps/billing-and-pricing/manage-costs) | Documents quota and cost-management controls. Alerts are monitoring notifications, not a guaranteed maximum-spend control. |
| [Google Controller-Controller Data Protection Terms](https://business.safety.google/controllerterms/) | The Maps terms incorporate these controller terms. They describe Google and the customer as independent controllers for covered Controller Services and require each party to meet applicable data-protection obligations. |

## Terms and privacy findings

### Applicable regional terms are not verified

- The standard terms state that the EEA terms govern if the customer's billing account address is in the EEA. The EEA terms state the same applicability rule.
- The standard and EEA terms each state that an integration existing before 2025-07-08 and remaining unmodified may continue under the standard terms. If the billing account is in the EEA, the project integration's creation date and modification status must therefore be checked as well.
- Neither the repository nor the supplied preflight reports identify the Google Cloud billing account's address. User location, deployment location, or repository locale cannot substitute for that account evidence.

### Transmitting precise coordinates

**Google's written requirements:**

- Standard terms Section 4.4(c)(i) and EEA terms Section 4.3 require advance notice of data types collected and of combining the end user's location with data from another provider.
- Both require express, prior, revocable end-user consent before obtaining or caching the end user's location.
- Standard terms Section 4.4(c)(ii) prohibit the customer from providing Google any end user's personally identifiable information and any European end user's Personal Data (defined there as EEA, Switzerland, or UK).
- EEA terms Section 4.2 prohibit the customer from providing Google any end user's personally identifiable information or any end user's Personal Data.
- Both sets of terms separately describe data, including latitude/longitude coordinates, that Google collects in normal service operation. That statement does not expressly decide whether a customer backend may send precise coordinates that are linked to an identifiable user or complaint.

**Assessment, not a Google statement:** A precise location associated with a report or other identifying context may be personal data, but the reviewed Google documentation does not classify this exact payload or resolve whether this backend request is permitted. Do not treat consent as sufficient to override the prohibition on providing qualifying personal data. Obtain a privacy/legal determination for this exact data flow, or written clarification from Google if needed, before transmission.

### Showing the returned address and attribution

- Both Service Specific Terms allow Geocoding API content to be used in a customer application without a corresponding Google Map.
- The standard terms prohibit use of Google Maps Core Services with or near a non-Google map. The EEA service terms prohibit use of Geocoding API content "With any Map" other than latitude, longitude, and place ID. A plain address field without a map is the documented path that avoids this map restriction.
- The Geocoding API policies require Google Maps attribution when displaying Google Maps content. Use the Google Maps logo where practicable, or the exact text "Google Maps" where space is limited; keep it visible and visually distinguish the returned content from other content. The API policy says no extra attribution is needed if the content is displayed on a Google Map that already shows the attribution.
- The application's terms of service must notify users that it includes Google Maps features/content and state that Google Maps end-user terms and the Google Privacy Policy apply.
- Reverse-geocoded addresses are estimates, not guaranteed exact street addresses. Do not present the result as verified or user-confirmed unless it has actually been confirmed.

### Sending and storing the address with a complaint

- Standard Terms Section 3.2.3 and EEA Terms Section 3.3.2 prohibit storing/caching Google Maps content except where a Service Specific Term expressly permits it.
- The Geocoding API caching provisions allow latitude, longitude, formatted address, and structured address fields to be cached indefinitely solely to support the direct, end-user-facing functionality of the customer application that initiated the request. The cached data must be logically isolated to the specific end user and not used across multiple end users; it cannot replace an additional call to the Services.
- The terms also permit temporary caching of Geocoding API latitude/longitude for up to 30 consecutive calendar days. This is not a general permission to retain all Google Maps content indefinitely.
- The terms do not explicitly say that attaching Google-returned address content to a complaint record and retaining or exposing it for staff/administrative handling is within the direct end-user-facing exception. Do not assume that a consented user submission converts Google's returned address into unrestricted customer data. Before storing/sending it with the complaint, have the privacy/legal owner confirm that the intended audience, purpose, retention period, and per-user isolation fit the applicable terms, or obtain written Google clarification.
- Do not use the returned content with a non-Google map. If the user confirms or edits an address, treat that as a separate user-provided data path only after reviewing the product and privacy requirements; do not assume that confirmation retroactively removes restrictions on the original Google result.

## Quota, costs, and operational safeguards

- The public usage documentation says daily quota limits can be changed in the Cloud Console and requests stop receiving service responses when the configured quota is reached; daily quota refresh is at midnight Pacific time. This supports a 15 requests/day project quota as a documented control, but does not prove that the correct project's daily quota is available, editable, or currently set to 15.
- **15 requests/day remains the user-approved ceiling.** Active quota configuration was not inspected and must not be presumed.
- Budget alerts, alert recipients, billing setup, current project usage, and API-key restrictions were not inspected and must not be presumed active. Alerts do not impose a hard spend cap.
- The previously recorded estimate remains conditional: $0 if the 10,000-event free cap applies and remains available; otherwise approximately $2.25-$2.33 for 450-465 events at $5 per 1,000, subject to the account, region, pricing, and aggregate project usage. This is an estimate, not a spend guarantee.
- The chosen access model is **public_limited**: public endpoint without user authentication, protected by an application-side per-IP limit plus independent Google project controls (including the 15/day quota and appropriately restricted server-side key). CORS is not an abuse control.
- The prior infrastructure preflight found one backend service declared in Compose, generic Express CORS, no rate-limiting middleware or Express `trust proxy` setting in the searched files, and an external `webproxy` whose configuration/IP-forwarding behavior is not versioned. Thus the effective client IP and actual proxy behavior remain unverified. Do not trust forwarded IP headers until the deployed proxy chain is confirmed.

## Blockers and exact information needed

1. **Billing terms:** An authorized account owner must provide the billing account address country (or confirm whether it is in the EEA). Do not provide credentials, payment details, or an API key. If it is in the EEA, also confirm whether the project integration existed before 2025-07-08 and has remained unmodified.
2. **Coordinate transmission:** The privacy/legal owner must determine whether precise coordinates associated with this user's report are end-user PII/Personal Data for the applicable terms, and confirm the exact consent notice and consent withdrawal behavior. If the answer is yes or remains uncertain, do not send coordinates unless Google provides written confirmation that this specific flow is permitted.
3. **Complaint storage:** The privacy/legal owner must confirm whether persistent attachment of Google's returned address to the complaint, including staff access and retention, falls within the direct end-user-facing caching exception under the applicable regional terms. If it does not or remains uncertain, do not persist or send Google Maps content with the complaint.
4. **Activation controls:** Before any real call, an authorized project operator must verify the 15/day Geocoding quota, billing and alert recipients, and server-side API-key application/API restrictions in the correct Google Cloud project. Separately verify deployed proxy/IP forwarding and effective per-IP limiting. No such active setting is asserted by this report.

## Gate

**PENDING; real calls blocked.** The policy supports a narrow, consented, attributed, non-map display use, but it does not resolve the actual billing terms or the data classification/storage questions for this report flow. Do not proceed to Google geocoding implementation that can make real calls, do not enable `GOOGLE_GEOCODING_ENABLED`, and do not execute Wave 2/3 until blockers 1-3 are resolved. Activation additionally requires the operational controls in blocker 4. This is a policy preflight, not legal advice.
