# Video Customization Guide

This guide helps you customize the Versoll Books product reveal video to match your brand or create variations.

## 🎨 Changing Colors

### Primary Color Scheme
Edit the `COLORS` object at the top of `VideoReveal.tsx`:

```typescript
const COLORS = {
  primary: '#6366f1',      // Main brand color
  secondary: '#8b5cf6',    // Complementary accent
  accent: '#f59e0b',       // Highlights and CTAs
  dark: '#0f172a',         // Background
  light: '#f8fafc',        // Text on dark
  success: '#10b981',      // Positive indicators
  warning: '#f59e0b',      // Warnings
  info: '#3b82f6',         // Informational
};
```

### Feature Card Colors
Each feature card has a `color` prop that controls:
- Border color
- Icon glow effect
- Shadow color

```tsx
<FeatureCard
  title="TDS Calculation"
  description="..."
  icon="🧮"
  index={0}
  delay={0}
  color={COLORS.primary}  // Change this
/>
```

## ✏️ Changing Text Content

### Title and Tagline
Edit the `CinematicTitle` component:

```tsx
<h1>VERSOLL</h1>
<h1>BOOKS</h1>

<p>The Future of Accounting</p>  // Change tagline
```

### Feature Cards
Update each feature's title and description:

```tsx
<FeatureCard
  title="TDS Calculation"        // Edit title
  description="Automated tax..."  // Edit description
  icon="🧮"                       // Change emoji
  index={0}
  delay={0}
  color={COLORS.primary}
/>
```

### Call to Action
Edit the `CallToAction` component:

```tsx
<div>Ready to Transform Your Business?</div>  // Pre-CTA text
<h1>Start Your Journey Today</h1>              // Main CTA
<p>Join thousands of businesses...</p>        // Subtext

<div>Get Started Free</div>                     // Button text
```

### Statistics
Update the social proof numbers:

```tsx
<div>50K+</div>   // Change user count
<div>Active Users</div>

<div>99.9%</div>   // Change uptime
<div>Uptime</div>

<div>24/7</div>    // Change support
<div>Support</div>
```

## ⏱️ Adjusting Timing

### Video Duration
Change the `durationInFrames` in `src/index.tsx`:

```typescript
<Composition
  id="VideoReveal"
  component={VideoReveal}
  durationInFrames={300}  // Change this (60 fps)
  fps={60}
  width={1920}
  height={1080}
/>
```

**Common durations**:
- 300 frames = 5 seconds
- 600 frames = 10 seconds
- 900 frames = 15 seconds

### Section Timings
Edit the `Sequence` components in `VideoReveal`:

```tsx
{/* Intro Section */}
<Sequence from={0} durationInFrames={90}>     {/* Frames 0-90 */}
  <AnimatedBackground intensity={1} />
  <ParticleField seed={42} />
  <CinematicTitle />
</Sequence>

{/* Features Section */}
<Sequence from={90} durationInFrames={150}>    {/* Frames 90-240 */}
  <AnimatedBackground intensity={0.6} />
  <ParticleField seed={123} />
  <FeaturesSection />
</Sequence>

{/* CTA Section */}
<Sequence from={240} durationInFrames={60}>    {/* Frames 240-300 */}
  <AnimatedBackground intensity={1} />
  <ParticleField seed={789} />
  <CallToAction />
</Sequence>
```

### Animation Delays
Adjust card entrance delays in the FeaturesSection:

```tsx
// First row (no delay)
<FeatureCard index={0} delay={0} ... />
<FeatureCard index={1} delay={0} ... />
<FeatureCard index={2} delay={0} ... />

// Second row (15 frame delay)
<FeatureCard index={0} delay={15} ... />
<FeatureCard index={1} delay={15} ... />
<FeatureCard index={2} delay={15} ... />
```

## 🎭 Animation Speed

### Spring Physics
Adjust the `config` object in `spring()` calls:

```typescript
spring({
  frame,
  fps,
  config: {
    mass: 2,        // Increase = heavier, slower
    damping: 20,    // Increase = less bouncy
    stiffness: 80   // Increase = faster, snappier
  }
})
```

**Presets**:

**Gentle & Slow**:
```typescript
config: { mass: 3, damping: 25, stiffness: 60 }
```

**Natural**:
```typescript
config: { mass: 2, damping: 20, stiffness: 80 }
```

**Snappy**:
```typescript
config: { mass: 1.5, damping: 15, stiffness: 100 }
```

**Bouncy**:
```typescript
config: { mass: 1, damping: 10, stiffness: 120 }
```

## 📐 Layout Changes

### Grid Columns
Change the grid layout in `FeaturesSection`:

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',  // Change 3 to 2 or 4
  gap: 30,
  flex: 1,
}}>
```

**Options**:
- `'repeat(2, 1fr)'` - 2 columns
- `'repeat(3, 1fr)'` - 3 columns (default)
- `'repeat(4, 1fr)'` - 4 columns

### Spacing
Adjust gaps and padding:

```tsx
// Grid gap
gap: 30,  // Increase for more space

// Section padding
padding: '60px 100px',

// Card padding
padding: 40,

// Feature grid gap
gap: 60,  // Statistics in CTA
```

## 🎨 Visual Effects

### Particle Count
Change number of particles in `ParticleField`:

```typescript
const particles = useMemo(() => {
  return Array.from({ length: 50 }, (_, i) => ({  // Change 50
    // ...
  }));
}, [width, height]);
```

### Background Intensity
Adjust background glow in each section:

```tsx
<AnimatedBackground intensity={1} />  // 0.0 to 1.0
```

- `1.0` - Full intensity (intro, CTA)
- `0.6` - Reduced intensity (features)
- `0.3` - Subtle glow

### Glow Effects
Modify shadow intensities:

```tsx
textShadow: `
  0 0 80px rgba(99, 102, 241, 0.8),    // Increase opacity for more glow
  0 0 40px rgba(139, 92, 246, 0.6),
  0 0 20px rgba(99, 102, 241, 0.4)
`
```

### Card Glassmorphism
Adjust the glass effect in `FeatureCard`:

```tsx
background: 'rgba(15, 23, 42, 0.8)',  // Increase opacity for more solid
backdropFilter: 'blur(20px)',         // Increase for more blur
border: `2px solid ${color}30`,      // Change 30 to adjust border opacity
```

## 📏 Video Resolution

Change output dimensions in `src/index.tsx`:

```typescript
<Composition
  width={1920}   // Change width
  height={1080}  // Change height
/>
```

**Common Resolutions**:
- 1920x1080 - Full HD (default)
- 1280x720 - HD
- 3840x2160 - 4K
- 1080x1920 - Portrait (for social media)

## 🎵 Adding Audio

### Background Music
Add at the top of `VideoReveal`:

```tsx
import { Audio } from 'remotion';

// In your component return:
<Audio src="/path/to/music.mp3" />
```

### Sound Effects
Add sound effects at specific timestamps:

```tsx
<Audio src="/whoosh.mp3" startFrom={90} />
<Audio src="/click.mp3" startFrom={240} />
```

## 🔄 Creating Variations

### Light Theme
Create a light theme version:

1. Change `COLORS.dark` to `#f8fafc`
2. Change text colors to dark
3. Reduce shadow intensities
4. Adjust background gradients

### Minimal Version
Remove or simplify elements:

```tsx
// Remove particles
// <ParticleField seed={42} />

// Reduce glow effects
// Simplify shadows

// Use fewer feature cards
// 2x2 grid instead of 3x2
```

### Fast Version (3 seconds)
Compress timing:

```typescript
durationInFrames={180}  // 3 seconds

<Sequence from={0} durationInFrames={45}>     {/* Intro: 0.75s */}
<Sequence from={45} durationInFrames={90}>    {/* Features: 1.5s */}
<Sequence from={135} durationInFrames={45}>   {/* CTA: 0.75s */}
```

## 🎯 Best Practices

1. **Maintain Contrast**: Ensure text is readable against backgrounds
2. **Keep It Simple**: Don't overdo animations
3. **Test Timing**: Preview at different speeds
4. **Consistent Delays**: Use consistent spacing between animations
5. **Spring Physics**: Prefer springs over manual easing
6. **GPU Acceleration**: Use transforms (scale, rotate) over changing dimensions
7. **Optimize Particles**: Limit particle count for smooth rendering
8. **Test Exports**: Always render the final video to check quality

## 🔧 Debugging

### Preview Animation
Use Remotion Studio to scrub frame-by-frame:

```bash
npm start
```

### Check Timing
Add temporary frame counter:

```tsx
const frame = useCurrentFrame();
<div style={{ position: 'fixed', top: 10, left: 10, color: 'white' }}>
  Frame: {frame}
</div>
```

### Test Export Quality
Render at different quality settings in `remotion.config.ts`:

```typescript
Config.setQuality(90);  // Increase for better quality (larger file)
Config.setVideoImageFormat("jpeg");  // Use jpeg for photos, png for graphics
```

## 📚 Resources

- [Remotion Customization Guide](https://remotion.dev/docs)
- [Spring Physics Visualizer](https://staging.react-spring.dev/hooks/use-spring#common-configuration)
- [Color Picker](https://htmlcolorcodes.com/color-picker/)
- [Gradient Generator](https://cssgradient.io/)
- [Shadow Generator](https://cssgenerator.org/box-shadow-css-generator.html)

---

**Happy Creating! 🎬**
