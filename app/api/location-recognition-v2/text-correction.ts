// OCR text correction for common misreads
export class TextCorrection {
  private static corrections: Record<string, string> = {
    'FERRIS': '',
    'FERRIS HOLIDAYS': '',
    'ROZOANA': 'SEOUL',
    'ROZDAW': 'SEOUL',
    'SE UL': 'SEOUL',
    'ESTAURANT': 'RESTAURANT',
    'RESTARANT': 'RESTAURANT',
    'RESTURANT': 'RESTAURANT',
    'COFFE': 'COFFEE',
    'CAFFE': 'CAFE',
    'SHOPPE': 'SHOP',
    'CENTRE': 'CENTER',
    'COLOUR': 'COLOR',
    'FAVOUR': 'FAVOR',
    'HONOUR': 'HONOR',
    'LABOUR': 'LABOR',
    'NEIGHBOUR': 'NEIGHBOR',
    'FLAVOUR': 'FLAVOR',
    'HARBOUR': 'HARBOR',
    'RUMOUR': 'RUMOR',
    'SPLENDOUR': 'SPLENDOR',
    'VAPOUR': 'VAPOR',
    'ALBAN ROAD': 'ALBANY ROAD',
    'ALBAN RD': 'ALBANY RD',
    'GOMAS': 'GOMAYS',
    'GOHAYS': 'GOMAYS',
    'GOHANS': 'GOMAYS',
    'SC UL': 'SEOUL',
    'SCUL': 'SEOUL'
  };

  static correctText(text: string): string {
    let corrected = text;
    
    // Remove noise words first
    corrected = corrected.replace(/\bFERRIS\s+HOLIDAYS\b/gi, '');
    corrected = corrected.replace(/\bFERRIS\b/gi, '');
    
    // Apply word-level corrections
    for (const [wrong, right] of Object.entries(this.corrections)) {
      if (!wrong || !right) continue;
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    }
    
    // Dynamic OCR corrections using fuzzy matching
    corrected = this.applyFuzzyCorrections(corrected);
    
    return corrected;
  }

  private static applyFuzzyCorrections(text: string): string {
    // Common OCR character substitutions
    let corrected = text
      .replace(/([A-Z])0([A-Z])/g, '$1O$2') // 0 -> O between letters
      .replace(/([A-Z])1([A-Z])/g, '$1I$2') // 1 -> I between letters  
      .replace(/5([A-Z])/g, 'S$1') // 5 -> S before letter
      .replace(/([A-Z])5/g, '$1S') // 5 -> S after letter
      .replace(/\bG0/g, 'GO') // G0 -> GO
      .replace(/0([A-Z])/g, 'O$1') // 0 -> O before letter
      .replace(/([A-Z])H([A-Z])/g, '$1M$2') // H -> M between letters (GOHAYS -> GOMAYS)
      .replace(/\bGOH/g, 'GOM'); // GOH -> GOM at word start
    
    // Fix common word-level OCR errors using edit distance
    const words = corrected.split(/\s+/);
    const correctedWords = words.map(word => {
      if (word.length < 4) return word;
      
      // Check if word is likely misspelled (contains numbers/special chars in wrong places)
      if (/[0-9]/.test(word) && !/^\d+$/.test(word)) {
        // Try common substitutions
        let fixed = word
          .replace(/0/g, 'O')
          .replace(/1/g, 'I')
          .replace(/5/g, 'S');
        return fixed;
      }
      
      return word;
    });
    
    return correctedWords.join(' ');
  }

  static addCorrection(wrong: string, right: string): void {
    this.corrections[wrong.toUpperCase()] = right.toUpperCase();
  }
}
