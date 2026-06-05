import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get admin workspace
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin?.workspaceId) { console.error("No admin with a workspace found"); process.exit(1); }

  const adminWs = await prisma.workspace.findUnique({ where: { id: admin.workspaceId } });
  if (!adminWs) { console.error("Admin workspace not found"); process.exit(1); }

  const adminSettings = JSON.parse(adminWs.brandSettings || "{}");
  const adminColors = adminSettings.brandColors;
  if (!adminColors) { console.error("Admin has no saved brandColors"); process.exit(1); }

  console.log("Admin colors:", JSON.stringify(adminColors));

  // Get all other workspaces
  const others = await prisma.workspace.findMany({ where: { id: { not: admin.workspaceId } } });
  console.log(`Updating ${others.length} other workspace(s)…`);

  for (const ws of others) {
    const settings = JSON.parse(ws.brandSettings || "{}");
    settings.brandColors = adminColors;
    await prisma.workspace.update({
      where: { id: ws.id },
      data: { brandSettings: JSON.stringify(settings) },
    });
    console.log(`  ✓ ${ws.name} (${ws.id})`);
  }

  console.log("Done.");
}

main().finally(() => prisma.$disconnect());
