# Graphics, music and free tools for a children's math game (grades 1–8, iPhone browser/PWA)

Research date: 2026-10-20. Licence pages were read from the primary sites on that date, most through direct HTTP fetches of the pages themselves. Library versions and sizes come from the npm registry and jsDelivr on that date. Some numbers were **measured first-hand in the container**: Kenney model triangle counts, gzip sizes of the libraries, and which tools and encoders are available. These are marked "(measured)". Forum and blog material is marked as anecdotal.

## 1. Visual style by age band (grades 1–3, 4–6, 7–8): what appeals and what reads as "childish"

### Takeaway
Children are acutely sensitive to age signals. Even content one grade below their own level gets rejected as "for babies", and teens are repelled by anything labelled or styled "kid" (heavy animation, garish colours, babyish tone). The safe direction is one stylised low-poly 3D look that is clean, readable and not babyish, as in Minecraft, Roblox, Fortnite and Brawl Stars, the games Polish 9–17-year-olds actually play. Visual "age" then shifts through palette saturation, character proportions, humour and UI tone rather than through completely different art. Hard research on colour preference by age is thin. It exists mainly for 4–7-year-olds.

### Cited Findings
**Usability research on age sensitivity (Nielsen Norman Group)**
- NN/g tested users aged 3–12 in three studies (the latest in 2018, 39 sites and 36 apps, US and Beijing). "At a minimum, you must distinguish between young (3–5), mid-range (6–8), and older (9–12) children." "Young users reacted negatively to content designed for children that were even one school grade below or above their own level." A 6-year-old said: "This website is for babies, maybe 4 or 5 years old. You can tell because of the cartoons and trains." (article dated 2019-01-13) — [NN/g, Children's UX](https://www.nngroup.com/articles/childrens-websites-usability-issues/)
- In the same NN/g comparison table, "Animation and sound" are "Liked" by children and "Usually disliked" by adults. Children "like to try many options / mine-sweeping the screen". Recommended font size is 14 pt for young children and 12 pt for older children — [NN/g, Children's UX](https://www.nngroup.com/articles/childrens-websites-usability-issues/)
- On teens (published 2019-03-17, updated 2022-04-14), NN/g says: "the word 'kid' is a teen repellent. Teenagers are fiercely proud of their newly won status, and they don't want overly childish content — one more reason to ease up on the heavy animations and garish color schemes that work for younger audiences." "Avoid anything that sounds condescending or babyish." Teens "don't like sites laden with glitzy, blinking graphics." Also: "Beware of overusing interactive features just because you design for younger audiences." — [NN/g, Teenager's UX](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/)
- NN/g's table on animation and sound effects: children "attend to things that move and make sounds"; teens "might appreciate them to some extent, but overuse can be problematic"; college students and adults "dislike them; autoplay sound disruptive". Teens also dislike tiny fonts and dense text: "Sites that were easy to scan or that illustrated concepts visually were strongly preferred" — [NN/g, Teenager's UX](https://www.nngroup.com/articles/usability-of-websites-for-teenagers/)
- From NN/g's research on children's cognition: state the goal and how to reach it clearly; "even a few years make a big difference in children's cognitive abilities" — [NN/g, Kids' cognition](https://www.nngroup.com/articles/kids-cognition/)

**Colour preference research (thin; mostly young children)**
- A 2023 head-mounted eye-tracking study of 4–7-year-olds looking at toys (Frontiers in Psychology) found children are more attracted as saturation decreases and brightness increases, but only within a range. Beyond it, reduced saturation lowers appeal. Moderate brightness and contrast help visual comfort, warm hues (red, orange, yellow) slightly dominate, and the authors call the roles of hue, saturation and brightness "inconclusive". They also call for age-specific research. (Read via search summary; I did not read the full text.) — [Frontiers in Psychology 2023](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1205213/text)
- The same search found no study showing that adolescents prefer less saturated colours. That popular claim is unsupported by what I found — [search summary of Frontiers 2023 and related work](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10771309/)

**What Polish children and teens actually play, and the art styles involved**
- IQS "Game Story 2" survey (reported July 2021). Among 9–17-year-olds in Poland the most-played titles were Minecraft (32%), Roblox (20%), The Sims 4 (16%), Among Us (13%) and GTA (13%). 87% of 12–18-year-olds and 91% of 9–18-year-olds play at least weekly. The same article gives PEGI ratings of Minecraft PEGI 7, Brawl Stars and FIFA PEGI 9, and Fortnite and League of Legends PEGI 12. The data is from 2021, so it is old — [Super Biznes / IQS](https://superbiz.se.pl/technologie/prawie-90-proc-nastolatkow-w-polsce-gra-w-gry-komputerowe-jak-to-wplywa-na-ich-rozwoj-aa-PbbF-CuU2-3qjB.html)
- A PAP article on GameTrack 2025 (Video Games Poland) lists the top PC titles as Counter-Strike 2/GO, Minecraft, Roblox, Fortnite and The Sims 4, and the top console titles as Fortnite, Call of Duty, GTA V, Roblox and Minecraft. (This comes from a search summary. The age coverage of GameTrack was not verified, and the summary claimed it excludes under-16s, which I could not confirm.) — [PAP](https://www.pap.pl/aktualnosci/counter-strike-gaming-disorder-i-miliardy-dolarow-kto-rzadzi-swiatem-gier-0)
- Polish Gamers Kids 2022 (Gry-OnLine and the Polish Gamers Observatory) covered children aged 9–15. 81% of Polish children say games are important to them. I did not find the title ranking — [instalki.pl](https://www.instalki.pl/news/gry/badanie-polish-gamers-kids-pokazuje-jak-wazne-sa-gry-wideo-dla-polskich-dzieci/)
- Roblox, globally in 2025 (per the PAP search summary): of about 127M DAU, 38% were aged 13–17 and 35% under 13 — [PAP](https://www.pap.pl/aktualnosci/counter-strike-gaming-disorder-i-miliardy-dolarow-kto-rzadzi-swiatem-gier-0). Statista reports 39.7M under-13 DAU in Q2 2025, up from 32.4M a year earlier — [Statista](https://www.statista.com/statistics/1190309/daily-active-users-worldwide-roblox)
- Supercell's own job posting for Brawl Stars describes the goal as "the most accessible team game for mobile devices" and asks for "low-poly 3D character art with stylised textures" — [Supercell job posting via Hitmarker](https://hitmarker.net/jobs/supercell-3d-character-artist-brawl-stars-885364)
- Kenney's "Mini Characters" pack is tagged "disability" and includes wheelchairs, canes, a hearing aid and glasses. That makes inclusive soldier variety possible at no cost — [Kenney Mini Characters](https://kenney.nl/assets/mini-characters) (contents measured from the zip, see section 4)

### Inferences
- One stylised low-poly 3D style (Kenney, Quaternius or KayKit) can serve all levels, because it is the visual language of Minecraft, Roblox, Brawl Stars and Fortnite. Teens associate these games with "cool", not "babyish". The age-specific "skin" can then vary:
  - **Grades 1–3:** brighter, warmer palette, bouncy idle animations, a big-eyed cute monster, celebratory particles and sounds, very large text and buttons, minimal reading.
  - **Grades 4–6:** adventure framing (canyon, jungle, castle), a slightly less saturated palette, monsters that look "cool-scary" rather than cute, more humour.
  - **Grades 7–8:** cleaner and darker or neon palettes (city at night, sci-fi base), fewer and subtler effects, no "kid" wording, a sleeker UI. Monsters look like Brawl Stars or Fortnite bosses, not plush toys.
- Avoid labelling anything "for kids". NN/g's finding that kids reject content even one grade younger suggests the level-select screen should not visually tag levels 1–3 as "baby levels". A neutral world map, with environments that unlock, avoids that.
- Environments map naturally onto free kits: bridge and river (Kenney Nature Kit, KayKit Forest Nature Pack), canyon (nature or rock kits), city (Kenney City Kit, Quaternius Downtown City MegaKit, KayKit City Builder Bits), castle (Quaternius Medieval Village MegaKit, KayKit Dungeon), space or sci-fi (Quaternius Modular Sci-Fi MegaKit, KayKit Space Base Bits).

### Gaps
- I found no peer-reviewed study that directly compares the art-style preferences ("cute" vs "cool", realism) of 7-, 11- and 14-year-olds in games. The age-band guidance above rests on NN/g usability work and on the genre and art style of the popular titles, not on controlled aesthetic studies.
- I found no 2025–2026 Polish ranking of games by children's age. The best Polish title data (IQS) is from 2021.
- I found no first-party Supercell or Epic interview on art direction for young players.

## 2. Music by age, and background music during math

### Takeaway
Children's openness to "any" music fades early, mostly by about age 9, and adolescents use music as identity and peer signalling. Intense and contemporary genres peak in adolescence, so obviously "kiddy" chiptune will grate on grades 7–8. For concentration, the evidence is consistent: lyrics hurt and arousing or aggressive music hurts, especially on difficult tasks. Calm instrumental music is neutral to slightly helpful, and arithmetic is affected less than reading or memory. Recommendation: instrumental only during question gates, calmer and quieter while the child is solving, age-styled tracks, music on by default but at a low level, a style picker, and an easy music-off toggle that is separate from sound effects.

### Cited Findings
**Development of preferences**
- "Open-earedness" (Hargreaves): younger children are more open to music adults find unconventional. LeBlanc's version says this tolerance "declines sharply with moving into adolescence", rises again in adulthood and declines in old age (summaries found via search) — [Paderborn ESCOM paper](https://kw.uni-paderborn.de/fileadmin-kw/fakultaet/Institute/ibfm/Downloads/Musical_Preferences_Escom.pdf); [Cambridge BJME abstract](https://www.cambridge.org/core/journals/british-journal-of-music-education/article/abs/openearedness-hypothesis-and-the-development-of-agerelated-aesthetic-reactions-to-music-in-elementary-school-children/7562E2D2A54AE86D07F25DAB28A0BB1B)
- A Paderborn study of 591 children found that open-earedness for unfamiliar styles "declines gradually with increasing age" and that by age 9 at the latest it "has disappeared in most children" — [Paderborn ESCOM paper](https://kw.uni-paderborn.de/fileadmin-kw/fakultaet/Institute/ibfm/Downloads/Musical_Preferences_Escom.pdf)
- This partly conflicts with a Cambridge/BJME study of grades 1–4, which found a decline from grade 1 to grade 2 (age 7–8) that disappeared once classical music was excluded, and few outright rejections of unconventional styles — [BJME abstract](https://www.cambridge.org/core/journals/british-journal-of-music-education/article/abs/openearedness-hypothesis-and-the-development-of-agerelated-aesthetic-reactions-to-music-in-elementary-school-children/7562E2D2A54AE86D07F25DAB28A0BB1B)
- Bonneville-Roussy, Rentfrow, Xu & Potter (2013, Journal of Personality and Social Psychology), with more than 250,000 participants, found that preference for "Intense" music (punk, metal, rock) peaks in adolescence and declines in early adulthood. "Contemporary" (rap, electronic, pop) and Intense preferences decrease with age, while "Unpretentious" and "Sophisticated" preferences increase. Rentfrow: teenage years are "dominated by the need to establish identity, and music is a cheap, effective way to do this" — [University of Cambridge news](https://www.cam.ac.uk/research/news/the-musical-ages-of-modern-man-how-our-taste-in-music-changes-over-a-lifetime); [Roehampton record](https://pure.roehampton.ac.uk/portal/en/publications/music-through-the-ages-trends-in-musical-engagement-and-preferenc/)
- North, Hargreaves & O'Neill (2000), "The importance of music to adolescents", British Journal of Educational Psychology 70, 255–272. Secondary sources say it identified three motives: satisfying emotional needs, creating a social image, and enjoyment. An Irish replication found the emotional motive rated higher than the image motive, except for rock, where image dominated. (I could not read the original abstract.) — [DBS replication](https://esource.dbs.ie/items/e48ea9e7-c0ff-4622-8e57-5ff51e24026a); [UM Malta replication](https://www.um.edu.mt/library/oar/handle/123456789/85412)

**Background music and cognitive performance**
- Kämpfe, Sedlmeier & Renkewitz (2011), meta-analysis, Psychology of Music 39(4), 424–448. The overall effect of background music was about zero, because positive and negative effects cancel out. Music impaired reading, had a small negative effect on memory, and had positive effects on emotional reactions and sports performance. Tempo influenced the pace of activity — [SAGE abstract](https://journals.sagepub.com/doi/10.1177/0305735610376261); [full text PDF](https://Www.Gwern.net/doc/music/music-distraction/2011-kampfe.pdf)
- Hallam, Price & Katsarou (2002), Educational Studies 28(2), with children aged 10–12. Music perceived as calming and relaxing improved performance on an arithmetic task and a memory task compared with no music. Arousing, aggressive or unpleasant music disrupted memory performance and reduced reported altruism. The authors attribute the effects to arousal and mood — [Hallam et al. 2002 PDF](https://www.Gwern.net/doc/music/music-distraction/2002-hallam.pdf)
- Cheah, Wong, Spitzer & Coutinho (2022), Music & Science, systematic review of 95 articles (154 experiments). Background music generally harmed memory and language tasks, and music with lyrics tended to be worse than instrumental music. Background music was detrimental on difficult (not easy) tasks and for introverts (not extraverts). In most cases there was no effect, and only one positive effect (of instrumental music) was found. The review counts the direction of effects only (sign test), not their size — [Liverpool repository](https://livrepository.liverpool.ac.uk/3166444/)
- A 2023 study in the Journal of Cognition had college students do tasks in silence, with instrumental lo-fi hip-hop, or with lyrical music. Lyrics impaired verbal and visual memory and reading comprehension (d ≈ −0.3). Their effect on arithmetic (d = −0.19) was "not credible". Instrumental music neither helped nor hurt — [PMC10162369](https://pmc.ncbi.nlm.nih.gov/articles/PMC10162369/)
- Young adults with and without ADHD both prefer "relaxing, instrumental, familiar, and self-chosen" music during cognitive activities. This is self-report, not performance (search summary) — [Simply Psychology summary](https://www.simplypsychology.org/?p=77693)

### Inferences
- **Per age band:**
  - **Grades 1–3:** bright and playful, but sampled rather than square-wave: marimba or xylophone, glockenspiel, pizzicato strings, ukulele, light percussion, around 100–120 BPM, major keys. The current chiptune works here, but softer timbres will tire parents less.
  - **Grades 4–6:** "adventure" orchestral-lite (strings, brass stabs, taiko), funk or pop-rock instrumentals, more drive in the run sections.
  - **Grades 7–8:** genres peers respect: lo-fi hip-hop or chillhop, synthwave, EDM-lite, trap-style beats, rock riffs for boss fights. Always instrumental and never "cute". Calmer during gates; energetic only in the running and fighting phases.
- **Concentration:** use instrumental music only. During the gate or question phase, duck the music (for example by 6–10 dB) or switch to a calmer layer. Avoid aggressive, high-arousal tracks while the child is computing. This follows the effects of lyrics and difficulty in Cheah 2022 and the effects of arousal in Hallam 2002.
- **Defaults:** keep music quieter than sound effects (for example music at about 30–40% and effects at about 70–80%). Offer separate on/off toggles for music and for effects, a style picker ("Wesoła / Przygoda / Chill / Elektro"), and remember the choice. Default the style by level band, but let any child choose any style, since a 2nd grader may want "Elektro" and a 7th grader "Chill".
- Older users and adults dislike autoplaying sound (NN/g), which fits the iOS rule that sound may only start after a tap anyway (section 6).

### Gaps
- I found no study of background music specifically during math games for children aged 7–9, and none with ADHD children doing arithmetic.
- I did not read the full LeBlanc (1991) or Hargreaves (1982) papers. The ages are taken from secondary summaries.
- Vasilev et al. (2018), a meta-analysis on music and reading (g ≈ −0.19), appeared only in a search summary and was not verified.

## 3. 3D in the browser on iPhone: engine choice, glTF, budgets, crowds of 100–150 soldiers

### Takeaway
Three.js is the best fit for a game with no build step. It is MIT-licensed, the smallest of the three engines (about 190 KB gzipped for the core, measured), loads from a CDN or a vendored file with an import map, and has a first-party glTF/GLB loader. WebGL2 has worked on iOS Safari since 15.0, and WebGPU since iOS 26. The old WebKit bug that made instanced drawing slow on iPhone is fixed. For 150 soldiers, avoid 150 separate skinned meshes. Use one InstancedMesh, or a few, with shader-driven motion. Triangle counts are not the problem: a Kenney character is about 700–880 triangles (measured), so 150 of them is about 120k triangles.

### Cited Findings
**Engines (versions and licences as of 2026-10-20)**
- three.js: MIT licence ("Copyright © 2010-2026 three.js authors") — [three.js LICENSE](https://raw.githubusercontent.com/mrdoob/three.js/dev/LICENSE). Current npm version 0.186.1 (modified 2026-09-24) — [npm registry](https://www.npmjs.com/package/three)
- Babylon.js (@babylonjs/core): Apache-2.0, version 9.31.0 (2026-10-15) — [npm registry](https://www.npmjs.com/package/@babylonjs/core)
- PlayCanvas engine: MIT, version 2.23.3 (2026-10-20) — [npm registry](https://www.npmjs.com/package/playcanvas)
- Download sizes (measured from jsDelivr builds):
  - three.module.min.js: 383 KB raw / 87 KB gzip. It imports three.core.min.js: 406 KB raw / 101 KB gzip. Total ≈ 190 KB gzip.
  - GLTFLoader.js (unminified): 114 KB / 25 KB gzip.
  - Babylon UMD babylon.js 9.31.0: 8.4 MB raw / 1.8 MB gzip. The modular ES build can shrink this, but needs a bundler.
  - playcanvas.min.mjs 2.23.3: 2.5 MB raw / 639 KB gzip.
  - [jsDelivr three](https://cdn.jsdelivr.net/npm/three@0.186.1/build/), [jsDelivr babylonjs](https://cdn.jsdelivr.net/npm/babylonjs@9.31.0/), [jsDelivr playcanvas](https://cdn.jsdelivr.net/npm/playcanvas@2.23.3/build/)

**iOS Safari support**
- WebGL 2.0 has been fully supported in iOS Safari since 15.0 — [caniuse webgl2 data](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgl2.json)
- WebGPU is supported in iOS Safari 26.0 (before that only behind a flag from 17.4) — [caniuse webgpu data](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/webgpu.json)
- WebKit bug 218949, "WebGL instanced draw calls are very slow on iPhone 12 Pro" (2020), is RESOLVED FIXED. An engineer noted: "The enablement of ANGLE Metal backend on iPhone seems to fix the immediate performance issue here." — [WebKit Bugzilla 218949](https://bugs.webkit.org/show_bug.cgi?id=218949)

**Crowds and draw calls**
- A three.js forum case study (2026-02-19, anecdotal but detailed) renders "a massive animated crowd in a single draw call". All characters share one merged geometry in one InstancedMesh. A per-vertex ID lets the shader animate head, body and legs differently. Colours and flags are packed into instance attributes, and LOD happens in the vertex shader. Updates are spread across frames, and caching trigonometry "recovered ~25fps at scale" — [three.js forum](https://discourse.threejs.org/t/one-draw-call-massive-crowd-performance-engineering-in-three-js/89928)
- Rule-of-thumb draw-call targets circulating online are "< 200 desktop, < 50 mobile". These are not measured limits, and the source is a low-quality skill registry — [skills page (anecdotal)](https://skillselion.com/skills/ovachiever/droid-tings/threejs-graphics-optimizer)
- Each three.js Mesh produces at least one draw call per frame (practitioner guide, anecdotal) — [Digital Strategy Force](https://digitalstrategyforce.com/journal/how-do-you-optimize-threejs-performance-for-mobile-devices/)

**Real asset budgets (measured, Kenney Mini Characters 1.0, CC0)**
- 12 characters. Each GLB is 237–267 KB, has 690–876 triangles, 2 skins and 32 embedded animations (static, idle, walk, sprint, jump, fall, crouch, sit, drive, die, pick-up, emote-yes, …). Props (canes, wheelchairs, glasses) are 48–1,040 triangles, 6–88 KB. All 26 GLBs total 3.3 MB uncompressed (measured from [kenney_mini-characters.zip](https://kenney.nl/assets/mini-characters))

### Inferences
- **Engine:** Three.js. It can be added with `<script type="importmap">` pointing at a vendored `three.module.min.js` and `three.core.min.js`, about 190 KB gzip, with no build step. That keeps the "plain JS + GitHub Pages" architecture. Babylon and PlayCanvas are 3–10× heavier and lean towards bundlers or editors.
- **Crowd of 100–150 soldiers:** 150 skinned Kenney characters would mean at least 150 draw calls and 150 skeleton updates per frame. That is likely too much for mid-range iPhones. Better options:
  - (a) One InstancedMesh per soldier body type, with the walk, bob and arm swing done in the vertex shader. The soldiers are tiny on screen, so a simple sinusoidal limb wiggle reads well.
  - (b) A few skinned "hero" models near the camera, such as the leader and the monster, plus instanced simple soldiers behind them.
  - (c) Vertex animation textures, baked offline in the container with a script, for real walk cycles on instances.
- **Budget guess for a mid-range iPhone at 60 fps** (inference, not measured on device): keep draw calls under about 100, triangles on screen under about 200–300k, and textures as a single 1024² atlas per kit. Cap devicePixelRatio at about 2 and use simple Lambert or toon materials with one shadow-casting light, or fake blob shadows.
- **Environments as separate GLB "level kits"** loaded on demand (bridge, canyon, city, castle, space), each ideally under 1–2 MB. KayKit and Quaternius use a single gradient or atlas texture, which suits this (section 4).
- Keep the current 2D canvas renderer as a fallback in case WebGL context creation fails.

### Gaps
- I found no authoritative Apple or three.js published draw-call or triangle budget for specific iPhone models. On-device profiling (Safari Web Inspector over USB) is needed.
- I could not verify Low Power Mode frame-rate throttling of requestAnimationFrame on iOS from a primary source.
- I did not test instanced skinned meshes (BatchedMesh, or third-party libraries such as InstancedMesh2) on iOS.

## 4. Free 3D assets: exact licences, attribution, animated characters and monsters, formats

### Takeaway
Kenney (CC0) and KayKit's free tiers (CC0) are the cleanest choices: public domain, commercial use allowed, no attribution required. Both ship GLB or glTF with animations. Quaternius has many animated characters and monsters, but its licence page now shows a custom **"Quaternius Asset License (QAL) v1.0", last updated 8/28/2026**. It still allows free commercial use with no credit, but bans redistributing the assets as assets, while the FAQ and pack pages still say "CC0". Poly Pizza and OpenGameArt have mixed licences that must be checked per model. Keep a CREDITS file anyway.

### Cited Findings
**Kenney (kenney.nl)**
- "All game assets on the asset pages are public domain licensed (CC0)… You're free to use them, even in commercial projects… Attribution is not required." — [Kenney support](https://kenney.nl/support)
- City Kit (Commercial), Blaster Kit, Nature Kit and Mini Characters each show "License: Creative Commons CC0" on their asset pages — [City Kit Commercial](https://kenney.nl/assets/city-kit-commercial), [Blaster Kit](https://kenney.nl/assets/blaster-kit), [Nature Kit](https://kenney.nl/assets/nature-kit), [Mini Characters](https://kenney.nl/assets/mini-characters)
- Mini Characters 1.0 (released 2024) includes License.txt: "License: (Creative Commons Zero, CC0)… You can use this content for personal, educational, and commercial purposes. Support by crediting 'Kenney' or 'www.kenney.nl' (this is not a requirement)". The zip (2.4 MB) contains the models in FBX, GLB and OBJ+MTL (26 each), plus previews. The characters are animated (measured; see section 3) — [Mini Characters zip](https://kenney.nl/assets/mini-characters)
- Kenney audio: "Music Jingles" (85 files) and "Interface Sounds" (100 files), both CC0 — [Music Jingles](https://kenney.nl/assets/music-jingles), [Interface Sounds](https://kenney.nl/assets/interface-sounds)

**Quaternius (quaternius.com)**
- Licence page: "Quaternius Asset License (QAL) v1.0, Last updated: 8/28/2026. In short: You can use these assets, free of charge, in personal, educational, and commercial games and other projects, with no credit required. You just can't resell or redistribute the assets themselves as assets." Section 3a forbids redistributing the assets "as a standalone asset, asset pack, stock file, template… whether for free or for payment… regardless of how much the Assets have been modified". It "does not restrict distributing a completed Product". Section 7 says changes "will not apply retroactively… the version in effect at the time you obtained the Assets governs" — [Quaternius licence](https://quaternius.com/license.html)
- **Conflict:** the Quaternius FAQ still says "All models are under the CC0 License… These assets are licensed under CC0, allowing you to use them without giving credit, even for commercial purposes" — [Quaternius FAQ](https://quaternius.com/faq.html). The Ultimate Monsters pack page shows "License CC0", "Models 50, Animated" and formats FBX, OBJ, Blend and glTF: "This pack includes 50 fully animated monsters" — [Ultimate Monsters](https://quaternius.com/packs/ultimatemonsters.html)
- Packs relevant to this game (names from the site index):
  - Animated characters: Animated Men/Women Packs, RPG Character Pack, Animated Knight, Robot, Alien and Zombie Packs, Ultimate Animated Character Pack, Ultimate Modular Men/Women.
  - Monsters: Ultimate Monsters, Cute Animated Monsters Pack, Animated Monster Pack, Easy Enemy Pack, Animated Dinosaur Pack, Bestiary – Dungeon Monsters Kit.
  - Environments: Downtown City MegaKit, Stylized Nature MegaKit, Medieval Village MegaKit, Modular Sci-Fi MegaKit, Ultimate Modular Ruins, Ultimate Space Kit.
  - [Quaternius index](https://quaternius.com/)
- FAQ: "Most packs are textured using an Atlas Texture"; the models can be edited in Blender (.blend or FBX) — [Quaternius FAQ](https://quaternius.com/faq.html)

**KayKit (Kay Lousberg)**
- City Builder Bits: "32+ Low poly optimized 3D models, suitable for all ranges of games, including mobile. Textured using a single gradient atlas texture (1024x1024) that can be downsampled up to 128x128… Free for personal and commercial use, no attribution required. (CC0 Licensed). Included files are .OBJ, .FBX and .GLTF" — [City Builder Bits](https://kaylousberg.com/game-assets/city-builder-bits)
- Adventurers Character Pack 1.0 LICENSE.txt (13/03/2023): "License: (Creative Commons Zero, CC0)… free to use in personal, educational and commercial projects… crediting Kay Lousberg… (this is not mandatory)" — [GitHub LICENSE](https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/main/LICENSE.txt)
- The characters are "fully rigged and animated". Adventurers has 5 free characters (+3 in the paid EXTRA tier), and Skeletons has 4 (+2 EXTRA) with "90+ animations". A separate Character Animations pack provides humanoid animation sets for Rig_Medium and Rig_Large, retargetable to other humanoids. Forest Nature Pack: "1588 low poly optimized models… CC0 Licensed" — [Adventurers](https://kaylousberg.com/game-assets/characters-adventurers), [Skeletons](https://kaylousberg.com/game-assets/characters-skeletons), [Character Animations](https://kaylousberg.com/game-assets/character-animations), [Forest Nature Pack](https://kaylousberg.com/game-assets/forest-nature-pack)
- Other packs: Platformer Pack, Dungeon Remastered, Medieval Hexagon, Space Base Bits, Prototype Bits, Block Bits, Halloween Bits and more — [KayKit index](https://kaylousberg.com/game-assets)

**OpenGameArt**
- "Yes, you can use any of the art submitted to this site. Even in commercial projects. Just be sure to adhere to the license terms." Suggested credit: "[asset name] by [author name] licensed [license(s)]: [asset url]". Some works list several licences, and you pick one — [OGA FAQ](https://opengameart.org/content/faq)
- The site's advanced search can filter by type = Music and licence = CC0. Results include "Battle Theme A", "Town Theme RPG", "NES Shooter Music (5 tracks, 3 jingles)", "Menu Music", "Fast fight / battle music" and a collection "Over 2500 Tracks". Licences must still be checked on each page — [OGA search: music + CC0](https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=12&field_art_licenses_tid%5B%5D=4&sort_by=count&sort_order=DESC)

### Inferences
- **Recommended stack:**
  - Kenney for soldiers (Mini Characters), props, city and nature kits, blasters and UI sounds.
  - KayKit for nature, city and dungeon environments plus extra characters.
  - Quaternius for monsters (Ultimate Monsters, Cute Animated Monsters): cute monsters for grades 1–3, scarier ones for grades 7–8.
  - All three can be used commercially without credit, but a CREDITS screen is good practice and costs nothing.
- **Quaternius QAL nuance:** the game itself can ship commercially. But the GitHub repo is public, so committing raw Quaternius GLB files there could be read as "redistributing the assets" under QAL §3a. It is safer to keep assets bundled or converted inside the game, or prefer pack versions obtained while they were labelled CC0 (record the download date). This is my reading, not legal advice.
- All three use one atlas or gradient texture per kit, which suits mobile: few materials and few draw calls.

### Gaps
- **Poly Pizza:** poly.pizza/faq returned HTTP 403 (a Cloudflare challenge), so I could not verify its licence wording. From prior knowledge (unverified this session), it hosts a mix of CC0 and CC-BY 3.0 models, many from the Google Poly archive. CC-BY models need attribution, so each model's licence must be checked.
- Kenney pack pages do not list formats in the HTML. I verified formats only for Mini Characters (FBX, GLB, OBJ). Other Kenney 3D kits likely follow the same pattern, but this is unverified.
- I did not verify which Quaternius packs were released after 2026-08-28 and are therefore covered by QAL rather than CC0.

## 5. Better music without a human composer: libraries, MIDI + SoundFont rendering, Tone.js samples, AI generators, iOS formats

### Takeaway
The most reliable legal path is to compose in code: write MIDI programmatically (melody, bass, drums, per-age styles), render it offline in the container with **FluidSynth plus FluidR3_GM (MIT)** or GeneralUser GS (permissive), then encode with ffmpeg to **AAC/M4A (with an MP3 fallback)**. fluidsynth, fluid-soundfont-gm and timidity are installable via apt here, and ffmpeg 6.1.1 with aac, libmp3lame, libopus and libvorbis encoders is already present. CC0 tracks from OpenGameArt and Kenney can fill gaps. Kevin MacLeod tracks (CC BY 4.0) work with a credit. Pixabay is usable but non-CC0 with a custom licence, and FreePD has shut down. AI generators are hazardous: MusicGen weights are non-commercial, Suno's free tier is non-commercial, and only paid Suno outputs are assigned, with no warranty. Open models like ACE-Step (Apache-2.0 for v1, MIT for 1.5) are permissive but need a GPU.

### Cited Findings
**Royalty-free libraries**
- **FreePD.com is closed:** "After 17 years of sharing… Public Domain music… we have officially taken the service offline… [freepd.com] is now permanently closed." — [freepd.com](https://freepd.com/)
- **Incompetech (Kevin MacLeod):**
  - The "Creative Commons — Free" option needs no payment but "requires that you credit the music". The generated credit reads "Licensed under Creative Commons: By Attribution 4.0".
  - The paid "Standard License" is "for projects where attribution is not wanted or is impossible", paid through PayPal, up to 18 pieces per form.
  - [incompetech licences](https://incompetech.com/music/royalty-free/licenses/)
- **Pixabay** (Content License Summary plus Terms, last updated Nov 18, 2024):
  - Use is free, including commercially; credit is not required; modification is allowed.
  - Audio may not be sold or distributed "on a Standalone basis" (where "no creative effort has been applied… and it remains in substantially the same form"). Combining it into a new work is fine.
  - Only content with a "Published date" before January 9, 2019 is CC0.
  - The user must check third-party rights in "audio or video samples".
  - There are no music-specific clauses about apps or games.
  - [Pixabay licence summary](https://pixabay.com/service/license-summary/), [Pixabay terms](https://pixabay.com/service/terms/)
- **Free Music Archive:** each track carries its own CC licence. BY-NC forbids use "primarily intended for commercial advantage or monetary compensation", and BY-ND forbids derivatives; "Syncing a track to video/moving images constitutes a derivative work" — [FMA licence guide](https://freemusicarchive.org/License_Guide)
- **OpenGameArt and Kenney CC0 audio:** see section 4.

**MIDI → audio rendering with General MIDI SoundFonts**
- **FluidR3_GM** (Debian package fluid-soundfont), Copyright 2000–2002, 2008 Frank Wen and 2008 Toby Smithe. "License: MIT" — [Debian copyright file](https://metadata.ftp-master.debian.org/changelogs/main/f/fluid-soundfont/unstable_copyright)
- **GeneralUser GS v2.0.3 (License v2.0):** "You may use GeneralUser GS without restriction for your own music creation, private or commercial… feel free to use it in your software projects, and to modify". The samples "allow full use in music production, including the ability to make profit". Caveat from the author: "I cannot be 100% sure where all of the samples originated… This uncertainty may concern you if you intend to use GeneralUser GS in a commercial software product", although he has "never received any complaint" since 2000 — [GeneralUser GS LICENSE](https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main/documentation/LICENSE.txt)
- **MuseScore_General.sf3:** the MuseScore handbook says it is released under the MIT licence and credits S. Christian Collins. It has shipped with MuseScore since 2.2 and is a GM set with over 128 instruments and drum kits. (From a search summary; the licence file on the OSUOSL mirror failed TLS or returned 404.) — [MuseScore handbook](https://musescore.org/en/handbook/soundfonts)
- **Container check (measured):**
  - apt candidates: fluidsynth 2.3.4-1build3, fluid-soundfont-gm 3.1-5.3 and timidity 2.14.0-8.2ubuntu1.
  - ffmpeg 7:6.1.1 is installed, with encoders aac (native), libmp3lame, libopus, opus, libvorbis and flac.
  - Node 22 and npm reach the registry.
  - [local apt/ffmpeg output; no URL]

**Web Audio libraries and sampled instruments (versions and licences from the npm registry, 2026-10-20)**
- Tone.js 15.1.22, MIT. The jsDelivr build Tone.js is 337 KB raw / 77 KB gzip (measured) — [npm tone](https://www.npmjs.com/package/tone)
- smplr 1.1.0, MIT (sampled instruments and SoundFont player) — [npm smplr](https://www.npmjs.com/package/smplr). spessasynth_lib 4.3.14, Apache-2.0 (in-browser SF2/SF3 MIDI synth) — [npm spessasynth_lib](https://www.npmjs.com/package/spessasynth_lib). js-synthesizer 1.13.0, BSD-3-Clause (FluidSynth compiled to WebAssembly) — [npm js-synthesizer](https://www.npmjs.com/package/js-synthesizer). soundfont-player 0.12.0, MIT, last modified 2022 (stale) — [npm soundfont-player](https://www.npmjs.com/package/soundfont-player)
- **tonejs-instruments** (nbrosowsky): "These instrument samples come from a variety of public domain sources". Sources listed per instrument:
  - VSO2 (VSCO 2): piano, strings, brass, woodwinds, harp, organ, xylophone.
  - Karoryfer: bass, electric guitar, sax.
  - University of Iowa: acoustic guitar.
  - Freesound packs: cello, nylon guitar, harmonium.
  - Files default to .mp3 with .ogg as a fallback.
  - The repo's own code licence was not confirmed (no LICENSE file at the expected path).
  - [README](https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/README.md), [sample-source-info.txt](https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/sample-source-info.txt)

**AI music generators: licensing**
- Meta MusicGen/AudioCraft model weights: "Attribution-NonCommercial 4.0 International" (CC BY-NC 4.0). Unusable if the game is ever sold or monetised — [audiocraft LICENSE_weights](https://raw.githubusercontent.com/facebookresearch/audiocraft/main/LICENSE_weights)
- Suno Terms (effective September 3, 2026; revised August 10, 2026):
  - Free and basic users "will only use such Outputs for your lawful, personal and non-commercial purposes".
  - Paid users: Suno "hereby assigns to you all of its right, title and interest in and to any Output owned by Suno", but "makes no representation or warranty to you that any copyright will vest in any Output". Commercial use is allowed only with "a permitted download".
  - Remixes are always non-commercial.
  - [Suno terms](https://suno.com/terms)
- ACE-Step (open music-generation model): v1 repo LICENSE is Apache 2.0, and the Hugging Face model ACE-Step-v1-3.5B is tagged apache-2.0. ACE-Step 1.5 repo LICENSE is MIT ("Copyright (c) 2026 ACEStep"), and the Hugging Face model Ace-Step1.5 is tagged mit (lastModified 2026-02-03) — [ACE-Step LICENSE](https://raw.githubusercontent.com/ace-step/ACE-Step/main/LICENSE), [ACE-Step-1.5 LICENSE](https://raw.githubusercontent.com/ace-step/ACE-Step-1.5/main/LICENSE), [HF ACE-Step-v1-3.5B](https://huggingface.co/ACE-Step/ACE-Step-v1-3.5B)
- Stable Audio Open 1.0 is a gated model with licence "other" (Stability AI's own licence); the terms were not readable without login — [HF stable-audio-open-1.0](https://huggingface.co/stabilityai/stable-audio-open-1.0)

**Audio formats on iPhone Safari (caniuse data; `<audio>` element support)**
- AAC: supported since iOS 4. MP3: supported since iOS 4 — [caniuse aac](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/aac.json), [caniuse mp3](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/mp3.json)
- Ogg Vorbis: full support only from iOS Safari 18.4. iOS 17.4–18.3 "supports the Vorbis audio codec, but not the Ogg container" — [caniuse ogg-vorbis](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/ogg-vorbis.json)
- Opus: full from iOS 18.4. iOS 17.4–18.3 only in a WebM container (17.4 has a known regression). iOS 11+ only in a CAF container at constant bitrate — [caniuse opus](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/opus.json)
- Web Audio API: unprefixed since iOS Safari 14.5 (prefixed since 6) — [caniuse audio-api](https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/audio-api.json)

### Inferences
- **Pipeline the AI developer can run unattended:**
  1. Write a Node or Python script that generates MIDI per style (patterns, chord progressions, drum grooves; seeded variations).
  2. Render it: `fluidsynth -ni FluidR3_GM.sf2 song.mid -F song.wav -r 44100`.
  3. Normalise loudness: `ffmpeg -af loudnorm`.
  4. Encode: `ffmpeg -c:a aac -b:a 96k song.m4a`, plus an MP3 fallback.
  5. Make seamless loops by cutting on bar boundaries, and play them in Web Audio with `loop = true` on an AudioBuffer for gapless looping.
- **Size estimate** (arithmetic): a 60–90 s loop at 96 kbps AAC is about 0.7–1.1 MB. 3–4 styles × 2 intensities (calm gate layer / active run layer) ≈ 6–9 MB total, which is fine for a PWA cache.
- AAC/M4A should be the primary format, since it works on every iOS version. Ogg/Opus only became fully reliable on iOS 18.4+, and many children's hand-me-down iPhones run older iOS.
- Real-time alternative: Tone.js (77 KB gz) with a small set of sampled instruments (for example 6–10 samples per instrument, about 100–300 KB each in MP3). Fine for SFX and stingers, but heavier on CPU and slower to start than pre-rendered loops.
- The current oscillator synth can stay as the "Retro" style option for players who like it.
- **AI generators:** avoid MusicGen (non-commercial). Avoid the Suno free tier, and even paid Suno carries legal-uncertainty risk. ACE-Step is permissive but needs a CUDA GPU, which this container probably lacks. If used, keep generation logs and prompts.

### Gaps
- caniuse covers `<audio>` playback. I did not verify Web Audio `decodeAudioData` support for Ogg/Opus on iOS 17–18.3 separately.
- The MuseScore_General licence file itself was not fetched (TLS error / 404 on the mirror); MIT comes from the handbook via a search summary.
- I did not check Udio's terms.
- The Pixabay Content ID / "copyright claim" behaviour for music on YouTube is not covered by Pixabay's terms. It is not relevant to an app, but matters for promotional videos.
- I did not verify GPU availability or whether ACE-Step can run CPU-only.

## 6. iPhone audio rules, storage and App Store constraints

### Takeaway
On iOS, sound may start only after a user gesture, so create or resume the AudioContext inside the first tap (for example a "Start" button). Web Audio follows the **ringer/silent switch**: by default an AudioContext gets the "ambient" audio-session type and is silent when the phone is on mute, while `<audio>` elements count as "playback" and are not muted. Safari 16.4+ exposes `navigator.audioSession.type`, so the game can choose. For a PWA, Safari 17+ gives a browser origin up to 60% of the disk (15% in other apps such as a WKWebView wrapper), which is plenty for cached assets. An App Store wrapper must be more than "a repackaged website", and Kids Category rules forbid third-party analytics and ads.

### Cited Findings
- **Autoplay:** with the Web Audio API, a site can start sound "using the start() method on a source node linked to the AudioContext. Doing so outside the context of handling a user input event is subject to autoplay rules." — [MDN Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)
- **Audio Session API:** `navigator.audioSession.type` was added in Safari 16.4, with iOS Safari mirroring desktop. The `state` property is not supported in Safari. Chrome does not support the API, and Firefox has it only in preview — [MDN browser-compat-data AudioSession](https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/AudioSession.json); [W3C Audio Session spec](https://www.w3.org/TR/audio-session/)
- **Session types** (MDN):
  - "auto": the default.
  - "playback": "an exclusive type that will pause other playback audio on the device".
  - "ambient": "can mix with other types of audio".
  - "transient" / "transient-solo": short sounds that duck other audio, and prompts that play exclusively.
  - "play-and-record".
  - In auto mode, "an AudioContext defaults to 'ambient'", "an HTMLMediaElement (such as `<audio>` or `<video>`) defaults to 'playback'", and the page takes the highest-priority active type.
  - [MDN AudioSession.type](https://developer.mozilla.org/docs/Web/API/AudioSession/type); [MDN Audio Session API](https://developer.mozilla.org/en-US/docs/Web/API/Audio_Session_API)
- **Silent switch:** WebKit bug 237322 is titled "webaudio api is muted when the iOS ringer is muted". "Audio and video element are on the media channel, where webaudio seems to be on the default/ringer channel of iOS." — [WebKit Bugzilla 237322](https://bugs.webkit.org/show_bug.cgi?id=237322)
- In WebKit bug 264473, setting "transient" maps to AVAudioSession's ambient category: "If the silent switch is on, video is muted, otherwise it is not." Other WebKit threads report that setting `navigator.audioSession.type = 'playback'` keeps Web Audio audible with the switch on (search summary). — [WebKit Bugzilla 264473](https://bugs.webkit.org/show_bug.cgi?id=264473); [WebKit Bugzilla 251532](https://bugs.webkit.org/show_bug.cgi?id=251532)
- **Storage quota** (WebKit, from Safari 17 / iOS 17): "For a browser app, the origin quota is up to 60% of the total disk space. For other apps, the origin quota is up to 15% of the total disk space." Cross-origin frames get 10% of the main frame's quota. The policy covers localStorage, the Cache API, IndexedDB and Service Workers — [WebKit blog: Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
- **App Store Review Guidelines** (last updated October 16, 2026):
  - 4.2: "Your app should include features, content, and UI that elevate it beyond a repackaged website. If your app is not particularly useful, unique, or 'app-like,' it doesn't belong on the App Store."
  - 1.3 Kids Category: "Apps in the Kids Category should not include third-party analytics or third-party advertising"; such apps "may not send personally identifiable information or device information to third parties".
  - [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- Anecdotal: developers report 4.2 rejections of web wrappers. Vendor blogs (which have an interest in selling services) say reviewers test offline mode, and that games fare better than utility apps if the assets are bundled locally — [Apple Developer Forums thread](https://developer.apple.com/forums/thread/93116); [MobiLoud blog](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper)

### Inferences
- **Unlock pattern:** on the first `pointerup`/`touchend` on the start screen, create a single AudioContext and call `resume()`. Optionally play a silent buffer. Then start the music. Re-`resume()` on `visibilitychange` and after phone-call interruptions.
- **Silent-switch policy (product decision):**
  - Option A (respectful default): keep "ambient". The game is silent when the phone is on mute, and the player's own Spotify can keep playing alongside. Show a small hint, "Telefon wyciszony? Przełącz przełącznik z boku", if the player turned music on but hears nothing. Detection is not reliable, so keep the hint passive.
  - Option B: set `navigator.audioSession.type = "playback"` (with feature detection) when the player explicitly enables music. Sound then plays despite the silent switch, but other apps' music is paused.
  - A reasonable default for a children's game used in class or on the bus is A, with B as a setting.
- Use AAC .m4a for music, decoded into AudioBuffers (or a single `<audio loop>` element for long music, which also escapes the ringer channel). Use short M4A/MP3 or synthesised SFX via Web Audio.
- **PWA:** a service worker can cache the 3D kits and music, about 10–30 MB in total, which is well within quota. That keeps GitHub Pages hosting and makes the game work offline, which also matters for any future App Store wrapper (the offline test, 4.2).
- **Future App Store:** a wrapper (for example Capacitor or a plain WKWebView) should bundle all assets locally, work offline and add some native value (haptics, Game Center, parental gate). Avoid third-party analytics and ads if targeting the Kids Category. Note the WKWebView storage quota of 15%.

### Gaps
- I found no primary Apple or WebKit documentation that states the current default (2026) silent-switch behaviour for Web Audio with `audioSession.type = "auto"`. MDN's "AudioContext defaults to ambient" plus the bug reports point to "muted on silent", but this should be tested on a real device.
- I could not confirm whether home-screen PWAs on iOS count as a "browser app" (60%) or as "other apps" (15%) under the WebKit quota.
- I found no authoritative iOS Safari per-tab memory limit for WebGL. Anecdotal reports exist, but none were verified.
