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
    "GOHST'S PLAZA HOTEL": 'GOMAYS PLAZA',
    'GOHST PLAZA': 'GOMAYS PLAZA',
    'GOWERS': 'GOMAYS',
    'GOWERS PLAZA': 'GOMAYS PLAZA'
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
    
    // Fix common OCR character confusions - but preserve lowercase 'l'
    corrected = corrected
      .replace(/[I1|]/g, (match, offset) => {
        // Only fix uppercase I, 1, and pipe - NOT lowercase l
        const before = corrected[offset - 1] || '';
        const after = corrected[offset + 1] || '';
        
        // If surrounded by numbers, likely '1'
        if (/\d/.test(before) || /\d/.test(after)) {
          return '1';
        }
        // Otherwise keep as 'I'
        return 'I';
      });
    
    return corrected;
  }

  static addCorrection(wrong: string, right: string): void {
    this.corrections[wrong.toUpperCase()] = right.toUpperCase();
  }
}
