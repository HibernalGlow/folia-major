# @hibernalglow/folia-player

Controlled host integration for Folia. The package keeps one HTML audio element in
`FoliaPlayerProvider`, exposes compact, remote and panel projections, and reuses the
upstream Folia lyric parser, visualizer registry, backgrounds and tuning panels.

The host owns library scanning, durable configuration and theme mapping. See the
exported `FoliaPlayerHostAdapter` and `FoliaPlayerPreferences` contracts.

This package and the upstream Folia sources it imports are licensed under AGPL-3.0.
