/**
 * Restores this repo's compact CSS house style after `prettier --write`.
 *
 * The stylesheet is hand-written one-rule-per-line (~900 lines). Prettier
 * expands every declaration onto its own line, ballooning it to ~4600 lines
 * and turning any real diff into noise. Prettier has never been run on this
 * file here, so we put it back the way it was authored.
 *
 * SAFETY: this only ever moves whitespace. The script verifies the
 * whitespace-stripped token stream is identical before and after and exits
 * non-zero if not, so a formatting bug can never silently change meaning.
 *
 * Usage: node scripts/reflow-css.mjs src/styles.css [--write]
 */
import { readFileSync, writeFileSync } from "node:fs";

const path = process.argv[2];
const write = process.argv.includes("--write");
if (!path) {
  console.error("usage: node scripts/reflow-css.mjs <file.css> [--write]");
  process.exit(2);
}

const source = readFileSync(path, "utf8");

/** Two files are semantically equal iff these match. */
const signature = (text) => text.replace(/\s+/g, "");

/**
 * Reflows CSS to the house style.
 *
 * Parses into a small tree (rules, at-rules, comments) then renders:
 *  - a leaf rule becomes one line: `sel { a: b; c: d; }`
 *  - a block whose body is only custom properties stays one-per-line, which
 *    is how `@theme` / `:root` are authored throughout this file
 *  - a container (`@media`, `@layer`) keeps its nested rules on separate,
 *    indented lines
 *
 * Comments and quoted strings are copied verbatim, so braces inside them can
 * never be mistaken for structure.
 */
function parse(css) {
  let i = 0;

  /** Reads a comment, string, or "chunk up to the next structural char". */
  function readComment() {
    const end = css.indexOf("*/", i + 2);
    const stop = end === -1 ? css.length : end + 2;
    const text = css.slice(i, stop);
    i = stop;
    return text;
  }

  function readString() {
    const quote = css[i];
    let j = i + 1;
    while (j < css.length && css[j] !== quote) j += css[j] === "\\" ? 2 : 1;
    const text = css.slice(i, j + 1);
    i = j + 1;
    return text;
  }

  /**
   * Collects selector/at-rule text up to the next `{`, stopping at `}` or `;`
   * too. Comments encountered mid-header are emitted as separate nodes rather
   * than glued onto the selector, so a comment sitting above a rule is never
   * swallowed into it.
   */
  function readHeader() {
    let text = "";
    const pending = [];
    while (i < css.length) {
      const char = css[i];
      if (char === "{" || char === "}" || char === ";") break;
      if (char === "/" && css[i + 1] === "*") {
        if (text.trim() === "") {
          // Leading comment in the header: flush it out on its own.
          pending.push({ kind: "comment", text: readComment() });
          continue;
        }
        text += readComment();
        continue;
      }
      if (char === '"' || char === "'") {
        text += readString();
        continue;
      }
      text += char;
      i += 1;
    }
    return { text: text.trim(), pending };
  }

  /**
   * Reads the declarations inside a leaf block (one that has no `{`), splitting
   * them on `;` so each can be emitted separately. Comments encountered along
   * the way are preserved as their own nodes.
   */
  function parseDeclarations() {
    const nodes = [];
    let declaration = "";
    const flush = () => {
      const text = declaration.trim();
      if (text) nodes.push({ kind: "statement", text });
      declaration = "";
    };
    while (i < css.length) {
      const char = css[i];
      if (char === "}" || char === "{") break;
      if (char === "/" && css[i + 1] === "*") {
        flush();
        nodes.push({ kind: "comment", text: readComment() });
        continue;
      }
      if (char === '"' || char === "'") {
        declaration += readString();
        continue;
      }
      if (char === ";") {
        flush();
        i += 1;
        continue;
      }
      declaration += char;
      i += 1;
    }
    flush();
    return nodes;
  }

  function parseNodes(stopAtBrace) {
    const nodes = [];
    while (i < css.length) {
      const char = css[i];
      if (char === "}") {
        if (stopAtBrace) return nodes;
        i += 1; // stray closer at top level: drop it
        continue;
      }
      if (/\s/.test(char)) {
        i += 1;
        continue;
      }
      if (char === "/" && css[i + 1] === "*") {
        nodes.push({ kind: "comment", text: readComment() });
        continue;
      }
      // A header may start with any of: an at-rule, a class/id/attr/pseudo
        // selector, a tag name, or -- inside `@keyframes` -- a percentage
        // selector such as `0%` / `100%` / `50%,100%`.
        if (char === "@" || /[.#:[\]&*>+~a-zA-Z0-9%-]/.test(char)) {
        const { text: header, pending } = readHeader();
        nodes.push(...pending);
        if (i >= css.length || css[i] !== "{") {
          // Statement such as `@import "x";`. `readHeader` stops *at* the
          // semicolon, so re-emit it or the next statement would run on.
          if (header) nodes.push({ kind: "statement", text: header + ";" });
          if (i < css.length && css[i] === ";") i += 1;
          continue;
        }
        i += 1; // consume '{'
        const isAtRule = header.startsWith("@");
        // At-rules that hold declarations rather than nested rules (@theme,
        // @font-face, @property) need their body split on `;`. Everything
        // else holds nested rules, which parseNodes walks directly.
        const bodyIsDeclarations = !isAtRule || /^(?:@theme|@font-face|@property)\b/.test(header);
        let children;
        if (bodyIsDeclarations) {
          children = parseDeclarations();
          if (i < css.length && css[i] === "}") i += 1;
        } else {
          children = parseNodes(true);
          if (i < css.length && css[i] === "}") i += 1; // consume '}'
        }
        nodes.push({ kind: "block", header, children });
        continue;
      }
      // Anything else (stray punctuation): consume it as part of the stream.
      i += 1;
    }
    return nodes;
  }

  return parseNodes(false);
}

/** True when every declaration in a block is a custom property. */
function isPropertyBag(children) {
  if (children.length === 0) return false;
  return children.every((child) => child.kind === "comment" || (child.kind === "statement" && child.text.startsWith("--")));
}

function render(nodes, depth) {
  const indent = "  ".repeat(depth);
  const lines = [];
  for (const node of nodes) {
    if (node.kind === "comment") {
      lines.push(indent + node.text);
      continue;
    }
    if (node.kind === "statement") {
      lines.push(indent + node.text);
      continue;
    }
    if (isPropertyBag(node.children)) {
      const body = node.children
        .filter((child) => child.kind === "statement")
        .map((child) => `${indent}  ${child.text};`)
        .join("\n");
      lines.push(`${indent}${node.header} {\n${body}\n${indent}}`);
      continue;
    }
    // Leaf rule: inline the declarations onto one line. Comments inside the body
    // and any nested blocks are preserved rather than dropped, and kept in
    // their original order -- reordering them would be a real, subtle edit.
    const nested = node.children.filter((child) => child.kind === "block");
    // `ordered` keeps declarations and comments interleaved as authored.
    const ordered = node.children
      .filter((child) => child.kind !== "block")
      .map((child) => (child.kind === "comment" ? child.text : child.text.trim().endsWith(";") ? child.text : `${child.text};`));

    if (ordered.length === 0 && nested.length === 0) {
      // A container holding only comments.
      lines.push(`${indent}${node.header} {`);
      for (const child of node.children) if (child.kind === "comment") lines.push(`${indent}  ${child.text}`);
      lines.push(`${indent}}`);
      continue;
    }

    // A comment sitting between declarations cannot be inlined onto one line
    // without reordering it, so render that block expanded instead. Nested
    // blocks and comments are emitted in source order so nothing is reordered.
    const interiorComment = ordered.some((item) => item.startsWith("/*"));
    const hasDeclaration = ordered.some((item) => !item.startsWith("/*"));

    if (nested.length > 0 || (interiorComment && hasDeclaration)) {
      lines.push(`${indent}${node.header} {`);
      for (const child of node.children) {
        if (child.kind === "block") lines.push(...render([child], depth + 1));
        else if (child.kind === "comment") lines.push(`${indent}  ${child.text}`);
        else {
          const text = child.text.trim().endsWith(";") ? child.text : `${child.text};`;
          lines.push(`${indent}  ${text}`);
        }
      }
      lines.push(`${indent}}`);
      continue;
    }
    lines.push(`${indent}${node.header} { ${ordered.join(" ")} }`);
  }
  return lines;
}

/** Renders the tree, inserting a blank line between top-level rules. */
function reflow(css) {
  const nodes = parse(css);
  const top = render(nodes, 0);
  return top.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

const result = reflow(source);
const before = signature(source);
const after = signature(result);

if (before !== after) {
  console.error(`REFLOW ABORTED: semantics changed for ${path}`);
  console.error(`  before=${before.length} after=${after.length}`);
  let k = 0;
  while (k < before.length && before[k] === after[k]) k += 1;
  console.error(`  diverges at char ${k}:`);
  const lo = Math.max(0, k - 70);
  console.error(`    expected: ${JSON.stringify(before.slice(lo, k + 70))}`);
  console.error(`    actual:   ${JSON.stringify(after.slice(lo, k + 70))}`);
  console.error(`    got "${after[k]}" (${after.charCodeAt(k)}), wanted "${before[k]}" (${before.charCodeAt(k)})`);
  process.exit(1);
}

console.log(`${path}: ${source.split("\n").length} -> ${result.split("\n").length} lines; signature verified identical (${after.length} chars)`);
if (write) {
  writeFileSync(path, result, "utf8");
  console.log("  written");
}