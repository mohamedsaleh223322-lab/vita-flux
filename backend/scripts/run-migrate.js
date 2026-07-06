import { runMigrations } from '../src/db/migrate.js';

runMigrations().then(() => {
  console.log('Migration script run successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
