/**
 * Business Name Priority Analyzer
 * 
 * This module helps determine which business name to prioritize when multiple
 * business names are detected in the same image.
 */

interface BusinessPriority {
  name: string;
  priority: number;
}

// List of business names with their priority scores (higher = more important)
const BUSINESS_PRIORITIES: BusinessPriority[] = [
  { name: "ARIN WINES", priority: 100 },
  { name: "GEORGE BINS FUNFAIR", priority: 90 },
  { name: "TORTOISE", priority: 80 },
  { name: "VENCHI", priority: 80 },
  { name: "FUNFAIR", priority: 70 }
];

/**
 * Analyzes text to find the highest priority business name
 * @param text The full text to analyze
 * @returns The highest priority business name found, or null if none found
 */
export function findPriorityBusinessName(text: string): string | null {
  if (!text) return null;
  
  const upperText = text.toUpperCase();
  let highestPriority = -1;
  let priorityName = null;
  
  // Check each business name in our priority list
  for (const business of BUSINESS_PRIORITIES) {
    if (upperText.includes(business.name) && business.priority > highestPriority) {
      highestPriority = business.priority;
      priorityName = business.name;
    }
  }
  
  return priorityName;
}

/**
 * Checks if a business name should be prioritized over another
 * @param name1 First business name
 * @param name2 Second business name
 * @returns True if name1 has higher priority than name2
 */
export function hasPriority(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  
  const priority1 = BUSINESS_PRIORITIES.find(b => b.name === name1.toUpperCase())?.priority || 0;
  const priority2 = BUSINESS_PRIORITIES.find(b => b.name === name2.toUpperCase())?.priority || 0;
  
  return priority1 > priority2;
}