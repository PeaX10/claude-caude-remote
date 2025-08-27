import { existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Intelligently decode Claude's encoded project paths
 * Claude encoding: / becomes -, . becomes --
 * Problem: dashes in original names are ambiguous
 */
export function decodeProjectPath(encodedPath: string): string {
  // Handle simple cases first
  if (!encodedPath) return '/';
  
  // Step 1: Handle dots (-- becomes .)
  let decodedPath = encodedPath.replace(/--/g, '.');
  
  // Step 2: Add leading slash if it starts with -
  if (decodedPath.startsWith('-')) {
    decodedPath = '/' + decodedPath.substring(1);
  }
  
  // Step 3: Try different decoding strategies
  const strategies = [
    // Strategy 1: Simple replacement (all - become /)
    () => decodedPath.replace(/-/g, '/'),
    
    // Strategy 2: Keep last segment as-is (for project names with dashes)
    () => {
      const parts = decodedPath.split('-');
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        const basePath = parts.slice(0, -1).join('/');
        return `${basePath}/${lastPart}`;
      }
      return decodedPath.replace(/-/g, '/');
    },
    
    // Strategy 3: Keep last two segments with dash (for names like claude-code-remote)
    () => {
      const parts = decodedPath.split('-');
      if (parts.length > 2) {
        const lastTwo = parts.slice(-2).join('-');
        const basePath = parts.slice(0, -2).join('/');
        return `${basePath}/${lastTwo}`;
      }
      return decodedPath.replace(/-/g, '/');
    },
    
    // Strategy 4: Keep last three segments with dash (for names like sharkblock-nestjs-worktree)
    () => {
      const parts = decodedPath.split('-');
      if (parts.length > 3) {
        const lastThree = parts.slice(-3).join('-');
        const basePath = parts.slice(0, -3).join('/');
        return `${basePath}/${lastThree}`;
      }
      return decodedPath.replace(/-/g, '/');
    },
    
    // Strategy 5: Smart reconstruction based on common patterns
    () => {
      // Common project name patterns that contain dashes
      const commonPatterns = [
        'claude-code-remote',
        'sharkblock-nestjs',
        'sharkblock-signer',
        'sharkblock-infra',
        'abbott-billing-admin',
        'sharkblocker-nft-collection',
        'sharkblock-telegram-webapp'
      ];
      
      let result = decodedPath.replace(/-/g, '/');
      
      // Check if any common pattern exists in the path
      for (const pattern of commonPatterns) {
        const patternWithSlashes = pattern.replace(/-/g, '/');
        if (result.includes(patternWithSlashes)) {
          // Replace the slashed version with the dashed version
          result = result.replace(patternWithSlashes, pattern);
        }
      }
      
      return result;
    }
  ];
  
  // Try each strategy and return the first one that points to an existing directory
  for (const strategy of strategies) {
    try {
      const candidatePath = strategy();
      if (existsSync(candidatePath)) {
        const stat = statSync(candidatePath);
        if (stat.isDirectory()) {
          return candidatePath;
        }
      }
    } catch (e) {
      // Ignore errors and try next strategy
    }
  }
  
  // If no strategy worked, return null to indicate the path doesn't exist
  const fallbackPath = decodedPath.replace(/-/g, '/');
  return null;
}

/**
 * Find all possible decodings and let user choose
 */
export function findPossiblePaths(encodedPath: string): string[] {
  const possibilities = new Set<string>();
  
  // Generate all possible combinations of dash interpretations
  const generateCombinations = (path: string): string[] => {
    const parts = path.split('-');
    if (parts.length <= 1) return [path];
    
    const results: string[] = [];
    
    // Try different groupings
    for (let i = 1; i <= Math.min(4, parts.length); i++) {
      const lastGroup = parts.slice(-i).join('-');
      const basePath = parts.slice(0, -i).join('/');
      if (basePath) {
        results.push(`${basePath}/${lastGroup}`);
      }
    }
    
    // Also add the simple version
    results.push(parts.join('/'));
    
    return results;
  };
  
  // Handle dots first
  let processed = encodedPath.replace(/--/g, '.');
  if (processed.startsWith('-')) {
    processed = '/' + processed.substring(1);
  }
  
  const candidates = generateCombinations(processed);
  
  // Check which ones exist
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try {
        const stat = statSync(candidate);
        if (stat.isDirectory()) {
          possibilities.add(candidate);
        }
      } catch (e) {
        // Ignore
      }
    }
  }
  
  return Array.from(possibilities);
}