import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const suppliers = await prisma.supplier.findMany({ select: { id: true, name: true, whatsappNumber: true } })
  console.log(suppliers)
}
main().finally(() => prisma.$disconnect())
