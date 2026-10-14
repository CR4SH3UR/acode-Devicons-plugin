// Renders the README presentation images into screenshots/.
// Needs Playwright with a Chromium build: `npm run screenshots`
// (or NODE_PATH=$(npm root -g) node scripts/screenshots.mjs).
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

// CommonJS require so a global install found through NODE_PATH works too.
const { chromium } = createRequire(import.meta.url)("playwright");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const json = (f) => JSON.parse(readFileSync(join(root, f), "utf8"));

const byName = {};
const byExt = {};
for (const e of json("file_icons.json")) {
	for (const n of e.file_name || []) byName[n] = e.name;
	for (const x of e.file_extensions || []) byExt[x] = e.name;
}
const byFolder = {};
for (const e of json("folder_icons.json")) for (const n of e.folder_name || []) byFolder[n] = e.name;

function fileIcon(name) {
	if (byName[name]) return byName[name];
	const parts = name.toLowerCase().split(".");
	for (let i = 1; i < parts.length; i++) {
		const ext = parts.slice(i).join(".");
		if (byExt[ext]) return byExt[ext];
	}
	return null;
}

// [depth, name, isFolder, open]
const TREE = [
	[0, "my-app", true, true, "root"],
	[1, ".github", true, true],
	[2, "workflows", true, false],
	[1, ".vscode", true, false],
	[1, "node_modules", true, false],
	[1, "docker", true, false],
	[1, "src", true, true],
	[2, "components", true, true],
	[3, "App.tsx"],
	[3, "Header.vue"],
	[3, "Card.svelte"],
	[2, "styles", true, true],
	[3, "main.scss"],
	[2, "index.ts"],
	[2, "server.py"],
	[2, "api.go"],
	[2, "lib.rs"],
	[1, ".env"],
	[1, ".gitignore"],
	[1, "Dockerfile"],
	[1, "package.json"],
	[1, "tsconfig.json"],
	[1, "vite.config.ts"],
	[1, "tailwind.config.js"],
	[1, "README.md"],
];

const FILE_FALLBACK = `<svg viewBox="0 0 24 24"><path fill="#90A4AE" d="M6 2h8l6 6v14H6z"/></svg>`;

function tree(theme) {
	return TREE.map(([depth, name, folder, open, root]) => {
		let icon;
		if (folder) {
			icon = byFolder[name] || (root ? (open ? "folder-root-open" : "folder-root") : open ? "folder-open" : "folder");
		} else icon = fileIcon(name);
		const img = icon ? `<img src="/icons/${icon}.svg">` : FILE_FALLBACK;
		const chevron = folder ? `<span class="chev">${open ? "▾" : "▸"}</span>` : `<span class="chev"></span>`;
		return `<div class="row" style="padding-left:${12 + depth * 16}px">${chevron}${img}<span>${name}</span></div>`;
	}).join("");
}

const THEMES = {
	dark: { bg: "#1b1d23", panel: "#21252b", text: "#d7dae0", muted: "#7f848e", head: "#282c34", border: "#2c313a" },
	light: { bg: "#f3f4f6", panel: "#ffffff", text: "#2b2f36", muted: "#6b7280", head: "#eef0f3", border: "#e3e5e8" },
};

const panel = (t, title) => `
<div class="panel" style="background:${THEMES[t].panel};color:${THEMES[t].text};border-color:${THEMES[t].border}">
	<div class="head" style="background:${THEMES[t].head};color:${THEMES[t].muted}">${title}</div>
	${tree(t)}
</div>`;

const BASE_CSS = `
*{box-sizing:border-box;margin:0}
body{font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;width:1200px;height:675px;overflow:hidden}
.panel{width:330px;border:1px solid;border-radius:14px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.35)}
.head{font-size:12px;letter-spacing:.08em;text-transform:uppercase;padding:10px 14px;font-weight:600}
.row{display:flex;align-items:center;gap:8px;height:22.5px;font-size:13.5px;white-space:nowrap}
.row img,.row svg{width:17px;height:17px;flex:none}
.chev{width:10px;font-size:10px;opacity:.6;flex:none}
`;

const ALL = [...new Set([...json("file_icons.json"), ...json("folder_icons.json")].map((e) => e.name))].sort();
const featured = ["javascript", "typescript-icon", "python", "rust", "go", "react", "vue", "svelte-icon", "docker-icon", "kotlin-icon", "dart", "c-plusplus", "html-5", "css", "php", "swift", "github-icon", "git-icon", "npm-icon", "vite", "tailwind", "nodejs-icon", "flutter", "java"].filter((n) => ALL.includes(n));

const PAGES = {
	"hero.png": `<style>${BASE_CSS}
body{background:radial-gradient(1200px 700px at 85% -10%,#ff4d0033,transparent 60%),linear-gradient(135deg,#14161b,#1d2027);color:#fff;display:flex;align-items:center;gap:70px;padding:0 80px}
h1{font-size:64px;font-weight:800;letter-spacing:-.03em;line-height:1}
h1 span{color:#ff6a2b}
p{font-size:22px;color:#b8bcc6;margin-top:18px;line-height:1.45;max-width:560px}
.cloud{display:grid;grid-template-columns:repeat(8,52px);gap:14px;margin-top:38px}
.cloud div{width:52px;height:52px;border-radius:12px;background:#ffffff0d;border:1px solid #ffffff14;display:grid;place-items:center}
.cloud img{width:30px;height:30px}
.stats{display:flex;gap:28px;margin-top:34px;font-size:15px;color:#9aa0ab}
.stats b{display:block;font-size:26px;color:#fff}
</style>
${panel("dark", "Explorateur")}
<div>
	<h1>Devicons<br><span>pour Acode</span></h1>
	<p>Les vrais logos de vos langages, frameworks et outils, directement dans l'explorateur de fichiers.</p>
	<div class="cloud">${featured.map((n) => `<div><img src="/icons/${n}.svg"></div>`).join("")}</div>
	<div class="stats"><div><b>${ALL.length}</b>icônes</div><div><b>194</b>extensions</div><div><b>236</b>fichiers</div><div><b>60</b>dossiers</div></div>
</div>`,

	"themes.png": `<style>${BASE_CSS}
body{background:linear-gradient(90deg,#16181d 50%,#e9ebef 50%);display:flex;justify-content:space-around;align-items:center;padding:0 70px}
.col{display:flex;flex-direction:column;align-items:center;gap:18px}
.label{font-size:18px;font-weight:700;letter-spacing:.02em}
</style>
<div class="col"><div class="label" style="color:#e6e8ec">Thème sombre</div>${panel("dark", "Explorateur")}</div>
<div class="col"><div class="label" style="color:#22262d">Thème clair</div>${panel("light", "Explorateur")}</div>`,

	"icons.png": `<style>${BASE_CSS}
body{background:linear-gradient(135deg,#14161b,#1d2027);padding:44px 54px;color:#fff;height:auto}
h2{font-size:30px;font-weight:800;letter-spacing:-.02em}
h2 span{color:#ff6a2b}
.grid{display:grid;grid-template-columns:repeat(16,1fr);gap:12px;margin-top:26px}
.grid div{aspect-ratio:1;border-radius:12px;background:#ffffff0b;border:1px solid #ffffff12;display:grid;place-items:center}
.grid img{width:58%;height:58%}
</style>
<h2>${ALL.length} icônes <span>en couleur</span></h2>
<div class="grid">${ALL.filter((n) => !n.startsWith("folder")).map((n) => `<div title="${n}"><img src="/icons/${n}.svg"></div>`).join("")}</div>`,
};

const server = createServer((req, res) => {
	const url = decodeURIComponent(req.url.split("?")[0]);
	if (url.startsWith("/page/")) {
		res.setHeader("content-type", "text/html; charset=utf-8");
		return res.end(`<!doctype html><meta charset="utf-8">${PAGES[url.slice(6)]}`);
	}
	try {
		const body = readFileSync(join(root, url));
		res.setHeader("content-type", extname(url) === ".svg" ? "image/svg+xml" : "application/octet-stream");
		res.end(body);
	} catch {
		res.statusCode = 404;
		res.end();
	}
});
await new Promise((r) => server.listen(0, r));
const { port } = server.address();

const browser = await chromium.launch();
for (const name of Object.keys(PAGES)) {
	const page = await browser.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 2 });
	await page.goto(`http://localhost:${port}/page/${name}`, { waitUntil: "networkidle" });
	await page.screenshot({ path: join(root, "screenshots", name), fullPage: name === "icons.png" });
	console.log(`screenshots/${name}`);
}
await browser.close();
server.close();
