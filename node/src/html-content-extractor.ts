import { execSync } from "node:child_process";
import { resolve } from "node:path";

import { remove, writeFile } from "fs-extra";
import { v4 as uuid } from "uuid";

/**
 * HTML content extraction utility that uses the Trafilatura recall extractor
 * to clean and extract article content from HTML.
 */
export class HtmlContentExtractor {
  /**
   * Extract clean article content from HTML using Trafilatura.
   *
   * @param html - The HTML string to extract content from
   * @param outputFormat - Output format: "html" for cleaned HTML, "txt" for plain text
   * @returns Promise resolving to the extracted content
   */
  public static async extract(html: string, outputFormat: "html" | "txt" = "txt"): Promise<string> {
    const extractor = new HtmlContentExtractor();
    return extractor.processHtml(html, outputFormat);
  }

  private constructor() {}

  private async processHtml(html: string, outputFormat: "html" | "txt"): Promise<string> {
    const tempFilePath = await this.storeHtmlInTempFile(html);

    try {
      return this.executeExtraction(tempFilePath, outputFormat);
    } finally {
      await this.removeTempFile(tempFilePath);
    }
  }

  private async storeHtmlInTempFile(html: string): Promise<string> {
    const tempPath = resolve("/", "tmp", `${uuid()}.html`);
    await writeFile(tempPath, html);
    return tempPath;
  }

  private executeExtraction(filePath: string, outputFormat: "html" | "txt"): string {
    const extractorPath = resolve(__dirname, "..", "bin", "extract-recall", "extract-recall");

    return execSync(`${extractorPath} ${filePath} ${outputFormat}`, {
      stdio: "pipe",
      encoding: "utf-8",
    });
  }

  private async removeTempFile(filePath: string): Promise<void> {
    await remove(filePath);
  }
}
