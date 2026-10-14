// Generates icons/, file_icons.json and folder_icons.json from the
// @dev.icons/core sprite (https://devicons.io) and scripts/mappings.mjs.
// Run with `npm run build`.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fileExtensions, fileNames, folderNames } from "./mappings.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const sprite = readFileSync(require.resolve("@dev.icons/core/sprite"), "utf8");

// Replacement for logos drawn only in black/near-black (or currentColor),
// so they stay visible on dark editor themes.
const MONO_COLOR = "#A8A8A8";

function luminance(hex) {
	let h = hex.slice(1);
	if (h.length === 3) h = [...h].map((c) => c + c).join("");
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const HEX = /#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi;

function fixMonochrome(svg, color) {
	let out = svg
		.replace(/currentColor/g, color || MONO_COLOR)
		.replace(/(["':\s])black\b/gi, "$1#000000");
	// White details (Rust, Next.js, .env…) don't count: a logo that is
	// otherwise all dark still disappears on a dark background.
	const colors = (out.match(HEX) || []).filter((c) => luminance(c) < 0.95);
	if (colors.length && colors.every((c) => luminance(c) < 0.2)) {
		out = out.replace(HEX, (c) => (luminance(c) < 0.2 ? MONO_COLOR : c));
	}
	return out;
}

// Split the sprite into standalone SVG files.
const icons = new Map();
for (const [, attrs, body] of sprite.matchAll(/<symbol\b([^>]*)>([\s\S]*?)<\/symbol>/g)) {
	const id = attrs.match(/\bid="([^"]+)"/)[1];
	const color = attrs.match(/\bcolor="([^"]+)"/)?.[1];
	const rest = attrs
		.replace(/\s(id|xmlns|color)="[^"]*"/g, "")
		.trim();
	const xlink = body.includes("xlink:") ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : "";
	const svg = `<svg xmlns="http://www.w3.org/2000/svg"${xlink} ${rest}>${body}</svg>`;
	icons.set(id, fixMonochrome(svg, color));
}

// Compact "<name>-icon" logo marks read better at file-tree size.
const iconFor = (name) => (icons.has(`${name}-icon`) ? `${name}-icon` : name);

function collect(map, label) {
	const entries = new Map();
	for (const [name, values] of Object.entries(map)) {
		if (!icons.has(name)) throw new Error(`Unknown icon "${name}" in ${label}`);
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

// Ship only the icons the maps reference.
const used = new Set([...extensions.values(), ...files.values(), ...folders.values()].map(iconFor));
const iconsDir = join(root, "icons");
rmSync(iconsDir, { recursive: true, force: true });
mkdirSync(iconsDir);
for (const id of used) writeFileSync(join(iconsDir, `${id}.svg`), `${icons.get(id)}\n`);

// Generic folder icons (the set has none).
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
		const icon = iconFor(name);
		if (!byIcon.has(icon)) byIcon.set(icon, { name: icon });
		(byIcon.get(icon)[key] ??= []).push(value);
	}
	return byIcon;
}

const fileMap = group(files, "file_name");
for (const [icon, entry] of group(extensions, "file_extensions")) {
	fileMap.set(icon, { ...fileMap.get(icon), ...entry });
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
	`${used.size} of ${icons.size} SVGs, ${extensions.size} extensions, ${files.size} file names, ${folders.size} folder names`,
);
