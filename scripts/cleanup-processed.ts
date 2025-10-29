#!/usr/bin/env tsx
/**
 * Cleanup script to mark processed newsletters as read or delete them
 * This helps avoid reprocessing the same emails
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Import IMAP services
import { createConnection } from '../src/services/imap/createConnection.js';
import { markAsRead } from '../src/services/imap/markAsRead.js';
import { deleteEmail } from '../src/services/imap/deleteEmail.js';
import { closeConnection } from '../src/services/imap/closeConnection.js';
import { getEmailCredentials } from '../src/config/config.js';

async function cleanupProcessed() {
  try {
    // Load processed UIDs
    const processedFile = join(process.cwd(), 'processed-uids.json');
    const data = JSON.parse(readFileSync(processedFile, 'utf-8'));
    const uids: number[] = data.processedUIDs;

    console.log(`Found ${uids.length} processed email(s) to cleanup`);
    console.log(`UIDs: ${uids.join(', ')}`);

    // Get email credentials
    const emailCredentials = getEmailCredentials();

    // Ask user what to do
    const action = process.argv[2] || 'read';

    if (!['read', 'delete'].includes(action)) {
      console.error('Usage: pnpm tsx scripts/cleanup-processed.ts [read|delete]');
      console.error('  read   - Mark emails as read (default)');
      console.error('  delete - Delete emails');
      process.exit(1);
    }

    console.log(`\nAction: ${action === 'read' ? 'Mark as read' : 'Delete'}`);
    console.log('Connecting to IMAP...');

    // Connect to IMAP (createConnection already opens INBOX)
    const conn = await createConnection(emailCredentials);

    console.log('Connected successfully\n');

    // Process each UID with individual timeout
    let successCount = 0;
    let failCount = 0;

    for (const uid of uids) {
      try {
        console.log(`Processing UID ${uid}...`);

        if (action === 'read') {
          await markAsRead(conn, uid);
          console.log(`  ✓ Marked as read`);
        } else {
          await deleteEmail(conn, uid);
          console.log(`  ✓ Deleted`);
        }

        successCount++;

        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        failCount++;
        console.error(`  ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log(`\nResults: ${successCount} succeeded, ${failCount} failed`);

    // Close connection
    await closeConnection(conn);
    console.log('Connection closed');

    process.exit(failCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

cleanupProcessed();
