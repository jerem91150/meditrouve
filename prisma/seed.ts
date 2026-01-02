import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Creer le compte admin
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@alertemedicaments.fr' },
    update: {},
    create: {
      email: 'admin@alertemedicaments.fr',
      name: 'Admin',
      password: hashedPassword,
      plan: 'PREMIUM',
      notifyEmail: true,
      notifyPush: true,
    },
  });

  console.log('Admin cree:', admin.email);

  // Creer des pharmacies demo (region parisienne)
  const pharmacies = [
    {
      name: 'Pharmacie du Centre',
      address: '15 Rue de la Paix',
      city: 'Paris',
      postalCode: '75002',
      latitude: 48.8698,
      longitude: 2.3308,
      phone: '01 42 61 00 00',
      isOnDuty: false,
    },
    {
      name: 'Pharmacie de la Gare',
      address: '42 Boulevard de Magenta',
      city: 'Paris',
      postalCode: '75010',
      latitude: 48.8761,
      longitude: 2.3570,
      phone: '01 48 78 00 00',
      isOnDuty: true,
    },
    {
      name: 'Grande Pharmacie de Belleville',
      address: '120 Boulevard de Belleville',
      city: 'Paris',
      postalCode: '75020',
      latitude: 48.8700,
      longitude: 2.3870,
      phone: '01 43 58 00 00',
      isOnDuty: false,
    },
    {
      name: 'Pharmacie Monge',
      address: '74 Rue Monge',
      city: 'Paris',
      postalCode: '75005',
      latitude: 48.8445,
      longitude: 2.3528,
      phone: '01 43 31 00 00',
      isOnDuty: false,
    },
    {
      name: 'Pharmacie des Halles',
      address: '10 Rue des Halles',
      city: 'Paris',
      postalCode: '75001',
      latitude: 48.8586,
      longitude: 2.3470,
      phone: '01 42 33 00 00',
      isOnDuty: true,
    },
    {
      name: 'Pharmacie Charonne',
      address: '95 Rue de Charonne',
      city: 'Paris',
      postalCode: '75011',
      latitude: 48.8534,
      longitude: 2.3849,
      phone: '01 43 79 00 00',
      isOnDuty: false,
    },
    {
      name: 'Pharmacie Nation',
      address: '2 Place de la Nation',
      city: 'Paris',
      postalCode: '75012',
      latitude: 48.8484,
      longitude: 2.3959,
      phone: '01 43 07 00 00',
      isOnDuty: false,
    },
    {
      name: 'Pharmacie de Vincennes',
      address: '58 Avenue de Paris',
      city: 'Vincennes',
      postalCode: '94300',
      latitude: 48.8474,
      longitude: 2.4305,
      phone: '01 43 28 00 00',
      isOnDuty: false,
    },
    {
      name: 'Pharmacie de Montreuil',
      address: '25 Rue de Paris',
      city: 'Montreuil',
      postalCode: '93100',
      latitude: 48.8619,
      longitude: 2.4404,
      phone: '01 48 70 00 00',
      isOnDuty: true,
    },
    {
      name: 'Pharmacie Saint-Lazare',
      address: '109 Rue Saint-Lazare',
      city: 'Paris',
      postalCode: '75009',
      latitude: 48.8768,
      longitude: 2.3265,
      phone: '01 48 74 00 00',
      isOnDuty: false,
    },
  ];

  for (const pharmacy of pharmacies) {
    await prisma.pharmacy.upsert({
      where: {
        id: pharmacy.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      },
      update: pharmacy,
      create: {
        id: pharmacy.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        ...pharmacy,
      },
    });
  }

  console.log(`${pharmacies.length} pharmacies demo creees`);

  // Creer quelques medicaments demo
  const medications = [
    {
      cisCode: 'DEMO001',
      name: 'DOLIPRANE 1000mg',
      laboratory: 'Sanofi',
      activeIngredient: 'Paracétamol',
      dosage: '1000mg',
      form: 'Comprimé',
      status: 'AVAILABLE' as const,
    },
    {
      cisCode: 'DEMO002',
      name: 'AMOXICILLINE 500mg',
      laboratory: 'Biogaran',
      activeIngredient: 'Amoxicilline',
      dosage: '500mg',
      form: 'Gélule',
      status: 'TENSION' as const,
    },
    {
      cisCode: 'DEMO003',
      name: 'LEVOTHYROX 100µg',
      laboratory: 'Merck',
      activeIngredient: 'Lévothyroxine sodique',
      dosage: '100µg',
      form: 'Comprimé',
      status: 'RUPTURE' as const,
      isMITM: true,
    },
    {
      cisCode: 'DEMO004',
      name: 'VENTOLINE 100µg',
      laboratory: 'GlaxoSmithKline',
      activeIngredient: 'Salbutamol',
      dosage: '100µg',
      form: 'Suspension pour inhalation',
      status: 'AVAILABLE' as const,
      isMITM: true,
    },
    {
      cisCode: 'DEMO005',
      name: 'ADVIL 400mg',
      laboratory: 'Pfizer',
      activeIngredient: 'Ibuprofène',
      dosage: '400mg',
      form: 'Comprimé enrobé',
      status: 'AVAILABLE' as const,
    },
    // Ozempic et autres antidiabétiques
    {
      cisCode: 'DEMO006',
      name: 'OZEMPIC 0.25mg',
      laboratory: 'Novo Nordisk',
      activeIngredient: 'Sémaglutide',
      dosage: '0.25mg',
      form: 'Solution injectable',
      status: 'RUPTURE' as const,
      isMITM: true,
    },
    {
      cisCode: 'DEMO007',
      name: 'OZEMPIC 0.5mg',
      laboratory: 'Novo Nordisk',
      activeIngredient: 'Sémaglutide',
      dosage: '0.5mg',
      form: 'Solution injectable',
      status: 'RUPTURE' as const,
      isMITM: true,
    },
    {
      cisCode: 'DEMO008',
      name: 'OZEMPIC 1mg',
      laboratory: 'Novo Nordisk',
      activeIngredient: 'Sémaglutide',
      dosage: '1mg',
      form: 'Solution injectable',
      status: 'TENSION' as const,
      isMITM: true,
    },
    {
      cisCode: 'DEMO009',
      name: 'WEGOVY 0.25mg',
      laboratory: 'Novo Nordisk',
      activeIngredient: 'Sémaglutide',
      dosage: '0.25mg',
      form: 'Solution injectable',
      status: 'RUPTURE' as const,
    },
    {
      cisCode: 'DEMO010',
      name: 'MOUNJARO 2.5mg',
      laboratory: 'Eli Lilly',
      activeIngredient: 'Tirzépatide',
      dosage: '2.5mg',
      form: 'Solution injectable',
      status: 'RUPTURE' as const,
    },
    {
      cisCode: 'DEMO011',
      name: 'TRULICITY 0.75mg',
      laboratory: 'Eli Lilly',
      activeIngredient: 'Dulaglutide',
      dosage: '0.75mg',
      form: 'Solution injectable',
      status: 'AVAILABLE' as const,
    },
    // Autres médicaments courants
    {
      cisCode: 'DEMO012',
      name: 'DOLIPRANE 500mg',
      laboratory: 'Sanofi',
      activeIngredient: 'Paracétamol',
      dosage: '500mg',
      form: 'Comprimé',
      status: 'AVAILABLE' as const,
    },
    {
      cisCode: 'DEMO013',
      name: 'EFFERALGAN 1000mg',
      laboratory: 'Upsa',
      activeIngredient: 'Paracétamol',
      dosage: '1000mg',
      form: 'Comprimé effervescent',
      status: 'AVAILABLE' as const,
    },
    {
      cisCode: 'DEMO014',
      name: 'SPASFON 80mg',
      laboratory: 'Teva',
      activeIngredient: 'Phloroglucinol',
      dosage: '80mg',
      form: 'Comprimé',
      status: 'AVAILABLE' as const,
    },
    {
      cisCode: 'DEMO015',
      name: 'SMECTA 3g',
      laboratory: 'Ipsen',
      activeIngredient: 'Diosmectite',
      dosage: '3g',
      form: 'Poudre pour suspension buvable',
      status: 'AVAILABLE' as const,
    },
  ];

  for (const med of medications) {
    await prisma.medication.upsert({
      where: { cisCode: med.cisCode },
      update: med,
      create: med,
    });
  }

  console.log(`${medications.length} medicaments demo crees`);

  console.log('');
  console.log('=================================');
  console.log('COMPTE ADMIN ALERTE MEDICAMENTS');
  console.log('=================================');
  console.log('Email: admin@alertemedicaments.fr');
  console.log('Mot de passe: admin123');
  console.log('=================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
