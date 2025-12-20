# Bagh Chaal

 A modern, lightweight implementation of Bagh Chaal (Sheep and Tiger) built with Vite + React.

 This repository contains a browser game implementation with a local AI (Easy/Medium/Hard), local PvP mode, a small ranking/XP system, and an SVG-based board and piece art.

 ## Live Demo
- GitHub Pages: https://cloudsnapmanage.github.io/Bagh-Chaal/ (deployed via GitHub Actions)

 ## Features
- 1-player (AI) and 2-player (local) modes
- Difficulty levels for AI (Easy / Medium / Hard)
- Placement and movement phases for goats and tigers
- SVG illustrations for pieces (tiger / goat) and responsive board
- Simple ranking & XP persistence (localStorage)

 ## Tech Stack
- Vite
- React 19
- TypeScript
- Tailwind CSS (CDN in index.html — see Notes)

 ## Prerequisites
- Node.js 18+ and npm

 ## Quick start (development)
 Open a PowerShell terminal and run:

 ```powershell
 cd 'C:\Users\LFGSIK\Desktop\Bagh-Chaal-main'
 npm install
 npm run dev
 ```

 Open http://localhost:3000 in your browser.

 ## Build (production)

 ```powershell
 npm run build
 ```

 The built static site is written to `./dist`.

 ## Preview build locally

 ```powershell
 npm run preview
 ```

 ## GitHub Pages deployment

 This repository contains a GitHub Actions workflow at `.github/workflows/workflow.yml` that builds the project and deploys `./dist` to GitHub Pages whenever you push to the `main` branch.

 Notes about Pages setup:
- The Vite `base` option is already set to `/Bagh-Chaal/` so asset URLs will resolve correctly when the site is hosted at `https://<username>.github.io/Bagh-Chaal/`.
- If your repository name or Pages URL changes, update `vite.config.ts` (the `base` option) and re-deploy.

 ## Troubleshooting

- White screen after deploy: If the browser console shows 404s (e.g. `GET https://<user>.github.io/assets/index-...js 404`), verify `vite.config.ts` has `base: '/Bagh-Chaal/'` (or the appropriate repo path) and re-run the build and deploy workflow.
- Tailwind CDN warning: The app currently includes Tailwind via the CDN in `index.html`. This works, but you'll see the production warning in the console. For production best-practice, install Tailwind and configure it as a PostCSS plugin.
- Importmap: `index.html` includes an `importmap` pointing at an external React CDN. When using Vite's bundling you can safely remove that importmap to avoid potential duplicate React instances in some edge cases.

 ## Contributing

 Contributions and fixes are welcome. Please open an issue or create a pull request.

 ## License

 This project has no license file in the repository. Add a `LICENSE` file if you want to apply an open-source license.


