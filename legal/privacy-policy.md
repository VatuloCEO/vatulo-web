# Vatulo Privacy Policy

**Last updated: 30 August 2026**

> **DRAFT — NOT YET REVIEWED BY A LAWYER.**
> Every factual claim below was re-checked against the code and database schema
> on 30 August 2026 and is accurate as of that date. The 23 August version had
> drifted: it described gender as a binary choice, and predated the app
> recording swipe outcomes and reading time at all.
>
> The *legal* framing has not been reviewed. Vatulo operates from Quebec, which
> means Quebec's Law 25 applies in addition to PIPEDA, and Law 25 has specific obligations — a designated privacy officer,
> breach reporting, and consent rules — that a lawyer should confirm before this
> is published. Do not ship this as-is without that review.

Vatulo helps people find house parties and decide who comes to theirs. This
policy explains what we collect, why, who else can see it, and how to get rid of
it.

## Who we are

Vatulo, Montreal, Quebec, Canada.
Contact: **vatulosupport@gmail.com**

## What we collect

**Things you tell us when you sign up**

- Email address, and a password (stored only as a hash — we never see it).
- First name and username.
- Date of birth. Vatulo is 18+ and we use this to enforce that and to show your
  age on your profile.
- Gender. Required, and one of woman, man, non-binary, or prefer not to say. It
  is shown to other people only as part of a party's aggregate ratio, never
  attached to you individually, and never when fewer than five guests are on a
  list.
- At least one photo.

**Things you add later**

Bio, interests, music preferences, vibe tags, profile prompts, university and
programme, further photos, and optionally a phone number.

**Things that happen as you use Vatulo**

- Parties you host, apply to, are accepted to, commit to, or check into.
- **Every party you swipe on, and which way.** Passing, saving and applying are
  all recorded and kept, so a party you have answered does not come back. Hosts
  never see that you passed on theirs.
- **How you looked at it.** For each card, roughly how long it was on screen and
  whether you opened the full party page. We use this for one thing: if several
  applications in a row are sent without reading anything, the app asks you to
  open a party before applying again. It is not shown to hosts and it does not
  affect whether you are accepted.
- Messages and photos you send, and who you send them to.
- Reviews you leave and reports you make.
- Friend requests, friendships, people you have removed from your Crowd, and
  people you have blocked.
- A device push token, so we can notify you, and which platform it is for.
- Security records: rate-limit events and risk events, used to detect abuse.

**Addresses.** A party's exact address is given to you only after you commit to
attending, and only once the host's chosen release time has arrived — some hosts
release on commitment, others hold it until a day, three hours, or an hour
before the party starts. Hosts supply the address; we store it and release it
under those two conditions and no other.

## Location

**Your location never leaves your phone.**

If you allow it, Vatulo reads your device's location and uses it *on the device*
to work out how far away a party is. That calculation happens locally. We do not
transmit, store, or log your coordinates, and there is no column anywhere in our
database that holds a user's position.

The one address we do store is the one a host types in for their own party, so
it can be given to guests who commit — described under "Addresses" above. That
is a place, supplied deliberately; it is not a record of where anybody is.

Parties themselves carry a deliberately coarse published position — a
neighbourhood-level point, not the address — which is what distances are
measured against.

You can decline location entirely. The app works without it; you just will not
see distances.

## What we do with it

- Run the product: show you parties, let hosts choose guests, deliver messages.
- Keep people safe: enforce 18+, apply rate limits, investigate reports, and act
  on moderation decisions.
- Send you notifications you have not turned off.
- Send transactional email — confirming your address, resetting your password.

We do **not** sell your personal information, and we do not use it for
advertising or share it with advertisers.

## Who else can see what

- **Other users** see your profile as your privacy settings allow: name,
  username, age, photos, bio, interests, prompts, reputation and badges. You
  control the audience for individual fields in the app.
- **Hosts** of parties you apply to see your profile and how many friends you
  have in common.
- **The size of your Crowd** appears on your profile, and tapping it opens the
  list. Both follow the audience you choose for your Crowd in privacy settings —
  set it to nobody and the number is withheld as well as the names, because a
  count is itself a fact about you.
- **Nobody** sees your gender individually. It appears only inside a party's
  aggregate ratio, and only when at least five guests are on the list — below
  that the ratio is withheld entirely, because a ratio over a handful of people
  identifies them.
- **Nobody** sees your email address, your phone number, or your date of birth.
  Other people see your age, not your birthday.

## Service providers

We use a small number of processors, each of which handles data on our behalf:

| Provider | What it handles |
| --- | --- |
| Supabase | Database, authentication, file storage. Hosted in Canada (ca-central-1). |
| Expo | Push notification delivery. Receives a device push token and the notification text. |
| Resend | Transactional email — confirmations and password resets. Receives your email address. |
| Apple / Google | App distribution, and the push transport underneath Expo. |

## Deleting your account

You can delete your account from Settings, in the app. It is permanent.

When you do, we erase your name, username, photos, bio, interests, vibe tags,
music preferences, prompts, university, programme, phone number, gender and
avatar, replace your email with an unusable placeholder, end every session, and
delete your push tokens, devices, filters, saved invite lists, friendships,
blocks, swipes and notifications. Parties you were hosting that had not happened yet are cancelled,
and your guests are told. Messages you sent become tombstones so the thread
still reads sensibly for the other person, but the words and any images are
gone.

**What survives, and why.** Reports made about you, moderation decisions, and
reviews other people wrote stay. Those are other people's accounts of what
happened, and deleting your account should not erase somebody else's record of
being harmed. They are retained under our legitimate interest in keeping the
community safe.

## Your rights

You can access, correct, or delete your personal information, withdraw consent,
and — under Quebec's Law 25 — request that we stop disclosing it or de-index it.
Most of this you can do yourself in the app; for anything else, write to
**vatulosupport@gmail.com** and we will respond within 30 days.

## Children

Vatulo is for adults. You must be 18 or older. We do not knowingly collect
information from anyone under 18, and we delete accounts we find.

## Security

Every table in our database is protected by row-level security, so what you are
allowed to see is enforced by the database itself rather than by the app asking
nicely. Passwords are hashed. Traffic is encrypted in transit. Exact addresses
are released only against a confirmed commitment.

No system is perfect. If we discover a breach affecting you, we will notify you
and the Commission d'accès à l'information as Law 25 requires.

## Changes

If we change this policy materially we will tell you in the app before the
change takes effect.
