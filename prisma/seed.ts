import { PrismaClient, SystemType, AgreementType, AgreementStatus, SlaLevel, VisitStatus, VisitType, AddonCategory, AddonUnit } from "../generated/prisma";
import { CHECKLIST_TEMPLATES } from "../src/data/checklist-templates";

const prisma = new PrismaClient();

// Norwegian technician IDs (these should match employees in @energismart/shared Redis)
const TECHNICIAN_IDS = [
  "tech-001", // Primary technician
  "tech-002", // Secondary technician
  "tech-003", // Third technician
];

// Helper to generate a random date within a range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to pick random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// Helper to generate agreement number
function generateAgreementNumber(index: number): string {
  const year = new Date().getFullYear();
  return `SA-${year}-${String(index).padStart(4, "0")}`;
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data in reverse dependency order
  console.log("🗑️  Clearing existing data...");
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklist.deleteMany();
  await prisma.checklistTemplateItem.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.visitPhoto.deleteMany();
  await prisma.serviceVisit.deleteMany();
  await prisma.agreementAddon.deleteMany();
  await prisma.servicePlan.deleteMany();
  await prisma.serviceAgreement.deleteMany();
  await prisma.addonProduct.deleteMany();
  await prisma.installation.deleteMany();
  await prisma.customerCache.deleteMany();

  // =========================================
  // 1. Seed Customers (Norwegian businesses)
  // =========================================
  console.log("📦 Creating customers...");

  const customers = await Promise.all([
    prisma.customerCache.create({
      data: {
        tripletexId: 10001,
        name: "Solberg Eiendom AS",
        orgNumber: "912345678",
        contactPerson: "Erik Solberg",
        email: "erik@solberg-eiendom.no",
        phone: "+47 22 33 44 55",
        postalAddress: "Postboks 123, 0102 Oslo",
        physicalAddress: "Storgata 15, 0102 Oslo",
        invoiceEmail: "faktura@solberg-eiendom.no",
      },
    }),
    prisma.customerCache.create({
      data: {
        tripletexId: 10002,
        name: "Bergen Borettslag",
        orgNumber: "987654321",
        contactPerson: "Ingrid Hansen",
        email: "styret@bergen-borettslag.no",
        phone: "+47 55 66 77 88",
        postalAddress: "Nygårdsgaten 45, 5008 Bergen",
        physicalAddress: "Nygårdsgaten 45, 5008 Bergen",
        invoiceEmail: "faktura@bergen-borettslag.no",
      },
    }),
    prisma.customerCache.create({
      data: {
        tripletexId: 10003,
        name: "Trondheim Næringseiendom AS",
        orgNumber: "876543210",
        contactPerson: "Magnus Holm",
        email: "magnus@tn-eiendom.no",
        phone: "+47 73 11 22 33",
        postalAddress: "Munkegata 10, 7011 Trondheim",
        physicalAddress: "Munkegata 10, 7011 Trondheim",
        invoiceEmail: "regnskap@tn-eiendom.no",
      },
    }),
    prisma.customerCache.create({
      data: {
        tripletexId: 10004,
        name: "Fredrikstad Gård",
        orgNumber: "765432109",
        contactPerson: "Kari Johansen",
        email: "kari@fredrikstad-gard.no",
        phone: "+47 69 11 22 33",
        postalAddress: "Bondegata 8, 1605 Fredrikstad",
        physicalAddress: "Bondegata 8, 1605 Fredrikstad",
        invoiceEmail: "kari@fredrikstad-gard.no",
      },
    }),
    prisma.customerCache.create({
      data: {
        tripletexId: 10005,
        name: "Stavanger Havnebygg AS",
        orgNumber: "654321098",
        contactPerson: "Lars Pedersen",
        email: "lars@havnebygg.no",
        phone: "+47 51 22 33 44",
        postalAddress: "Havnegata 22, 4006 Stavanger",
        physicalAddress: "Havnegata 22, 4006 Stavanger",
        invoiceEmail: "okonomi@havnebygg.no",
      },
    }),
    prisma.customerCache.create({
      data: {
        tripletexId: 10006,
        name: "Kristiansand Sameie",
        orgNumber: "543210987",
        contactPerson: "Marte Olsen",
        email: "styreleder@ks-sameie.no",
        phone: "+47 38 44 55 66",
        postalAddress: "Markensgate 5, 4611 Kristiansand",
        physicalAddress: "Markensgate 5, 4611 Kristiansand",
        invoiceEmail: "styreleder@ks-sameie.no",
      },
    }),
    prisma.customerCache.create({
      data: {
        tripletexId: 10007,
        name: "Tromsø Industri AS",
        orgNumber: "432109876",
        contactPerson: "Anders Berg",
        email: "anders@tromso-industri.no",
        phone: "+47 77 55 66 77",
        postalAddress: "Industrivegen 100, 9019 Tromsø",
        physicalAddress: "Industrivegen 100, 9019 Tromsø",
        invoiceEmail: "regnskap@tromso-industri.no",
      },
    }),
    prisma.customerCache.create({
      data: {
        tripletexId: 10008,
        name: "Drammen Hotell Drift AS",
        orgNumber: "321098765",
        contactPerson: "Silje Andersen",
        email: "silje@drammen-hotell.no",
        phone: "+47 32 88 99 00",
        postalAddress: "Bragernes Torg 3, 3017 Drammen",
        physicalAddress: "Bragernes Torg 3, 3017 Drammen",
        invoiceEmail: "regnskap@drammen-hotell.no",
      },
    }),
  ]);

  console.log(`   Created ${customers.length} customers`);

  // =========================================
  // 2. Seed Installations
  // =========================================
  console.log("🏠 Creating installations...");

  const installationsData = [
    // Customer 1 - Multiple installations
    { customerId: customers[0]!.id, address: "Storgata 15", city: "Oslo", postalCode: "0102", systemType: SystemType.SOLAR_PANEL, capacityKw: 45.6, panelCount: 120, inverterType: "SolarEdge SE25K", panelType: "JinkoSolar Tiger Neo 380W" },
    { customerId: customers[0]!.id, address: "Karl Johans gate 33", city: "Oslo", postalCode: "0162", systemType: SystemType.COMBINED, capacityKw: 30.0, panelCount: 80, batteryKwh: 26.5, batteryType: "BYD HVM 26.5", inverterType: "Fronius Symo GEN24 Plus", panelType: "LONGi Hi-MO 5 390W" },
    // Customer 2
    { customerId: customers[1]!.id, address: "Nygårdsgaten 45", city: "Bergen", postalCode: "5008", systemType: SystemType.SOLAR_PANEL, capacityKw: 22.8, panelCount: 60, inverterType: "Huawei SUN2000-20KTL", panelType: "Canadian Solar HiKu6 380W" },
    // Customer 3 - Large industrial
    { customerId: customers[2]!.id, address: "Munkegata 10", city: "Trondheim", postalCode: "7011", systemType: SystemType.COMBINED, capacityKw: 100.0, panelCount: 250, batteryKwh: 100.0, batteryType: "Tesla Megapack", inverterType: "SMA Sunny Tripower X", panelType: "Trina Vertex S 405W" },
    { customerId: customers[2]!.id, address: "Haakon VIIs gate 5", city: "Trondheim", postalCode: "7010", systemType: SystemType.BESS, capacityKw: 0, batteryKwh: 50.0, batteryType: "BYD Battery-Box Premium HVM 50.0", inverterType: "Fronius Symo GEN24" },
    // Customer 4 - Farm
    { customerId: customers[3]!.id, address: "Bondegata 8", city: "Fredrikstad", postalCode: "1605", systemType: SystemType.SOLAR_PANEL, capacityKw: 15.2, panelCount: 40, inverterType: "GoodWe GW15K-DT", panelType: "Risen Energy RSM40-8-380M" },
    // Customer 5
    { customerId: customers[4]!.id, address: "Havnegata 22", city: "Stavanger", postalCode: "4006", systemType: SystemType.COMBINED, capacityKw: 75.0, panelCount: 200, batteryKwh: 40.0, batteryType: "LG RESU16H Prime", inverterType: "SolarEdge SE75K", panelType: "JA Solar DeepBlue 3.0 395W" },
    // Customer 6
    { customerId: customers[5]!.id, address: "Markensgate 5", city: "Kristiansand", postalCode: "4611", systemType: SystemType.SOLAR_PANEL, capacityKw: 18.0, panelCount: 48, inverterType: "Sungrow SG20RT", panelType: "Q CELLS Q.PEAK DUO 375W" },
    // Customer 7 - Industrial
    { customerId: customers[6]!.id, address: "Industrivegen 100", city: "Tromsø", postalCode: "9019", systemType: SystemType.COMBINED, capacityKw: 150.0, panelCount: 400, batteryKwh: 200.0, batteryType: "Samsung SDI ESS", inverterType: "SMA Sunny Central", panelType: "First Solar Series 7" },
    // Customer 8
    { customerId: customers[7]!.id, address: "Bragernes Torg 3", city: "Drammen", postalCode: "3017", systemType: SystemType.SOLAR_PANEL, capacityKw: 35.0, panelCount: 90, inverterType: "Growatt MOD 35KTL3-X", panelType: "Astronergy CHSM60M-HC 390W" },
    // Additional installations for variety
    { customerId: customers[0]!.id, address: "Grensen 12", city: "Oslo", postalCode: "0159", systemType: SystemType.BESS, capacityKw: 0, batteryKwh: 13.5, batteryType: "Tesla Powerwall 2", inverterType: "Tesla Gateway" },
    { customerId: customers[1]!.id, address: "Torgallmenningen 8", city: "Bergen", postalCode: "5014", systemType: SystemType.SOLAR_PANEL, capacityKw: 12.0, panelCount: 32, inverterType: "Enphase IQ8+", panelType: "SunPower Maxeon 3" },
  ];

  const installations = await Promise.all(
    installationsData.map((data, index) =>
      prisma.installation.create({
        data: {
          ...data,
          capacityKw: data.capacityKw,
          installDate: new Date(2022 + Math.floor(index / 4), index % 12, 15),
          batteryKwh: data.batteryKwh,
          inverterSerial: `INV-${Date.now()}-${String(index).padStart(3, "0")}`,
          monitoringId: `MON-${String(index + 1).padStart(5, "0")}`,
          notes: index % 3 === 0 ? "VIP-kunde med utvidet garanti" : undefined,
        },
      })
    )
  );

  console.log(`   Created ${installations.length} installations`);

  // =========================================
  // 3. Seed Add-on Products
  // =========================================
  console.log("🧩 Creating addon products...");

  const addonProducts = await Promise.all([
    // Maintenance
    prisma.addonProduct.create({
      data: {
        name: "Ekstra rengjøring",
        description: "Grundig rengjøring av paneler utover standard service",
        category: AddonCategory.MAINTENANCE,
        basePrice: 2500,
        unit: AddonUnit.PER_VISIT,
        isRecurring: false,
        sortOrder: 1,
      },
    }),
    prisma.addonProduct.create({
      data: {
        name: "Utvidet garanti",
        description: "5 års utvidet garanti på komponenter",
        category: AddonCategory.MAINTENANCE,
        basePrice: 5000,
        unit: AddonUnit.PER_YEAR,
        isRecurring: true,
        sortOrder: 2,
      },
    }),
    // Monitoring
    prisma.addonProduct.create({
      data: {
        name: "24/7 Fjernovervåking",
        description: "Kontinuerlig overvåking med varsling ved avvik",
        category: AddonCategory.MONITORING,
        basePrice: 500,
        unit: AddonUnit.PER_MONTH,
        isRecurring: true,
        sortOrder: 3,
      },
    }),
    prisma.addonProduct.create({
      data: {
        name: "Ytelsesrapport",
        description: "Månedlig detaljert ytelsesrapport",
        category: AddonCategory.MONITORING,
        basePrice: 300,
        unit: AddonUnit.PER_MONTH,
        isRecurring: true,
        sortOrder: 4,
      },
    }),
    // Priority
    prisma.addonProduct.create({
      data: {
        name: "Prioritert respons",
        description: "Garantert responstid innen 4 timer",
        category: AddonCategory.PRIORITY,
        basePrice: 15000,
        unit: AddonUnit.PER_YEAR,
        isRecurring: true,
        sortOrder: 5,
      },
    }),
    prisma.addonProduct.create({
      data: {
        name: "Helge- og kveldstillegg",
        description: "Service tilgjengelig utenom normal arbeidstid",
        category: AddonCategory.PRIORITY,
        basePrice: 8000,
        unit: AddonUnit.PER_YEAR,
        isRecurring: true,
        sortOrder: 6,
      },
    }),
    // Equipment
    prisma.addonProduct.create({
      data: {
        name: "Reservedeler pakke",
        description: "Forhåndslagret reservedeler for rask utskiftning",
        category: AddonCategory.EQUIPMENT,
        basePrice: 10000,
        unit: AddonUnit.FLAT_RATE,
        isRecurring: false,
        sortOrder: 7,
      },
    }),
    prisma.addonProduct.create({
      data: {
        name: "Termografisk inspeksjon",
        description: "Varmekamera-inspeksjon av paneler",
        category: AddonCategory.EQUIPMENT,
        basePrice: 3500,
        unit: AddonUnit.PER_VISIT,
        isRecurring: false,
        sortOrder: 8,
      },
    }),
  ]);

  console.log(`   Created ${addonProducts.length} addon products`);

  // =========================================
  // 4. Seed Service Agreements
  // =========================================
  console.log("📋 Creating service agreements...");

  const agreementTypes = [AgreementType.BASIC, AgreementType.STANDARD, AgreementType.PREMIUM, AgreementType.ENTERPRISE];
  const basePrices: Record<AgreementType, number> = {
    [AgreementType.BASIC]: 4500,
    [AgreementType.STANDARD]: 8500,
    [AgreementType.PREMIUM]: 15000,
    [AgreementType.ENTERPRISE]: 35000,
  };
  const visitFrequencies: Record<AgreementType, number> = {
    [AgreementType.BASIC]: 1,
    [AgreementType.STANDARD]: 2,
    [AgreementType.PREMIUM]: 4,
    [AgreementType.ENTERPRISE]: 6,
  };

  const agreements = await Promise.all(
    installations.map(async (installation, index) => {
      const agreementType = agreementTypes[index % agreementTypes.length]!;
      const status = index < 10 ? AgreementStatus.ACTIVE : (index === 10 ? AgreementStatus.DRAFT : AgreementStatus.PENDING_RENEWAL);
      const startDate = new Date(2023, Math.floor(index / 2), 1);
      
      const agreement = await prisma.serviceAgreement.create({
        data: {
          installationId: installation.id,
          agreementNumber: generateAgreementNumber(index + 1),
          agreementType,
          status,
          startDate,
          endDate: new Date(startDate.getFullYear() + 1, startDate.getMonth(), 0),
          basePrice: basePrices[agreementType],
          slaLevel: agreementType === AgreementType.ENTERPRISE ? SlaLevel.CRITICAL : (agreementType === AgreementType.PREMIUM ? SlaLevel.PRIORITY : SlaLevel.STANDARD),
          visitFrequency: visitFrequencies[agreementType],
          signedAt: status === AgreementStatus.ACTIVE ? startDate : undefined,
          signedBy: status === AgreementStatus.ACTIVE ? "Kundens signatur" : undefined,
          notes: index % 4 === 0 ? "Spesiell tilpasning avtalt med kunde" : undefined,
        },
      });

      // Add service plan for active agreements
      if (status === AgreementStatus.ACTIVE) {
        await prisma.servicePlan.create({
          data: {
            agreementId: agreement.id,
            visitFrequency: visitFrequencies[agreementType],
            nextVisit: new Date(),
            visitWindow: 14,
            preferredDay: ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag"][index % 5],
            preferredTime: index % 2 === 0 ? "morning" : "afternoon",
            seasonalAdjust: true,
          },
        });
      }

      // Add random addons to some agreements
      if (index % 2 === 0 && addonProducts.length > 0) {
        const numAddons = 1 + (index % 3);
        const selectedAddons = [...addonProducts].sort(() => Math.random() - 0.5).slice(0, numAddons);
        
        for (const addon of selectedAddons) {
          await prisma.agreementAddon.create({
            data: {
              agreementId: agreement.id,
              addonId: addon.id,
              quantity: 1,
            },
          });
        }
      }

      return agreement;
    })
  );

  console.log(`   Created ${agreements.length} service agreements`);

  // =========================================
  // 5. Seed Checklist Templates
  // =========================================
  console.log("📝 Creating checklist templates...");

  for (const template of CHECKLIST_TEMPLATES) {
    const createdTemplate = await prisma.checklistTemplate.create({
      data: {
        name: template.name,
        description: template.description,
        systemType: template.systemType as SystemType,
        visitType: template.visitType as VisitType,
        version: 1,
        isActive: true,
      },
    });

    await Promise.all(
      template.items.map((item) =>
        prisma.checklistTemplateItem.create({
          data: {
            templateId: createdTemplate.id,
            category: item.category,
            description: item.description,
            inputType: item.inputType,
            isMandatory: item.isMandatory,
            photoRequired: item.photoRequired,
            minValue: item.minValue,
            maxValue: item.maxValue,
            options: item.options ? JSON.stringify(item.options) : undefined,
            helpText: item.helpText,
            sortOrder: item.sortOrder,
          },
        })
      )
    );
  }

  console.log(`   Created ${CHECKLIST_TEMPLATES.length} checklist templates`);

  // =========================================
  // 6. Seed Service Visits
  // =========================================
  console.log("🗓️ Creating service visits...");

  const visitTypes = [VisitType.ANNUAL_INSPECTION, VisitType.SEMI_ANNUAL, VisitType.QUARTERLY];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const visitsToCreate: Array<{
    agreementId: string;
    technicianId: string;
    scheduledDate: Date;
    status: VisitStatus;
    visitType: VisitType;
    durationMinutes?: number;
    actualStartDate?: Date;
    actualEndDate?: Date;
    notes?: string;
  }> = [];

  // Generate visits for active agreements
  const activeAgreements = agreements.filter(a => a.status === AgreementStatus.ACTIVE);
  
  for (let i = 0; i < activeAgreements.length; i++) {
    const agreement = activeAgreements[i]!;
    
    // Past completed visits
    for (let j = 0; j < 3; j++) {
      const scheduledDate = new Date(today);
      scheduledDate.setDate(today.getDate() - 30 * (j + 1) - Math.floor(Math.random() * 10));
      scheduledDate.setHours(8 + Math.floor(Math.random() * 8), 0, 0, 0);
      
      const startDate = new Date(scheduledDate);
      const duration = 60 + Math.floor(Math.random() * 120);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      
      visitsToCreate.push({
        agreementId: agreement.id,
        technicianId: TECHNICIAN_IDS[i % TECHNICIAN_IDS.length]!,
        scheduledDate,
        status: VisitStatus.COMPLETED,
        visitType: visitTypes[j % visitTypes.length]!,
        durationMinutes: duration,
        actualStartDate: startDate,
        actualEndDate: endDate,
        notes: j === 0 ? "Utført uten avvik" : undefined,
      });
    }

    // Today's visits (mix of scheduled and in-progress)
    if (i < 4) {
      const todayDate = new Date(today);
      todayDate.setHours(9 + i * 2, 0, 0, 0);
      
      const isInProgress = i < 2;
      visitsToCreate.push({
        agreementId: agreement.id,
        technicianId: TECHNICIAN_IDS[i % TECHNICIAN_IDS.length]!,
        scheduledDate: todayDate,
        status: isInProgress ? VisitStatus.IN_PROGRESS : VisitStatus.SCHEDULED,
        visitType: VisitType.ANNUAL_INSPECTION,
        actualStartDate: isInProgress ? new Date(todayDate.getTime() - 30 * 60000) : undefined,
        notes: isInProgress ? "Pågående inspeksjon" : undefined,
      });
    }

    // Upcoming scheduled visits
    for (let j = 0; j < 2; j++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 7 * (j + 1) + Math.floor(Math.random() * 5));
      futureDate.setHours(8 + Math.floor(Math.random() * 8), 0, 0, 0);
      
      visitsToCreate.push({
        agreementId: agreement.id,
        technicianId: TECHNICIAN_IDS[(i + j) % TECHNICIAN_IDS.length]!,
        scheduledDate: futureDate,
        status: VisitStatus.SCHEDULED,
        visitType: visitTypes[j % visitTypes.length]!,
      });
    }
  }

  // Add a few cancelled visits
  visitsToCreate.push({
    agreementId: activeAgreements[0]!.id,
    technicianId: TECHNICIAN_IDS[0]!,
    scheduledDate: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
    status: VisitStatus.CANCELLED,
    visitType: VisitType.QUARTERLY,
    notes: "Kansellert pga. værforhold",
  });

  const visits = await Promise.all(
    visitsToCreate.map((visit) =>
      prisma.serviceVisit.create({
        data: visit,
      })
    )
  );

  console.log(`   Created ${visits.length} service visits`);

  // =========================================
  // 7. Seed Invoices for completed visits
  // =========================================
  console.log("💰 Creating invoices...");

  const completedVisits = visits.filter(v => v.status === VisitStatus.COMPLETED);
  let invoiceCount = 0;

  for (let i = 0; i < Math.min(completedVisits.length, 10); i++) {
    const visit = completedVisits[i]!;
    const baseAmount = 2500 + Math.floor(Math.random() * 5000);
    const vatAmount = baseAmount * 0.25;
    
    await prisma.invoice.create({
      data: {
        visitId: visit.id,
        invoiceNumber: `INV-2024-${String(i + 1).padStart(5, "0")}`,
        amount: baseAmount,
        vatAmount: vatAmount,
        totalAmount: baseAmount + vatAmount,
        status: i < 5 ? "PAID" : (i < 8 ? "SENT" : "DRAFT"),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        sentAt: i < 8 ? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) : undefined,
        paidAt: i < 5 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : undefined,
        lineItems: {
          create: [
            {
              description: "Årlig serviceinspeksjon",
              quantity: 1,
              unitPrice: baseAmount * 0.7,
              totalPrice: baseAmount * 0.7,
              vatRate: 25,
            },
            {
              description: "Materialer og forbruksartikler",
              quantity: 1,
              unitPrice: baseAmount * 0.3,
              totalPrice: baseAmount * 0.3,
              vatRate: 25,
            },
          ],
        },
      },
    });
    invoiceCount++;
  }

  console.log(`   Created ${invoiceCount} invoices`);

  // =========================================
  // Summary
  // =========================================
  console.log("\n✅ Seed completed successfully!\n");
  console.log("Summary:");
  console.log(`   - ${customers.length} customers`);
  console.log(`   - ${installations.length} installations`);
  console.log(`   - ${addonProducts.length} addon products`);
  console.log(`   - ${agreements.length} service agreements`);
  console.log(`   - ${CHECKLIST_TEMPLATES.length} checklist templates`);
  console.log(`   - ${visits.length} service visits`);
  console.log(`   - ${invoiceCount} invoices`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
