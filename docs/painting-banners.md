# Painting banners

Each content page selects a painting with a literal prop, for example:

```astro
<ContentLayout title="Research" banner="orion">
```

The available keys, imported WebPs, alt text, viewer captions, museum source links, ThumbHashes and focal positions live in `src/lib/bannerImages.ts`. `PaintingBanner.astro` renders the selected image through the site's `Image.astro` wrapper. There is no random selection or client-side banner state.

Alt text describes what is visible in each crop. Captions add the work's title, artist and story, with a museum link for further reading. Banners use `captionVisibility="viewer"` so this text appears when the image is opened, while other images keep their existing inline captions. The coastal scene's title and artist remain unidentified. Dates follow the linked museum records, including the Louvre's current c. 1654–1658 dating for Diogenes; Sandrart's broadly dated work is labelled 17th century.

All eleven painting assets are **1400 × 350**. The rendered image height stays between **192 and 240 px**, and every banner starts at the top of the page beneath the floating navigation. Every painting fills the entire banner with `object-fit: cover` on all screen sizes. The `position` value controls the focal point for responsive cropping and is shared by the image and its loading placeholder. There are no blurred backdrops, letterboxing or alternate fitting modes. The image viewer shows the complete prepared banner crop.

The homepage uses `CoastalPoppiesBanner.astro` in the `ContentLayout` named `banner` slot. The closed banner matches the painting banners’ full width and `clamp(12rem, 25vw, 15rem)` height. Clicking it, or pressing Enter/Space while focused, opens it smoothly to the viewport height and pushes the page content down. The profile picture’s negative top margin transitions to positive spacing at the same speed, moving the entire portrait below the viewport; closing restores its original overlap. The homepage reads the banner’s native `[open]` state through CSS, with no extra JavaScript. Another activation closes it. A native `<details>` element owns expansion, and the video stays mounted throughout: opening and closing never replay the animation. Both transitions respect reduced-motion preferences.

The animation now uses a native H.264 MP4 and an optimised WebP poster instead of downloading and decompressing the original 5.3 MiB HTML player in the browser. Both use `object-fit: cover` without stretching. The homepage preloads the poster at high priority in `<head>` so it can paint immediately; the video has `preload="none"` and no initial `src`. Its source is assigned after the page loads and the browser is idle, while the banner is visible. An intentional click may start it sooner. Reduced-motion and Save-Data visitors keep the static poster without downloading the video. Offscreen and hidden-page playback pauses, and Astro navigation cancels pending work and releases the media. Playback runs forward once and holds the final blooming frame. Imported media gets hashed asset URLs, and the original coastal painting remains available in the image library.

This follows the [video poster and LCP guidance](https://web.dev/articles/lazy-loading-video): prioritise the poster rather than lazy-loading the hero’s first visual. The original supplied HTML, including its Lumen player MIT licence, is retained only as a source asset at `src/assets/animations/coastal-poppies.html`; it is not imported by the site or copied to `dist`.

Regenerate the MP4 and poster with `bun scripts/prepare-coastal-poppies.ts` (requires local FFmpeg with libx264). The script reconstructs the original 288 palette frames, preserves their 640 × 360 size and 24 fps timing, encodes a silent MP4 with fast-start metadata, and runs the existing image optimisation script for the poster. It prints source, compressed-source and output byte counts for review. Normal site builds use the prepared assets and do not need FFmpeg.

The fullscreen control uses Font Awesome Free 6.6.0’s [expand](https://github.com/FortAwesome/Font-Awesome/blob/6.6.0/svgs/solid/expand.svg) and [compress](https://github.com/FortAwesome/Font-Awesome/blob/6.6.0/svgs/solid/compress.svg) icons through the existing local `astro-icon` pipeline. This matches the site’s other Font Awesome icons. It uses the visible navigation shell’s `rounded-2xl` (16 px) corner radius, with a translucent ivory/shark surface, subtle border and theme-aware icon/focus colours. The downloaded SVGs retain Fonticons’ attribution and [CC BY 4.0 licence notice](https://github.com/FortAwesome/Font-Awesome/blob/6.6.0/LICENSE.txt).

## Assignments

| Pages | Key | Asset |
| --- | --- | --- |
| Home | `banner` slot | `src/assets/animations/coastal-poppies.mp4` + WebP poster |
| Blurb, Research, Lab | `orion` | `src/assets/images/banners/orion.webp` |
| Writing archive and individual entries | `apollo` | `src/assets/images/banners/apollo.webp` |
| Coding, Problems and individual problems | `minerva` | `src/assets/images/banners/minerva.webp` |
| 404 | `harbour` | `src/assets/images/banners/harbour.webp` |
| Questions | `lastSupper` | `src/assets/images/banners/last-supper.webp` |
| Lexicon | `diogenes` | `src/assets/images/banners/diogenes.webp` |
| Musings | `sirens` | `src/assets/images/banners/ulysses-and-the-sirens.webp` |
| Projects | `polyphemus` | `src/assets/images/banners/ulysses-and-polyphemus.webp` |
| Available for future pages | `nausicaa` | `src/assets/images/banners/odysseus-and-nausicaa.webp` |
| Bookshelf, Notes | `patroclus` | `src/assets/images/banners/funeral-of-patroclus.webp` |

The standalone NYC map and Möbius showcase retain their immersive layouts. Home retains the overlapping portrait; Blurb has no portrait.

## Preparing the files

The final banners use crops from the supplied originals, with proportional resampling and WebP compression. No generated painting details are included. Sharp reads AVIF directly, so Orion needs no separate format converter. The harbour and Turner sources are only 800 px wide; they are resampled to the common resolution without synthesising detail.

To reproduce all ten prepared assets from a folder containing the original filenames:

```bash
bun scripts/prepare-painting-banners.ts /path/to/source-images
```

To prepare only the latest additions:

```bash
bun scripts/prepare-painting-banners.ts /path/to/source-images odysseus-and-nausicaa funeral-of-patroclus
```

The script prepares temporary lossless PNGs, then invokes the astro-image-optimization skill's existing script at quality 82. It prints the final dimensions, size and ThumbHash for every WebP and removes its temporary PNGs. After changing a crop, update the corresponding ThumbHash in `src/lib/bannerImages.ts` from this output.

| Original file | Crop: left, top, width, height | Focus |
| --- | --- | --- |
| `Blind Orion Searching for the Rising Sun.avif` | `0, 0, 3200, 800` | Orion, his guide and the distant mountains |
| `Apollo_by_Giovanni_Antonio_Pellegrini_Mauritshuis_1135.jpg` | `0, 0, 1920, 480` | Face, raised hand and golden cloak |
| `Combat de Minerve contre Mars.JPG` | `0, 150, 1464, 366` | Minerva's helmet, face and pointing arm |
| `N-0014-00-000066-wpu.jpg` | `0, 235, 800, 200` | Sunlit water, ships and classical architecture |
| `last supper.jpg` | `0, 1150, 9600, 2400` | Heads, gestures and tabletop |
| `0000399948_OG.JPG` | `20, 695, 1464, 366` | Diogenes, the drinking boy and the discarded bowl; photographic frame removed |
| `JohnWilliamWATERHOUSE-Ulyssesand-Fd101526.jpg` | `12, 180, 2976, 744` | Ulysses's face and bindings, with the six airborne sirens' faces |
| `N-0508-00-000028-wpu.jpg` | `0, 255, 800, 200` | Ulysses on the departing ship and the golden sunrise |
| `Odysseus_en_Nausikaä_Rijksmuseum_SK-A-4278.jpeg` | `0, 260, 2500, 625` | Nausicaa's face and offering gesture, her attendants and Odysseus's face |
| `P1188.jpg` | `0, 260, 2480, 620` | Achilles's plumed helmet and red cloak, Patroclus's body and the surrounding mourners |

Crop coordinates are pixels in the original files, before resizing. Original files are never overwritten. The existing coastal WebP and its ThumbHash are reused unchanged.

## Subject selection

The [Wellcome Collection's account of Poussin's scene](https://wellcomecollection.org/works/dxcym6wd) identifies the encounter between Diogenes and the young man drinking from his hands, with the discarded cup. All three elements remain in the Lexicon crop. Most of the distant landscape is outside this detail.

The [NGV's account of Waterhouse's painting](https://www.ngv.vic.gov.au/explore/collection/work/4457/) centres on Ulysses listening to the sirens while bound to the mast. The Musings crop retains his face, bound hands and the airborne sirens around him; the lower rowers and foreground siren are outside this detail. The phone focal point keeps Ulysses and the nearest sirens together.

The [National Gallery's account of Turner's painting](https://www.nationalgallery.org.uk/paintings/joseph-mallord-william-turner-ulysses-deriding-polyphemus-homer-s-odyssey) identifies both Ulysses on the departing ship and Polyphemus above the cliffs. The user chose a short banner focused on the ship and sunrise. The prepared Projects crop follows that choice; Polyphemus and the upper sail fall outside this detail. The page crops this asset further as needed to cover the banner viewport.

[Joachim von Sandrart's Odysseus and Nausicaa](https://www.rijksmuseum.nl/en/collection/object/Odysseus-and-Nausicaa--36d44d38106f0cc843b11a1b12dc5c09) shows the shipwrecked Odysseus meeting Nausicaa and her attendants. The prepared crop preserves both central faces and Nausicaa's gesture offering clothing. The lower bodies, dog and upper sky are outside the detail. This banner remains in the library for future pages, with its alt text, caption and museum link.

[Jacques-Louis David's The Funeral of Patroclus](https://onlinecollection.nationalgallery.ie/objects/8188) centres on Achilles mourning his friend before the funeral pyre. The Notes crop keeps Achilles's entire helmet, red cloak and Patroclus's reclining body, together with the surrounding mourners. It removes most of the sky and lower foreground; the phone focal point keeps Achilles and Patroclus together.

## Imagegen exploration

The built-in imagegen tool was used to explore five crops; the imagegen API/CLI fallback was not used. Its successful candidates altered painted details, and Orion and Minerva were rejected by its safety filter. Those candidates were discarded. The user then authorised choosing the best tools, and the final assets were prepared from original pixels using Sharp and the optimisation skill.

For reference, each imagegen call used its converted source WebP as the sole edit target, with the following shared prompt followed by the painting-specific instruction below:

> Use case: precise-object-edit. Asset type: full-width horizontal fine-art website banner. Input image 1 is the edit target, an existing painting. Make an intelligent CROP of this exact painting to a 4:1 panoramic banner, preferably 2048x512 pixels. Preserve the original painted pixels, faces, poses, colours, brushwork and aged texture as faithfully as possible. Only crop and proportionally scale: no repainting, no new elements, no moving subjects, no outpainting, no text, no frame, no borders. The output must fill the entire canvas edge to edge. Choose a field of interest that conveys a quest for knowledge and adventure.

**Orion:** Retain the landscape and Orion at the right, with his head, the small guide on his shoulder, his reaching hand and the distant mountains visible. Crop mainly the lower foreground; keep enough upper edge for the guide's head. The landscape in his direction of travel is essential.

**Apollo:** Focus on Apollo's expressive face, raised open hand and flowing golden cloak, with the soft pink clouds and pale blue sky. A close horizontal detail of the upper body is preferable to squeezing or redrawing the whole figure. Keep the full head and raised fingers comfortably inside the crop.

**Minerva:** Focus on helmeted Minerva's face, her outstretched pointing arm and hand, with the cloud figures to her left and the men at her right where the crop permits. Keep the full helmet plume and face inside the crop. The lower bodies and foreground may fall outside the banner; do not move figures to force them in.

**Harbour:** Frame the luminous sea horizon, sailing ships and the classical colonnade as a horizontal journey outward. Preserve the sunlit water and architectural perspective. Crop excess sky and foreground, focusing on the original middle band. Do not invent detail; faithfully resample this lower-resolution painting.

**The Last Supper:** Select the horizontal band through all thirteen heads, expressive hands and the tabletop. Keep Jesus near the middle and retain all apostles across the width. Remove most of the empty ceiling and floor. No head should be cut by the top edge. Preserve the original faded fresco colours and damaged surface.
