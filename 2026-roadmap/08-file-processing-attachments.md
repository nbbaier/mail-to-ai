# File Processing & Attachments

**Category:** New Feature
**Quarter:** Q2
**T-shirt Size:** M

## Why This Matters

Email's superpower is **attachments**. People naturally send documents, images, CSVs, and PDFs via email. But Mail-to-AI currently **ignores all attachments**. The email parser extracts text, but files are discarded.

This is a massive missed opportunity. Some of the highest-value use cases require file processing:
- "Summarize this PDF report"
- "Review this Excel spreadsheet"
- "Describe what's in this image"
- "Convert this document to markdown"
- "Analyze this CSV data"

Without attachment support, Mail-to-AI is limited to text-only interactions.

## Current State

**What exists:**
- `email-parser.ts` extracts `from`, `subject`, `body`
- Attachments are received by inbound.new but not processed
- No file storage infrastructure
- No image processing
- No document parsing

**What users try to do (and fail):**
```
To: summarize@mail-to-ai.com
Subject: Please summarize
Body: Please summarize the attached quarterly report.
Attachment: Q4-Report.pdf

Response: "I don't see any content to summarize.
Please paste the text in your email."
```

## Proposed Future State

Full attachment processing with intelligent file handling:

### Supported File Types
```
┌─────────────────────────────────────────────────────────────┐
│  File Type Support                                          │
├─────────────────────────────────────────────────────────────┤
│  Documents: PDF, DOCX, TXT, MD, HTML                       │
│  Spreadsheets: XLSX, CSV, TSV                              │
│  Images: PNG, JPG, GIF, WEBP (with vision)                 │
│  Code: Any text-based file (.py, .ts, .rs, etc.)           │
│  Data: JSON, XML, YAML                                     │
│  Archives: ZIP (extract and process contents)              │
└─────────────────────────────────────────────────────────────┘
```

### File Processing Pipeline
```
Email arrives with attachment
         │
         ▼
┌─────────────────┐
│ File Validator  │ ─→ Size limits, type checking, virus scan
└─────────────────┘
         │
         ▼
┌─────────────────┐
│ File Processor  │ ─→ Extract text, parse structure
└─────────────────┘
         │
         ├─── PDF → Text + layout extraction
         ├─── XLSX → Structured data tables
         ├─── Images → Claude Vision analysis
         ├─── CSV → Data parsing + preview
         └─── Code → Syntax-aware extraction
         │
         ▼
┌─────────────────┐
│ Content Merger  │ ─→ Combine email body + file contents
└─────────────────┘
         │
         ▼
    Agent processes unified content
```

### Example: PDF Summarization
```
To: summarize@mail-to-ai.com
Subject: Summarize this report
Attachment: Q4-2024-Report.pdf (42 pages)

Response:
📄 **Summary of Q4-2024-Report.pdf**

**Executive Summary:**
The report covers Q4 2024 financial results, showing 23% YoY
revenue growth driven by enterprise expansion...

**Key Findings:**
1. Revenue: $127M (+23% YoY)
2. Customer retention: 94%
3. New enterprise deals: 47
...

**Notable Quotes:**
> "We expect continued momentum into 2025" (p. 12)
> "International expansion exceeded projections" (p. 28)

[Full 42-page document processed]
```

### Example: Image Analysis
```
To: analyze-image@mail-to-ai.com
Subject: What's in this diagram?
Attachment: architecture.png

Response:
🖼️ **Image Analysis**

This appears to be a system architecture diagram showing:

**Components:**
- Frontend (React) connecting to API Gateway
- Three microservices: Auth, Orders, Inventory
- PostgreSQL database with read replicas
- Redis cache layer
- Message queue (appears to be RabbitMQ)

**Observations:**
- Single point of failure at the API Gateway
- No CDN for static assets
- Database connection pooling not shown

Would you like me to suggest improvements?
```

## Key Deliverables

- [ ] Extend email parser to extract attachment metadata
- [ ] Implement R2 storage for attachment files (temporary, 24hr TTL)
- [ ] Build PDF text extraction (pdf-parse or similar)
- [ ] Add DOCX/DOC parsing (mammoth.js)
- [ ] Implement CSV/XLSX parsing (xlsx library)
- [ ] Integrate Claude Vision for image analysis
- [ ] Create file type detection and routing
- [ ] Implement file size limits and validation
- [ ] Add virus/malware scanning (ClamAV or cloud service)
- [ ] Build multi-file processing (handle multiple attachments)
- [ ] Create attachment reference in responses ("See page 12...")
- [ ] Implement file generation responses (return PDF, images, etc.)
- [ ] Add file storage quotas per user
- [ ] Build preview generation for large files
- [ ] Create file processing analytics

## Prerequisites

- **Initiative #1 (Testing)**: File parsing has many edge cases
- **Initiative #5 (Observability)**: File processing errors need visibility

## Risks & Open Questions

- **File size limits**: What's the max attachment size? Email typically limits to 25MB.
- **Processing time**: Large PDFs can take seconds to parse. Does this fit Workers CPU limits?
- **Cost**: R2 storage, Claude Vision API calls, processing compute. How does this affect pricing?
- **Security**: File uploads are attack vectors. How thorough is our validation?
- **OCR**: Should we OCR scanned PDFs? This adds complexity and cost.
- **Multi-modal context**: How do we efficiently combine image context with text?
- **Privacy**: Files may contain sensitive data. How long do we retain them?

## Notes

**PDF processing options:**
- **pdf-parse**: Simple text extraction, works in Workers
- **pdf.js**: Full rendering, heavier
- **pdf-lib**: Manipulation, not extraction
- **External service**: Unstructured.io, AWS Textract

Recommendation: Start with pdf-parse for text PDFs, add OCR service for scanned docs.

**Claude Vision considerations:**
- Images must be base64 encoded or URL-accessible
- Max image size: 20MB
- Supported formats: PNG, JPG, GIF, WEBP
- Cost: More expensive than text tokens

**File retention policy:**
- Temporary files: 24 hours
- Processed content: Per conversation history retention
- User-uploaded context: Per user storage quota

**Storage architecture:**
```
R2 Bucket: mail-to-ai-attachments
├── temp/
│   └── {emailId}/{filename}  // 24hr TTL
├── processed/
│   └── {userId}/{filename}   // Extracted content
└── generated/
    └── {emailId}/{filename}  // Output files
```

**Size limits recommendation:**
- Single file: 10MB max
- Total per email: 25MB max
- Monthly storage per free user: 100MB
- Monthly storage per paid user: 5GB

**Related files:**
- `src/utils/email-parser.ts` - attachment extraction
- `src/agents/base-agent.ts` - multi-modal message handling
- New: `src/services/file-processor.ts`
- New: `src/services/pdf-extractor.ts`
- New: `src/services/image-analyzer.ts`
- New: `src/utils/file-validator.ts`
