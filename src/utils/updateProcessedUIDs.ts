/**
 * Simple utility to update processed-uids.json after successful email processing
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { displayVerbose, displayError } from '../cli/utils/index.js';

interface ProcessedUIDsData {
  processedUIDs: number[];
  processedAt: string;
  summary: string;
}

const PROCESSED_UIDS_FILE = join(process.cwd(), 'processed-uids.json');

/**
 * Updates the processed-uids.json file by adding a newly processed UID
 * @param uid The UID that was successfully processed
 * @returns true if update was successful
 */
export async function updateProcessedUID(uid: number): Promise<boolean> {
  try {
    // Load existing data or create default structure
    let data: ProcessedUIDsData;

    try {
      const fileContent = await fs.readFile(PROCESSED_UIDS_FILE, 'utf-8');
      data = JSON.parse(fileContent);
    } catch {
      // File doesn't exist or is invalid, create new structure
      data = {
        processedUIDs: [],
        processedAt: new Date().toISOString().split('T')[0],
        summary: "These UIDs were successfully processed and should be marked as read or deleted to avoid reprocessing"
      };
    }

    // Check if UID already exists
    if (data.processedUIDs.includes(uid)) {
      displayVerbose(`UID ${uid} already in processed-uids.json`);
      return true;
    }

    // Add the new UID and update timestamp
    data.processedUIDs.push(uid);
    data.processedAt = new Date().toISOString().split('T')[0];

    // Sort UIDs for consistency
    data.processedUIDs.sort((a, b) => a - b);

    // Save back to file
    await fs.writeFile(PROCESSED_UIDS_FILE, JSON.stringify(data, null, 2));
    displayVerbose(`Added UID ${uid} to processed-uids.json`);

    return true;
  } catch (error) {
    displayError(`Failed to update processed-uids.json for UID ${uid}: ${error}`);
    // Don't throw - we don't want to fail the whole process just because logging failed
    return false;
  }
}

/**
 * Removes a UID from processed-uids.json (useful when email processing fails)
 * @param uid The UID to remove
 */
export async function removeProcessedUID(uid: number): Promise<boolean> {
  try {
    const fileContent = await fs.readFile(PROCESSED_UIDS_FILE, 'utf-8');
    const data: ProcessedUIDsData = JSON.parse(fileContent);

    const originalLength = data.processedUIDs.length;
    data.processedUIDs = data.processedUIDs.filter(id => id !== uid);

    if (data.processedUIDs.length === originalLength) {
      // UID wasn't in the list
      return false;
    }

    data.processedAt = new Date().toISOString().split('T')[0];

    await fs.writeFile(PROCESSED_UIDS_FILE, JSON.stringify(data, null, 2));
    displayVerbose(`Removed UID ${uid} from processed-uids.json`);

    return true;
  } catch (error) {
    displayError(`Failed to remove UID ${uid} from processed-uids.json: ${error}`);
    return false;
  }
}