/*
  ============================================================
  LYRICS TIMELINE — "I Like U" by NIKI
  ============================================================
  I can't pre-fill this with the real lyrics (copyright), but
  the whole karaoke engine in game.js is fully wired up to this
  array — you just need to fill in the real lines + timestamps.
  Takes about 10 minutes. Here's how:

  1. Put i-like-u.mp3 in assets/audio/ (see the setup guide).
  2. Open the mp3 in any player that shows a running time
     (VLC, your phone's music app, even this game's own player
     once the file is in place — the progress bar under the
     lyric box shows the current time as you scrub).
  3. Every time a new line starts, jot the time in seconds.
     e.g. a line that starts at 0:14 -> time: 14
  4. Replace the placeholder "text" strings below with the real
     line, keeping the "time" you noted. Add/remove objects so
     you have one entry per line of the song.
  5. Save this file and reload the page — the box will now
     highlight each line in sync with the audio, with the
     previous/next lines faded above and below it.

  The array must stay sorted by "time" (earliest first).
  ============================================================
*/

const LYRICS = [
  { time: 0,   text: "🎵 (intro — instrumental)" },
  { time: 8,   text: "[verse line 1 — replace me]" },
  { time: 12,  text: "[verse line 2 — replace me]" },
  { time: 16,  text: "[verse line 3 — replace me]" },
  { time: 20,  text: "[verse line 4 — replace me]" },
  { time: 24,  text: "[pre-chorus line 1 — replace me]" },
  { time: 28,  text: "[pre-chorus line 2 — replace me]" },
  { time: 32,  text: "[chorus line 1 — replace me]" },
  { time: 36,  text: "[chorus line 2 — replace me]" },
  { time: 40,  text: "[chorus line 3 — replace me]" },
  { time: 44,  text: "[chorus line 4 — replace me]" },
  { time: 50,  text: "🎵 (instrumental break)" },
  { time: 58,  text: "[verse 2 line 1 — replace me]" },
  { time: 62,  text: "[verse 2 line 2 — replace me]" },
  { time: 66,  text: "[verse 2 line 3 — replace me]" },
  { time: 70,  text: "[verse 2 line 4 — replace me]" },
  { time: 74,  text: "[chorus line 1 — replace me]" },
  { time: 78,  text: "[chorus line 2 — replace me]" },
  { time: 82,  text: "[chorus line 3 — replace me]" },
  { time: 86,  text: "[chorus line 4 — replace me]" },
  { time: 95,  text: "[bridge line 1 — replace me]" },
  { time: 99,  text: "[bridge line 2 — replace me]" },
  { time: 103, text: "[final chorus — replace me]" },
  { time: 110, text: "🎵 (outro)" },
];
