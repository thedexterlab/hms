const fs = require("fs");
const path = require("path");

const distDir = path.resolve("dist");

const priorityTargets = [
  "/services/local-seo/",
  "/guides/website-development-cost/",
  "/guides/how-much-do-seo-services-cost/",
  "/guides/web-design-vs-web-development/"
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    return entry.isDirectory()
      ? walk(fullPath)
      : [fullPath];
  });
}

function fileToRoute(filePath) {
  const relative = path
    .relative(distDir, filePath)
    .replaceAll("\\", "/");

  if (relative === "index.html") return "/";

  if (relative.endsWith("/index.html")) {
    return `/${relative.replace(/index\.html$/, "")}`;
  }

  if (relative.endsWith(".html")) {
    return `/${relative.replace(/\.html$/, "/")}`;
  }

  return null;
}

function normalizeHref(href, sourceRoute) {
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return null;
  }

  try {
    const url = new URL(
      href,
      `https://zyronexlab.com${sourceRoute}`
    );

    if (url.hostname !== "zyronexlab.com") return null;

    let pathname = url.pathname;

    if (
      pathname !== "/" &&
      !pathname.endsWith("/") &&
      !path.extname(pathname)
    ) {
      pathname += "/";
    }

    return pathname;
  } catch {
    return null;
  }
}

if (!fs.existsSync(distDir)) {
  console.error("dist directory not found.");
  process.exit(1);
}

const htmlFiles = walk(distDir).filter((file) =>
  file.endsWith(".html")
);

const pages = htmlFiles
  .map((file) => ({
    file,
    route: fileToRoute(file),
    html: fs.readFileSync(file, "utf8")
  }))
  .filter((page) => page.route);

const inbound = new Map(
  pages.map((page) => [page.route, new Set()])
);

for (const page of pages) {
  const hrefs = [
    ...page.html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)
  ].map((match) => match[1]);

  for (const href of hrefs) {
    const target = normalizeHref(href, page.route);

    if (
      target &&
      inbound.has(target) &&
      target !== page.route
    ) {
      inbound.get(target).add(page.route);
    }
  }
}

console.log("\nPRIORITY PAGE INBOUND LINKS\n");

for (const target of priorityTargets) {
  const sources = [...(inbound.get(target) || [])].sort();

  console.log(`${target}`);
  console.log(`Inbound source pages: ${sources.length}`);

  if (sources.length) {
    sources.forEach((source) => console.log(`  <- ${source}`));
  } else {
    console.log("  ORPHAN / NO INBOUND LINKS FOUND");
  }

  console.log("");
}

console.log("\nLOW-INBOUND INDEXABLE ROUTES\n");

[...inbound.entries()]
  .filter(([route]) =>
    ![
      "/privacy-policy/",
      "/terms-of-service/",
      "/cookies/"
    ].includes(route)
  )
  .map(([route, sources]) => ({
    route,
    count: sources.size
  }))
  .filter((item) => item.count <= 1)
  .sort((a, b) =>
    a.count - b.count || a.route.localeCompare(b.route)
  )
  .forEach((item) => {
    console.log(`${item.count} inbound — ${item.route}`);
  });
