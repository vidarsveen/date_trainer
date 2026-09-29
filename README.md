# Daykeeper · Weekday memory trainer

A touch-friendly calendar trainer for phones, tablets, and computers. It includes year, month, and century code drills; a full-date weekday quiz; all 100 year codes in a cheat sheet; and embedded Norwegian (Pernille) and English (Sonia) recordings made with the free Edge speech service. No API keys, paid subscriptions, analytics, or backend are needed.

## Enable the website

1. In this repository, open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Open **Actions → Deploy Daykeeper to GitHub Pages → Run workflow**, choose **main**, and run it. If GitHub asks you to enable Actions first, enable it.
4. Wait for both jobs to turn green. Your site will be at **https://vidarsveen.github.io/date_trainer/**. The deployment also displays the final site link.

Future pushes to `main` run checks and deploy automatically. The first deployment can fail until Pages has been enabled; run the workflow again after completing the settings above. GitHub Pages is free for public repositories; private-repository availability depends on your GitHub plan.

## Use on a phone

Open the website in Safari or Chrome. Pick a practice mode; for spoken dates choose **Weekday quiz**, then select Norwegian or English under **Weekday quiz audio**. Tap **Read date aloud** to replay. The thinking timer waits until narration finishes. Revealing an answer, changing dates, or pausing stops the current audio.

Use your browser's **Add to Home Screen** or **Install app** option where available. Let the first visit finish downloading: the single HTML file is about 26 MB because it contains all 1,529 recordings. When the footer says **Ready for offline practice**, the site has been cached on that device. Browser storage can be cleared or evicted, so open it online again if offline access stops working.

You can also download `index.html` and open it directly on a computer. The complete app and audio work from that one file. Home-screen installation and website caching require the HTTPS website.

## Content and accuracy

- Year code: `(n + floor(n / 4)) mod 7`, where `n` is the last two year digits.
- Month codes: `0,3,3,6,1,4,6,2,5,0,3,5`.
- Century codes repeat every 400 years: 1800 = 2, 1900 = 0, 2000 = 6, 2100 = 4.
- Subtract 1 for January/February of a Gregorian leap year.
- Sunday = 0 through Saturday = 6. Supported years: 1–9999, using the proleptic Gregorian calendar.

Audio combines recorded day/month phrases and years. Years 1900–2099 have whole-year recordings; other years are assembled from number recordings. No live speech service is contacted while using the trainer.

## Checks

Run `node tests/calendar.cjs` , `node tests/audio.cjs`, and `node tests/offline.cjs` (no dependency installation required). Tests compare every date in a 400-year Gregorian cycle with JavaScript's UTC calendar, check all 100 year codes, quiz controls, timers, the cheat sheet, audio coverage for all supported years, and playback cancellation/error handling. Playback tests use a simulated audio API; they do not replace listening tests on physical devices.

The Pages workflow publishes only the four app files. Test files and this README are kept in the repository, outside the website artifact.
