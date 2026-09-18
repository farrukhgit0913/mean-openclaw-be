require('dotenv/config');

const mongoose = require('mongoose');

const customerSchema =
  new mongoose.Schema(
    {
      name: String,
      phone: {
        type: String,
        unique: true
      },
      email: String,
      vehicle: {
        make: String,
        model: String,
        year: Number
      },
      lastContactAt: Date
    },
    {
      timestamps: true
    }
  );

const Customer =
  mongoose.model(
    'Customer',
    customerSchema
  );

const customers = [
  {
    name: 'Ahmed Khan',
    phone: '+923001111111',
    email: 'ahmed@example.com',
    vehicle: {
      make: 'Toyota',
      model: 'Corolla',
      year: 2022
    },
    lastContactAt: new Date(
      Date.now() -
        45 * 24 * 60 * 60 * 1000
    )
  },

  {
    name: 'Sara Ahmed',
    phone: '+923002222222',
    email: 'sara@example.com',
    vehicle: {
      make: 'Honda',
      model: 'Civic',
      year: 2023
    },
    lastContactAt: new Date(
      Date.now() -
        10 * 24 * 60 * 60 * 1000
    )
  },

  {
    name: 'Usman Ali',
    phone: '+923003333333',
    email: 'usman@example.com',
    vehicle: {
      make: 'Toyota',
      model: 'Yaris',
      year: 2021
    },
    lastContactAt: new Date(
      Date.now() -
        65 * 24 * 60 * 60 * 1000
    )
  },

  {
    name: 'Fatima Shah',
    phone: '+923004444444',
    email: 'fatima@example.com',
    vehicle: {
      make: 'Kia',
      model: 'Sportage',
      year: 2024
    },
    lastContactAt: new Date(
      Date.now() -
        5 * 24 * 60 * 60 * 1000
    )
  },

  {
    name: 'Bilal Hassan',
    phone: '+923005555555',
    email: 'bilal@example.com',
    vehicle: {
      make: 'Honda',
      model: 'City',
      year: 2020
    },
    lastContactAt: new Date(
      Date.now() -
        90 * 24 * 60 * 60 * 1000
    )
  }
];

async function seed() {
  const mongoUri =
    process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGODB_URI is missing'
    );
  }

  await mongoose.connect(
    mongoUri
  );

  await Customer.deleteMany({});

  await Customer.insertMany(
    customers
  );

  console.log(
    `Seeded ${customers.length} customers.`
  );

  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error(
    'Seed failed:',
    error
  );

  process.exit(1);
});
