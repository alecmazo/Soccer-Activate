# Soccer-Activate

Elite soccer activation for a 13-year-old path. Timed sessions, check-offs, a development tracker, and an **X video locker** for bookmarked instruction clips.

- Live: [soccer-activate.vercel.app](https://soccer-activate.vercel.app)
- Hub: [application-hub](https://alecmazo.github.io/application-hub/)
- Repo: [alecmazo/Soccer-Activate](https://github.com/alecmazo/Soccer-Activate)

## What it is

- **12-week program** — Technical Lab, Engine Room, Final Third, Combined (4 sessions / week)
- **Session runner** — work/rest timer, metronome pace, mark-off list, score logging
- **Solo / partner / trainer** modes change setup and cues
- **Tracker** — six pillars, streak, personal marks
- **X locker** — paste bookmarked X post URLs, assign them to drills, tap Watch mid-session (plays in-app)

## X video locker

X bookmarks are private, so the app cannot pull them automatically. Linking the URL is how a clip becomes part of the workout.

1. Open **Bookmarks** on X (`x.com/i/bookmarks`)
2. Copy one or more post URLs (`x.com/…/status/…`) — paste several at once, or tap **Paste bookmarks**
3. In **Videos**, or on a drill page, paste the links
4. Assign each clip to the matching drill
5. Tap **Watch** from the library, the drill card, or during the session — the clip opens in-app (Open on X is still there)

## Develop

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Stack

React 19 · TypeScript · Vite · TanStack Start · Tailwind v4 · Zustand · Postgres / PGLite
