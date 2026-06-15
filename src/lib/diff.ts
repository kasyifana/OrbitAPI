export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

/**
 * Computes a line-by-line diff of two strings using a look-ahead window.
 * Returns a list of lines flagged as added, removed, or unchanged.
 */
export function computeLineDiff(text1: string, text2: string): DiffLine[] {
  const lines1 = (text1 || '').split('\n');
  const lines2 = (text2 || '').split('\n');
  const result: DiffLine[] = [];
  
  let i = 0;
  let j = 0;
  const maxLookAhead = 5;

  while (i < lines1.length || j < lines2.length) {
    // Both indices are within range
    if (i < lines1.length && j < lines2.length) {
      if (lines1[i] === lines2[j]) {
        result.push({ type: 'unchanged', text: lines1[i] });
        i++;
        j++;
      } else {
        let foundMatch = false;
        
        // Scan ahead to locate if lines were inserted or deleted
        for (let look = 1; look <= maxLookAhead; look++) {
          if (i + look < lines1.length && lines1[i + look] === lines2[j]) {
            // Lines from original were deleted
            for (let d = 0; d < look; d++) {
              result.push({ type: 'removed', text: lines1[i + d] });
            }
            i += look;
            foundMatch = true;
            break;
          }
          if (j + look < lines2.length && lines1[i] === lines2[j + look]) {
            // New lines were added
            for (let a = 0; a < look; a++) {
              result.push({ type: 'added', text: lines2[j + a] });
            }
            j += look;
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          // If no matches found in window, mark both as edit (remove/add)
          result.push({ type: 'removed', text: lines1[i] });
          result.push({ type: 'added', text: lines2[j] });
          i++;
          j++;
        }
      }
    } else if (i < lines1.length) {
      // Lines remaining only in original
      result.push({ type: 'removed', text: lines1[i] });
      i++;
    } else if (j < lines2.length) {
      // Lines remaining only in updated
      result.push({ type: 'added', text: lines2[j] });
      j++;
    }
  }
  
  return result;
}
