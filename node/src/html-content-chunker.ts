import { parseHTML } from "linkedom";

import { HtmlContentExtractor } from "./html-content-extractor";

export interface IHtmlContentChunk {
  title?: string;
  headingLevel?: number;
  content: string;
  wordCount: number;
}

/**
 * HTML content chunking utility that uses Trafilatura to extract clean content
 * and organizes it into structured, digestible chunks with preserved hierarchy.
 */
export class HtmlContentChunker {
  /**
   * Extract clean article content from HTML and chunk it logically.
   * First uses Trafilatura to extract clean content, then chunks it while
   * preserving document structure with headings and enforcing word limits.
   *
   * @param html - The HTML string to process
   * @param maxWords - Maximum words per chunk (default: 400)
   * @returns Promise resolving to array of structured content chunks
   */
  public static async chunk(html: string, maxWords = 400): Promise<IHtmlContentChunk[]> {
    // First extract clean HTML content using Trafilatura
    const cleanHtml = await HtmlContentExtractor.extract(html, "html");

    // Then parse and chunk the cleaned content
    const { document } = parseHTML(cleanHtml);
    const processor = new HtmlContentChunker(maxWords);

    return processor.processDocument(document);
  }

  private readonly maxWords: number;
  private readonly chunks: IHtmlContentChunk[] = [];
  private readonly processedTexts = new Set<string>();
  private currentChunk = this.createNewChunk();

  private constructor(maxWords: number) {
    this.maxWords = maxWords;
  }

  private processDocument(document: Document): IHtmlContentChunk[] {
    const elements = this.getContentElements(document);

    elements.forEach(element => this.processElement(element));

    this.finalizeCurrentChunk();
    return this.chunks;
  }

  private getContentElements(document: Document): Element[] {
    const selector = "h1, h2, h3, h4, h5, h6, p, li, blockquote, table";
    return Array.from(document.querySelectorAll(selector));
  }

  private processElement(element: Element): void {
    const tagName = element.tagName.toLowerCase();

    if (this.isHeadingElement(tagName)) {
      this.processHeading(element, tagName);
    } else if (this.isContentElement(tagName)) {
      this.processContentElement(element);
    }
  }

  private isHeadingElement(tagName: string): boolean {
    return /^h[1-6]$/.test(tagName);
  }

  private isContentElement(tagName: string): boolean {
    return ["p", "li", "blockquote", "table"].includes(tagName);
  }

  private processHeading(element: Element, tagName: string): void {
    const headingText = element.textContent?.trim();

    if (this.isValidHeading(headingText)) {
      this.finalizeCurrentChunk();
      this.startNewSection(headingText, parseInt(tagName[1]));
    }
  }

  private isValidHeading(text?: string): text is string {
    return Boolean(text && text.length > 0);
  }

  private startNewSection(title: string, level: number): void {
    this.currentChunk = this.createNewChunk(title, level);
  }

  private processContentElement(element: Element): void {
    const text = element.textContent?.trim();

    if (this.isValidContentText(text)) {
      this.addTextToChunk(text);
    }
  }

  private isValidContentText(text?: string): text is string {
    if (!text || text.length < 15) return false;

    const wordCount = this.countWords(text);
    if (wordCount < 5) return false;

    return !this.isDuplicateText(text);
  }

  private isDuplicateText(text: string): boolean {
    if (this.processedTexts.has(text)) return true;

    // Check for substring overlaps to prevent parent/child duplication
    return Array.from(this.processedTexts).some(
      processedText => processedText.includes(text) || text.includes(processedText),
    );
  }

  private addTextToChunk(text: string): void {
    const wordCount = this.countWords(text);

    // Start new chunk if current would exceed word limit
    if (this.wouldExceedWordLimit(wordCount)) {
      this.finalizeCurrentChunk();
      this.currentChunk = this.createNewChunk(this.currentChunk.title, this.currentChunk.headingLevel);
    }

    this.currentChunk.contentSegments.push(text);
    this.currentChunk.wordCount += wordCount;
    this.processedTexts.add(text);
  }

  private wouldExceedWordLimit(additionalWords: number): boolean {
    return (
      this.currentChunk.wordCount + additionalWords > this.maxWords && this.currentChunk.contentSegments.length > 0
    );
  }

  private countWords(text: string): number {
    return text.split(/\s+/).length;
  }

  private finalizeCurrentChunk(): void {
    if (this.currentChunk.contentSegments.length === 0) return;

    const content = this.currentChunk.contentSegments.join(" ").trim();

    if (content.length > 0) {
      this.chunks.push({
        title: this.currentChunk.title,
        headingLevel: this.currentChunk.headingLevel,
        content,
        wordCount: this.currentChunk.wordCount,
      });
    }
  }

  private createNewChunk(
    title = "Content",
    headingLevel = 2,
  ): { title: string; headingLevel: number; contentSegments: string[]; wordCount: number } {
    return { title, headingLevel, contentSegments: [], wordCount: 0 };
  }
}
