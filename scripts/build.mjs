// Generates icons/, file_icons.json and folder_icons.json from the devicon
// npm package and scripts/mappings.mjs. Run with `npm run build`.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fileExtensions, fileNames, folderNames } from "./mappings.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const deviconDir = dirname(require.resolve("devicon/devicon.json"));
const devicons = new Map(
	require("devicon/devicon.json").map((icon) => [icon.name, icon]),
);

// Preferred SVG variants, most iconic first.
const VARIANTS = ["original", "plain", "original-wordmark", "plain-wordmark", "line", "line-wordmark"];
// Replacement for icons drawn only in black/near-black, so they stay
// visible on dark editor themes.
const MONO_COLOR = "#A8A8A8";
// Icons whose preferred variant is unreadable on dark themes.
const VARIANT_OVERRIDES = { bash: "plain", unity: "plain", yaml: "plain" };

// Returns the icon id (SVG file name without extension) used for `name`.
function pickSvg(name) {
	const dir = join(deviconDir, "icons", name);
	const variants = VARIANT_OVERRIDES[name] ? [VARIANT_OVERRIDES[name], ...VARIANTS] : VARIANTS;
	for (const variant of variants) {
		if (existsSync(join(dir, `${name}-${variant}.svg`))) return `${name}-${variant}`;
	}
	throw new Error(`No SVG found for devicon "${name}"`);
}

function luminance(hex) {
	let h = hex.slice(1);
	if (h.length === 3) h = [...h].map((c) => c + c).join("");
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function fixMonochrome(svg) {
	const normalized = svg.replace(/(["':\s])black\b/gi, "$1#000000");
	const colors = normalized.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) || [];
	if (!colors.length) {
		// No explicit color: everything renders in the default black fill.
		return normalized.replace(/<svg\b/, `<svg fill="${MONO_COLOR}"`);
	}
	if (colors.every((c) => luminance(c) < 0.2)) {
		return normalized.replace(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi, MONO_COLOR);
	}
	return svg;
}

function collect(map, label) {
	const entries = new Map();
	for (const [name, values] of Object.entries(map)) {
		if (!devicons.has(name)) throw new Error(`Unknown devicon "${name}" in ${label}`);
		for (const value of values) {
			if (entries.has(value)) {
				throw new Error(`${label}: "${value}" mapped to both ${entries.get(value)} and ${name}`);
			}
			entries.set(value, name);
		}
	}
	return entries;
}

const extensions = collect(fileExtensions, "fileExtensions");
const files = collect(fileNames, "fileNames");
const folders = collect(folderNames, "folderNames");

// Every technology also gets its folder: `docker/`, `react/`, `arm64/`…
for (const icon of devicons.values()) {
	for (const folder of [icon.name, ...(icon.altnames || [])]) {
		const key = folder.toLowerCase();
		if (!/^[\w.+-]+$/.test(key) || folders.has(key)) continue;
		folders.set(key, icon.name);
	}
}

// Ship every SVG variant, flattened to icons/<name>-<variant>.svg.
const iconsDir = join(root, "icons");
rmSync(iconsDir, { recursive: true, force: true });
mkdirSync(iconsDir);

let svgCount = 0;
for (const name of devicons.keys()) {
	const dir = join(deviconDir, "icons", name);
	for (const file of readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
		const svg = readFileSync(join(dir, file), "utf8").trim();
		writeFileSync(join(iconsDir, file), `${fixMonochrome(svg)}\n`);
		svgCount++;
	}
}

const iconIds = new Map([...devicons.keys()].map((name) => [name, pickSvg(name)]));
for (const entries of [extensions, files, folders]) {
	for (const [value, name] of entries) entries.set(value, iconIds.get(name));
}

// Generic folder icons (Devicon has none).
const FOLDER = "M3 6.5A1.5 1.5 0 0 1 4.5 5h5.4l2 2h7.6A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z";
const FOLDER_OPEN = "M3 6.5A1.5 1.5 0 0 1 4.5 5h5.4l2 2h6.6A1.5 1.5 0 0 1 20 8.5V10H7.2a1.5 1.5 0 0 0-1.4 1L3.6 17.6 3 17.5zM7.6 11h14.1l-2.6 7.2a1.2 1.2 0 0 1-1.1.8H4.4z";
const folderSvg = (path, color) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${path}"/></svg>\n`;
writeFileSync(join(iconsDir, "folder.svg"), folderSvg(FOLDER, "#90A4AE"));
writeFileSync(join(iconsDir, "folder-open.svg"), folderSvg(FOLDER_OPEN, "#90A4AE"));
writeFileSync(join(iconsDir, "folder-root.svg"), folderSvg(FOLDER, "#5C9BD6"));
writeFileSync(join(iconsDir, "folder-root-open.svg"), folderSvg(FOLDER_OPEN, "#5C9BD6"));

// Same shape as the Material Icons maps consumed by main.js.
function group(entries, key) {
	const byIcon = new Map();
	for (const [value, name] of entries) {
		if (!byIcon.has(name)) byIcon.set(name, { name });
		(byIcon.get(name)[key] ??= []).push(value);
	}
	return byIcon;
}

const fileMap = group(files, "file_name");
for (const [name, entry] of group(extensions, "file_extensions")) {
	fileMap.set(name, { ...fileMap.get(name), ...entry });
}
const sortByName = (a, b) => a.name.localeCompare(b.name);
writeFileSync(
	join(root, "file_icons.json"),
	`${JSON.stringify([...fileMap.values()].sort(sortByName), null, "\t")}\n`,
);
writeFileSync(
	join(root, "folder_icons.json"),
	`${JSON.stringify([...group(folders, "folder_name").values()].sort(sortByName), null, "\t")}\n`,
);

console.log(
	`${svgCount} SVGs (${devicons.size} technologies), ${extensions.size} extensions, ${files.size} file names, ${folders.size} folder names`,
);
