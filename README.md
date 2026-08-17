# Soccer-Activate

Elite soccer activation for a 13-year-old path. Timed sessions, check-offs, a development tracker, and an **X video locker** for bookmarked instruction clips.

Hub listing: [application-hub](https://alecmazo.github.io/application-hub/)

## What it is

- **12-week program** — Technical Lab, Engine Room, Final Third, Combined (4 sessions / week)
- **Session runner** — work/rest timer, metronome pace, mark-off list, score logging
- **Solo / partner / trainer** modes change setup and cues
- **Tracker** — six pillars, streak, personal marks
- **X locker** — paste bookmarked X post URLs, assign them to drills, tap Watch mid-session

## X video locker

1. Bookmark drill videos on X
2. Copy the post URL (`x.com/…/status/…`)
3. Paste it in **Videos** or on a drill page
4. Assign the clip to the matching drill
5. Open **Watch** from the library or during the session

X bookmarks are private, so the app does not pull them automatically. Linking the URL is how the clip becomes part of the workout.

## Develop

```bash
npm install
npm run dev          # 0.0.0.0:8080
npm run typecheck
npm run build
```

## Stack

React 19 · TypeScript · Vite · TanStack Start · Tailwind v4 · Zustand · Postgres / PGLite
