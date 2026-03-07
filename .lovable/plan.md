

## Plan : Ajouter des events PostHog stratégiques partout

### Contexte

`trackEvent()` forward deja vers PostHog. Beaucoup de CTAs sont deja tracks. Ce plan couvre tous les points manquants.

### Events a ajouter

#### 1. Navigation & Header (`Header.tsx`)
- Track **tous** les clics nav (pas seulement Analyse Express) : `click_nav` avec `{ item, location: "header"|"header_mobile" }`
- Track clic CTA header "Reserver mon One Shot" : `click_nav_cta`
- Track ouverture/fermeture menu mobile : `toggle_mobile_menu` avec `{ open: true|false }`

#### 2. Footer (`Footer.tsx`)
- Track tous les clics liens footer : `click_footer_link` avec `{ item, section }`
- Track clics reseaux sociaux footer : `click_social` avec `{ platform, location: "footer" }`

#### 3. Home (`Home.tsx`)
- Deja track les CTAs via `trackEvent`. Ajouter :
  - `click_proof_strip` (clic lien preuves)
  - `faq_open` deja tracke — OK
  - `click_offer_card` avec `{ offer, location: "choose_section" }` — deja via `trackEvent` — OK

#### 4. Offres (`Offres.tsx`)
- Track `click_profile_selector` avec `{ target }` quand l'utilisateur clique "Je veux..."
- Les CTAs sont deja tracks via `trackEvent` — OK

#### 5. OneShot (`OneShot.tsx`)
- Track `click_faq_oneshot` avec `{ question }` a l'ouverture FAQ
- Les CTAs sont deja tracks — OK

#### 6. QuarantecinqJours (`QuarantecinqJours.tsx`)
- Track `click_faq_45j` avec `{ question }` a l'ouverture FAQ
- Track `click_video_play` avec `{ video_id, location: "45j" }` quand un temoignage video est lance
- Track `click_preuves_link` avec `{ location: "45j" }`

#### 7. Preuves (`Preuves.tsx`)
- Track `click_video_play` avec `{ video_id, location: "preuves" }` quand une video est lancee
- Les CTAs sont deja tracks — OK

#### 8. Contact (`Contact.tsx`)
- `contact_social_click` deja tracke — OK
- Track `click_email_link` quand l'utilisateur clique sur l'email

#### 9. APropos (`APropos.tsx`)
- CTA deja tracke — OK

#### 10. DiagnosticStart (`DiagnosticStart.tsx`)
- Deja tres bien instrumente — OK

#### 11. DiagnosticResult (`DiagnosticResult.tsx`)
- Track `diagnostic_result_viewed` avec `{ score, offer, audience, budget }` au mount
- Track `click_calendly` avec `{ offer }` pour les liens Calendly
- Track `click_email_contact` pour le lien mail

#### 12. WavPremiumApplication (`WavPremiumApplication.tsx`)
- Track `wav_premium_form_start` quand l'utilisateur commence a remplir (premier focus sur un champ)
- Track `wav_premium_form_error` avec `{ fields }` quand la validation echoue
- `wav_premium_apply` deja tracke au submit — OK
- Track `click_calendly_post_apply` quand l'utilisateur clique "Reserver mon appel" apres soumission

#### 13. OneShotSuccess (`OneShotSuccess.tsx`)
- Track `oneshot_payment_verified` au chargement reussi
- Track `oneshot_payment_error` si verification echoue
- `oneshot_form_submit` deja tracke — OK
- Track `click_calendly_oneshot` quand l'utilisateur clique "Reserver mon creneau"
- Track `oneshot_flow_complete` quand l'utilisateur clique "J'ai reserve mon creneau"

#### 14. AnalyseExpress (`AnalyseExpress.tsx`)
- Track `click_analyse_express_confirm` quand l'utilisateur valide dans le modal de confirmation
- Track `click_wavsocialscan_link` quand l'utilisateur clique le lien Wav Social Scan

#### 15. AnalyseExpressResult (`AnalyseExpressResult.tsx`)
- Track `analyse_express_result_viewed` au chargement reussi
- Track `click_pdf_download` quand l'utilisateur telecharge le PDF

#### 16. CookieConsent (`CookieConsent.tsx`)
- Track `cookie_consent_accepted` et `cookie_consent_refused` (noter : PostHog ne sera pas init si refuse, donc seulement accepted sera capture, mais c'est la l'info utile)

#### 17. WavSocialScanPopup (`WavSocialScanPopup.tsx`)
- Track `popup_dismissed` quand l'utilisateur ferme le popup sans cliquer
- `click_analyse_express_popup` deja tracke — OK

### Implementation

Tous les fichiers utiliseront `trackPostHogEvent` directement (import depuis `@/lib/posthog`) ou `trackEvent` (qui forward deja vers PostHog). Pour les fichiers qui importent deja `trackEvent`, on l'utilisera car il envoie a la fois a GA et PostHog.

### Fichiers modifies (13 fichiers)

1. `src/components/layout/Header.tsx`
2. `src/components/layout/Footer.tsx`
3. `src/pages/Home.tsx`
4. `src/pages/Offres.tsx`
5. `src/pages/OneShot.tsx`
6. `src/pages/QuarantecinqJours.tsx`
7. `src/pages/Preuves.tsx`
8. `src/pages/Contact.tsx`
9. `src/pages/DiagnosticResult.tsx`
10. `src/pages/WavPremiumApplication.tsx`
11. `src/pages/OneShotSuccess.tsx`
12. `src/pages/AnalyseExpress.tsx`
13. `src/pages/AnalyseExpressResult.tsx`
14. `src/components/WavSocialScanPopup.tsx`
15. `src/components/CookieConsent.tsx`

