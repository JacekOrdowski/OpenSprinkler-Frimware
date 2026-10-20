# Turning an HTML5 canvas game into Android/iOS store apps, and realistic monetization for a children's game (as of 20 Oct 2026)

Context for the report writer: the game is a single index.html + gra.js + zadania.js with MP3 music, already a PWA (service worker + manifest) hosted on GitHub Pages. The owner is a non-programmer working with an AI coding assistant in a Linux cloud container (no Mac). The audience is Polish children, grades 1–8 (about 7–15 years old), so most players are under 13.

Package versions below were read from the npm registry on 2026-10-20 with `npm view` (the "modified" date is when the registry entry last changed, not necessarily the release date).

## 1. Packaging options: Capacitor, cloud macOS CI, cloud Macs, TWA/Bubblewrap, PWABuilder, Cordova, engine exporters

### Takeaway
For one developer without a Mac, the practical path in 2026 is **Capacitor 8**. It bundles the existing web files into real Android and iOS projects. Android AAB files can be built in the Linux container. iOS builds run on a **cloud macOS CI** service: Codemagic's free tier gives 500 macOS minutes a month, and GitHub Actions macOS runners cost $0.062/min in private repositories. For Android, a **TWA via Bubblewrap** is an even lighter option that works entirely on Linux, but it ties the app to the GitHub Pages website and makes native ads and in-app purchases harder. PWABuilder's iOS output is experimental, still needs Xcode, and carries more Apple review risk. Ionic Appflow is closed to new customers.

### Cited Findings
**Capacitor (Ionic)**
- Capacitor 8 was announced on 9 Dec 2025. Swift Package Manager became the default for new iOS projects, a new SystemBars plugin handles Android edge-to-edge, and Ionic reported nearly 1 million downloads per week. — [API Evangelist mirror of the Ionic blog "Announcing Capacitor 8"](https://blogs.apievangelist.com/blogs/ionic-2025-12-09-announcing-capacitor-8/); [Plushcap mirror](https://www.plushcap.com/content/ionic/blog/ionic-announcing-capacitor-8)
- The current stable release is `@capacitor/core` / `@capacitor/cli` **8.5.3**, tagged `latest`. Capacitor 9 is in alpha (`next` = 9.0.0-alpha.8). — [npm @capacitor/core](https://www.npmjs.com/package/@capacitor/core) (registry read 2026-10-20)
- Capacitor 8 requirements: Node.js 22 or higher; "To build iOS apps, you will need macOS"; at least Xcode 26.0; at least Android Studio 2025.2.1; Android SDK API 24 or higher, with API 36 the latest stable. Android Studio installs the JDK. — [Capacitor docs, Environment Setup (v8)](https://capacitorjs.com/docs/getting-started/environment-setup)
- **Ionic Appflow** (Ionic's cloud build service) stopped new-customer sales on 11 Feb 2025. Existing users keep access until 31 Dec 2027. — [Ionic blog, 11 Feb 2025](https://ionic.io/blog/?p=6282) (summarized via search; vendor pages from competitors such as Capawesome describe it more harshly)

**Cloud macOS for the iOS build (no Mac owned)**
- **GitHub Actions** per-minute rates: macOS standard runner (3–4 core, M1 or Intel) $0.062; macOS 12-core $0.077; macOS 5-core M2 Pro $0.102; Linux 2-core x64 $0.006. Jobs are rounded up to whole minutes. — [GitHub Docs, Actions runner pricing](https://docs.github.com/en/billing/reference/actions-runner-pricing)
- On GitHub Free, private repositories get 2,000 minutes a month. "The use of standard GitHub-hosted runners is free … in public repositories." Larger runners are always charged, including in public repositories. The page does not name macOS in the free-for-public statement and does not mention minute multipliers. — [GitHub Docs, Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
- **Codemagic** free "For individuals" plan: 500 free macOS M2 minutes a month, 1 parallel build, unlimited apps, 30 days of build history. Pay-as-you-go: Mac mini M2 $0.095/min after the first 500 free minutes; M4 $0.114/min; Linux/Windows $0.045/min. — [Codemagic pricing](https://codemagic.io/pricing/)
- **MacinCloud**: the pricing page URL tried returned 404, so no current prices. A Construct forum user suggests renting a cloud Mac such as MacinCloud ("you don't need to own them yourself, you can rent them"). Forum source, unverified. — [Construct forum](https://construct.net/en/forum/construct-3/how-do-i-8/build-ios-without-mac-165848)

**Trusted Web Activity (Android only) via Bubblewrap / PWABuilder**
- A TWA opens a PWA inside an Android app through a Custom Tabs-based protocol. The user's browser (Chrome 72+ or another browser that supports the protocol) renders the content fullscreen. App and site must belong to the same developer, which is verified with Digital Asset Links. The page expects the content to meet the Lighthouse "Add to Home screen" criteria. The host app cannot read the web content's cookies or localStorage. — [Chrome for Developers, TWA overview (last updated 2020-02-04)](https://developer.chrome.com/docs/android/trusted-web-activity/overview)
- If Digital Asset Links verification fails, the site opens as a Custom Tab with browser UI (a URL bar) at the top. A common cause is a wrong signing-key fingerprint, because Google Play re-signs the app. — [Chrome TWA Quick Start](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start)
- Since Chrome 86, critical web-app failures (asset-link verification failure at launch, HTTP 404/5xx, failed offline requests) are reported as native app crashes rather than silently falling back. — [Chrome blog: "TWA will delegate some web app errors to native app crashes beginning in Chrome 86"](https://goo.gle/twa-quality-criteria-update) (2020)
- Bubblewrap CLI: needs Node 18+, JDK 17 ("higher versions are incompatible with the Android command line tools") and the Android command-line tools, and offers to download the JDK and SDK automatically on first run. `bubblewrap init --manifest=<url>` creates a regular Android project. `bubblewrap build` produces `app-release-signed.apk` and `app-release-bundle.aab` for Play. Keystore passwords can come from the `BUBBLEWRAP_KEYSTORE_PASSWORD` / `BUBBLEWRAP_KEY_PASSWORD` environment variables. `bubblewrap fingerprint generateAssetLinks` writes `assetlinks.json`. A Docker image is provided. The repo says it is "not an officially supported Google product." — [Bubblewrap CLI README](https://github.com/GoogleChromeLabs/bubblewrap/tree/main/packages/cli); [Bubblewrap repo](https://github.com/GoogleChromeLabs/bubblewrap)
- The current `@bubblewrap/cli` is **1.27.0**, registry modified 2026-10-09, so the project is still active. — [npm @bubblewrap/cli](https://www.npmjs.com/package/@bubblewrap/cli)
- Play Billing can be used inside a TWA through the Digital Goods API and a custom DelegationService (android-browser-helper). The guide describes this as an origin trial starting in Chrome 88, and its current status was not verified. — [Chrome docs, Use Play Billing in your TWA](https://developer.chrome.com/docs/android/trusted-web-activity/play-billing)

**PWABuilder for iOS**
- PWABuilder's iOS platform is described as **experimental**. It packages the PWA into an **Xcode project** using WKWebView, which you then "build in Xcode and publish to the iOS App Store", so a Mac or cloud Mac is still required. Service workers are enabled via App-Bound Domains on iOS 14+, and the template has no iOS-specific features such as Apple Pay or Sign in with Apple. — [PWABuilder blog, "Publish your PWA to the iOS App Store"](https://blog.pwabuilder.com/posts/publish-your-pwa-to-the-ios-app-store/) (summarized via search; the PWABuilder docs page did not render for fetching)
- A third-party guide rates a raw PWA wrapper as "High, thin-wrapper rejection risk" on the App Store. Blog source, low reliability. — [vp0.com, 2026](https://vp0.com/blogs/convert-pwa-to-ios-app-fast-2026)

**Cordova**
- Apache Cordova is still maintained: `cordova-android` **15.1.0** (registry modified 2026-07-22) and `cordova-ios` **8.1.1** (2026-07-07). Cordova Android 14.0.0 (26 Mar 2025) raised the target SDK to 35. — [npm cordova-android](https://www.npmjs.com/package/cordova-android); [npm cordova-ios](https://www.npmjs.com/package/cordova-ios); [Cordova blog, cordova-android 14.0.0](https://cordova.apache.org/announcements/2025/03/26/cordova-android-14.0.0.html)

**Game-engine exporters (for comparison)**
- Construct 3's build service is aimed at Android. Its iOS export produces an Xcode project, and publishing continues with Apple's tools on a Mac. Construct also offers a Cordova project export for third-party build services. — [Construct tutorial "How to publish mobile apps"](https://www.construct.net/en/tutorials/how-to-publish-mobile-apps-26); [Construct forum](https://construct.net/en/forum/construct-3/how-do-i-8/build-ios-without-mac-165848)

**Store accounts and fees**
- Apple Developer Program: $99/year. Google Play: $25 one-time registration. These come from secondary sources (not Apple's or Google's own pages). — [SplitMetrics, Aug 2025](https://splitmetrics.com/blog/google-play-apple-app-store-fees/); [AppRadar](https://appradar.com/blog/google-play-apple-app-store-fees)
- Apple's App Store Small Business Program cuts the commission to **15%** for developers with at most $1M in proceeds in the prior calendar year; new developers qualify too. Enrollment is required. — [Apple, Small Business Program](https://developer.apple.com/app-store/small-business-program/)
- New Google Play **personal** developer accounts (created after 13 Nov 2023) must run a closed test with **at least 12 testers opted in for 14 continuous days** before applying for production access. This was earlier 20 testers. — [Play Console Help 14151465](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB)
- Apple's new age-rating questionnaire (adding 13+, 16+ and 18+ ratings) had to be answered by **31 Jan 2026**, or app updates would be blocked. — [9to5Mac / iPhone in Canada, Jul 2025](https://www.iphoneincanada.ca/2025/07/25/updated-app-store-age-ratings)

### Inferences
- **Recommended route for this project:** Capacitor 8 for both stores.
  - The existing index.html, gra.js, zadania.js and the MP3 files go into the `webDir`. Capacitor copies them into the app, so the game runs offline from inside the app and not from GitHub Pages. This standard Capacitor behaviour was not re-fetched in this session.
  - The Android AAB can be built entirely in the Linux container with Gradle and the Android command-line SDK.
  - iOS: the Xcode project is generated in Linux, committed, and built and signed on Codemagic (free 500 min/month) or GitHub Actions macOS. Uploading to TestFlight and App Store Connect from CI with an App Store Connect API key is standard practice (not verified in this session).
  - Testing requires a real iPhone or iPad in the family, through TestFlight.
- **Rough cost of iOS CI:** if one iOS build takes about 10–20 minutes (an assumption, not measured), Codemagic's 500 free minutes cover roughly 25–50 builds a month. On GitHub Actions in a private repo, 20 minutes × $0.062 ≈ $1.24 per build.
- **TWA (Bubblewrap) suits Android only, and fits best if the game stays a free web game.** Its size is tiny and updates go live by updating GitHub Pages, with no store re-upload. Drawbacks:
  - It needs the live site, so the PWA must work offline; failures count as crashes since Chrome 86.
  - `assetlinks.json` must sit at `https://<domain>/.well-known/assetlinks.json`. For a GitHub Pages *project* site (`user.github.io/repo/`) that means the root `user.github.io` repository, or a custom domain. Jekyll on GitHub Pages also skips dot-folders unless a `.nojekyll` file is added. These two points are known GitHub Pages behaviour, not re-verified here.
  - Native AdMob is not available without extra native code.
  - Play Billing works only through the Digital Goods API route.
- **PWABuilder iOS** gives no advantage over Capacitor here. It still needs Xcode on a Mac, it is "experimental", and if it loads the live URL instead of bundled files, it raises the risks under guidelines 4.2 and 2.5.2 (inference; check the generated template).
- **Cordova** works, but Capacitor is the better-supported choice for a new project in 2026. The plugins (AdMob, RevenueCat) and Capacitor 8's docs target Capacitor.
- **Total minimum fixed cost:** about $99/year for Apple plus $25 once for Google. CI can be $0 within the free tiers. For a Google personal account, plan on recruiting 12 testers (family, school parents) for 14 days.

| Option | Android | iOS | Mac needed? | Cost | Difficulty with AI helper on Linux | Main risks |
|---|---|---|---|---|---|---|
| Capacitor 8 + Codemagic/GitHub Actions | AAB on Linux | via cloud macOS CI | No (rented CI) | $0–low CI + store fees | Medium | iOS signing setup; Apple 4.2 review |
| TWA via Bubblewrap | AAB on Linux | no | No | store fee only | Low | must stay online-hosted and offline-capable; assetlinks on GitHub Pages root; native ads/IAP harder |
| PWABuilder (Android = TWA; iOS = Xcode project) | yes | Xcode project only | Yes (or cloud Mac) | store fees | Low–medium | iOS "experimental"; higher 4.2 risk |
| Cordova | yes | needs macOS | Yes (or cloud CI) | same as Capacitor | Medium | older ecosystem |
| Ionic Appflow | — | — | — | not sold to new customers | — | ends 31 Dec 2027 |

### Gaps
- Whether GitHub's free public-repo minutes explicitly include **macOS** standard runners, and whether a 10× macOS minute multiplier still applies to the 2,000 included minutes. The docs pages fetched did not say.
- Which Xcode versions are on GitHub's macOS runner images and Codemagic in Oct 2026. Capacitor 8 needs Xcode 26+. Apple's current minimum-SDK rule for uploads was not checked.
- MacinCloud's current prices (page returned 404).
- Whether the Digital Goods API for TWA has left origin trial; current Bubblewrap docs on Play Billing were not checked.
- Google Play's own service-fee rate (commonly cited as 15% on the first $1M/year) was not verified from Google's page in this session.

## 2. Apple guideline 4.2 risk for web-wrapped apps: what makes Apple accept an HTML5 game

### Takeaway
Apple's rules do not ban HTML5 or WebView games. What they reject is an app that is merely "a repackaged website" or that lacks "lasting entertainment value." A self-contained game, bundled in the app, working offline, with no browser UI, links or login, and with a native feel (full screen, haptics, proper icons and launch screen) is the profile most likely to pass. No official Apple statement or reputable outlet gives a clear "accepted" checklist, and developer forum reports show rejections are inconsistent.

### Cited Findings
- Guideline 4.2 (Minimum Functionality), verbatim: "Your app should include features, content, and UI that elevate it beyond a repackaged website. If your app is not particularly useful, unique, or 'app-like,' it doesn't belong on the App Store. If your App doesn't provide some sort of lasting entertainment value or adequate utility, it may not be accepted." — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 4.2.2: apps "shouldn't primarily be marketing materials, advertisements, web clippings, content aggregators, or a collection of links." 4.2.3(ii): if the app must download extra resources on first launch, disclose the size and prompt the user first. — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 2.5.2: apps should be "self-contained in their bundles" and may not "download, install, or execute code which introduces or changes features or functionality of the app." — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 2.5.6: apps that browse the web must use WebKit. — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- 4.7 explicitly allows "HTML5 and JavaScript mini apps and mini games" offered inside an app, not embedded in the binary. The host app is responsible for them, and they may not get native APIs without permission (4.7.2). This covers platforms that host third-party mini-games, not a single bundled game. — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Developer reports on Apple's own forums show 4.2 rejections worded as "not sufficiently different from a mobile browsing experience" for Capacitor apps. A forum reply said Game Center leaderboards are "a good start, but probably not enough." These are anecdotal forum posts. — [Apple Developer Forums thread 704430](https://developer.apple.com/forums/thread/704430); [Meteor forum (unreliable)](https://forums.meteor.com/t/ios-app-rejected-for-being-html5/38090)

### Inferences
- For an educational game with 8 grades × 8 topics × 4 difficulty levels, original music and a weapons/gold progression, "lasting entertainment value" is arguably met. The real 4.2 danger is anything that looks like a website:
  - loading the game from the GitHub Pages URL instead of the bundle;
  - visible links to the web, or "add to home screen" prompts;
  - text selection or pinch-zoom left enabled;
  - scrolling bounce;
  - a broken offline mode.
- A practical pre-submission checklist (inference, built from the guideline text):
  - all files bundled (no remote code, per 2.5.2);
  - works in airplane mode;
  - no URL bar, external links or web install prompts (remove the PWA "add to home screen" window, the instruction dialog that version 8 added, from the app build);
  - proper app icon and launch screen;
  - respects safe areas and the notch;
  - pauses audio when the app is backgrounded;
  - optionally haptics or Game Center through Capacitor plugins;
  - no account or login wall.
- Reviewers vary; if the app is rejected, the usual route is to reply in App Store Connect explaining the native features, or to add them.

### Gaps
- No official Apple statement or reputable industry outlet (pocketgamer.biz, gamesindustry.biz) was found that lists the criteria under which wrapped HTML5 games are accepted. Evidence of acceptances is anecdotal only.
- No data on 4.2 rejection rates for Capacitor games specifically.

## 3. Technical pitfalls of canvas games in Android WebView / iOS WKWebView

### Takeaway
The main traps are:
- **iOS silent switch muting Web Audio**: set `navigator.audioSession.type = "playback"` where supported.
- **Music must pause when the app goes to the background**: use the Capacitor App plugin's `pause`/`resume` events.
- **Low Power Mode on iOS capping requestAnimationFrame at 30 fps**: use a delta-time game loop.
- **localStorage is "transient" in Capacitor**: keep game progress in the Preferences plugin.
- **Android back button**: must be handled explicitly.
- **Android 15 enforcing edge-to-edge**: use Capacitor 8 SystemBars and safe-area insets.

### Cited Findings
**Audio**
- On iOS, the default Web Audio session type is "ambient", so audio is muted when the phone is on silent. Setting `navigator.audioSession.type = 'playback'` keeps it audible, and a WebKit maintainer said this "should help for silent mode at least." `<audio>` elements and Web Audio behave inconsistently with the silent switch. Audio is stopped when the page is backgrounded. Source: WebKit Bugzilla threads, mostly from 2023. — [WebKit bug 251532](https://bugs.webkit.org/show_bug.cgi?id=251532); [WebKit bug 264473](https://bugs.webkit.org/show_bug.cgi?id=264473)
- In native WKWebView apps, the native AVAudioSession category also matters, according to older Apple forum threads. — [Apple Developer Forums thread 24464](https://developer.apple.com/forums/thread/24464) (old)
- The Capacitor App plugin fires `pause` when the app goes to the background (Android `onPause`) and `resume` when it returns; `appStateChange` provides `isActive`. — [Capacitor App API](https://capacitorjs.com/docs/apis/app)

**Frame rate**
- iOS Low Power Mode throttles `requestAnimationFrame` to 30 fps. A WebKit engineer said this is intentional (bug closed as INVALID, 2020), and developers on the GreenSock forum found no reliable override. — [WebKit bug 215745](https://bugs.webkit.org/show_bug.cgi?id=215745); [Motion.dev, "When browsers throttle requestAnimationFrame"](https://motion.dev/blog/when-browsers-throttle-requestanimationframe)

**Saving progress (localStorage)**
- Capacitor docs: localStorage "must be considered transient", because "the OS will reclaim local storage from Web Views if a device is running low on space"; the same applies to IndexedDB, at least on iOS. Recommendation: the **Preferences API**, a native key/value store that "avoids the eviction issues", for small data, or SQLite for large data. — [Capacitor Storage guide](https://capacitorjs.com/docs/guides/storage)
- `@capacitor/preferences` latest is 8.0.1. — [npm](https://www.npmjs.com/package/@capacitor/preferences)
- WebKit's ITP 7-day cap deletes "all of a website's script-writable storage after seven days of Safari use without user interaction on the site" (including localStorage, IndexedDB and service worker caches). Home-screen web apps keep their own day counter, and WebKit treats deletion there as a serious bug. — [WebKit blog, "Full Third-Party Cookie Blocking and More" (Mar 2020)](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- Whether this cap applies inside a WKWebView in a normal app has not been officially stated. Thinktecture and Ionic (both 2020) argue it does not, because the counter is Safari-specific. — [Ionic blog, "Is Apple trying to kill PWAs?" (2020)](https://ionic.io/blog/is-apple-trying-to-kill-pwas); [Apple forum thread 770747, "LocalStorage sometimes disappears in WKWebView"](https://developer.apple.com/forums/thread/770747)

**Android back button**
- Capacitor App plugin `backButton` event (Android): "Listening for this event will disable the default back button behaviour"; the event reports `canGoBack`; call `App.exitApp()` to close the app. — [Capacitor App API](https://capacitorjs.com/docs/apis/app)

**Status bar, safe areas, orientation**
- Capacitor 8 ships **SystemBars** in `@capacitor/core` for modern edge-to-edge use. In Android WebView versions below 140, `env(safe-area-inset-*)` gives wrong values; the fix is the `insetsHandling` config. Capacitor 8.3/8.4 inject `--safe-area-inset-*` CSS variables, including on older Android versions. Android 15 enforces edge-to-edge by default. — [Capacitor SystemBars docs](https://capacitorjs.com/docs/apis/system-bars); [Capawesome, edge-to-edge guide](https://capawesome.io/blog/capacitor-edge-to-edge-and-safe-areas-guide/); [Capawesome, What's new in Capacitor 8.4.0](https://capawesome.io/blog/whats-new-in-capacitor-8-4-0/)
- A community forum thread reports leftover keyboard-spacing issues with edge-to-edge in Capacitor 8. Forum source. — [Ionic forum](https://forum.ionicframework.com/t/android-edge-to-edge-and-keyboard-for-capacitor-8/250231)
- `@capacitor/screen-orientation` 8.0.2 is available for locking orientation. — [npm](https://www.npmjs.com/package/@capacitor/screen-orientation)

**TWA specifics**
- In a TWA, the native app cannot access the page's localStorage. Data stays in the browser's storage for that origin. — [Chrome TWA overview](https://developer.chrome.com/docs/android/trusted-web-activity/overview)
- Offline failures and 404s count as app crashes from Chrome 86. — [Chrome blog](https://goo.gle/twa-quality-criteria-update)

### Inferences
- Concrete to-do list for gra.js in an app build:
  1. **Audio unlock.** On the first tap, create/resume the AudioContext and start the MP3s, which the web version probably already does. Set `navigator.audioSession.type='playback'` when the feature exists, so the music is heard with the silent switch on. Parents may actually prefer respecting the silent switch, so make this a setting.
  2. **Background.** Pause the music and the game on Capacitor `pause`, and resume on `resume`, also for review quality.
  3. **Frame rate.** Make sure movement uses delta-time, so the game runs at the same speed at 30, 60 or 120 fps.
  4. **Saved progress.** Mirror gold, levels and settings from localStorage into `@capacitor/preferences`.
  5. **Back button.** Back closes the current menu or pauses the game; on the main menu it asks "Wyjść?" (Exit?) and then calls `exitApp()`.
  6. **Orientation.** Lock to the orientation the game is designed for.
  7. **Safe areas.** Use safe-area CSS variables so HUD buttons are not under the notch or gesture bar.
  8. **Web behaviour.** Disable pinch-zoom, text selection, long-press menus and overscroll bounce.
- The current *web* version on GitHub Pages in Safari (not added to the home screen) is exposed to the 7-day storage deletion. That is an argument for the app version, or for telling parents to add the game to the home screen.
- Performance: both WebViews use the same engine families as the browsers (Chromium on Android, WebKit on iOS). A single 2D canvas game should run like it does in mobile Chrome/Safari. Low-end Android phones are the main performance risk; test on one. This is an inference, not benchmarked.

### Gaps
- No official, current (2025–2026) statement on WKWebView localStorage eviction beyond Capacitor's "transient" warning.
- No benchmark data comparing canvas frame rates in Capacitor WebView versus mobile Chrome/Safari in 2026.
- Whether `navigator.audioSession` behaves the same in an embedded WKWebView as in Safari is unconfirmed. Test on a device.

## 4. Monetization reality: eCPM/ARPDAU for kids traffic, kid-safe ad networks, Apple Kids rules, paid vs. IAP vs. subscription, and downloads needed for 1000 PLN/month

### Takeaway
Child-directed (COPPA/Families) ad traffic earns roughly **2.5–5× less per impression** than normal traffic. Some big mediation platforms, such as AppLovin MAX, block under-13 users entirely. Apple's Kids category allows almost no third-party ads.

For a Polish-language educational game, ad revenue per daily player will be a fraction of a US cent. Reaching about **1000 PLN/month** from ads needs on the order of **thousands of daily players**, meaning tens of thousands of installs a month (rough estimate below). A one-time "unlock all / remove ads" purchase behind a parental gate is the more realistic model for a small kids' title, but it still needs several thousand downloads a month.

### Cited Findings
**How much less kids traffic earns, and which networks serve it**
- eCPM on COPPA traffic is "2.5 to more than 5 times lower" than on non-COPPA traffic. Mediation status as of May 2026 (vendor newsletter by Ivona Pinjak, GameBiz Consulting):
  - **AppLovin MAX** blocks ad requests for users under 13 (since Jan 2025);
  - **AdMob** allows COPPA traffic only through waterfalls, with no third-party bidding;
  - **Unity LevelPlay** is the "most viable" option;
  - main COPPA demand: Kidoz, SuperAwesome, Unity Ads, Liftoff Monetize, DT Exchange, InMobi;
  - ironSource Direct was deprecated on 30 Apr 2026.

  The newsletter's headline claim that marking an app child-directed "just to be safe" costs 70% of eCPM is not backed by data in the article. — [GameBiz Consulting AdMon Newsletter #11, ~May 2026](https://www.gamebizconsulting.com/newsletter/admon-newsletter-11-the-shrinking-island-ad-monetization-underage-users)
- Academic evidence: after the 2019 COPPA-related ban on targeted advertising (YouTube settlement), children's app developers invested less in their apps and raised prices. — [AEA 2025 conference paper "COPPAcalypse?"](https://www.aeaweb.org/conference/2025/program/paper/Nh473RD3)
- **Google Play Families policy:** apps that target children and use an ads SDK "must use one of the self-certified ads SDK versions". The self-certified list is AdColony, AddApptr, Chartboost (9.1.1+), DT Exchange, Google Ad Manager, Google AdMob (19.0.0+), HyprMX, InMobi, ironSource (7.2.1+), Kidoz (8.9.4+), SuperAwesome (8.4.3+), Unity Ads (4.0.1+) and Vungle. AppLovin "has left the program". The program is "currently not accepting new applicants". In-house ads and cross-promotion don't require a certified SDK. — [Play Console Help, Families Self-Certified Ads SDK Program](https://support.google.com/googleplay/android-developer/answer/9283445)
- **AdMob child-directed settings:** tagging for child-directed treatment means Google will "disable IBA [interest-based ads] and remarketing ads" and "prevents the transmission of the Android advertising identifier (AAID)". `setTagForChildDirectedTreatment()` is **deprecated** in favour of `setAgeRestrictedTreatment()` with `CHILD`. The under-age-of-consent tag (EEA, GDPR) disables personalized ads and third-party ad-vendor requests, and the child-directed tag wins if both are set. `maxAdContentRating` (G/PG/T/MA) limits ad content; use G for kids. — [AdMob Android targeting docs](https://developers.google.com/admob/android/targeting)

**Kid-safe ad networks in 2026**
- **SuperAwesome** is active in 2026. Roblox named it its commercial and technology partner for under-13 contextual advertising (4 Jun 2026). It expanded its audio network in May 2026 and launched "Creator Aware" in Jul 2026. It was acquired by Epic Games in 2020. — [Outlook Respawn](https://respawn.outlookindia.com/amp/story/gaming/gaming-news/roblox-superawesome-launch-under-13-contextual-advertising-ads); [PPC Land](https://ppc.land/superawesome-gives-under-18-creators-direct-trust-payments-therapy-access/); [Campaign Asia (2020)](https://aws2.campaignasia.com/article/epic-games-acquires-kid-focused-media-and-ad-firm-superawesome/463906)
- **Kidoz** (a listed company) reported Q1 2026 results with year-on-year revenue growth. It positions itself as "privacy-first" contextual advertising (COPPA, GDPR-K) without PII or location data. It added the Prado SDK for all-age apps in Jul 2025. A third-party review notes that the kids-only advertiser pool can mean lower fill. — [Kidoz Q1 2026 press release](https://www.newswire.com/news/kidoz-inc-reports-q1-2026-financial-results-with-yoy-revenue-growth); [Prado SDK launch](https://www.newswire.com/news/kidoz-inc-announces-official-launch-of-the-prado-sdk-a-powerful-new); [FitGap review (low reliability)](https://us.fitgap.com/products/kidoz-sdk)

**Apple Kids category**
- Guideline 1.3 says Kids Category apps "must not include links out of the app, purchasing opportunities, or other distractions to kids unless reserved for a designated area behind a parental gate", "should not include third-party analytics or third-party advertising", and "Third-party contextual advertising may also be permitted in limited cases provided that the services have publicly documented practices and policies for Kids Category apps that include human review of ad creatives for age appropriateness". Guideline 5.1.4 applies the same rules to any app "intended primarily for kids", even outside the Kids category. — [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Age-signal APIs that are arriving: Google Play Age Signals API and Apple Declared Age Range API (mentioned as preparation items). — [GameBiz Consulting #11](https://www.gamebizconsulting.com/newsletter/admon-newsletter-11-the-shrinking-island-ad-monetization-underage-users)

**General (non-kids) ad benchmarks**
- Appodeal, Q4 2024 (via secondary summary): US rewarded-video eCPM was $19.63 on iOS and $16.49 on Android. Top interstitial eCPMs on iOS were US $14.32, UK $10.38 and South Korea $10.04. iOS beat Android across formats, and North America and Europe lead. — [WN Hub summary of Appodeal data](https://wnhub.io/news/art/item-40260); [Appodeal Latest eCPM Report 2025 (PDF; country charts are images, Poland values unreadable)](https://appodeal.com/the-mobile-ecpm-report-updated-q4-2024-view)
- GameAnalytics (2019 benchmarks): **median ARPDAU $0.02**; top 15% of games $0.10–0.14. These figures are about 7 years old. — [App Developer Magazine on GameAnalytics benchmarks](https://appdevelopermagazine.com/mobile-gaming-industry-benchmarks-offer-fresh-look-on-industry/)
- Third-party ARPDAU ranges (unverified): hyper-casual $0.01–0.05; hybrid-casual $0.15–0.50. — [Juego Studio](https://www.juegostudio.com/blog/arpdau-benchmarks-by-game-genre); [Playio](https://blog.playio.co/arpdau-benchmarks-mobile-games) (blogs, low reliability)

**Purchases and subscriptions (RevenueCat data)**
- RevenueCat *State of Subscription Apps 2026*, Education category medians:
  - download-to-trial (D30) **6.5%**;
  - revenue per install at D14 **$0.30**;
  - year-1 realized LTV per payer **$22.82**;
  - median yearly price **$44.99** and monthly price **$9.99**;
  - 59–66% of Education subscribers choose annual plans.

  These figures cover subscription apps that use RevenueCat, a self-selected sample. — [RevenueCat SOSA 2026, Education](https://www.revenuecat.com/state-of-subscription-apps-2026-education)
- All-category median download-to-paid: hard paywall **10.7%** versus freemium **2.1%** (RevenueCat 2026 data, via SaaStr). — [SaaStr summary](https://www.saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps/)

**What other kids' studios did, and top-end revenue**
- Toca Boca moved from paid upfront apps to a free app (Toca Life: World) with paid unlocks, as part of an industry move to recurring revenue (2018). It later consolidated its standalone apps into Toca Boca World; a low-reliability FAQ says this happened on 1 Jan 2024. — [Axios, 2018](https://www.axios.com/2018/11/21/toca-boca-in-app-purchases-toca-life-world); [Playgama FAQ (low reliability)](https://playgama.com/blog/game-faqs/what-happened-to-the-old-toca-boca-games/)
- Top US educational games (Sensor Tower data, reproduced in short auto-generated Sensor Tower blog posts, 2025): Lingokids about $350–408K **per week** in US revenue; Kiddopia about $190–203K/week (Q3 2025); Splash Jr about $58K/week (Sep 2025); Minecraft Education about $0 revenue with 30–40K weekly downloads. In smaller markets, most regional apps earn "a few thousand dollars per week or less" (e.g. MentalUP, Turkey, about $20.4K/week in Dec 2025). These are subscription giants, not comparable to a solo game. — [Sensor Tower Q2 2025 US educational games revenue](https://sensortower.com/blog/2025-q2-unified-top-5-educational%20games-revenue-us-642f2824e1714cfff1ed8590); [Q3 2025 units](https://sensortower.com/blog/2025-q3-unified-top-5-educational%20games-units-us-642f2824e1714cfff1ed8590); [Q4 2025 Android TR](https://sensortower.com/blog/2025-q4-android-top-5-educational-games-units-tr-642f2824e1714cfff1ed8590)

**Store fees**
- Apple's App Store commission is 15% under the Small Business Program. — [Apple](https://developer.apple.com/app-store/small-business-program/)

### Inferences
**How many downloads for about 1000 PLN/month?** Rough model; all inputs are assumptions labelled below.
- 1000 PLN ≈ **$270/month ≈ $9/day**. Assumed exchange rate about 3.7 PLN/USD, not verified for Oct 2026.

**Ads model (child-directed traffic, Poland):**
- Western casual non-kids ARPDAU median is about $0.02 (2019). Kids eCPM is 2.5–5× lower, and Polish eCPMs are below US levels. With gentle ad use in a kids' game (about 2–5 interstitial or rewarded views per daily player), plausible ARPDAU is **$0.003–0.015**.
- DAU needed = $9 ÷ ARPDAU ≈ **600–3,000 daily active players**.
- Casual games keep few players: each install yields roughly 2–4 active days in its first month (assumption). Sustaining that DAU therefore needs about **5,000–30,000 new installs every month**, continuously.

**One-time purchase ("odblokuj wszystkie levele / bez reklam" = unlock all levels / no ads) at 14.99 PLN:**
- Net per sale after 23% Polish VAT (included in the consumer price) and the 15% store fee ≈ 14.99 ÷ 1.23 × 0.85 ≈ **10.4 PLN**.
- About **97 sales a month** are needed.
- At the RevenueCat freemium median of about 2.1% (a subscription benchmark, used here as a proxy), that is about **4,600 downloads a month**. At 5% conversion it would be about 1,900.
- On iOS, the purchase must sit behind a parental gate (guideline 1.3).

**Paid upfront app (e.g. 9.99–19.99 PLN):** the fewest downloads but the cleanest kids' experience (no ads, no data issues). For an unknown solo title it is usually the lowest-volume option; there is no hard data. Apple Family Sharing can be enabled for paid apps, so one purchase covers the family (standard App Store feature, not re-verified).

**Subscription:** Education median $44.99/year exists, but it suits large content apps (Lingokids, Kiddopia). It is overkill and harder to justify to parents for one game, and it adds maintenance and churn handling.

**Practical recommendation for a children's game:**
- Make the Android and iOS apps free, with no third-party ads (avoiding COPPA/GDPR-K complexity, Apple 1.3/5.1.4 restrictions, Families SDK rules, parental distrust and low eCPM).
- Offer one non-consumable in-app purchase, behind a parental gate, that unlocks the higher levels (grades) or extra worlds.
- Optionally keep the web version as a free demo or teacher version.
- Expect pocket money rather than an income at first. 1000 PLN/month realistically needs thousands of downloads a month, which a Polish-only educational game without marketing is unlikely to reach quickly (no data either way).

**If ads are used anyway:**
- Use AdMob with `setAgeRestrictedTreatment(CHILD)` (replacing the deprecated child-directed tag) and `maxAdContentRating = G`, plus possibly Kidoz or SuperAwesome via mediation.
- Use rewarded ads only (for example "watch for extra gold"), never interrupting a math question.
- Do not list the app in Apple's Kids category, or if listing there, use only human-reviewed contextual networks. Note that 5.1.4 applies to any app "intended primarily for kids".

### Gaps
- No reliable 2025–2026 **Poland-specific** eCPM data, and no published kids-only eCPM levels by country or format (only the 2.5–5× ratio from one vendor newsletter).
- No current (2025–2026) GameAnalytics ARPDAU benchmark for casual or educational games; their reports require sign-up.
- No published revenue figures from Tutotoons or Sago Mini were found. Khan Academy Kids' non-profit free model was not re-verified in this session.
- No data on conversion rates for one-time unlock purchases in kids' apps specifically.
- Whether SuperAwesome still offers a self-serve SDK and monetization for small app publishers in 2026 (its 2026 news is about Roblox and brands) is unclear.
- The PLN/USD rate for Oct 2026 was not checked.

## 5. Getting downloads with no marketing budget

### Takeaway
There is little hard evidence on what works for small educational games. Free levers:
- **App Store and Play listing optimization** in Polish: name, subtitle and keywords, plus good screenshots;
- **Teachers and schools**: the free web version is a natural funnel into the app;
- **word of mouth among parents**.

Google's **Teacher Approved** badge is *not* available, because Polish is not a supported language.

### Cited Findings
- Apple product-page limits: app name and subtitle up to 30 characters each; keywords "limited to 100 characters total, with terms separated by commas and no spaces"; promotional text up to 170 characters (it does not affect search ranking); up to 10 screenshots, of which the first 1–3 appear in search results; up to 3 app previews of 30 s each. Advice:
  - skip plurals, duplicates, category names and the word "app" in keywords;
  - balance popular and niche terms;
  - localize the name, keywords, description and screenshots per market.

  — [Apple, Creating your product page](https://developer.apple.com/app-store/product-page/)
- Google Play **Teacher Approved**:
  - only apps complying with the Families Policy are eligible;
  - supported languages: English, French, German, Indonesian, Japanese, Korean, Portuguese, Russian, Spanish, Turkish and Arabic (**no Polish**);
  - excluded: apps "designed primarily for classroom use", apps meant to be used with an adult, language-learning apps and social apps;
  - eligible apps enter review automatically, and approved apps get a badge and may appear in the Kids tab.

  — [Play Console Help 10075896](https://support.google.com/googleplay/android-developer/answer/10075896)
- At launch (2020), Teacher Approved reviewers were more than 200 US teachers. — [TechCrunch, 2022](https://techcrunch.com/2022/11/16/google-play-streamlines-policies-around-kids-apps-as-regulations-tighten/)

### Inferences
- Polish ASO:
  - name and subtitle such as "Śmierdzipacha – matematyka klasy 1–8" ("Śmierdzipacha – maths for grades 1–8");
  - keywords such as tabliczka mnożenia (times tables), ułamki (fractions), matematyka dla dzieci (maths for kids), klasa 4, gra edukacyjna (educational game), dodawanie (addition), procenty (percentages);
  - screenshots showing the zombie gameplay and the levels.
- The existing GitHub Pages web version can link to the store pages for parents. In the app itself, avoid outbound links in kid-facing screens, or put them behind a parental gate.
- The 12-tester closed test on Google Play can double as a first word-of-mouth seed (classmates' parents).
- Other channels with no hard evidence found: teacher Facebook groups, school newsletters, local parenting forums, and an edu catalogue such as Apple School Manager volume purchase. These were not researched in this session.

### Gaps
- No reputable data on which free channels (teachers, word of mouth, ASO) actually drive downloads for small educational games, Polish or otherwise.
- No information on Polish equivalents of curated "teacher approved" lists, or on how Polish schools adopt apps.

## 6. Plugins: @capacitor-community/admob, RevenueCat Capacitor SDK, cordova-plugin-purchase (status 2026)

### Takeaway
All three are actively maintained in October 2026:
- `@capacitor-community/admob` **8.2.1**: needs Capacitor 8.5+; supports child-directed, under-age-of-consent and max-ad-rating options and Google's UMP consent.
- `@revenuecat/purchases-capacitor` **13.7.4**: free up to $2,500 monthly tracked revenue, then 1%.
- `cordova-plugin-purchase` **13.19.1**.

### Cited Findings
- `@capacitor-community/admob` latest **8.2.1** (registry modified 2026-10-06). — [npm](https://www.npmjs.com/package/@capacitor-community/admob)
- The README targets v8.2.0, needs **Capacitor 8.5+** (use `@capacitor-community/admob@7` for Capacitor 7), iOS 15+ and Android API 24+. Supported:
  - `tagForChildDirectedTreatment`, `tagForUnderAgeOfConsent` and `maxAdContentRating` (General / ParentalGuidance / Teen / MatureAudience) in `initialize`;
  - banner, interstitial, rewarded, rewarded interstitial and App Open ads;
  - UMP consent forms.

  — [GitHub capacitor-community/admob](https://github.com/capacitor-community/admob)
- `@revenuecat/purchases-capacitor` latest **13.7.4** (registry modified 2026-10-13). This is the official package; similarly named third-party packages (`capacitor-purchases`, `@capgo/capacitor-purchases`) are old or deprecated. The iOS In-App Purchase capability must be enabled in Xcode. — [npm](https://www.npmjs.com/package/@revenuecat/purchases-capacitor); [RevenueCat Capacitor install docs](https://revenuecat.com/docs/getting-started/installation/capacitor)
- RevenueCat pricing: "Pay nothing for up to $2,500 in monthly tracked revenue", then "1% of what you track". — [RevenueCat pricing](https://www.revenuecat.com/pricing/)
- `cordova-plugin-purchase` latest **13.19.1** (registry modified 2026-10-14). — [npm](https://www.npmjs.com/package/cordova-plugin-purchase)

### Inferences
- For a single non-consumable "unlock everything" purchase, RevenueCat is free at this scale and handles receipt validation for both stores. It does add a third-party service that receives purchase data, which is relevant to Apple 1.3/5.1.4 for kids' apps: check that it sends no device identifiers or PII.
- The AdMob plugin exposes the needed kid-safety flags. Because AdMob deprecated `setTagForChildDirectedTreatment()` in favour of `setAgeRestrictedTreatment()`, check that the plugin version maps its option to the new API.

### Gaps
- Whether `@capacitor-community/admob` 8.2.x internally uses AdMob's new `setAgeRestrictedTreatment` API.
- Whether `cordova-plugin-purchase` officially supports Capacitor 8 (not checked).
- The RevenueCat page does not say whether the 1% applies to all tracked revenue or only the amount above $2,500.
