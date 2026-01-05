import { PrismaClient, UserRole, RequirementCategory, RequirementOwner } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// DFSA 20-item checklist template
const DFSA_REQUIREMENTS = [
  {
    name: "Regulatory Business Plan (RBP)",
    description: "Scope, target clients, products, DIFC operating model, outsourcing, timeline.",
    category: RequirementCategory.BUSINESS_PLAN,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "GEN",
    sortOrder: 1,
  },
  {
    name: "Regulated Activities & Permissions Mapping",
    description: "Clear mapping of proposed activities to DFSA permissions + boundaries (what you will NOT do).",
    category: RequirementCategory.LEGAL,
    owner: RequirementOwner.SHARED,
    dfsaModuleTag: "GEN",
    sortOrder: 2,
  },
  {
    name: "Programme of Operations / Operating Model",
    description: "End-to-end flows: onboarding, trading/execution (if any), custody/wallet ops (if any), settlement, complaints.",
    category: RequirementCategory.OPERATIONS,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "GEN",
    sortOrder: 3,
  },
  {
    name: "Group Structure, Controllers, UBOs, Close Links",
    description: "Ownership chart, controllers, UBO declaration, close-links narrative.",
    category: RequirementCategory.LEGAL,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "GEN",
    sortOrder: 4,
  },
  {
    name: "Governance Pack",
    description: "Board charter, committee ToRs, decision rights, meeting cadence.",
    category: RequirementCategory.GOVERNANCE,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "GEN",
    sortOrder: 5,
  },
  {
    name: "Senior Management & Key Individuals Pack",
    description: "Org chart, role descriptions, CVs, responsibilities matrix, key-person dependency notes.",
    category: RequirementCategory.GOVERNANCE,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "GEN",
    sortOrder: 6,
  },
  {
    name: "Compliance Manual (GEN/COB-aligned)",
    description: "Compliance framework, monitoring plan, policies index, breaches/escalation.",
    category: RequirementCategory.COMPLIANCE,
    owner: RequirementOwner.SHARED,
    dfsaModuleTag: "GEN",
    sortOrder: 7,
  },
  {
    name: "Risk Management Framework",
    description: "Risk taxonomy, risk appetite, KRIs, registers, governance, stress scenarios.",
    category: RequirementCategory.RISK_MANAGEMENT,
    owner: RequirementOwner.SHARED,
    dfsaModuleTag: "GEN",
    sortOrder: 8,
  },
  {
    name: "AML/CFT Framework (DFSA AML expectations)",
    description: "AML policy, MLRO responsibilities, suspicious activity process, training plan.",
    category: RequirementCategory.AML_CFT,
    owner: RequirementOwner.SHARED,
    dfsaModuleTag: "AML",
    sortOrder: 9,
  },
  {
    name: "Customer Due Diligence (CDD/KYC) Procedures",
    description: "CDD tiers, onboarding checks, EDD triggers, source of funds/wealth, PEP handling.",
    category: RequirementCategory.AML_CFT,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "AML",
    sortOrder: 10,
  },
  {
    name: "Sanctions & Screening Procedure",
    description: "Screening tools/workflows, false-positive handling, escalation & reporting.",
    category: RequirementCategory.AML_CFT,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "AML",
    sortOrder: 11,
  },
  {
    name: "Transaction Monitoring & Blockchain Analytics Approach",
    description: "Monitoring rules, red flags, analytics tooling, investigations workflow.",
    category: RequirementCategory.AML_CFT,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "AML",
    sortOrder: 12,
  },
  {
    name: "Market Conduct & Client Communications (COB)",
    description: "Disclosures, marketing approvals, suitability/appropriateness approach (if relevant), complaint handling.",
    category: RequirementCategory.COMPLIANCE,
    owner: RequirementOwner.SHARED,
    dfsaModuleTag: "COB",
    sortOrder: 13,
  },
  {
    name: "Custody / Client Asset Safeguarding (if applicable)",
    description: "Wallet controls, key management, segregation, reconciliations, access controls.",
    category: RequirementCategory.OPERATIONS,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "COB",
    sortOrder: 14,
    required: false,
  },
  {
    name: "Technology Architecture & IT Controls Pack",
    description: "System architecture, environments, SDLC, change management, logging, access control.",
    category: RequirementCategory.TECHNOLOGY,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "SYS",
    sortOrder: 15,
  },
  {
    name: "Cybersecurity Policy & Incident Response Plan",
    description: "SOC processes, detection/response, incident playbooks, notification workflow, DR testing.",
    category: RequirementCategory.TECHNOLOGY,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "SYS",
    sortOrder: 16,
  },
  {
    name: "Outsourcing & Third-Party/Vendor Management",
    description: "Outsourcing register, due diligence, SLAs, audit rights, concentration risk, exit plans.",
    category: RequirementCategory.OPERATIONS,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "GEN",
    sortOrder: 17,
  },
  {
    name: "Financial Model + Capital/Prudential Resources",
    description: "3-year projections, runway, assumptions, regulatory capital approach, liquidity plan.",
    category: RequirementCategory.FINANCIAL,
    owner: RequirementOwner.CLIENT,
    dfsaModuleTag: "PRU",
    sortOrder: 18,
  },
  {
    name: "Internal Controls / Audit & Assurance Plan",
    description: "Internal audit approach (in-house/outsourced), control testing, reporting to board.",
    category: RequirementCategory.GOVERNANCE,
    owner: RequirementOwner.SHARED,
    dfsaModuleTag: "GEN",
    sortOrder: 19,
  },
  {
    name: "Application Forms & Submission Pack Index",
    description: "Master index of forms, declarations, attachments, version-controlled 'what's in the final package'.",
    category: RequirementCategory.LEGAL,
    owner: RequirementOwner.LAWYER,
    dfsaModuleTag: "GEN",
    sortOrder: 20,
  },
];

async function main() {
  console.log('🌱 Starting seed...');

  // Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "CryptoTech DMCC",
      description: "A crypto token business applying for DFSA authorization in DIFC",
    },
  });
  console.log('✓ Created organization:', org.name);

  // Create Users
  const passwordHash = await hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@coddylaw.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      password: passwordHash,
      organizationId: org.id,
    },
  });
  console.log('✓ Created admin user:', admin.email);

  const lawyer = await prisma.user.create({
    data: {
      email: 'lawyer@coddylaw.com',
      name: 'Sarah Al-Mansouri',
      role: UserRole.LAWYER,
      password: passwordHash,
      organizationId: org.id,
    },
  });
  console.log('✓ Created lawyer user:', lawyer.email);

  const client = await prisma.user.create({
    data: {
      email: 'client@cryptotech.ae',
      name: 'Michael Chen',
      role: UserRole.CLIENT,
      password: passwordHash,
      organizationId: org.id,
    },
  });
  console.log('✓ Created client user:', client.email);

  // Create Filing with DFSA checklist
  const filing = await prisma.filing.create({
    data: {
      name: "CryptoTech DFSA Authorization Application",
      description: "DFSA authorization application for crypto/token business operations in DIFC",
      status: "IN_PROGRESS",
      regulator: "DFSA",
      jurisdiction: "DIFC",
      applicationType: "Authorisation",
      organizationId: org.id,
      createdById: admin.id,
      targetSubmissionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    },
  });
  console.log('✓ Created filing:', filing.name);

  // Assign users to filing
  await prisma.filingAssignment.createMany({
    data: [
      { filingId: filing.id, userId: lawyer.id, role: UserRole.LAWYER },
      { filingId: filing.id, userId: client.id, role: UserRole.CLIENT },
    ],
  });
  console.log('✓ Assigned users to filing');

  // Create all 20 DFSA document requirements
  for (const req of DFSA_REQUIREMENTS) {
    await prisma.documentRequirement.create({
      data: {
        ...req,
        filingId: filing.id,
      },
    });
  }
  console.log('✓ Created 20 DFSA document requirements');

  // Log activity
  await prisma.activityLog.create({
    data: {
      filingId: filing.id,
      activityType: 'FILING_CREATED',
      description: `Filing "${filing.name}" created with DFSA checklist`,
      userId: admin.id,
    },
  });

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin:  admin@coddylaw.com / password123');
  console.log('  Lawyer: lawyer@coddylaw.com / password123');
  console.log('  Client: client@cryptotech.ae / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
