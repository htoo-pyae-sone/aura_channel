# Entry Guide (filling an anime `.md` from scratch)

How agents build a complete entry: frontmatter + synopsis. The ONLY part
agents never touch is `episodes[].downloads[].link` — CODEs come from the
owner's Telegram bot uploads, filled in later.

## 1. Research first (2+ sources)

Order: official anime site → AniList → MyAnimeList → ANN / Wikipedia.
Confirm: official English title, Japanese title (exact script),
premiere year, type (Movie/Series), status, genres (pick 2–4 from
AniList), episode counts per season, sequel status. If sources disagree,
go with AniList/official and note it in the sources comment.

## 2. Frontmatter rules

- `title`: official English title, exact spelling/capitalization.
- `titleNative`: exact Japanese script — copy, never transliterate by hand.
- `year`: premiere year (first season / film), 4 digits.
- `status`: top-level = latest season's status
  (`Ongoing` / `Completed` / `Upcoming`).
- `rating`: source score rounded to 1 decimal (e.g. MAL 8.16 → `8.2`).
  Never invent one — no score found means omit the field.
- `totalEpisodes`: number (`170`), `"Unknown"`, or `"170+"`-style —
  nothing else passes the schema.
- `seasons`: one block per season (`season`, optional `title`,
  per-season `status`, per-season `totalEpisodes`); single-season titles
  use top-level `episodes:` instead. Leave every `episodes:` list as
  `[]` — the owner fills CODEs later.
- `aiAssisted: true` on anything you drafted.
- Filename slug: kebab-case English title
  (`Black Clover` → `black-clover.md`).

## 3. Poster

- Official key visual, portrait 2:3, no watermarks/fansub logos.
- Verify before using: fetch the URL, require HTTP 200 + an image
  content-type. Dead on arrival = don't use it.
- Hotlinked art belongs to its studio — official promo art is the norm
  for catalog sites, but never re-upload it as your own and swap it out
  if asked. When unsure, use
  `https://picsum.photos/seed/<slug>/400/600` as a stand-in and flag it.

## 4. Synopsis (MY voice)

Scope: synopsis/body ONLY beyond the fields above. Rules: meaning over
word-for-word; keep `EP`, `Season`, `Download`, `Link`, `CODE`,
`Telegram`, `Bot`, `VPN`, `Saved Messages`, commands, `aniXsubs`,
proper nouns in English; Arabic numerals; loanwords this site's way
(ဒေါင်းလုတ် / လင့်ခ် / ဇာတ်ကား / အပိုင်း / ဘာသာပြန်); placeholders and
markup sacred; UI strings short. Pattern: hook → spoiler-free setup →
optional comparison anchor. Paraphrase sources, never copy sentences.

First paragraph carries the page: only the 1st paragraph shows before
the `...` expand, so it must hook AND summarize alone (who + the deal,
no cliffhangers, no "read more to find out"). Everything after it is
detail for expanders.

## Worked examples (from this repo)

## Audience

Myanmar anime fans, casual reading level. They live inside Telegram and
already think in mixed Myanmar-English (`Download`, `Link`, `EP`, `VPN`
are everyday words — do not force-pure-Myanmar them).

## Core rules

0. **Scope: synopsis/body ONLY — never touch anything else.** Frontmatter
   is data, not prose: `title`, `titleNative`, `poster`, `genres`,
   `type`, `year`, `status`, `rating`, `totalEpisodes`, `episodes`,
   `seasons`, `link` CODEs, dates, numbers — all stay byte-for-byte as
   the owner wrote them. No rewording titles, no "improving" genres, no
   inventing ratings. If a field looks wrong, flag it, don't fix it.
1. **Meaning over word-for-word.** Short, friendly sentences. If the
   English needs 3 clauses, the Myanmar may use 2.
2. **Keep these in English** (fans expect them, translation confuses):
   `EP`, `Season`, `Download`, `Link`, `CODE`, `Telegram`, `Bot`, `VPN`,
   `Saved Messages`, bot commands (`/start`, `/lang`), the brand
   `aniXsubs`, proper nouns (titles, names).
3. **Arabic numerals always.** `EP 12`, `မိနစ် ၃၀` is wrong — write
   `မိနစ် 30`. Never Myanmar digits in UI; synopsis may use either but
   prefer Arabic for consistency.
4. **Loanwords, spelled this site's way:** ဒေါင်းလုတ် (download),
   လင့်ခ် (link), ဇာတ်ကား (title/episode video), အပိုင်း (episode),
   ဘာသာပြန် (translate/subtitle), ဗီဒီယိုဖိုင် (video file).
5. **Placeholders and markup are sacred.** `{delay}`, `{CODE}`, `[CODE]`,
   `<code>…</code>`, `<b>…</b>` stay exactly where they are — translate
   around them, never inside them.
6. **UI strings stay short.** Buttons/badges/notices get the plain
   version, not the polite long version.

## Worked examples (from this repo)

EN: `Tap a download link on the website and I will send the episode here.`
MY: `ဝက်ဘ်ဆိုက်က Download Link ကို နှိပ်လိုက်ရင် ဒီမှာ ဇာတ်ကားပို့ပေးပါမယ်။`
→ `Download Link` kept, one flowing sentence.

EN: `This file will be auto-deleted in {delay}. Forward it to Saved Messages or download it now.`
MY: `ဒီဖိုင်က {delay} အကြာမှာ အလိုအလျောက် ပျက်သွားပါမယ်။ Saved Messages ကို forward လုပ်ထားပါ (သို့) အခု ဒေါင်းလုတ်ဆွဲထားပါ။`
→ placeholder untouched, `Saved Messages`/`forward` kept in English,
`ဒေါင်းလုတ်` per glossary.

EN: `Episode 99 isn't available yet — this title lists 24 episodes so far.`
MY pattern: `Episode {n} မထွက်သေးပါ — ဒီကားမှာ အခုထိ {total} ပိုင်း ရှိပါတယ်။`
→ numbers stay Arabic, `Episode` kept.

## Synopsis pattern

1. Hook line first (the feeling, 1–2 sentences).
2. Setup without spoilers (who/where, plain words).
3. One comparison anchor fans know (`A Silent Voice…` style) only if
   it genuinely fits — never force it.
4. Keep English title words (`Season 2`, `EP 0`, `1080p`) inline.

## Writing a synopsis from a blank body

When the `.md` body is empty and you're asked to write the synopsis:
research FIRST, never invent plot facts.

1. **Gather from 2+ sources.** Good sources, in order: the official
   anime site → AniList → MyAnimeList → Anime News Network / Wikipedia.
   Confirm premise, setting, main characters, episode count, year.
   If sources disagree, go with AniList/official and say so.
2. **Premise only, no spoilers.** Setup material (who/where/the deal)
   — nothing past the first cour's setup. Never lift sentences; always
   paraphrase. Short quoted phrases at most.
3. **Write MY per the pattern above** (hook → setup → optional anchor),
   keep English terms (`Season 2`, `EP 1`, studio names) inline.
4. **Leave a paper trail.** End the body with an HTML comment listing
   what you checked, e.g.
   `<!-- Sources: anilist.co/anime/21, myanimelist.net/anime/21 -->`
   so the owner can verify.
5. **Frontmatter stays untouched** (rule 0) — except setting
   `aiAssisted: true`, since you drafted it.

## 5. Episodes: one live sample per season, owner pastes CODEs

Every entry ships with ONE live sample episode per season using
`link: "PASTE-CODE-HERE"` (passes the schema, renders one row). Filling
= duplicate the block, set `ep`/`title`/`size`, paste the real bot CODE.
Flat (no seasons) entries get the same single sample under top-level
`episodes:`.

## Checklist before committing

- [ ] Facts checked on 2+ sources, disagreements noted?
- [ ] Frontmatter complete, episodes lists left `[]` for the owner?
- [ ] Poster fetched OK (or flagged as stand-in)?
- [ ] `aiAssisted: true` set?
- [ ] Sources HTML comment appended to the body?
- [ ] Only the synopsis/body changed on existing entries — old frontmatter untouched?
- [ ] Numerals Arabic, glossary spellings match, reads aloud like a person?
