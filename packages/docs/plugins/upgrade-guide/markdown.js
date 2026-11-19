// @ts-check
// Markdown helpers the plugin and the filtered page share. The line-level ones skip fenced code blocks and inline code
// spans, which is all the entries need: they never touch a `#` or a link inside code.

const FENCE = /^\s*(`{3,}|~{3,})/;
const INLINE_CODE = /(`+).*?(?<!`)\1(?!`)/g;
const INLINE_LINK = /\]\(\s*(<[^<>\n]*>|[^\s()<>]+)((?:\s+(?:"[^"]*"|'[^']*'))?\s*)\)/g;
const LINK_DEFINITION = /^(\s{0,3}\[[^\]]+\]:\s*)(<[^<>\n]*>|\S+)/;
const HEADING = /^(#{1,6})(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$/;
/** A Markdown file's frontmatter block, its YAML captured. The filtered page strips it from the `.md` copies too. */
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/**
 * Maps every line, telling `mapLine` whether the line is part of a fenced code block (its fences included).
 *
 * @param {string} markdown
 * @param {(line: string, inCode: boolean) => string} mapLine
 */
function mapLines(markdown, mapLine) {
  let fence = '';
  return markdown
    .split('\n')
    .map((line) => {
      if (fence) {
        const close = line.trim();
        if (close.startsWith(fence) && /^([`~])\1*$/.test(close)) {
          fence = '';
        }
        return mapLine(line, true);
      }
      const open = FENCE.exec(line);
      if (open) {
        fence = open[1];
        return mapLine(line, true);
      }
      return mapLine(line, false);
    })
    .join('\n');
}

/**
 * Maps the parts of a line outside inline code spans.
 *
 * @param {string} line
 * @param {(prose: string) => string} mapText
 */
function mapProse(line, mapText) {
  let out = '';
  let last = 0;
  for (const match of line.matchAll(INLINE_CODE)) {
    out += mapText(line.slice(last, match.index)) + match[0];
    last = match.index + match[0].length;
  }
  return out + mapText(line.slice(last));
}

/**
 * Maps the destination of every inline link, image and link definition outside code. `mapDestination` gets the
 * destination without its angle brackets and returns the new one.
 *
 * @param {string} markdown
 * @param {(destination: string) => string} mapDestination
 */
function mapLinks(markdown, mapDestination) {
  /** @param {string} destination */
  const map = (destination) => {
    const unwrapped = destination.startsWith('<') ? destination.slice(1, -1) : destination;
    const mapped = mapDestination(unwrapped);
    return /[\s<>()]/.test(mapped) ? `<${mapped}>` : mapped;
  };
  return mapLines(markdown, (line, inCode) =>
    inCode
      ? line
      : mapProse(line, (prose) =>
          prose
            .replace(INLINE_LINK, (_, destination, title) => `](${map(destination)}${title})`)
            .replace(LINK_DEFINITION, (_, label, destination) => `${label}${map(destination)}`),
        ),
  );
}

/**
 * The link destinations outside code, without angle brackets.
 *
 * @param {string} markdown
 */
function linkDestinations(markdown) {
  /** @type {string[]} */
  const destinations = [];
  mapLinks(markdown, (destination) => {
    destinations.push(destination);
    return destination;
  });
  return destinations;
}

/**
 * The ATX headings outside code.
 *
 * @param {string} markdown
 * @returns {{ level: number; text: string }[]}
 */
function headings(markdown) {
  /** @type {{ level: number; text: string }[]} */
  const found = [];
  mapLines(markdown, (line, inCode) => {
    const match = inCode ? null : HEADING.exec(line);
    if (match) {
      found.push({ level: match[1].length, text: (match[2] ?? '').trim() });
    }
    return line;
  });
  return found;
}

/**
 * Moves every heading outside code `levels` levels deeper, capped at `######`.
 *
 * @param {string} markdown
 * @param {number} levels
 */
function demoteHeadings(markdown, levels) {
  return mapLines(markdown, (line, inCode) =>
    inCode ? line : line.replace(/^#{1,6}(?=[ \t]|$)/, (hashes) => '#'.repeat(Math.min(6, hashes.length + levels))),
  );
}

/** @param {string[]} values */
function codes(values) {
  return values.map((value) => `\`${value}\``);
}

/** @param {string[]} values */
function codeList(values) {
  return codes(values).join(', ');
}

/**
 * `a`, `a and b`, `a, b and c`, with `or` for `conjunction: 'or'`.
 *
 * @param {string[]} values
 * @param {string} [conjunction]
 */
function andList(values, conjunction = 'and') {
  return values.length > 1 ? `${values.slice(0, -1).join(', ')} ${conjunction} ${values.at(-1)}` : values.join('');
}

module.exports = { FRONT_MATTER, mapLinks, linkDestinations, headings, demoteHeadings, codes, codeList, andList };
