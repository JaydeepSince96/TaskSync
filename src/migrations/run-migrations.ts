#!/usr/bin/env node

// src/migrations/run-migrations.ts
import MigrationRunner from './migration-runner';

const args = process.argv.slice(2);
const command = args[0];
const migrationName = args[1];

async function main() {
  switch (command) {
    case 'run':
      if (migrationName) {
        await MigrationRunner.runMigration(migrationName);
      } else {
        await MigrationRunner.runAllMigrations();
      }
      break;
      
    case 'rollback':
      await MigrationRunner.rollbackUserIdMigrations();
      break;
      
    default:
      console.log(`
TaskSync Migration Tool

Usage:
  npm run migrate                    - Run all migrations
  npm run migrate run <name>         - Run specific migration
  npm run migrate rollback           - Rollback userId migrations

Available migrations:
  - tasks              : Add userId to existing tasks
  - subtasks           : Add userId to existing subtasks  
  - default-user       : Create default user for orphaned data
  - task-indexes       : Update task database indexes
  - subtask-indexes    : Update subtask database indexes

Examples:
  npm run migrate
  npm run migrate run tasks
  npm run migrate rollback
      `);
      break;
  }
  
  process.exit(0);
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
