import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();

  // 1. Seed Categories (4 standard categories)
  const categoryNames = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  // 2. Seed Related Systems (7 campus systems)
  const relatedSystems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
  ];

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }

  // 3. Seed Development Requester Users (4 active, 1 inactive)
  const requesters = [
    {
      fullName: "Jennifer Anderson",
      email: "jennifer.anderson@kmutt.ac.th",
      department: "Computer Engineering",
      isActive: true,
    },
    {
      fullName: "Michael Brown",
      email: "michael.brown@kmutt.ac.th",
      department: "Information Technology",
      isActive: true,
    },
    {
      fullName: "Sarah Johnson",
      email: "sarah.johnson@kmutt.ac.th",
      department: "Electrical Engineering",
      isActive: true,
    },
    {
      fullName: "David Lee",
      email: "david.lee@kmutt.ac.th",
      department: "Applied Science",
      isActive: true,
    },
    {
      fullName: "Inactive User",
      email: "inactive.user@kmutt.ac.th",
      department: "Staff",
      isActive: false,
    },
  ];

  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: {
        fullName: req.fullName,
        department: req.department,
        isActive: req.isActive,
      },
      create: req,
    });
  }

  console.log("Lab 2 seed data completed successfully:");
  console.log(`- ${categoryNames.length} Categories`);
  console.log(`- ${relatedSystems.length} Related Systems`);
  console.log(`- ${requesters.length} Requester Users (4 active, 1 inactive)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
