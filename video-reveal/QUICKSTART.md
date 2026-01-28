# 🚀 Quick Start Guide

Get your Versoll Books product reveal video up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Chrome or Chromium browser
- Terminal/command line access

## Installation (2 minutes)

### 1. Navigate to the project
```bash
cd video-reveal
```

### 2. Install dependencies
```bash
npm install
```

This will download all required packages (~100-200MB).

## Preview Your Video (1 minute)

### 3. Start the development server
```bash
npm start
```

Or use the helper script:
```bash
./video-helper.sh
# Then select option 2
```

### 4. Open in browser
Remotion Studio will automatically open at `http://localhost:3000`

### 5. Explore
- **Timeline at bottom**: Drag the red line to scrub through frames
- **Play button**: Watch the full animation
- **Settings**: Adjust playback speed
- **Preview panel**: See how your video looks

## Render Your Video (2 minutes)

### Option A: Render as MP4 (recommended)
```bash
npm run build
```

Output: `out/video.mp4`

### Option B: Render as PNG frames
```bash
npx remotion render VideoReveal main out/frame-%04d.png --image-sequence
```

Output: Individual frames in `out/`

### Option C: Use helper script
```bash
./video-helper.sh
# Then select option 3 or 4
```

## 🎬 Understanding Your Video

### Video Structure
Your video is **5 seconds long** (300 frames @ 60 fps):

| Section | Frames | Time | Content |
|---------|--------|------|---------|
| Intro | 0-90 | 0-1.5s | Title reveal with dramatic animation |
| Features | 90-240 | 1.5-4s | 6 feature cards with staggered animations |
| CTA | 240-300 | 4-5s | Call to action with statistics |

### Key Features Showcased
1. **TDS Calculation** - Automated tax deduction
2. **E-Way Bills** - GST-compliant logistics
3. **Banking Reconciliation** - AI-powered categorization
4. **Point of Sale** - Retail management
5. **GST Reports** - Comprehensive reporting
6. **Business Events** - Real-time insights

## 🎨 Customization Quick Tips

### Change the Colors
Edit the `COLORS` object in `src/VideoReveal.tsx` (line 13-22):

```typescript
const COLORS = {
  primary: '#6366f1',      // Main brand color
  secondary: '#8b5cf6',    // Accent color
  accent: '#f59e0b',       // Highlights
  // ... more colors
};
```

### Change the Text
Find the text you want to change in `VideoReveal.tsx`:
- Title: Line 135, 150
- Tagline: Line 169
- Feature titles: Lines 338, 346, 354, 362, 370, 378
- CTA: Line 439, 452, 472

### Adjust Timing
Edit the `Sequence` components in `VideoReveal.tsx` (lines 540, 547, 554):

```typescript
<Sequence from={0} durationInFrames={90}>     {/* Intro */}
<Sequence from={90} durationInFrames={150}>   {/* Features */}
<Sequence from={240} durationInFrames={60}>   {/* CTA */}
```

### Change Video Duration
Edit `durationInFrames` in `src/index.tsx` (line 10):

```typescript
durationInFrames={300}  // Change this (60 fps = 5 seconds)
```

**Common values**:
- 180 = 3 seconds
- 300 = 5 seconds (default)
- 600 = 10 seconds

## 🐛 Troubleshooting

### "No video config found" error
**Solution**: Ensure your `src/index.tsx` has the Composition wrapper:

```typescript
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VideoReveal"
        component={VideoReveal}
        durationInFrames={300}
        fps={60}
        width={1920}
        height={1080}
      />
    </>
  );
};
```

### Dependencies not installing
**Solution**: Try clearing npm cache and reinstalling:
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Video rendering fails
**Solution**: 
1. Ensure Chrome is installed
2. Check available disk space (need ~500MB)
3. Try reducing quality in `remotion.config.ts`:
```typescript
Config.setQuality(80);  // Reduce from 90
```

### Preview is slow
**Solution**: 
1. Reduce particle count in `ParticleField` (line 28):
```typescript
return Array.from({ length: 25 }, (_, i) => ({  // Change 50 to 25
```

2. Lower preview resolution in Remotion Studio settings

## 📚 Next Steps

### Learn More
- **README.md** - Complete documentation
- **CUSTOMIZATION.md** - Detailed customization guide
- **Remotion Docs** - https://remotion.dev/docs

### Make It Your Own
1. Change colors to match your brand
2. Update text and features
3. Adjust timing and animations
4. Add your logo
5. Add background music

### Create Variations
- **Light theme** - Invert colors for light backgrounds
- **Portrait** - 1080x1920 for social media
- **Short** - 3-second version for ads
- **Long** - 15-second version with more detail

## 🎯 Common Tasks

### Check if everything is working
```bash
./video-helper.sh
# Select option 7 (Check for issues)
```

### Preview at different resolutions
```bash
./video-helper.sh
# Select option 9 (Preview with different resolution)
```

### Clean build artifacts
```bash
./video-helper.sh
# Select option 5 (Clean build artifacts)
```

### Show project information
```bash
./video-helper.sh
# Select option 8 (Show project info)
```

## 🎬 Export Tips

### For Web (YouTube, Vimeo)
- Resolution: 1920x1080 (default)
- Format: MP4
- Quality: 90%
- File size: ~5-10 MB

### For Social Media
- Instagram (feed): 1080x1080
- Instagram (stories): 1080x1920
- TikTok: 1080x1920
- Twitter: 1280x720

Edit `src/index.tsx` to change resolution:
```typescript
<Composition
  width={1080}
  height={1920}
  // ... other props
/>
```

### For Presentations
- Resolution: 1920x1080 or 3840x2160
- Format: MP4
- Consider looping the video

## 🆘 Need Help?

1. Check the documentation:
   - README.md - Complete guide
   - CUSTOMIZATION.md - Customization details
   
2. Use the helper script:
   ```bash
   ./video-helper.sh
   # Select option 7 to check for issues
   ```

3. Visit Remotion community:
   - https://remotion.dev
   - https://discord.gg/remotion

## ✅ Success Checklist

Before you're done, make sure:

- [ ] Dependencies installed successfully
- [ ] Development server starts
- [ ] Video preview plays smoothly
- [ ] Video renders to MP4
- [ ] Text and colors are correct
- [ ] Timing feels right
- [ ] Video exports at desired quality

---

**Happy Creating! 🎬**

For detailed customization, see [CUSTOMIZATION.md](./CUSTOMIZATION.md)
