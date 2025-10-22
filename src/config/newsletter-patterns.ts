// Newsletter search patterns configuration

import type { NewsletterPattern } from '../types/index.js';

export const defaultNewsletterPatterns: NewsletterPattern[] = [
  {
    name: 'daily.dev',
    from: 'daily@daily.dev',
    subject: ['daily.dev', 'Daily Digest'],
    enabled: true,
    maxArticles: 10,
  },
  {
    name: 'JavaScript Weekly',
    from: 'javascriptweekly@cooperpress.com',
    subject: ['JavaScript Weekly'],
    enabled: true,
    maxArticles: 15,
  },
  {
    name: 'React Status',
    from: 'react@cooperpress.com',
    subject: ['React Status'],
    enabled: true,
    maxArticles: 12,
  },
  {
    name: 'TypeScript Weekly',
    from: 'typescript@cooperpress.com',
    subject: ['TypeScript Weekly'],
    enabled: false,
    maxArticles: 10,
  },
];
