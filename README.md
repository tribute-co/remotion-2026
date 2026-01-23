# Remotion Player Demo 2026

A demo app showcasing the [Remotion Player](https://www.remotion.dev/player) with TypeScript and Bun, playing 3 videos in sequence.

## Features

- 🎬 Embedded Remotion Player with controls
- 🐰 **New Mediabunny-powered Video tags** - Uses `@remotion/media` for frame-accurate, fast playback
- 🎥 Sequential playback of 3 videos:
  - Sloth on Train
  - Mongolian Horses 4K
  - Magical Ink
- ⚡ Built with Bun for fast package management
- 🎨 Modern, responsive UI

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or higher

### Installation

```bash
bun install
```

### Development

Start the development server with Vite:

```bash
bun run dev
```

Then open your browser to `http://localhost:3000` to view the player.

For the Remotion Studio (advanced editing and previewing compositions):

```bash
bun run remotion
```

### Building

Build for production:

```bash
bun run build
```

The output will be in the `dist/` directory.

### Rendering

Render the composition to a video file:

```bash
bun run render
```

## Project Structure

- `src/`
  - `index.tsx` - Entry point
  - `Player.tsx` - Player component with UI
  - `VideoSequence.tsx` - Composition with sequential videos
  - `Root.tsx` - Remotion root configuration
- `index.html` - HTML entry point
- `remotion.config.ts` - Remotion configuration
- `package.json` - Dependencies and scripts

## Technologies

- [Remotion](https://www.remotion.dev/) - Video creation framework
- [@remotion/player](https://www.remotion.dev/player) - Embeddable video player
- [@remotion/media](https://www.remotion.dev/docs/mediabunny/new-video) - New Mediabunny-powered `<Video>` tags for frame-accurate playback
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Bun](https://bun.sh/) - Fast package manager and runtime

## Why the New Video Tags?

According to the [Remotion documentation](https://www.remotion.dev/docs/mediabunny/new-video), the new `@remotion/media` video tags powered by Mediabunny provide:

- 🎯 **Absolute frame-accuracy** - Perfect synchronization
- ⚡ **Fastest performance** - Optimized playback
- 📊 **Minimal data fetching** - Efficient loading

This demo uses the new `<Video>` component from `@remotion/media` for best-in-class video playback.

## Learn More

- [Remotion Documentation](https://www.remotion.dev/docs)
- [Remotion Player Docs](https://www.remotion.dev/docs/player)
- [Bun Documentation](https://bun.sh/docs)

## License

MIT
