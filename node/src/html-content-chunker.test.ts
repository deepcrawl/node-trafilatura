import { HtmlContentChunker } from "./html-content-chunker";
import { HtmlContentExtractor } from "./html-content-extractor";

// Mock external dependencies
jest.mock("./html-content-extractor");

describe("HtmlContentChunker", () => {
  // Define common test constants
  const SUBSTANTIAL_CONTENT = "with enough words to be processed properly and meet requirements";
  const PROCESSING_REQUIREMENTS = "with sufficient content for processing requirements";
  const DEFAULT_HTML = "<html></html>";
  const MAIN_TITLE = "Main Title";

  let mockExtract: jest.MockedFunction<typeof HtmlContentExtractor.extract>;

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    mockExtract = jest.mocked(HtmlContentExtractor.extract);
  });

  describe("chunk", () => {
    it("should extract and chunk basic HTML content", async () => {
      const inputHtml =
        "<html><body><h1>Title</h1><p>This is a substantial content paragraph with enough words to meet processing requirements.</p></body></html>";
      const cleanedHtml =
        "<h1>Title</h1><p>This is a substantial content paragraph with enough words to meet processing requirements.</p>";

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(inputHtml);

      expect(mockExtract).toHaveBeenCalledWith(inputHtml, "html");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        title: "Title",
        headingLevel: 1,
        content: "This is a substantial content paragraph with enough words to meet processing requirements.",
        wordCount: 13,
      });
    });

    it("should handle multiple sections with headings", async () => {
      const cleanedHtml = `
        <h1>${MAIN_TITLE}</h1>
        <p>Introduction paragraph with some content to make it substantial enough for processing.</p>
        <h2>Section One</h2>
        <p>Content for section one with enough words to be processed properly.</p>
        <h2>Section Two</h2>
        <p>Content for section two with sufficient length for processing requirements.</p>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe(MAIN_TITLE);
      expect(result[0].headingLevel).toBe(1);
      expect(result[1].title).toBe("Section One");
      expect(result[1].headingLevel).toBe(2);
      expect(result[2].title).toBe("Section Two");
      expect(result[2].headingLevel).toBe(2);
    });

    it("should chunk content based on word limit", async () => {
      // Create multiple paragraphs to enable chunking between them
      const paragraphs = Array.from(
        { length: 10 },
        (_, i) => `<p>This is paragraph number ${i} ${SUBSTANTIAL_CONTENT}.</p>`,
      );
      const cleanedHtml = `<h1>Title</h1>${paragraphs.join("")}`;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML, 30);

      expect(result.length).toBeGreaterThan(1);
      result.forEach(chunk => {
        expect(chunk.wordCount).toBeLessThanOrEqual(30);
      });
    });

    it("should preserve heading hierarchy across chunks", async () => {
      // Create two large paragraphs that will definitely require chunking
      const paragraph1 = `${Array(40).fill("word").join(" ")} end of paragraph one.`;
      const paragraph2 = `${Array(40).fill("word").join(" ")} end of paragraph two.`;
      const cleanedHtml = `
        <h1>${MAIN_TITLE}</h1>
        <p>${paragraph1}</p>
        <p>${paragraph2}</p>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML, 30);

      expect(result.length).toBeGreaterThan(1);
      result.forEach(chunk => {
        expect(chunk.title).toBe(MAIN_TITLE);
        expect(chunk.headingLevel).toBe(1);
      });
    });

    it("should handle nested headings correctly", async () => {
      const cleanedHtml = `
        <h1>${MAIN_TITLE}</h1>
        <p>Main content with enough words to be processed properly by the chunker.</p>
        <h2>Subsection</h2>
        <p>Subsection content with sufficient length for processing requirements and validation.</p>
        <h3>Sub-subsection</h3>
        <p>Sub-subsection content with adequate words to meet the minimum processing criteria.</p>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe(MAIN_TITLE);
      expect(result[0].headingLevel).toBe(1);
      expect(result[1].title).toBe("Subsection");
      expect(result[1].headingLevel).toBe(2);
      expect(result[2].title).toBe("Sub-subsection");
      expect(result[2].headingLevel).toBe(3);
    });

    it("should handle list items", async () => {
      const cleanedHtml = `
        <h1>Features</h1>
        <li>First feature with enough descriptive text to meet processing requirements.</li>
        <li>Second feature with sufficient detail to be processed by the chunker.</li>
        <li>Third feature with adequate content length for proper chunk creation.</li>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      expect(result[0].content).toContain("First feature");
      expect(result[0].content).toContain("Second feature");
      expect(result[0].content).toContain("Third feature");
    });

    it("should handle blockquotes", async () => {
      const cleanedHtml = `
        <h1>Quotes</h1>
        <blockquote>This is an important quote with sufficient length to be processed.</blockquote>
        <p>Regular paragraph content with enough words to meet processing requirements.</p>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      expect(result[0].content).toContain("important quote");
      expect(result[0].content).toContain("Regular paragraph");
    });

    it("should filter out short content", async () => {
      const cleanedHtml = `
        <h1>Title</h1>
        <p>Short.</p>
        <p>This is a much longer paragraph with sufficient content to be processed properly.</p>
        <p>Too short</p>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      expect(result[0].content).not.toContain("Short.");
      expect(result[0].content).not.toContain("Too short");
      expect(result[0].content).toContain("much longer paragraph");
    });

    it("should handle duplicate content", async () => {
      const duplicateText = "This is duplicate content with enough words to be processed properly.";
      const cleanedHtml = `
        <h1>Title</h1>
        <p>${duplicateText}</p>
        <p>${duplicateText}</p>
        <p>This is unique content with sufficient length for processing requirements.</p>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      const content = result[0].content;
      const duplicateCount = (content.match(/duplicate content/g) || []).length;
      expect(duplicateCount).toBe(1);
      expect(content).toContain("unique content");
    });

    it("should handle empty content gracefully", async () => {
      const cleanedHtml = "";

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(0);
    });

    it("should handle content without headings", async () => {
      const cleanedHtml = `
        <p>First paragraph with enough content to be processed by the chunker properly.</p>
        <p>Second paragraph with sufficient length to meet the processing requirements.</p>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Content");
      expect(result[0].headingLevel).toBe(2);
      expect(result[0].content).toContain("First paragraph");
      expect(result[0].content).toContain("Second paragraph");
    });

    it("should handle custom word limits", async () => {
      // Create multiple small paragraphs to enable chunking
      const paragraphs = Array.from(
        { length: 12 },
        (_, i) => `<p>Small paragraph number ${i} ${PROCESSING_REQUIREMENTS}.</p>`,
      );
      const cleanedHtml = `<h1>Title</h1>${paragraphs.join("")}`;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML, 20);

      expect(result.length).toBeGreaterThan(1);
      result.forEach(chunk => {
        expect(chunk.wordCount).toBeLessThanOrEqual(20);
      });
    });

    it("should maintain word count accuracy", async () => {
      const cleanedHtml = `
        <h1>Test Title</h1>
        <p>This paragraph has exactly ten words in it for testing.</p>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      expect(result[0].wordCount).toBe(10);
    });
  });

  describe("edge cases", () => {
    it("should handle malformed HTML", async () => {
      const malformedHtml =
        "<h1>Title</h1><p>Substantial content without proper closing tags but with enough words to be processed";

      mockExtract.mockResolvedValue(malformedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Title");
      expect(result[0].content).toContain("Substantial content");
    });

    it("should handle HTML with only whitespace", async () => {
      const whitespaceHtml = "<h1>   </h1><p>   </p>";

      mockExtract.mockResolvedValue(whitespaceHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(0);
    });

    it("should handle very long words", async () => {
      const veryLongWord = "a".repeat(1000);
      const cleanedHtml = `<h1>Title</h1><p>This paragraph contains a ${veryLongWord} which is extremely long.</p>`;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML, 50);

      expect(result).toHaveLength(1);
      expect(result[0].content).toContain(veryLongWord);
    });

    it("should handle HTML with special characters", async () => {
      const specialChars = "Special chars: äöü ñ 中文 🚀 & < > \" '";
      const cleanedHtml = `<h1>Special Characters</h1><p>${specialChars}</p>`;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      expect(result[0].content).toBe(specialChars);
    });

    it("should handle tables", async () => {
      const cleanedHtml = `
        <h1>Data Table</h1>
        <table>Table content with sufficient length to be processed by the chunker.</table>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      expect(result[0].content).toContain("Table content");
    });
  });

  describe("integration scenarios", () => {
    it("should handle complex nested document structure", async () => {
      const cleanedHtml = `
        <h1>Main Document Title</h1>
        <p>Introduction paragraph with substantial content to meet processing requirements for the chunker.</p>
        <h2>First Major Section</h2>
        <p>First section content with adequate length for proper processing and chunk creation.</p>
        <h3>Subsection A</h3>
        <p>Subsection A content with enough words to be processed correctly by the system.</p>
        <h3>Subsection B</h3>
        <p>Subsection B content with sufficient detail to meet the minimum processing criteria.</p>
        <h2>Second Major Section</h2>
        <p>Second section content with appropriate length for processing and chunking requirements.</p>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(5);

      // Check structure preservation
      expect(result[0].title).toBe("Main Document Title");
      expect(result[0].headingLevel).toBe(1);

      expect(result[1].title).toBe("First Major Section");
      expect(result[1].headingLevel).toBe(2);

      expect(result[2].title).toBe("Subsection A");
      expect(result[2].headingLevel).toBe(3);

      expect(result[3].title).toBe("Subsection B");
      expect(result[3].headingLevel).toBe(3);

      expect(result[4].title).toBe("Second Major Section");
      expect(result[4].headingLevel).toBe(2);
    });

    it("should handle mixed content types", async () => {
      const cleanedHtml = `
        <h1>Mixed Content Document</h1>
        <p>Paragraph content with sufficient length to be processed by the chunker system.</p>
        <li>List item with adequate detail to meet the processing requirements for chunks.</li>
        <blockquote>Blockquote content with enough words to be included in the processing workflow.</blockquote>
        <table>Table content with substantial information to be processed by the chunker.</table>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      const content = result[0].content;
      expect(content).toContain("Paragraph content");
      expect(content).toContain("List item");
      expect(content).toContain("Blockquote content");
      expect(content).toContain("Table content");
    });

    it("should handle large document with word limit chunking", async () => {
      // Create multiple smaller paragraphs that can be chunked properly
      const paragraphs = Array.from(
        { length: 15 },
        (_, i) => `<p>This is paragraph ${i} with substantial content to be processed by the chunker system.</p>`,
      );
      const cleanedHtml = `
        <h1>Large Document</h1>
        ${paragraphs.join("")}
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML, 40);

      expect(result.length).toBeGreaterThan(2);

      // Verify all chunks respect word limit
      result.forEach(chunk => {
        expect(chunk.wordCount).toBeLessThanOrEqual(40);
      });

      // Verify all chunks maintain the same title
      result.forEach(chunk => {
        expect(chunk.title).toBe("Large Document");
        expect(chunk.headingLevel).toBe(1);
      });
    });

    it("should handle zero maxWords parameter", async () => {
      const cleanedHtml = `<h1>Title</h1><p>Content with sufficient length for processing.</p>`;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML, 0);

      // Should still create chunks even with 0 word limit
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("content validation", () => {
    it("should reject content shorter than 15 characters", async () => {
      const cleanedHtml = `
        <h1>Title</h1>
        <p>Short</p>
        <p>This is a much longer paragraph with substantial content for processing.</p>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      expect(result[0].content).not.toContain("Short");
      expect(result[0].content).toContain("much longer paragraph");
    });

    it("should reject content with fewer than 5 words", async () => {
      const cleanedHtml = `
        <h1>Title</h1>
        <p>Only four words here</p>
        <p>This paragraph contains significantly more words to meet processing requirements.</p>
      `;

      mockExtract.mockResolvedValue(cleanedHtml);

      const result = await HtmlContentChunker.chunk(DEFAULT_HTML);

      expect(result).toHaveLength(1);
      expect(result[0].content).not.toContain("Only four words");
      expect(result[0].content).toContain("significantly more words");
    });
  });
});
