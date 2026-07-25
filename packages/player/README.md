# @hibernalglow/folia-player

Controlled host integration for Folia. The package keeps one HTML audio element in
`FoliaPlayerProvider`, exposes compact, remote and panel projections, and reuses the
upstream Folia Home, Grid3D, GridMap, GridView, search, floating controls, lyric
visualizers, backgrounds, parser, and tuning panels.

The fullscreen surface keeps the original visualizer mounted behind Home so Folia's
cover-driven background remains visible while lyric text is hidden. It opens on Home;
the original floating player entry navigates to the lyric visualizer. Hosts can provide
an embedded `brandLabel` and should pass theme tokens through `DualTheme`; host-wide
button/card CSS must not restyle Folia's internal component tree.

The host owns library scanning, durable configuration and theme mapping. See the
exported `FoliaPlayerHostAdapter` and `FoliaPlayerPreferences` contracts.

`FoliaPlayerSettingsSurface` contains playback, visualizer, and Lab sections. The Lab
preferences cover static visualizers, a static Home background, an optional 60/90/120
FPS cap, and the upstream player-page visibility controls. The package does not write
Folia's application localStorage keys; hosts persist the complete preferences object.

The FPS cap is scoped to `FoliaFullscreenSurface` while its lyrics player view is
active. Returning Home, disabling the cap, or unmounting the surface restores the
host's original `requestAnimationFrame` and `cancelAnimationFrame`. When more than one
lyrics surface is active, the lowest requested cap is used until that surface leaves.

Hosts can restore a persisted selection with `initialActiveTrackId` and persist later
user selections through `onActiveTrackChange`. Restoration selects the track without
autoplaying or restoring playback seconds.

`hydrateTrackPreview` is the lightweight library hydration path for metadata and album
art. The provider runs it serially at a fixed interval for non-active tracks. The active
track always uses `hydrateTrack`, so lyrics and other playback metadata are still fully
resolved. Both hooks may return `release`; the provider releases superseded, removed,
aborted, and unmounted resources.

This package and the upstream Folia sources it imports are licensed under AGPL-3.0.
