import categoriesData from '@/data/categories.json';
import noteCategoriesData from '@/data/note-categories.json';

interface Word {
  chinese: string;
  japanese: string;
}

interface PracticeGroup {
  name: string;
  words: Word[];
}

interface Category {
  id: string;
  name: string;
  words?: Word[];
  introContent?: string;
  practiceGroups?: PracticeGroup[];
  style?: string;
}

export function getButtonCounts() {
  try {
    const data: Category[] = categoriesData as unknown as Category[];
    const noteData: Category[] = (noteCategoriesData as unknown as Category[]) || [];
    let total = 0;
    const byCategory: Record<string, number> = {};

    // 通常のカテゴリーからカウント
    for (const c of data) {
      if (!c || c.id === 'pronunciation') continue;

      let categoryCount = 0;

      // words配列からカウント
      if (Array.isArray(c.words)) {
        categoryCount += c.words.length;
      }

      // practiceGroups配列からカウント
      if (Array.isArray(c.practiceGroups)) {
        for (const g of c.practiceGroups) {
          if (g && Array.isArray(g.words)) {
            categoryCount += g.words.length;
          }
        }
      }

      if (categoryCount > 0) {
        byCategory[c.name] = categoryCount;
        total += categoryCount;
      }
    }

    // Noteカテゴリーからカウント
    for (const c of noteData) {
      if (!c) continue;

      let categoryCount = 0;

      // words配列からカウント
      if (Array.isArray(c.words)) {
        categoryCount += c.words.length;
      }

      if (categoryCount > 0) {
        byCategory[c.name] = categoryCount;
        total += categoryCount;
      }
    }

    return {
      total,
      byCategory
    };
  } catch (error) {
    console.error('Error counting buttons:', error);
    return {
      total: 0,
      byCategory: {}
    };
  }
}

