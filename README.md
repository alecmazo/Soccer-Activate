# Soccer-Activate

Elite soccer activation for a 13-year-old path. Timed sessions, check-offs, a development tracker, and an **X video locker** for bookmarked instruction clips.

Hub listing: [application-hub](https://alecmazo.github.io/application-hub/)

Repo: [alecmazo/Soccer-Activate](https://github.com/alecmazo/Soccer-Activate)

## What it is

- **12-week program** — Technical Lab, Engine Room, Final Third, Combined (4 sessions / week)
- **Session runner** — work/rest timer, metronome pace, mark-off list, score logging
- **Solo / partner / trainer** modes change setup and cues
- **Tracker** — six pillars, streak, personal marks
- **X locker** — paste bookmarked X post URLs, assign them to drills, tap Watch mid-session

## X video locker

X bookmarks are private, so the app cannot pull them automatically. Linking the URL is how a clip becomes part of the workout.

1. Open **Bookmarks** on X (`x.com/i/bookmarks`)
2. Copy one or more post URLs (`x.com/…/status/…`) — paste several at once
3. In **Videos**, or on a drill page, paste the links
4. Assign each clip to the matching drill
5. Tap **Watch** from the library, the drill card, or during the session

## Develop

```bash
npm install
npm run dev          # 0.0.0.0:8080
npm run typecheck
npm run build
```

## Stack

React 19 · TypeScript · Vite · TanStack Start · Tailwind v4 · Zustand · Postgres / PGLite
