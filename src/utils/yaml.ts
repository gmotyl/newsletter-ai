// YAML serialization utilities for prepare/generate modes
import * as yaml from 'js-yaml';
import { promises as fs } from 'fs';
import path from 'path';
import type { Newsletter, Article } from '../types/index.js';

// YAML structure for LINKS.yaml
interface YAMLNewsletter {
  name: string;
  date: string;
  uid?: string; // Optional - auto-generated for manual entries
  patternName?: string; // Optional - defaults to name
  links: {
    title: string;
    url: string;
  }[];
}

interface YAMLStructure {
  generated: string;
  totalNewsletters: number;
  totalLinks: number;
  newsletters: YAMLNewsletter[];
}

/**
 * Save newsletters and their links to LINKS.yaml
 */
export async function saveLinksToYaml(
  newsletters: Newsletter[],
  outputPath: string = 'LINKS.yaml'
): Promise<void> {
  // Convert Newsletter objects to YAML-friendly structure
  const yamlNewsletters: YAMLNewsletter[] = newsletters.map(newsletter => ({
    name: newsletter.pattern.name,
    date: newsletter.date.toISOString(),
    uid: newsletter.id,
    patternName: newsletter.pattern.name,
    links: newsletter.articles.map(article => ({
      title: article.title || 'Untitled',
      url: article.url,
    })),
  }));

  // Calculate totals
  const totalLinks = yamlNewsletters.reduce((sum, n) => sum + n.links.length, 0);

  // Create YAML structure
  const yamlStructure: YAMLStructure = {
    generated: new Date().toISOString(),
    totalNewsletters: yamlNewsletters.length,
    totalLinks,
    newsletters: yamlNewsletters,
  };

  // Convert to YAML with comments
  const yamlContent = [
    `# Generated: ${yamlStructure.generated}`,
    `# Total newsletters: ${yamlStructure.totalNewsletters}`,
    `# Total links: ${yamlStructure.totalLinks}`,
    '#',
    '# You can edit this file to:',
    '# - Remove unwanted links',
    '# - Regroup links under different newsletters',
    '# - Add custom links (uid and patternName are optional for manual entries)',
    '# - Change link titles',
    '#',
    '# Fields:',
    '# - name: Newsletter display name (required)',
    '# - date: ISO date string (required, defaults to current date if invalid)',
    '# - uid: Email UID for marking as processed (optional - omit for manual entries)',
    '# - patternName: Pattern name from config (optional - defaults to name)',
    '# - links: Array of articles with title and url (required)',
    '#',
    '# Then run: npm run generate',
    '',
    yaml.dump({ newsletters: yamlStructure.newsletters }, {
      indent: 2,
      lineWidth: -1, // Don't wrap lines
      noRefs: true,
    }),
  ].join('\n');

  // Ensure the directory exists
  const dir = path.dirname(outputPath);
  if (dir !== '.') {
    await fs.mkdir(dir, { recursive: true });
  }

  // Write to file
  await fs.writeFile(outputPath, yamlContent, 'utf8');
}

/**
 * Load newsletters from LINKS.yaml
 */
export async function loadLinksFromYaml(
  inputPath: string = 'LINKS.yaml'
): Promise<Newsletter[]> {
  // Check if file exists
  try {
    await fs.access(inputPath);
  } catch (error) {
    throw new Error(
      `LINKS.yaml not found at ${inputPath}. Please run "npm run prepare" first to generate the file.`
    );
  }

  // Read and parse YAML
  const yamlContent = await fs.readFile(inputPath, 'utf8');

  let parsed: any;
  try {
    parsed = yaml.load(yamlContent);
  } catch (error) {
    throw new Error(
      `Failed to parse LINKS.yaml: ${error instanceof Error ? error.message : 'Invalid YAML format'}`
    );
  }

  // Validate structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid LINKS.yaml: Expected an object');
  }

  if (!Array.isArray(parsed.newsletters)) {
    throw new Error('Invalid LINKS.yaml: Missing or invalid "newsletters" array');
  }

  // Convert YAML structure back to Newsletter objects
  const newsletters: Newsletter[] = parsed.newsletters.map((yamlNewsletter: any, index: number) => {
    // Validate newsletter structure
    if (!yamlNewsletter.name || typeof yamlNewsletter.name !== 'string') {
      throw new Error(`Invalid newsletter at index ${index}: Missing or invalid "name"`);
    }
    // uid is optional - if missing, generate a temporary one (won't mark email as processed)
    const uid = yamlNewsletter.uid || `manual-${index}-${Date.now()}`;

    if (!Array.isArray(yamlNewsletter.links)) {
      throw new Error(`Invalid newsletter at index ${index}: Missing or invalid "links" array`);
    }

    // Convert links to Article objects (without content - will be scraped)
    const articles: Article[] = yamlNewsletter.links.map((link: any, linkIndex: number) => {
      if (!link.url || typeof link.url !== 'string') {
        throw new Error(
          `Invalid link at index ${linkIndex} in newsletter "${yamlNewsletter.name}": Missing or invalid "url"`
        );
      }

      return {
        title: link.title || 'Untitled',
        url: link.url,
        content: '', // Will be filled during scraping
      };
    });

    // Parse date
    let date: Date;
    try {
      date = new Date(yamlNewsletter.date);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      // Fallback to current date if date is invalid or missing
      console.warn(
        `Warning: Invalid or missing date for newsletter "${yamlNewsletter.name}", using current date`
      );
      date = new Date();
    }

    // Create Newsletter object
    // Note: We don't have full pattern data from YAML, so we create a minimal pattern
    const newsletter: Newsletter = {
      id: uid,
      pattern: {
        name: yamlNewsletter.patternName || yamlNewsletter.name,
        from: '', // Not available from YAML
        subject: [], // Not available from YAML
        enabled: true,
      },
      date,
      articles,
    };

    return newsletter;
  });

  return newsletters;
}

/**
 * Check if LINKS.yaml exists
 */
export async function linksYamlExists(filePath: string = 'LINKS.yaml'): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
