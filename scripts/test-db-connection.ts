import 'dotenv/config';
import AppDataSource from '../src/config/database.config';

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log(
    `📍 Database URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'NOT SET'}`,
  );

  try {
    if (!AppDataSource.isInitialized) {
      console.log('⏳ Initializing connection...');
      await AppDataSource.initialize();
    }

    console.log('✅ Connection initialized!');

    // Test query
    await AppDataSource.query('SELECT 1');
    console.log('✅ Database query successful!');
    console.log('✅ Database connection is working!');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error: unknown) {
    console.error('❌ Database connection failed!');
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode =
      error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined;
    console.error('Error details:', errorMessage);

    if (errorCode === 'EAI_AGAIN') {
      console.error('\n💡 DNS Resolution Error - Possible solutions:');
      console.error('1. Check your internet connection');
      console.error('2. Verify DATABASE_URL is correct in .env file');
      console.error('3. Check if Neon database is accessible');
      console.error('4. Try using the direct connection URL instead of pooler');
      console.error('5. Check firewall/network restrictions');
    } else if (errorCode === 'ENOTFOUND') {
      console.error('\n💡 Host Not Found - Possible solutions:');
      console.error('1. Verify the database hostname in DATABASE_URL');
      console.error('2. Check if Neon database is active');
      console.error('3. Try refreshing your Neon connection string');
    } else if (errorCode === 'ETIMEDOUT') {
      console.error('\n💡 Connection Timeout - Possible solutions:');
      console.error('1. Check your internet connection');
      console.error('2. Verify firewall allows database connections');
      console.error('3. Try again in a few moments');
    }

    process.exit(1);
  }
}

void testConnection();
