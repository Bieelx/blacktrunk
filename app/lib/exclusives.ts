export type ExclusiveKey = 'supino' | 'agachamento';

export const EXCLUSIVE_PRODUCT_HANDLES: Record<ExclusiveKey, string> = {
  supino: 'camiseta-algodao-performance-supino-100kg',
  agachamento: 'camiseta-algodao-performance-agachamento-150kg',
};

export interface ExclusiveRequirement {
  key: ExclusiveKey;
  kg: number;
  exercise: string;
}

const EXERCISE_LABELS: Record<ExclusiveKey, string> = {
  supino: 'Supino',
  agachamento: 'Agachamento',
};

/** Parses Shopify tag format: "exclusive:agachamento:150" */
export function parseExclusiveTag(tags: string[]): ExclusiveRequirement | null {
  for (const tag of tags) {
    if (!tag.startsWith('exclusive:')) continue;
    const [, key, kgStr] = tag.split(':');
    const kg = Number(kgStr);
    if ((key !== 'supino' && key !== 'agachamento') || isNaN(kg) || kg <= 0) continue;
    return {key: key as ExclusiveKey, kg, exercise: EXERCISE_LABELS[key as ExclusiveKey]};
  }
  return null;
}

export function getUnlockedExclusives(session: {get: (key: string) => unknown}): ExclusiveKey[] {
  const val = session.get('unlockedExclusives');
  if (Array.isArray(val)) return val as ExclusiveKey[];
  return [];
}
