# Arena Deckbuilder

Browser-based arena deckbuilder with solo runs and online PvP lobbies (no accounts).

## Quick start

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173/

- **Solo:** works without any backend setup.
- **Online lobbies:** copy `.env.example` to `.env`, add Supabase keys, and follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## Online features

- Shareable invite links: `/lobby/CODE`
- Up to 8 players per lobby
- PvP battles, shop rounds, spectator mode, reconnect, turn timers

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
