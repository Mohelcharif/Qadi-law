# Coddy Law - DFSA Crypto Authorization Workspace

A collaborative workspace application for managing DFSA (DIFC) authorization applications for crypto/token businesses. Built with Next.js 14, TypeScript, Prisma, and Tailwind CSS.

## Features

- **DFSA-Specific Workflow**: Pre-configured with 20 DFSA document requirements for crypto/token authorization
- **Role-Based Access Control (RBAC)**: Client, Lawyer, and Admin roles with appropriate permissions
- **Vanta-Style Checklist**: Track progress across all document requirements with status badges
- **AI Document Analysis**: Automatic analysis of uploaded documents with issue detection (Coddy AI integration stub)
- **Issues Management**: Track, filter, and resolve issues across all requirements
- **Submission Package**: View readiness status and export submission packages
- **Real-time Collaboration**: Comments, RFIs, and status updates

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + Radix UI components
- **State Management**: React Query
- **File Upload**: Multipart form data (with S3-ready architecture)

## Architecture

### Data Model

```
Organization
  ├─ Users (Client, Lawyer, Admin)
  └─ Filings
      ├─ Document Requirements (20 DFSA items)
      │   ├─ Document Submissions (versioned uploads)
      │   ├─ Issues (AI-generated + manual)
      │   └─ Comments (shared/internal)
      └─ Activity Log
```

### Key Entities

- **Filing**: A DFSA authorization application with status tracking
- **DocumentRequirement**: One of 20 predefined DFSA checklist items
- **DocumentSubmission**: Uploaded files with AI analysis results
- **Issue**: Problems or questions identified by AI or reviewers
- **Comment**: Discussion threads (shared or lawyer-internal)

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (local or hosted)
- Git

## Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Qadi-law
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/coddy_law?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Coddy AI Integration (optional - stub included)
CODDY_API_BASE_URL="https://api.coddy.ai"
CODDY_API_KEY="your-coddy-api-key"
```

**Generate a secure NextAuth secret**:
```bash
openssl rand -base64 32
```

### 4. Set up the database

```bash
# Push schema to database
npm run db:push

# Seed with sample data (includes 1 org, 3 users, 1 filing with 20 DFSA items)
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

After seeding, you can log in with:

- **Admin**: `admin@coddylaw.com` / `password123`
- **Lawyer**: `lawyer@coddylaw.com` / `password123`
- **Client**: `client@cryptotech.ae` / `password123`

## Usage Guide

### 1. Filings Dashboard

- View all filings with progress indicators
- Create new filings (Admin only)
- Click on a filing to open the detail view

### 2. Filing Detail View

The main workspace has four tabs:

#### **Summary Tab**
- **DFSA Submission Readiness**: Overall progress and statistics
- **Progress by Category**: Breakdown by requirement type (AML, Governance, etc.)
- **Filing Details**: Regulator, jurisdiction, and metadata

#### **Documents Tab** (Vanta-Style Checklist)
- **20 DFSA Requirements**: Pre-configured checklist
- **Upload Documents**: Click "Upload" to attach files
- **AI Analysis**: Automatic analysis runs on upload
- **Status Management**:
  - Lawyer/Admin can approve or request changes
  - Client can upload new versions
- **Issue Tracking**: See open issues per requirement

#### **Issues Tab**
- **Master Issues List**: All issues across all requirements
- **Filtering**: By severity (Low/Medium/High/Critical) and status
- **Issue Details**: Title, description, document, source (AI vs Manual)
- **Actions**: Mark as resolved, in progress, etc.

#### **Submission Package Tab**
- **Ready vs Blocked**: Visual breakdown of submission readiness
- **Export**: Download CSV of submission package
- **Submit Button**: Enabled when all items approved

### 3. Document Upload & AI Analysis

1. Navigate to **Documents** tab
2. Click **Upload** next to any requirement
3. Select a file (PDF, DOCX, etc.)
4. AI analysis runs automatically:
   - Extracts summary and fields
   - Identifies potential issues
   - Creates issue records
5. Review AI-generated issues in **Issues** tab

### 4. Approval Workflow

**For Lawyers/Admins**:
1. Review uploaded documents
2. Check AI-identified issues
3. Click **Approve** if document is compliant
4. Or click **Request Changes** to send back to client

**For Clients**:
1. View open issues and RFIs
2. Upload revised documents
3. Respond to comments

### 5. Submission Readiness

- **Summary Tab**: Check overall progress percentage
- **Submission Package Tab**:
  - All items must be "Approved" to submit
  - Export package for record-keeping
  - Click "Submit to DFSA" when ready

## Project Structure

```
├── app/
│   ├── (dashboard)/        # Authenticated pages
│   │   └── filings/        # Filings list and detail
│   ├── api/                # API routes
│   │   ├── auth/           # NextAuth
│   │   ├── filings/        # Filing CRUD
│   │   ├── requirements/   # Document requirements
│   │   └── issues/         # Issue management
│   ├── auth/               # Sign in page
│   └── layout.tsx          # Root layout
├── components/
│   ├── filing/             # Filing tab components
│   ├── layout/             # Navigation header
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── auth.ts             # NextAuth config + RBAC helpers
│   ├── coddy-ai.ts         # AI adapter (stub)
│   ├── prisma.ts           # Prisma client singleton
│   └── utils.ts            # Utility functions
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
└── README.md
```

## DFSA 20-Item Checklist

The application comes pre-configured with these DFSA requirements:

1. Regulatory Business Plan (RBP)
2. Regulated Activities & Permissions Mapping
3. Programme of Operations / Operating Model
4. Group Structure, Controllers, UBOs, Close Links
5. Governance Pack
6. Senior Management & Key Individuals Pack
7. Compliance Manual (GEN/COB-aligned)
8. Risk Management Framework
9. AML/CFT Framework (DFSA AML expectations)
10. Customer Due Diligence (CDD/KYC) Procedures
11. Sanctions & Screening Procedure
12. Transaction Monitoring & Blockchain Analytics Approach
13. Market Conduct & Client Communications (COB)
14. Custody / Client Asset Safeguarding (if applicable)
15. Technology Architecture & IT Controls Pack
16. Cybersecurity Policy & Incident Response Plan
17. Outsourcing & Third-Party/Vendor Management
18. Financial Model + Capital/Prudential Resources
19. Internal Controls / Audit & Assurance Plan
20. Application Forms & Submission Pack Index

## Role-Based Permissions

### Client
- View filings and all checklist items
- Upload documents
- View shared comments and issues
- Respond to RFIs

### Lawyer
- All Client permissions, plus:
- Approve/reject documents
- Create and edit issues
- View internal comments
- Mark items as "Needs Changes"
- Re-run AI analysis

### Admin
- All Lawyer permissions, plus:
- Create new filings
- Manage users and organizations
- Change filing status

## Coddy AI Integration

The application includes a stub adapter for Coddy AI (`lib/coddy-ai.ts`).

### Current Implementation (Stub)

The stub returns mock data for:
- `analyzeDocument()`: Returns sample summary, extracted fields, and 2 issues
- `chatOnDocument()`: Returns generic AI responses
- `generateRFI()`: Returns sample RFI questions

### Replacing with Real API

1. Update `CODDY_API_BASE_URL` and `CODDY_API_KEY` in `.env`
2. In `lib/coddy-ai.ts`, uncomment the actual API calls:

```typescript
// Replace this:
return this.mockAnalyze(context);

// With this:
const response = await this.client.post('/analyze', {
  fileUrl,
  context,
});
return response.data;
```

3. Adjust the response mapping based on actual API schema

## Database Management

```bash
# View data in Prisma Studio
npm run db:studio

# Push schema changes
npm run db:push

# Re-seed database
npm run db:seed

# Generate Prisma Client (after schema changes)
npx prisma generate
```

## Production Deployment

### Environment Variables

Set these in your production environment:
- `DATABASE_URL`: Production PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secure random string
- `NEXTAUTH_URL`: Your production domain
- `CODDY_API_KEY`: Your Coddy AI API key

### File Storage

The current implementation uses in-memory file URLs. For production:

1. Set up S3 or similar object storage
2. Update `app/api/requirements/[id]/submit/route.ts`:
   - Upload file to S3
   - Store S3 URL in database
3. Add signed URL generation for secure downloads

### Build

```bash
npm run build
npm run start
```

## Customization

### Adding Custom Requirements

Edit `prisma/seed.ts` to modify the checklist:

```typescript
const CUSTOM_REQUIREMENTS = [
  {
    name: "Your Custom Requirement",
    description: "Description here",
    category: RequirementCategory.COMPLIANCE,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "GEN",
    sortOrder: 21,
  },
  // ... more items
];
```

### Changing Color Scheme

Edit `app/globals.css` to modify CSS variables:

```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Blue */
  --secondary: 210 40% 96.1%;
  /* ... */
}
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:pass@host:port/db`

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Clear browser cookies and try again

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Delete `.next` folder and rebuild: `rm -rf .next && npm run build`

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
