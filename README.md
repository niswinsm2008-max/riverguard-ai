# RiverGuard AI — browser edition

Standalone HTML, CSS and JavaScript conversion of the supplied RiverGuard AI prototype. No Python server, installation, API key, or build step is needed to use the website.

## Open locally

Extract the whole ZIP and open `index.html` in a modern browser. Keep the files together. All predictions run locally; no readings are sent to a server. The page uses no external fonts, scripts, or CDNs.

## Publish on GitHub Pages

1. Create a GitHub repository, such as `riverguard-ai`.
2. Upload the contents of this folder, with `index.html` at the repository root. Upload the extracted files, not the ZIP.
3. Open repository Settings → Pages.
4. Choose Deploy from a branch, select `main` and `/(root)`, and save.
5. Wait for GitHub to display the published website address.

## Files

- `index.html`: dashboard structure.
- `styles.css`: responsive styling.
- `app.js`: form controls, tree inference, charts and assessment export.
- `model.js`: the original 250-tree Random Forest exported as JavaScript data, with feature importance, observed data ranges and dataset preview.
- `demo_water_quality.csv`: original 2,500-row synthetic dataset.
- `evaluation_metrics.json`: unchanged original synthetic test metrics.
- `VERIFICATION.md`: conversion checks and known limitations.
- `.nojekyll`: allows direct static-file hosting on GitHub Pages.

## Behavior and scope

The browser traverses the original trained trees and averages their class probabilities. Inputs are rounded to float32 before traversal, matching scikit-learn inference. This is a conversion of the fitted model, not a replacement rule-based scoring formula. Ties select the first class, as in the original classifier.

The interface adds sample presets, range warnings, a downloadable sample assessment and per-feature scaled profile bars. It retains the original dataset and evaluation, and explicitly shows class-specific performance and the majority-class accuracy baseline. The station name is included in the assessment export. Training remains an offline development task; the browser does not retrain the forest.

This is an educational demonstration trained on synthetic, rule-derived labels. No physical sensors are connected. Model probabilities are uncalibrated and predictions do not establish drinking-water safety or compliance. The animated reference HTML in the source ZIP is not the live model backend; this conversion implements the Python dashboard workflow.

## Field notebook update

Warm beige interface with a local sample journal (up to 50 records), per-feature comparison against the last saved sample, reloadable saved samples, journal CSV export and a clear-history control. journal.js implements these features. terms.html explains educational use, local storage and privacy. No AI-generated images are included. Comparison deltas are not safety trends.
