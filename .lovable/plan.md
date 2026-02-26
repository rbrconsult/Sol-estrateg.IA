

# Embed Status Page in Monitoramento

## What changes
Replace the entire card/button layout in `Monitoramento.tsx` with a full-height iframe that loads `https://status.rbrsistemas.com/status/evolve` directly inside the page.

## Implementation

### Edit `src/pages/Monitoramento.tsx`
- Keep the header (title + help button)
- Remove the Card, icons, button, and all the conditional `statusUrl` logic
- Remove the `useAuth`, `useQuery`, and `supabase` imports (no longer needed)
- Add an `<iframe>` pointing to `https://status.rbrsistemas.com/status/evolve` that fills the remaining viewport height
- Style: `w-full`, `border-0`, `rounded-lg`, height via `calc(100vh - 10rem)` to fill below the header

Result: the external status page renders inline, no button, no configuration needed.

