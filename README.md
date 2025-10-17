# Node Trafilatura

A high-performance Node.js wrapper around the powerful Python [Trafilatura](https://trafilatura.readthedocs.io/) library for extracting and chunking clean article content from HTML documents.

## Overview

Node Trafilatura provides two main utilities:

- **HtmlContentExtractor**: Extract clean, readable content from messy HTML using Trafilatura's advanced extraction algorithms
- **HtmlContentChunker**: Intelligently chunk extracted content into structured pieces while preserving document hierarchy

This library bridges the gap between Python's excellent text extraction capabilities and Node.js applications, providing a seamless TypeScript/JavaScript API backed by a high-performance Python binary.

## Features

- ✨ **Clean Content Extraction**: Remove ads, navigation, and other noise from web pages
- 📚 **Intelligent Chunking**: Break content into logical sections with preserved heading hierarchy
- 🎯 **Recall-Optimized**: Uses Trafilatura's recall mode for maximum content extraction
- 🔧 **TypeScript Support**: Full TypeScript definitions and modern async/await API
- 🚀 **High Performance**: Leverages optimized Python binary via PyInstaller
- 📦 **Easy Installation**: Automatic platform-specific binary downloads
- 🧪 **Well Tested**: Comprehensive test coverage for all functionality

## Installation

```bash
npm install @deepcrawl/node-trafilatura
```

The package automatically downloads the appropriate platform-specific binary during installation. Supported platforms:

- Linux ARM64
- Linux x64
- macOS ARM64 (Apple Silicon)

## Quick Start

### Basic Content Extraction

```typescript
import { HtmlContentExtractor } from "@deepcrawl/node-trafilatura";

const html = `
  <html>
    <body>
      <nav>Navigation menu</nav>
      <article>
        <h1>Breaking News: AI Breakthrough</h1>
        <p>Scientists have discovered a new method...</p>
        <p>This breakthrough could revolutionize...</p>
      </article>
      <aside>Advertisement</aside>
    </body>
  </html>
`;

// Extract as plain text (default)
const textContent = await HtmlContentExtractor.extract(html);
console.log(textContent);
// Output: "Breaking News: AI Breakthrough\n\nScientists have discovered..."

// Extract as clean HTML
const htmlContent = await HtmlContentExtractor.extract(html, "html");
console.log(htmlContent);
// Output: "<h1>Breaking News: AI Breakthrough</h1><p>Scientists have discovered...</p>"
```

### Intelligent Content Chunking

```typescript
import { HtmlContentChunker } from "@deepcrawl/node-trafilatura";

const html = `
  <html>
    <body>
      <article>
        <h1>Complete Guide to Web Scraping</h1>
        <p>Web scraping is the process of extracting data...</p>
        
        <h2>Getting Started</h2>
        <p>Before you begin scraping, you'll need to...</p>
        
        <h2>Advanced Techniques</h2>
        <p>Once you've mastered the basics...</p>
      </article>
    </body>
  </html>
`;

const chunks = await HtmlContentChunker.chunk(html, 400); // Max 400 words per chunk

chunks.forEach((chunk, index) => {
  console.log(`Chunk ${index + 1}:`);
  console.log(`Title: ${chunk.title}`);
  console.log(`Heading Level: ${chunk.headingLevel}`);
  console.log(`Word Count: ${chunk.wordCount}`);
  console.log(`Content: ${chunk.content}`);
  console.log("---");
});
```

## API Reference

### HtmlContentExtractor

Extract clean content from HTML documents.

#### `HtmlContentExtractor.extract(html, outputFormat?)`

**Parameters:**

- `html` (string): The HTML content to extract from
- `outputFormat` (string, optional): Output format - `'txt'` (default) or `'html'`

**Returns:** Promise<string> - The extracted content

**Example:**

```typescript
// Text extraction
const text = await HtmlContentExtractor.extract(html);

// HTML extraction (cleaned structure preserved)
const cleanHtml = await HtmlContentExtractor.extract(html, "html");
```

### HtmlContentChunker

Chunk extracted content into structured, manageable pieces.

#### `HtmlContentChunker.chunk(html, maxWords?)`

**Parameters:**

- `html` (string): The HTML content to process
- `maxWords` (number, optional): Maximum words per chunk (default: 400)

**Returns:** Promise<IHtmlContentChunk[]> - Array of content chunks

**Chunk Interface:**

```typescript
interface IHtmlContentChunk {
  title?: string; // Section title from heading
  headingLevel?: number; // HTML heading level (1-6)
  content: string; // The actual content
  wordCount: number; // Number of words in content
}
```

**Example:**

```typescript
// Default chunking (400 words max)
const chunks = await HtmlContentChunker.chunk(html);

// Custom word limit
const smallChunks = await HtmlContentChunker.chunk(html, 200);
```

## Architecture

Node Trafilatura uses a hybrid architecture combining the best of both Python and Node.js ecosystems:

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Node.js App       │───▶│  TypeScript API     │───▶│   Python Binary     │
│                     │    │                     │    │                     │
│ Your Application    │    │ • HtmlExtractor     │    │ • Trafilatura       │
│                     │    │ • HtmlChunker       │    │ • PyInstaller       │
│                     │    │ • Type Definitions  │    │ • Optimized Build   │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Components

1. **TypeScript API Layer**: Provides clean, type-safe interfaces
2. **Python Binary**: Self-contained executable with Trafilatura and dependencies
3. **Installation System**: Automatically downloads platform-specific binaries
4. **Temporary File Management**: Handles secure temporary file creation and cleanup

### How It Works

1. **Content Processing**: HTML is written to a temporary file
2. **Binary Execution**: The Python binary processes the file using Trafilatura
3. **Result Extraction**: Clean content is returned and temporary files are cleaned up
4. **Chunking** (optional): Clean HTML is parsed and intelligently divided into sections

## Development

This is a monorepo with multiple workspaces:

```
node-trafilatura/
├── node/               # TypeScript/JavaScript bindings
├── python/             # Python binary source
└── src/               # Installation scripts
```

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.8+ (for building Python components)

### Setup

```bash
# Clone the repository
git clone https://github.com/deepcrawl/node-trafilatura.git
cd node-trafilatura

# Install dependencies
pnpm install

# Build all components
pnpm build
```

### Development Commands

```bash
# Clean all build artifacts
pnpm clean

# Build everything
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

### Workspace Structure

#### Node Workspace (`/node`)

- TypeScript source in `src/`
- Compiled output in `dist/`
- Contains the main API implementations
- Jest tests with comprehensive coverage

#### Python Workspace (`/python`)

- Python source in `src/`
- PyInstaller builds in `dist/`
- Self-contained binary with all dependencies

### Building Python Binary

```bash
cd python
pnpm run build
```

This creates a self-contained executable using PyInstaller that includes:

- Trafilatura library
- All Python dependencies
- Platform-specific optimizations

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific workspace
cd node && pnpm test
cd python && pnpm test
```

Tests cover:

- Content extraction with various HTML structures
- Chunking algorithms and word limits
- Error handling and edge cases
- Temporary file management
- Platform compatibility

## Content Processing Details

### Extraction Features

- **Noise Removal**: Automatically removes navigation, ads, sidebars
- **Content Detection**: Identifies main article content using multiple signals
- **Structure Preservation**: Maintains important HTML structure in HTML mode
- **Encoding Handling**: Proper UTF-8 encoding support
- **Performance Optimized**: Recall mode prioritizes content completeness

### Chunking Algorithm

The chunking algorithm:

1. **Extraction**: First extracts clean HTML using Trafilatura
2. **Parsing**: Parses HTML structure to identify headings and content
3. **Hierarchy Preservation**: Maintains document structure across chunks
4. **Content Validation**: Filters out short, low-quality content
5. **Deduplication**: Prevents duplicate content across chunks
6. **Word Limits**: Respects maximum word counts while preserving coherence

### Content Quality Filters

- Minimum 15 characters per content block
- Minimum 5 words per content block
- Duplicate content detection and removal
- Heading validation and hierarchy preservation

## Error Handling

The library includes comprehensive error handling:

```typescript
try {
  const content = await HtmlContentExtractor.extract(html);
} catch (error) {
  // Handle extraction errors
  console.error("Extraction failed:", error.message);
}
```

Common error scenarios:

- Invalid HTML input
- Binary execution failures
- Temporary file system issues
- Memory limitations with very large documents

## Performance Considerations

- **Binary Execution**: Python binary startup has ~100ms overhead
- **Temporary Files**: Uses system temp directory with UUID naming
- **Memory Usage**: Scales with document size, typically <50MB for large docs
- **Concurrent Processing**: Safe for concurrent use with unique temp files
