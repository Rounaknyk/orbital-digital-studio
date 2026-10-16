# ORBITAL agency website

All agency identity, project copy, live links, screenshot galleries, market coordinates, and award gallery captions are in `dist/content.js`. Set each award's `image` to an asset path, such as `assets/engineer-of-the-year.jpg`, and copy that photograph into `dist/assets/`.

Open with a static server: `python3 -m http.server 5173 --directory dist`.

The enquiry form uses FormSubmit to send to rounakpro18@gmail.com. The first submission triggers a confirmation email to that address; activate the service from that email. Direct delivery cannot be verified until activation. No test enquiry has been sent. If submission fails, the form provides a prefilled email link.

Live links reflect the supplied project notes; current availability has not been independently verified. No live links are shown for Peck or Siddharth Constructions. Europe is represented near the Netherlands, where Blue Impact Solutions works.

The globe uses lightweight canvas projection and stylised land outlines, with drag rotation and selectable market markers. Motion respects reduced-motion preferences. The project archive includes all source and supplied screenshots.

## Performance and deployment

Images are WebP with responsive variants, declared dimensions, and hashed names for safe long-lived caching. The portfolio grid requests smaller images; opening a project loads the current and next carousel screenshot, then subsequent screenshots on demand. The globe only runs its animation loop while near the viewport and the tab is visible. Google Fonts connections start early; the CSS import chain has been removed.

Edit `dist/content.js` as before. Optional `media` metadata maps each full image URL to its width, height and responsive srcset. Ordinary new image URLs work without metadata. Retain only compressed production assets in `dist/assets/`.

After editing app.js or style.css, run `node scripts/prepare.mjs` to refresh fingerprinted files. Content edits need no build.

Cloudflare Pages: upload the `dist` folder for a Direct Upload project, or connect this source repository with build command `node scripts/prepare.mjs` and output directory `dist`. `_headers` sets immutable caching for hashed assets and revalidation for editable content. A Cloudflare account connection/deployment is not included in the current Sites publication.

Vercel: `vercel.json` supplies the same asset cache policy and dist output directory. Its commercial plan requirements still apply. Neither this website nor its images need Supabase.
