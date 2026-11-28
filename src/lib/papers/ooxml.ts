/**
 * XeroxQ Papers — Secure OOXML (.docx) & Legacy (.doc) Inspection, DOM Editor, and Builder
 *
 * Uses @xmldom/xmldom + JSZip for structural XML editing (never corrupting nested tags,
 * drawings, headers, footers, tables, or styles) and word-extractor for legacy binary .doc files.
 */

import JSZip from "jszip";
import {
  DOMParser,
  XMLSerializer,
  type Document,
  type Element,
  type Node,
} from "@xmldom/xmldom";

export const MAX_WORD_FILE_BYTES = 25 * 1024 * 1024; // 25 MB upload limit
const MAX_UNCOMPRESSED_XML_BYTES = 12 * 1024 * 1024; // 12 MB per XML file (zip-bomb defense)
const MAX_TOTAL_INSPECTED_BYTES = 40 * 1024 * 1024; // 40 MB cumulative ZIP XML cap

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

// ─── File Validation & Sanitization ──────────────────────────────────────────

export type WordFileFormat = "docx" | "doc";

export interface DetectedWordFormat {
  declaredExt: WordFileFormat;
  actualContainer: "zip" | "ole2";
}

/**
 * Strips XML 1.0 illegal control characters (prevents corrupted .docx files in Microsoft Word).
 */
export function sanitizeXmlText(input: string): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Blocks DOCTYPE / ENTITY declarations to neutralize XXE and Billion-Laughs attacks.
 */
function assertSafeXml(xml: string, entryName: string): void {
  if (/<!(?:DOCTYPE|ENTITY)\b/i.test(xml)) {
    throw new Error(
      `Unsupported XML declarations detected in "${entryName}". Please save a clean copy in Word and re-upload.`
    );
  }
}

/**
 * Validates file extension, size, and binary magic header.
 */
export function validateWordSignature(
  fileName: string,
  buffer: Buffer
): DetectedWordFormat {
  if (!buffer || buffer.length < 4) {
    throw new Error("This file appears empty or incomplete.");
  }
  if (buffer.length > MAX_WORD_FILE_BYTES) {
    throw new Error("File is too large. Please keep documents under 25 MB.");
  }

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext !== "docx" && ext !== "doc") {
    throw new Error(
      "Only Word documents (.docx or .doc) are supported here."
    );
  }

  const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b;
  const isOle2 =
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0;

  // Handle .doc files that are actually saved as OOXML internally, or genuine .docx
  if (isZip) {
    return { declaredExt: ext, actualContainer: "zip" };
  }
  if (isOle2 && ext === "doc") {
    return { declaredExt: "doc", actualContainer: "ole2" };
  }
  if (isOle2 && ext === "docx") {
    // Allow legacy OLE2 binary even if user renamed .doc -> .docx
    return { declaredExt: "doc", actualContainer: "ole2" };
  }

  throw new Error(
    "This file doesn't appear to be a valid Word (.docx or .doc) document. If it's an RTF or PDF renamed to .doc, please save it properly as .docx first."
  );
}

/**
 * Safely loads a DOCX ZIP container with zip-bomb decompression size limits.
 */
async function loadSafeDocxZip(buffer: Buffer): Promise<JSZip> {
  const zip = await JSZip.loadAsync(buffer);
  const docEntry = zip.file("word/document.xml");
  if (!docEntry) {
    throw new Error(
      "Could not find document contents inside this .docx file. Make sure it isn't encrypted or corrupted."
    );
  }

  // Enforce uncompressed bounds across XML parts
  let totalBytes = 0;
  const xmlEntries = Object.values(zip.files).filter(
    (f) => !f.dir && /\.(xml|rels)$/i.test(f.name)
  );
  for (const entry of xmlEntries) {
    const content = await entry.async("uint8array");
    if (content.byteLength > MAX_UNCOMPRESSED_XML_BYTES) {
      throw new Error("Document XML exceeds safe processing limits.");
    }
    totalBytes += content.byteLength;
    if (totalBytes > MAX_TOTAL_INSPECTED_BYTES) {
      throw new Error("Document structure exceeds safe processing limits.");
    }
  }

  return zip;
}

// ─── DOM Helpers (Namespace-safe for Word, Google Docs, LibreOffice) ─────────

function localName(node: Node | null | undefined): string {
  if (!node) return "";
  const el = node as Element;
  if (el.localName) return el.localName;
  const name = node.nodeName || "";
  const colon = name.indexOf(":");
  return colon >= 0 ? name.slice(colon + 1) : name;
}

function getDirectChildrenByLocalName(parent: Element, targetLocal: string): Element[] {
  const out: Element[] = [];
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes.item(i);
    if (child && child.nodeType === 1 && localName(child) === targetLocal) {
      out.push(child as Element);
    }
  }
  return out;
}

function getFirstDirectChild(parent: Element, targetLocal: string): Element | null {
  for (let i = 0; i < parent.childNodes.length; i++) {
    const child = parent.childNodes.item(i);
    if (child && child.nodeType === 1 && localName(child) === targetLocal) {
      return child as Element;
    }
  }
  return null;
}

function findDescendantsByLocalName(root: Element, targetLocal: string): Element[] {
  const out: Element[] = [];
  const walk = (el: Element) => {
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes.item(i);
      if (child && child.nodeType === 1) {
        const elem = child as Element;
        if (localName(elem) === targetLocal) {
          out.push(elem);
        }
        walk(elem);
      }
    }
  };
  walk(root);
  return out;
}

function getWAttr(el: Element, attrLocal: string): string | null {
  if (!el.attributes) return null;
  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes.item(i);
    if (!attr) continue;
    const name = attr.localName || attr.name.split(":").pop() || "";
    if (name === attrLocal) return attr.value;
  }
  return null;
}

function parseXmlDom(xml: string, entryName: string): Document {
  assertSafeXml(xml, entryName);
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (!doc || !doc.documentElement) {
    throw new Error(`Could not parse XML inside "${entryName}".`);
  }
  return doc;
}

function getDocRoot(doc: Document, entryName = "XML"): Element {
  if (!doc.documentElement) {
    throw new Error(`Could not parse XML root inside "${entryName}".`);
  }
  return doc.documentElement;
}

function serializeXmlDom(doc: Document): string {
  return new XMLSerializer().serializeToString(doc);
}

// ─── Style Discovery & Block Extraction ──────────────────────────────────────

export interface StylePalette {
  titleStyleId?: string;
  subtitleStyleId?: string;
  heading1StyleId?: string;
  heading2StyleId?: string;
  heading3StyleId?: string;
  normalStyleId?: string;
  listStyleId?: string;
}

export type BlockKind = "heading" | "paragraph" | "list" | "table-cell" | "header" | "footer";

export interface ExtractedBlock {
  id: number;
  kind: BlockKind;
  headingLevel?: number;
  styleId?: string;
  text: string;
  inFrontMatter: boolean;
  hasPlaceholder: boolean;
  partName: string;
}

export interface DocumentInspection {
  fileName: string;
  format: WordFileFormat;
  wordCount: number;
  estimatedPages: number;
  paragraphCount: number;
  tableCount: number;
  imageCount: number;
  headings: { level: number; text: string }[];
  placeholders: string[];
  headersFooters: string[];
  previewText: string;
  blockCount: number;
}

interface DomBlockRef {
  block: ExtractedBlock;
  pElement: Element;
  ownerDoc: Document;
  partName: string;
}

interface ParsedDocxModel {
  zip: JSZip;
  styles: StylePalette;
  docXmlDoc: Document;
  extraXmlDocs: Map<string, Document>; // header*.xml, footer*.xml
  domBlocks: DomBlockRef[];
  inspection: DocumentInspection;
}

function hasPlaceholderPattern(text: string): boolean {
  return (
    /\[[^\[\]\n]{2,60}\]/.test(text) ||
    /<<[^<>\n]{2,60}>>/.test(text) ||
    /<[A-Za-z][^<>\n]{2,40}>/.test(text) ||
    /_{4,}/.test(text) ||
    /\b(?:TBD|ENTER\s+YOUR|YOUR\s+NAME|STUDENT\s+NAME|PROJECT\s+TITLE|GUIDE\s+NAME|INSERT\s+HERE)\b/i.test(
      text
    )
  );
}

function extractPlaceholdersFromText(text: string): string[] {
  const matches: string[] = [];
  const re = /(\[[^\[\]\n]{2,50}\]|<<[^<>\n]{2,50}>>|___{2,})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    matches.push(m[1].trim());
  }
  return matches;
}

function discoverStyles(stylesXml: string | null): StylePalette {
  const palette: StylePalette = {};
  if (!stylesXml) return palette;

  try {
    const doc = parseXmlDom(stylesXml, "word/styles.xml");
    const styleEls = findDescendantsByLocalName(
      getDocRoot(doc, "word/styles.xml"),
      "style"
    );

    for (const st of styleEls) {
      if (getWAttr(st, "type") !== "paragraph") continue;
      const styleId = getWAttr(st, "styleId") || "";
      const nameEl = getFirstDirectChild(st, "name");
      const styleName = (nameEl ? getWAttr(nameEl, "val") : styleId) || styleId;
      const norm = styleName.trim().toLowerCase();

      if (norm === "title" && !palette.titleStyleId) palette.titleStyleId = styleId;
      else if (norm === "subtitle" && !palette.subtitleStyleId) palette.subtitleStyleId = styleId;
      else if ((norm === "heading 1" || norm === "heading1") && !palette.heading1StyleId)
        palette.heading1StyleId = styleId;
      else if ((norm === "heading 2" || norm === "heading2") && !palette.heading2StyleId)
        palette.heading2StyleId = styleId;
      else if ((norm === "heading 3" || norm === "heading3") && !palette.heading3StyleId)
        palette.heading3StyleId = styleId;
      else if (norm === "normal" && !palette.normalStyleId) palette.normalStyleId = styleId;
      else if ((norm === "list paragraph" || norm === "listparagraph") && !palette.listStyleId)
        palette.listStyleId = styleId;
    }
  } catch {
    // Non-fatal: fall back to inline heading formatting if styles.xml is minimal
  }

  return palette;
}

/**
 * Extracts visible text inside a <w:p> element while ignoring field instruction codes (<w:instrText>)
 * and alternate fallback text inside drawings (<mc:Fallback> or <a:t>).
 */
function extractParagraphTextAndFlags(pEl: Element): {
  text: string;
  isFieldOnlyOrToc: boolean;
  hasDrawing: boolean;
  hasPageBreak: boolean;
} {
  let text = "";
  let hasFieldCode = false;
  let isTocOrPageField = false;
  let hasDrawing = false;
  let hasPageBreak = false;

  const walkRun = (node: Element, inAlternateFallback = false) => {
    const name = localName(node);
    if (name === "Fallback" || name === "txbxContent") {
      // Skip Fallback duplicate text; handle txbxContent separately only if top-level
      if (name === "Fallback") return;
    }
    if (name === "drawing" || name === "pict" || name === "object") {
      hasDrawing = true;
      return; // Do not scrape text inside diagrams/charts/textboxes as main run text
    }
    if (name === "fldSimple") {
      const instr = getWAttr(node, "instr") || "";
      if (/\b(?:TOC|PAGE|NUMPAGES|PAGEREF|SEQ|REF)\b/i.test(instr)) {
        isTocOrPageField = true;
      }
      hasFieldCode = true;
    }
    if (name === "instrText") {
      const instrVal = node.textContent || "";
      if (/\b(?:TOC|PAGE|NUMPAGES|PAGEREF)\b/i.test(instrVal)) {
        isTocOrPageField = true;
      }
      hasFieldCode = true;
      return;
    }
    if (name === "br") {
      const brType = getWAttr(node, "type");
      if (brType === "page") hasPageBreak = true;
      else text += "\n";
      return;
    }
    if (name === "tab") {
      text += "\t";
      return;
    }
    if (name === "t" && !inAlternateFallback) {
      text += node.textContent || "";
      return;
    }

    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes.item(i);
      if (child && child.nodeType === 1) {
        walkRun(child as Element, inAlternateFallback);
      }
    }
  };

  walkRun(pEl);
  const cleaned = text.replace(/\s+/g, " ").trim();
  const isFieldOnlyOrToc =
    isTocOrPageField || (hasFieldCode && cleaned.length === 0);

  return { text: cleaned, isFieldOnlyOrToc, hasDrawing, hasPageBreak };
}

function classifyParagraph(
  pEl: Element,
  text: string,
  palette: StylePalette
): { kind: "heading" | "paragraph" | "list"; headingLevel?: number; styleId?: string } {
  const pPr = getFirstDirectChild(pEl, "pPr");
  let styleId: string | undefined;
  let headingLevel: number | undefined;
  let hasNumPr = false;

  if (pPr) {
    const pStyle = getFirstDirectChild(pPr, "pStyle");
    styleId = (pStyle ? getWAttr(pStyle, "val") : undefined) || undefined;
    hasNumPr = Boolean(getFirstDirectChild(pPr, "numPr"));

    const outlineLvlEl = getFirstDirectChild(pPr, "outlineLvl");
    if (outlineLvlEl) {
      const lvl = Number(getWAttr(outlineLvlEl, "val"));
      if (!Number.isNaN(lvl) && lvl >= 0 && lvl <= 5) {
        headingLevel = lvl + 1;
      }
    }
  }

  if (styleId) {
    const norm = styleId.toLowerCase();
    if (
      styleId === palette.titleStyleId ||
      styleId === palette.subtitleStyleId ||
      norm === "title" ||
      norm === "subtitle"
    ) {
      return { kind: "heading", headingLevel: 1, styleId };
    }
    if (styleId === palette.heading1StyleId || /^heading\s*1$/i.test(norm)) {
      return { kind: "heading", headingLevel: 1, styleId };
    }
    if (styleId === palette.heading2StyleId || /^heading\s*2$/i.test(norm)) {
      return { kind: "heading", headingLevel: 2, styleId };
    }
    if (styleId === palette.heading3StyleId || /^heading\s*3$/i.test(norm)) {
      return { kind: "heading", headingLevel: 3, styleId };
    }
    const numMatch = norm.match(/heading\s*(\d)/i);
    if (numMatch) {
      return { kind: "heading", headingLevel: Number(numMatch[1]), styleId };
    }
    if (styleId === palette.listStyleId || norm.includes("list")) {
      return { kind: "list", styleId };
    }
  }

  if (headingLevel) {
    return { kind: "heading", headingLevel, styleId };
  }
  if (hasNumPr) {
    return { kind: "list", styleId };
  }

  // Heuristic for unstyled section headings (short, all-caps or numbered chapter headers)
  const looksLikeChapterHeading =
    text.length >= 3 &&
    text.length <= 90 &&
    !text.endsWith(".") &&
    (/^(?:CHAPTER|SECTION|ABSTRACT|INTRODUCTION|ACKNOWLEDGEMENT|CERTIFICATE|DECLARATION|CONCLUSION|REFERENCES|BIBLIOGRAPHY|METHODOLOGY|OBJECTIVES|LITERATURE REVIEW)\b/i.test(
      text
    ) ||
      /^\d+(?:\.\d+)*\.?\s+[A-Z]/.test(text));

  if (looksLikeChapterHeading) {
    return {
      kind: "heading",
      headingLevel: /^\d+\.\d+/.test(text) ? 2 : 1,
      styleId,
    };
  }

  return { kind: "paragraph", styleId };
}

/**
 * Traverses direct content containers (including <w:sdt><w:sdtContent> controls).
 */
function walkBodyContainers(
  container: Element,
  onParagraph: (pEl: Element, inTable: boolean) => void,
  onTableSeen: () => void,
  inTable = false
): void {
  for (let i = 0; i < container.childNodes.length; i++) {
    const child = container.childNodes.item(i);
    if (!child || child.nodeType !== 1) continue;
    const el = child as Element;
    const tag = localName(el);

    if (tag === "p") {
      onParagraph(el, inTable);
    } else if (tag === "tbl") {
      onTableSeen();
      const rows = getDirectChildrenByLocalName(el, "tr");
      for (const row of rows) {
        const cells = getDirectChildrenByLocalName(row, "tc");
        for (const cell of cells) {
          walkBodyContainers(cell, onParagraph, onTableSeen, true);
        }
      }
    } else if (tag === "sdt") {
      const sdtContent = getFirstDirectChild(el, "sdtContent");
      if (sdtContent) {
        walkBodyContainers(sdtContent, onParagraph, onTableSeen, inTable);
      }
    }
  }
}

async function parseDocxToModel(
  buffer: Buffer,
  fileName: string
): Promise<ParsedDocxModel> {
  const zip = await loadSafeDocxZip(buffer);
  const docXmlStr = await zip.file("word/document.xml")!.async("string");
  const docXmlDoc = parseXmlDom(docXmlStr, "word/document.xml");

  const stylesFile = zip.file("word/styles.xml");
  const stylesXmlStr = stylesFile ? await stylesFile.async("string") : null;
  const palette = discoverStyles(stylesXmlStr);

  const body = getFirstDirectChild(
    getDocRoot(docXmlDoc, "word/document.xml"),
    "body"
  );
  if (!body) {
    throw new Error("Could not locate body content in this Word document.");
  }

  const domBlocks: DomBlockRef[] = [];
  const headings: { level: number; text: string }[] = [];
  const placeholderSet = new Set<string>();
  const headersFooters: string[] = [];
  let tableCount = 0;
  let imageCount = 0;
  let passedFirstBodyHeading = false;

  const pushParagraph = (
    pEl: Element,
    ownerDoc: Document,
    partName: string,
    kindOverride?: BlockKind
  ) => {
    const { text, isFieldOnlyOrToc, hasDrawing, hasPageBreak } =
      extractParagraphTextAndFlags(pEl);
    if (hasDrawing) imageCount++;
    if (isFieldOnlyOrToc || !text) return;

    const classified = classifyParagraph(pEl, text, palette);
    const kind: BlockKind = kindOverride ?? classified.kind;

    if (
      !kindOverride &&
      classified.kind === "heading" &&
      /^(?:CHAPTER|ABSTRACT|INTRODUCTION|1\.?\s+INTRODUCTION|LITERATURE|METHODOLOGY|CONTENTS|TABLE OF CONTENTS)/i.test(
        text
      )
    ) {
      passedFirstBodyHeading = true;
    }

    const inFrontMatter =
      partName !== "word/document.xml"
        ? false
        : !passedFirstBodyHeading && (domBlocks.length < 24 || hasPageBreak);

    const hasPlaceholder = hasPlaceholderPattern(text);
    for (const ph of extractPlaceholdersFromText(text)) {
      placeholderSet.add(ph);
    }

    if (kind === "heading" && !kindOverride) {
      headings.push({ level: classified.headingLevel || 1, text });
    }

    const id = domBlocks.length;
    domBlocks.push({
      block: {
        id,
        kind,
        headingLevel: classified.headingLevel,
        styleId: classified.styleId,
        text,
        inFrontMatter,
        hasPlaceholder,
        partName,
      },
      pElement: pEl,
      ownerDoc,
      partName,
    });
  };

  walkBodyContainers(
    body,
    (pEl, inTable) =>
      pushParagraph(
        pEl,
        docXmlDoc,
        "word/document.xml",
        inTable ? "table-cell" : undefined
      ),
    () => {
      tableCount++;
    }
  );

  // Also inspect headers & footers (preserving page number fields)
  const extraXmlDocs = new Map<string, Document>();
  const headerFooterEntries = Object.keys(zip.files)
    .filter((n) => /^word\/(?:header|footer)\d*\.xml$/i.test(n))
    .sort();

  for (const entryName of headerFooterEntries) {
    const entry = zip.file(entryName);
    if (!entry) continue;
    try {
      const xmlStr = await entry.async("string");
      const xmlDoc = parseXmlDom(xmlStr, entryName);
      extraXmlDocs.set(entryName, xmlDoc);
      const isHeader = entryName.toLowerCase().includes("header");
      walkBodyContainers(
        getDocRoot(xmlDoc, entryName),
        (pEl) => {
          const prevLen = domBlocks.length;
          pushParagraph(pEl, xmlDoc, entryName, isHeader ? "header" : "footer");
          if (domBlocks.length > prevLen) {
            headersFooters.push(domBlocks[domBlocks.length - 1].block.text);
          }
        },
        () => {}
      );
    } catch {
      // Ignore malformed optional header/footer parts
    }
  }

  // Count media files in word/media/ as well
  const mediaFiles = Object.keys(zip.files).filter((n) =>
    n.startsWith("word/media/")
  );
  imageCount = Math.max(imageCount, mediaFiles.length);

  const fullBodyText = domBlocks
    .filter((b) => b.partName === "word/document.xml")
    .map((b) => b.block.text)
    .join("\n");
  const wordCount = fullBodyText ? fullBodyText.split(/\s+/).filter(Boolean).length : 0;

  return {
    zip,
    styles: palette,
    docXmlDoc,
    extraXmlDocs,
    domBlocks,
    inspection: {
      fileName,
      format: "docx",
      wordCount,
      estimatedPages: Math.max(1, Math.ceil(wordCount / 280)),
      paragraphCount: domBlocks.filter((b) => b.partName === "word/document.xml").length,
      tableCount,
      imageCount,
      headings: headings.slice(0, 30),
      placeholders: Array.from(placeholderSet).slice(0, 25),
      headersFooters: headersFooters.slice(0, 8),
      previewText: fullBodyText.slice(0, 4500),
      blockCount: domBlocks.length,
    },
  };
}

/**
 * Inspects a legacy binary .doc file using word-extractor, producing a normalized
 * inspection & editable paragraph list so it can be edited into a polished .docx or template.
 */
async function extractLegacyDocBlocks(
  buffer: Buffer,
  fileName: string
): Promise<{
  blocks: ExtractedBlock[];
  inspection: DocumentInspection;
}> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const WordExtractor = require("word-extractor");
  const extractor = new WordExtractor();

  let extracted: {
    getBody: (opts?: { filterUnicode?: boolean }) => string;
    getHeaders: (opts?: { includeFooters?: boolean; filterUnicode?: boolean }) => string;
    getTextboxes: (opts?: { includeHeadersAndFooters?: boolean; filterUnicode?: boolean }) => string;
  };

  try {
    extracted = await extractor.extract(buffer);
  } catch {
    throw new Error(
      "We couldn't read this .doc file — it may be password-protected or saved in an older format. Try saving it as .docx in Word or Google Docs and uploading again."
    );
  }

  const bodyRaw = (extracted.getBody({ filterUnicode: false }) || "").trim();
  const textboxesRaw = (extracted.getTextboxes({ filterUnicode: false }) || "").trim();
  const headersRaw = (
    extracted.getHeaders({ includeFooters: true, filterUnicode: false }) || ""
  ).trim();

  const combinedLines = [bodyRaw, textboxesRaw]
    .filter(Boolean)
    .join("\n")
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (combinedLines.length === 0) {
    throw new Error(
      "This .doc file looks empty or contains only scanned images with no text."
    );
  }

  const headings: { level: number; text: string }[] = [];
  const placeholderSet = new Set<string>();
  const blocks: ExtractedBlock[] = [];

  combinedLines.forEach((line, idx) => {
    const isHeading =
      line.length <= 90 &&
      !line.endsWith(".") &&
      (/^(?:CHAPTER|SECTION|ABSTRACT|INTRODUCTION|ACKNOWLEDGEMENT|CERTIFICATE|CONCLUSION|REFERENCES|METHODOLOGY|OBJECTIVES)\b/i.test(
        line
      ) ||
        /^\d+(?:\.\d+)*\.?\s+[A-Z]/.test(line) ||
        (idx === 0 && line.length <= 120));

    for (const ph of extractPlaceholdersFromText(line)) {
      placeholderSet.add(ph);
    }

    if (isHeading) headings.push({ level: 1, text: line });

    blocks.push({
      id: idx,
      kind: isHeading ? "heading" : "paragraph",
      headingLevel: isHeading ? 1 : undefined,
      text: line,
      inFrontMatter: idx < 12,
      hasPlaceholder: hasPlaceholderPattern(line),
      partName: "word/document.xml",
    });
  });

  const fullText = combinedLines.join("\n");
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  return {
    blocks,
    inspection: {
      fileName,
      format: "doc",
      wordCount,
      estimatedPages: Math.max(1, Math.ceil(wordCount / 280)),
      paragraphCount: blocks.length,
      tableCount: 0,
      imageCount: 0,
      headings: headings.slice(0, 30),
      placeholders: Array.from(placeholderSet).slice(0, 25),
      headersFooters: headersRaw
        ? headersRaw
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 6)
        : [],
      previewText: fullText.slice(0, 4500),
      blockCount: blocks.length,
    },
  };
}

/**
 * Inspects any valid Word document (.docx or .doc) without modifying it.
 */
export async function inspectWordDocument(
  buffer: Buffer,
  fileName: string
): Promise<DocumentInspection> {
  const sig = validateWordSignature(fileName, buffer);
  if (sig.actualContainer === "zip") {
    const model = await parseDocxToModel(buffer, fileName);
    return model.inspection;
  }
  const legacy = await extractLegacyDocBlocks(buffer, fileName);
  return legacy.inspection;
}

// ─── Clean OOXML Node Creation & Updating ─────────────────────────────────────

interface InlineSpan {
  text: string;
  bold: boolean;
}

/** Parses inline **bold** segments safely without leaking literal asterisks. */
function parseInlineSpans(raw: string): InlineSpan[] {
  const cleaned = sanitizeXmlText(raw);
  const parts = cleaned.split(/\*\*(.+?)\*\*/g);
  const spans: InlineSpan[] = [];

  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    if (!seg) continue;
    spans.push({ text: seg, bold: i % 2 === 1 });
  }
  return spans.length > 0 ? spans : [{ text: cleaned, bold: false }];
}

function createWElement(doc: Document, tagName: string): Element {
  return doc.createElementNS(W_NS, `w:${tagName}`);
}

function setWAttr(el: Element, attrName: string, val: string): void {
  el.setAttributeNS(W_NS, `w:${attrName}`, val);
}

/**
 * Populates a <w:p> element's text runs while keeping <w:pPr>, primary <w:rPr>,
 * and any drawings/pictures/bookmarks intact.
 */
function replaceParagraphTextPreservingFormatting(
  doc: Document,
  pEl: Element,
  newText: string
): void {
  const spans = parseInlineSpans(newText);

  // Locate first non-drawing run to borrow its formatting (<w:rPr>)
  let templateRPr: Element | null = null;
  const runsToRemove: Element[] = [];

  for (let i = 0; i < pEl.childNodes.length; i++) {
    const child = pEl.childNodes.item(i);
    if (!child || child.nodeType !== 1) continue;
    const el = child as Element;
    const tag = localName(el);

    if (tag === "r") {
      const hasMedia =
        findDescendantsByLocalName(el, "drawing").length > 0 ||
        findDescendantsByLocalName(el, "pict").length > 0 ||
        findDescendantsByLocalName(el, "object").length > 0 ||
        findDescendantsByLocalName(el, "fldChar").length > 0 ||
        findDescendantsByLocalName(el, "instrText").length > 0;
      if (hasMedia) continue;

      if (!templateRPr) {
        const rPr = getFirstDirectChild(el, "rPr");
        if (rPr) templateRPr = rPr.cloneNode(true) as Element;
      }
      runsToRemove.push(el);
    } else if (tag === "hyperlink") {
      // Replace hyperlink text cleanly as normal runs if rewritten
      runsToRemove.push(el);
    }
  }

  for (const r of runsToRemove) {
    pEl.removeChild(r);
  }

  for (const span of spans) {
    const r = createWElement(doc, "r");
    if (templateRPr || span.bold) {
      const rPr = templateRPr
        ? (templateRPr.cloneNode(true) as Element)
        : createWElement(doc, "rPr");
      if (span.bold && !getFirstDirectChild(rPr, "b")) {
        rPr.appendChild(createWElement(doc, "b"));
      }
      r.appendChild(rPr);
    }
    const t = createWElement(doc, "t");
    t.setAttribute("xml:space", "preserve");
    t.appendChild(doc.createTextNode(span.text));
    r.appendChild(t);
    pEl.appendChild(r);
  }
}

/** Creates a styled OOXML <w:p> using template/document styles cleanly. */
function buildStyledParagraphElement(
  doc: Document,
  palette: StylePalette,
  kind: "title" | "heading1" | "heading2" | "heading3" | "paragraph" | "bullet",
  rawText: string
): Element {
  const text = rawText.replace(/^#{1,4}\s+/, "").replace(/^[\-\*•]\s+/, "").trim();
  const p = createWElement(doc, "p");
  const pPr = createWElement(doc, "pPr");

  if (kind === "title") {
    if (palette.titleStyleId) {
      const ps = createWElement(doc, "pStyle");
      setWAttr(ps, "val", palette.titleStyleId);
      pPr.appendChild(ps);
    }
    const jc = createWElement(doc, "jc");
    setWAttr(jc, "val", "center");
    pPr.appendChild(jc);
    const sp = createWElement(doc, "spacing");
    setWAttr(sp, "before", "240");
    setWAttr(sp, "after", "200");
    pPr.appendChild(sp);
  } else if (kind === "heading1" || kind === "heading2" || kind === "heading3") {
    const mappedStyle =
      kind === "heading1"
        ? palette.heading1StyleId
        : kind === "heading2"
        ? palette.heading2StyleId
        : palette.heading3StyleId;
    if (mappedStyle) {
      const ps = createWElement(doc, "pStyle");
      setWAttr(ps, "val", mappedStyle);
      pPr.appendChild(ps);
    }
    pPr.appendChild(createWElement(doc, "keepNext"));
    const sp = createWElement(doc, "spacing");
    setWAttr(sp, "before", kind === "heading1" ? "320" : "220");
    setWAttr(sp, "after", "100");
    pPr.appendChild(sp);
  } else if (kind === "bullet") {
    if (palette.listStyleId) {
      const ps = createWElement(doc, "pStyle");
      setWAttr(ps, "val", palette.listStyleId);
      pPr.appendChild(ps);
    }
    const ind = createWElement(doc, "ind");
    setWAttr(ind, "left", "540");
    setWAttr(ind, "hanging", "270");
    pPr.appendChild(ind);
    const sp = createWElement(doc, "spacing");
    setWAttr(sp, "after", "100");
    setWAttr(sp, "line", "276");
    setWAttr(sp, "lineRule", "auto");
    pPr.appendChild(sp);
  } else {
    if (palette.normalStyleId) {
      const ps = createWElement(doc, "pStyle");
      setWAttr(ps, "val", palette.normalStyleId);
      pPr.appendChild(ps);
    }
    const sp = createWElement(doc, "spacing");
    setWAttr(sp, "after", "140");
    setWAttr(sp, "line", "276");
    setWAttr(sp, "lineRule", "auto");
    pPr.appendChild(sp);
  }

  p.appendChild(pPr);

  const displayText =
    kind === "bullet" && !palette.listStyleId ? `•\t${text}` : text;
  const spans = parseInlineSpans(displayText);

  for (const span of spans) {
    const r = createWElement(doc, "r");
    const rPr = createWElement(doc, "rPr");

    if (kind === "title") {
      if (!palette.titleStyleId) {
        rPr.appendChild(createWElement(doc, "b"));
        const sz = createWElement(doc, "sz");
        setWAttr(sz, "val", "40");
        rPr.appendChild(sz);
      }
    } else if (kind === "heading1" && !palette.heading1StyleId) {
      rPr.appendChild(createWElement(doc, "b"));
      const sz = createWElement(doc, "sz");
      setWAttr(sz, "val", "30");
      rPr.appendChild(sz);
    } else if (kind === "heading2" && !palette.heading2StyleId) {
      rPr.appendChild(createWElement(doc, "b"));
      const sz = createWElement(doc, "sz");
      setWAttr(sz, "val", "26");
      rPr.appendChild(sz);
    } else if (kind === "heading3" && !palette.heading3StyleId) {
      rPr.appendChild(createWElement(doc, "b"));
      const sz = createWElement(doc, "sz");
      setWAttr(sz, "val", "24");
      rPr.appendChild(sz);
    } else if (span.bold) {
      rPr.appendChild(createWElement(doc, "b"));
    }

    if (rPr.childNodes.length > 0) {
      r.appendChild(rPr);
    }
    const t = createWElement(doc, "t");
    t.setAttribute("xml:space", "preserve");
    t.appendChild(doc.createTextNode(span.text));
    r.appendChild(t);
    p.appendChild(r);
  }

  return p;
}

/** Creates a clean bordered OOXML <w:tbl> element. */
function buildStyledTableElement(
  doc: Document,
  palette: StylePalette,
  headers: string[],
  rows: string[][]
): Element {
  const tbl = createWElement(doc, "tbl");
  const tblPr = createWElement(doc, "tblPr");

  const tblW = createWElement(doc, "tblW");
  setWAttr(tblW, "w", "9360");
  setWAttr(tblW, "type", "dxa");
  tblPr.appendChild(tblW);

  const borders = createWElement(doc, "tblBorders");
  for (const edge of ["top", "left", "bottom", "right", "insideH", "insideV"]) {
    const b = createWElement(doc, edge);
    setWAttr(b, "val", "single");
    setWAttr(b, "sz", "4");
    setWAttr(b, "space", "0");
    setWAttr(b, "color", "D1D5DB");
    borders.appendChild(b);
  }
  tblPr.appendChild(borders);
  tbl.appendChild(tblPr);

  const allRows: { cells: string[]; isHeader: boolean }[] = [];
  if (headers.length > 0) allRows.push({ cells: headers, isHeader: true });
  for (const r of rows) {
    allRows.push({ cells: r, isHeader: false });
  }

  for (const rowDef of allRows) {
    const tr = createWElement(doc, "tr");
    for (const cellText of rowDef.cells) {
      const tc = createWElement(doc, "tc");
      const tcPr = createWElement(doc, "tcPr");
      if (rowDef.isHeader) {
        const shd = createWElement(doc, "shd");
        setWAttr(shd, "val", "clear");
        setWAttr(shd, "color", "auto");
        setWAttr(shd, "fill", "F3F4F6");
        tcPr.appendChild(shd);
      }
      tc.appendChild(tcPr);

      const formatted = rowDef.isHeader ? `**${cellText}**` : cellText;
      tc.appendChild(
        buildStyledParagraphElement(doc, palette, "paragraph", formatted)
      );
      tr.appendChild(tc);
    }
    tbl.appendChild(tr);
  }

  return tbl;
}

/** Creates a fresh publication-grade OOXML ZIP container when starting from .doc or scratch. */
async function createFreshAcademicDocxZip(
  title: string,
  paragraphs: { kind: "title" | "heading1" | "heading2" | "bullet" | "paragraph"; text: string }[]
): Promise<Buffer> {
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${W_NS}">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="1F2937"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="140" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="200"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="40"/><w:szCs w:val="40"/><w:color w:val="111827"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="30"/><w:szCs w:val="30"/><w:color w:val="111827"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="220" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="25"/><w:szCs w:val="25"/><w:color w:val="1F2937"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph">
    <w:name w:val="List Paragraph"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="540" w:hanging="270"/><w:spacing w:after="90" w:line="276" w:lineRule="auto"/></w:pPr>
  </w:style>
</w:styles>`;

  const baseDocXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W_NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
  );
  zip.folder("_rels")!.file(
    ".rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  const word = zip.folder("word")!;
  word.file("styles.xml", stylesXml);
  word.folder("_rels")!.file(
    "document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  const doc = parseXmlDom(baseDocXml, "word/document.xml");
  const body = getFirstDirectChild(getDocRoot(doc, "word/document.xml"), "body")!;
  const sectPr = getFirstDirectChild(body, "sectPr")!;
  const palette: StylePalette = {
    titleStyleId: "Title",
    heading1StyleId: "Heading1",
    heading2StyleId: "Heading2",
    normalStyleId: "Normal",
    listStyleId: "ListParagraph",
  };

  if (title && !paragraphs.some((p) => p.kind === "title")) {
    body.insertBefore(buildStyledParagraphElement(doc, palette, "title", title), sectPr);
  }
  for (const item of paragraphs) {
    body.insertBefore(buildStyledParagraphElement(doc, palette, item.kind, item.text), sectPr);
  }

  word.file("document.xml", serializeXmlDom(doc));
  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

// ─── Structured AI Edit Operations & Application ─────────────────────────────

export interface BlockUpdateOp {
  id: number;
  text?: string;
  paragraphs?: string[];
}

export interface AppendBlockDef {
  type: "paragraph" | "bullet" | "subheading" | "table";
  text?: string;
  headers?: string[];
  rows?: string[][];
}

export interface AppendSectionDef {
  heading: string;
  level?: 1 | 2 | 3;
  pageBreakBefore?: boolean;
  blocks: AppendBlockDef[];
}

export interface DocumentEditPlan {
  summary: string;
  updates: BlockUpdateOp[];
  removeIds: number[];
  appendSections: AppendSectionDef[];
}

export interface AppliedDocxResult {
  buffer: Buffer;
  sections: string[];
  originalWordCount: number;
  newWordCount: number;
}

/**
 * Loads the primary container (.docx template if provided, else user's .docx,
 * else builds a fresh structured OOXML shell) and applies all XML DOM edits safely.
 */
export async function prepareBaseContainerAndBlocks(options: {
  mainBuffer: Buffer;
  mainName: string;
  templateBuffer?: Buffer | null;
  templateName?: string | null;
}): Promise<{
  mode: "template-docx" | "main-docx" | "fresh-docx";
  targetModel?: ParsedDocxModel;
  editableBlocks: ExtractedBlock[];
  sourceTextBlocks: ExtractedBlock[];
  sourceInspection: DocumentInspection;
  templateInspection?: DocumentInspection;
}> {
  const mainSig = validateWordSignature(options.mainName, options.mainBuffer);
  const mainParsed =
    mainSig.actualContainer === "zip"
      ? await parseDocxToModel(options.mainBuffer, options.mainName)
      : await extractLegacyDocBlocks(options.mainBuffer, options.mainName);

  const mainBlocks =
    "domBlocks" in mainParsed
      ? mainParsed.domBlocks.map((d) => d.block)
      : mainParsed.blocks;

  if (options.templateBuffer && options.templateName) {
    const tSig = validateWordSignature(options.templateName, options.templateBuffer);
    if (tSig.actualContainer === "zip") {
      const templateModel = await parseDocxToModel(
        options.templateBuffer,
        options.templateName
      );
      return {
        mode: "template-docx",
        targetModel: templateModel,
        editableBlocks: templateModel.domBlocks.map((d) => d.block),
        sourceTextBlocks: mainBlocks,
        sourceInspection: mainParsed.inspection,
        templateInspection: templateModel.inspection,
      };
    }

    const legacyTemplate = await extractLegacyDocBlocks(
      options.templateBuffer,
      options.templateName
    );
    return {
      mode: "domBlocks" in mainParsed ? "main-docx" : "fresh-docx",
      targetModel: "domBlocks" in mainParsed ? mainParsed : undefined,
      editableBlocks: mainBlocks,
      sourceTextBlocks: mainBlocks,
      sourceInspection: mainParsed.inspection,
      templateInspection: legacyTemplate.inspection,
    };
  }

  return {
    mode: "domBlocks" in mainParsed ? "main-docx" : "fresh-docx",
    targetModel: "domBlocks" in mainParsed ? mainParsed : undefined,
    editableBlocks: mainBlocks,
    sourceTextBlocks: mainBlocks,
    sourceInspection: mainParsed.inspection,
  };
}

/**
 * Applies structured updates, removals, expansions, and appended chapters to a real OOXML DOM,
 * or constructs a polished fresh DOCX from scratch when editing legacy .doc files.
 */
export async function applyDocumentEditPlan(options: {
  base: Awaited<ReturnType<typeof prepareBaseContainerAndBlocks>>;
  plan: DocumentEditPlan;
  fallbackTitle: string;
}): Promise<AppliedDocxResult> {
  const { base, plan, fallbackTitle } = options;

  // Fresh container path (only when BOTH user file & template are legacy binary .doc)
  if (base.mode === "fresh-docx" || !base.targetModel) {
    const updateMap = new Map<number, BlockUpdateOp>();
    for (const u of plan.updates) updateMap.set(u.id, u);
    const removeSet = new Set(plan.removeIds);

    const outParagraphs: {
      kind: "title" | "heading1" | "heading2" | "bullet" | "paragraph";
      text: string;
    }[] = [];

    for (const b of base.sourceTextBlocks) {
      if (removeSet.has(b.id)) continue;
      const upd = updateMap.get(b.id);
      const kind =
        b.kind === "heading"
          ? b.headingLevel === 2
            ? "heading2"
            : "heading1"
          : b.kind === "list"
          ? "bullet"
          : "paragraph";

      if (upd?.paragraphs && upd.paragraphs.length > 0) {
        for (const pText of upd.paragraphs) {
          if (pText.trim()) outParagraphs.push({ kind, text: pText.trim() });
        }
      } else {
        const text = (upd?.text ?? b.text).trim();
        if (text) outParagraphs.push({ kind, text });
      }
    }

    for (const sec of plan.appendSections) {
      if (sec.heading?.trim()) {
        outParagraphs.push({
          kind: sec.level === 2 ? "heading2" : "heading1",
          text: sec.heading.trim(),
        });
      }
      for (const blk of sec.blocks || []) {
        if (blk.type === "table" && blk.rows?.length) {
          const headerLine = blk.headers?.join(" | ");
          if (headerLine) outParagraphs.push({ kind: "paragraph", text: `**${headerLine}**` });
          for (const row of blk.rows) {
            outParagraphs.push({ kind: "bullet", text: row.join(" — ") });
          }
          continue;
        }
        const t = blk.text?.trim();
        if (!t) continue;
        outParagraphs.push({
          kind:
            blk.type === "subheading"
              ? "heading2"
              : blk.type === "bullet"
              ? "bullet"
              : "paragraph",
          text: t,
        });
      }
    }

    const buffer = await createFreshAcademicDocxZip(fallbackTitle, outParagraphs);
    const newText = outParagraphs.map((p) => p.text).join(" ");
    const sections = outParagraphs
      .filter((p) => p.kind === "heading1" || p.kind === "title")
      .map((p) => p.text)
      .slice(0, 20);

    return {
      buffer,
      sections,
      originalWordCount: base.sourceInspection.wordCount,
      newWordCount: newText ? newText.split(/\s+/).filter(Boolean).length : 0,
    };
  }

  // Real OOXML DOM Editing Path (.docx or official professor template .docx)
  const model = base.targetModel;
  const domById = new Map<number, DomBlockRef>();
  for (const ref of model.domBlocks) {
    domById.set(ref.block.id, ref);
  }

  const removeSet = new Set<number>(plan.removeIds);

  // 1. Apply in-place updates & multi-paragraph expansions
  for (const upd of plan.updates) {
    if (removeSet.has(upd.id)) continue;
    const ref = domById.get(upd.id);
    if (!ref) continue;

    if (upd.paragraphs && upd.paragraphs.length > 0) {
      const cleaned = upd.paragraphs.map((s) => s.trim()).filter(Boolean);
      if (cleaned.length === 0) continue;

      replaceParagraphTextPreservingFormatting(
        ref.ownerDoc,
        ref.pElement,
        cleaned[0]
      );

      // Insert extra expanded paragraphs right after the anchor element (keeping exact styling!)
      const parent = ref.pElement.parentNode;
      if (parent && cleaned.length > 1) {
        let insertAnchor: Node | null = ref.pElement.nextSibling;
        for (let idx = 1; idx < cleaned.length; idx++) {
          const cloneP = ref.pElement.cloneNode(true) as Element;
          // Strip heading style from follow-up paragraphs so body prose stays normal
          if (ref.block.kind === "heading") {
            const pPr = getFirstDirectChild(cloneP, "pPr");
            if (pPr) cloneP.removeChild(pPr);
            const built = buildStyledParagraphElement(
              ref.ownerDoc,
              model.styles,
              "paragraph",
              cleaned[idx]
            );
            parent.insertBefore(built, insertAnchor);
          } else {
            replaceParagraphTextPreservingFormatting(
              ref.ownerDoc,
              cloneP,
              cleaned[idx]
            );
            parent.insertBefore(cloneP, insertAnchor);
          }
        }
      }
    } else if (typeof upd.text === "string" && upd.text.trim()) {
      replaceParagraphTextPreservingFormatting(
        ref.ownerDoc,
        ref.pElement,
        upd.text.trim()
      );
    }
  }

  // 2. Remove unneeded template instruction boilerplate lines safely
  for (const remId of removeSet) {
    const ref = domById.get(remId);
    if (!ref) continue;
    // Never delete table cells directly — just clear their text to avoid grid corruption
    if (ref.block.kind === "table-cell") {
      replaceParagraphTextPreservingFormatting(ref.ownerDoc, ref.pElement, "");
      continue;
    }
    const parent = ref.pElement.parentNode;
    if (parent) {
      parent.removeChild(ref.pElement);
    }
  }

  // 3. Append newly generated / expanded sections right before <w:sectPr>
  const body = getFirstDirectChild(
    getDocRoot(model.docXmlDoc, "word/document.xml"),
    "body"
  )!;
  const sectPr = getFirstDirectChild(body, "sectPr");

  const appendNode = (node: Element) => {
    if (sectPr) body.insertBefore(node, sectPr);
    else body.appendChild(node);
  };

  for (const sec of plan.appendSections) {
    if (sec.pageBreakBefore) {
      const pbPara = createWElement(model.docXmlDoc, "p");
      const r = createWElement(model.docXmlDoc, "r");
      const br = createWElement(model.docXmlDoc, "br");
      setWAttr(br, "type", "page");
      r.appendChild(br);
      pbPara.appendChild(r);
      appendNode(pbPara);
    }

    if (sec.heading?.trim()) {
      const hKind =
        sec.level === 3 ? "heading3" : sec.level === 2 ? "heading2" : "heading1";
      appendNode(
        buildStyledParagraphElement(
          model.docXmlDoc,
          model.styles,
          hKind,
          sec.heading.trim()
        )
      );
    }

    for (const blk of sec.blocks || []) {
      if (blk.type === "table" && blk.rows && blk.rows.length > 0) {
        appendNode(
          buildStyledTableElement(
            model.docXmlDoc,
            model.styles,
            blk.headers || [],
            blk.rows
          )
        );
        continue;
      }

      const t = blk.text?.trim();
      if (!t) continue;
      const bKind =
        blk.type === "subheading"
          ? "heading2"
          : blk.type === "bullet"
          ? "bullet"
          : "paragraph";
      appendNode(
        buildStyledParagraphElement(model.docXmlDoc, model.styles, bKind, t)
      );
    }
  }

  // 4. Serialize modified XML back into ZIP
  model.zip.file("word/document.xml", serializeXmlDom(model.docXmlDoc));
  for (const [partName, extraDoc] of model.extraXmlDocs.entries()) {
    model.zip.file(partName, serializeXmlDom(extraDoc));
  }

  const buffer = await model.zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  // Compute updated inspection stats
  const refreshedModel = await parseDocxToModel(buffer, "output.docx");
  const sections = refreshedModel.inspection.headings
    .map((h) => h.text)
    .slice(0, 20);

  return {
    buffer,
    sections,
    originalWordCount: base.sourceInspection.wordCount,
    newWordCount: refreshedModel.inspection.wordCount,
  };
}
