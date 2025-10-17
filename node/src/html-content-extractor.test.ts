/* eslint-disable @typescript-eslint/no-explicit-any */
import { execSync } from "node:child_process";
import { resolve } from "node:path";

import { remove, writeFile } from "fs-extra";
import { v4 as uuid } from "uuid";

import { HtmlContentExtractor } from "./html-content-extractor";

// Mock external dependencies
jest.mock("node:child_process");
jest.mock("fs-extra");
jest.mock("uuid");

// Test constants and setup
const mockHtml = "<html><body><h1>Test Article</h1><p>Test content</p></body></html>";
const mockExtractedText = "Test Article\n\nTest content";
const mockExtractedHtml = "<article><h1>Test Article</h1><p>Test content</p></article>";
const mockTempId = "mock-uuid-123";

const mockExecSync = <jest.MockedFunction<typeof execSync>>execSync;
const mockWriteFile = <jest.MockedFunction<typeof writeFile>>writeFile;
const mockRemove = <jest.MockedFunction<typeof remove>>remove;
const mockUuid = <jest.MockedFunction<() => string>>uuid;

function setupMocks(): void {
  jest.clearAllMocks();

  // Default mock implementations
  mockUuid.mockReturnValue(mockTempId);
  mockWriteFile.mockImplementation(() => {
    return;
  });
  mockRemove.mockImplementation(() => {
    return;
  });
}

describe("HtmlContentExtractor", () => {
  const expectedTempPath = resolve("/", "tmp", `${mockTempId}.html`);
  const expectedExtractorPath = resolve(__dirname, "..", "..", "node", "bin", "extract-recall", "extract-recall");

  beforeEach(setupMocks);

  describe("extract", () => {
    it("should extract content in text format by default", async () => {
      mockExecSync.mockReturnValue(mockExtractedText);

      const result = await HtmlContentExtractor.extract(mockHtml);

      expect(result).toBe(mockExtractedText);
      expect(mockWriteFile).toHaveBeenCalledWith(expectedTempPath, mockHtml);
      expect(mockExecSync).toHaveBeenCalledWith(`${expectedExtractorPath} ${expectedTempPath} txt`, {
        stdio: "pipe",
        encoding: "utf-8",
      });
      expect(mockRemove).toHaveBeenCalledWith(expectedTempPath);
    });

    it("should extract content in HTML format when specified", async () => {
      mockExecSync.mockReturnValue(mockExtractedHtml);

      const result = await HtmlContentExtractor.extract(mockHtml, { outputFormat: "html" });

      expect(result).toBe(mockExtractedHtml);
      expect(mockWriteFile).toHaveBeenCalledWith(expectedTempPath, mockHtml);
      expect(mockExecSync).toHaveBeenCalledWith(`${expectedExtractorPath} ${expectedTempPath} html`, {
        stdio: "pipe",
        encoding: "utf-8",
      });
      expect(mockRemove).toHaveBeenCalledWith(expectedTempPath);
    });

    it("should extract content in text format when explicitly specified", async () => {
      mockExecSync.mockReturnValue(mockExtractedText);

      const result = await HtmlContentExtractor.extract(mockHtml, { outputFormat: "txt" });

      expect(result).toBe(mockExtractedText);
      expect(mockExecSync).toHaveBeenCalledWith(`${expectedExtractorPath} ${expectedTempPath} txt`, {
        stdio: "pipe",
        encoding: "utf-8",
      });
    });

    it("should handle empty HTML input", async () => {
      const emptyHtml = "";
      mockExecSync.mockReturnValue("");

      const result = await HtmlContentExtractor.extract(emptyHtml);

      expect(result).toBe("");
      expect(mockWriteFile).toHaveBeenCalledWith(expectedTempPath, emptyHtml);
    });

    it("should handle complex HTML with nested elements", async () => {
      const complexHtml = `
        <html>
          <head><title>Complex Page</title></head>
          <body>
            <nav>Navigation</nav>
            <main>
              <article>
                <h1>Main Article</h1>
                <p>First paragraph with <a href="#">link</a>.</p>
                <p>Second paragraph with <strong>emphasis</strong>.</p>
                <div class="metadata">Author info</div>
              </article>
            </main>
            <footer>Footer content</footer>
          </body>
        </html>
      `;
      const expectedOutput = "Main Article\n\nFirst paragraph with link.\n\nSecond paragraph with emphasis.";
      mockExecSync.mockReturnValue(expectedOutput);

      const result = await HtmlContentExtractor.extract(complexHtml);

      expect(result).toBe(expectedOutput);
      expect(mockWriteFile).toHaveBeenCalledWith(expectedTempPath, complexHtml);
    });
  });

  describe("error handling", () => {
    it("should cleanup temp file even when extraction fails", async () => {
      const extractionError = new Error("Extraction failed");
      mockExecSync.mockImplementation(() => {
        throw extractionError;
      });

      await expect(HtmlContentExtractor.extract(mockHtml)).rejects.toThrow("Extraction failed");

      expect(mockWriteFile).toHaveBeenCalledWith(expectedTempPath, mockHtml);
      expect(mockRemove).toHaveBeenCalledWith(expectedTempPath);
    });

    it("should cleanup temp file even when file writing fails", async () => {
      const writeError = new Error("Write failed");
      (<any>mockWriteFile).mockRejectedValue(writeError);

      await expect(HtmlContentExtractor.extract(mockHtml)).rejects.toThrow("Write failed");

      // Should not call execSync or remove since writeFile failed
      expect(mockExecSync).not.toHaveBeenCalled();
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it("should handle removal failure gracefully", async () => {
      mockExecSync.mockReturnValue(mockExtractedText);
      const removeError = new Error("Remove failed");
      (<any>mockRemove).mockRejectedValue(removeError);

      // The extraction should still succeed even if cleanup fails
      await expect(HtmlContentExtractor.extract(mockHtml)).rejects.toThrow("Remove failed");

      expect(mockWriteFile).toHaveBeenCalledWith(expectedTempPath, mockHtml);
      expect(mockExecSync).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalledWith(expectedTempPath);
    });

    it("should handle extractor command not found", async () => {
      const commandError = new Error("Command not found: extract-recall");
      mockExecSync.mockImplementation(() => {
        throw commandError;
      });

      await expect(HtmlContentExtractor.extract(mockHtml)).rejects.toThrow("Command not found: extract-recall");

      expect(mockRemove).toHaveBeenCalledWith(expectedTempPath);
    });

    it("should handle extractor returning error exit code", async () => {
      const exitError = new Error("Command failed with exit code 1");
      (<Error & { status: number }>exitError).status = 1;
      mockExecSync.mockImplementation(() => {
        throw exitError;
      });

      await expect(HtmlContentExtractor.extract(mockHtml)).rejects.toThrow("Command failed with exit code 1");

      expect(mockRemove).toHaveBeenCalledWith(expectedTempPath);
    });
  });

  describe("temporary file management", () => {
    it("should create unique temporary file paths", async () => {
      mockExecSync.mockReturnValue(mockExtractedText);

      // Mock different UUIDs for multiple calls
      mockUuid.mockReturnValueOnce("uuid-1").mockReturnValueOnce("uuid-2");

      await HtmlContentExtractor.extract(mockHtml);
      await HtmlContentExtractor.extract(mockHtml);

      expect(mockWriteFile).toHaveBeenNthCalledWith(1, "/tmp/uuid-1.html", mockHtml);
      expect(mockWriteFile).toHaveBeenNthCalledWith(2, "/tmp/uuid-2.html", mockHtml);
    });

    it("should use correct extractor path", async () => {
      mockExecSync.mockReturnValue(mockExtractedText);

      await HtmlContentExtractor.extract(mockHtml);

      const expectedCommand = `${expectedExtractorPath} ${expectedTempPath} txt`;
      expect(mockExecSync).toHaveBeenCalledWith(expectedCommand, {
        stdio: "pipe",
        encoding: "utf-8",
      });
    });
  });

  describe("output formats", () => {
    const testCases = <const>[
      { format: <const>"txt", expectedOutput: mockExtractedText },
      { format: <const>"html", expectedOutput: mockExtractedHtml },
    ];

    testCases.forEach(({ format, expectedOutput }) => {
      it(`should handle ${format} format correctly`, async () => {
        mockExecSync.mockReturnValue(expectedOutput);

        const result = await HtmlContentExtractor.extract(mockHtml, { outputFormat: format });

        expect(result).toBe(expectedOutput);
        expect(mockExecSync).toHaveBeenCalledWith(`${expectedExtractorPath} ${expectedTempPath} ${format}`, {
          stdio: "pipe",
          encoding: "utf-8",
        });
      });
    });
  });

  describe("integration scenarios", () => {
    it("should handle large HTML documents", async () => {
      const largeHtml = `<html><body>${"<p>Large content</p>".repeat(1000)}</body></html>`;
      const expectedOutput = "Large content\n\n".repeat(1000).trim();
      mockExecSync.mockReturnValue(expectedOutput);

      const result = await HtmlContentExtractor.extract(largeHtml);

      expect(result).toBe(expectedOutput);
      expect(mockWriteFile).toHaveBeenCalledWith(expectedTempPath, largeHtml);
    });

    it("should handle HTML with special characters", async () => {
      const specialCharHtml = "<html><body><p>Special chars: äöü ñ 中文 🚀</p></body></html>";
      const expectedOutput = "Special chars: äöü ñ 中文 🚀";
      mockExecSync.mockReturnValue(expectedOutput);

      const result = await HtmlContentExtractor.extract(specialCharHtml);

      expect(result).toBe(expectedOutput);
      expect(mockWriteFile).toHaveBeenCalledWith(expectedTempPath, specialCharHtml);
    });

    it("should handle malformed HTML", async () => {
      const malformedHtml = "<html><body><p>Unclosed paragraph<div>Nested without closing</body>";
      const expectedOutput = "Unclosed paragraph\n\nNested without closing";
      mockExecSync.mockReturnValue(expectedOutput);

      const result = await HtmlContentExtractor.extract(malformedHtml);

      expect(result).toBe(expectedOutput);
      expect(mockWriteFile).toHaveBeenCalledWith(expectedTempPath, malformedHtml);
    });
  });
});
