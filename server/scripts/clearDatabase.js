// ─── Database Cleanup Script ───────────────────────────────────────────────
// Run: node scripts/clearDatabase.js
// Yeh script MongoDB Atlas se SAARA data delete kar dega.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

const clearDatabase = async () => {
  try {
    console.log('🔗 MongoDB se connect ho raha hun...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected!');

    const collections = await mongoose.connection.db.collections();

    if (collections.length === 0) {
      console.log('ℹ️  Database pehle se khali hai.');
    } else {
      for (const collection of collections) {
        await collection.deleteMany({});
        console.log(`🗑️  Collection clear ki: ${collection.collectionName}`);
      }
      console.log('\n✅ Saara data delete ho gaya!');
    }

    console.log('📋 Ab app open karo aur apna Admin account banao.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected.');
    process.exit(0);
  }
};

clearDatabase();
