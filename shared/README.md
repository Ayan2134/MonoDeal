# @monodeal/shared

Canonical TypeScript shapes for MonoDeal cards, property sets, turns, and actions.

The live engine still owns runtime validation in `server/src/game`. The React table mirrors those types in `client/src/game/types.ts`. When you change a card field, a destination, or the win/turn model, update this folder and both copies in the same change.

These modules are the contract. They are not imported at runtime yet — Node and Vite each compile from their own workspace — so keep the three copies aligned by hand until a workspace package build is wired.
