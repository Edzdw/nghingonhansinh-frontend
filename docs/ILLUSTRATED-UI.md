# Illustrated room assets

The room follows the approved November 5 illustration: top action console, wood surface, paper mat, character stickers and ring-bound log. All names, counts, roles, targeting and actions remain rendered from the game snapshot. Artwork does not encode roles. Mobile retains the top console with a scrollable board/log.

Generated with the built-in ImageGen tool, using the user-approved illustration as style reference:

- `public/art/friends-atlas.png`: transparent 4-column × 2-row atlas, eight waist-up watercolor character stickers. Prompt: match expressive cozy Vietnamese young adult friends in the reference; row 1 orange-sweater curly-haired woman, green-hoodie bespectacled man, lavender-beret woman, lilac-blouse bun-haired woman; row 2 purple-cap hoodie man, olive-shirt headphone man, peach-shirt woman, blue-overshirt man. Cream cutout outlines, no text/cards/UI, equal grid cells, transparent background.
- `public/art/wood-table.png`: top-down watercolor terracotta wood desktop, subtle horizontal grain, small plant upper left, lavender plaid paper lower left, purple pencil lower right; no board, characters, cards or text.
- `public/art/paper-grain.svg`: code-native subtle grain, not a generated image.
- `public/art/patrick-hand.ttf`: Patrick Hand from Google Fonts, bundled locally; license in `FONT-LICENSE.txt`.

Verification: production Webpack build, TypeScript and existing frontend tests. UI fixture is outside the deployable repo in the chat workspace. No backend, credentials, migration or deployment changes.
