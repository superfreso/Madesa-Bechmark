import {
  DoorOpen,
  Utensils,
  Tv,
  Sofa,
  Bed,
  Table,
  Lamp,
  Armchair,
  Refrigerator,
  Microwave,
  WashingMachine,
  Package,
  type LucideIcon,
} from 'lucide-react';

const CATEGORY_ICON_MAP: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ['closet', 'clóset', 'ropa', 'guardarropa', 'wardrobe'], icon: DoorOpen },
  { keywords: ['comedor', 'dining', 'mesa comedor'], icon: Utensils },
  { keywords: ['tv', 'televisor', 'entretenimiento', 'audio'], icon: Tv },
  { keywords: ['sofá', 'sofa', 'sillón', 'sillon', 'estar', 'living'], icon: Sofa },
  { keywords: ['cama', 'dormitorio', 'bed', 'habitación', 'recamara'], icon: Bed },
  { keywords: ['mesa', 'table', 'centro', 'noche', 'consola'], icon: Table },
  { keywords: ['iluminación', 'lampara', 'lámpara', 'luz'], icon: Lamp },
  { keywords: ['silla', 'chair', 'taburete', 'banco'], icon: Armchair },
  { keywords: ['nevera', 'refrigerador', 'cocina', 'electrodoméstico'], icon: Refrigerator },
  { keywords: ['microondas', 'horno'], icon: Microwave },
  { keywords: ['lavadora', 'lavado'], icon: WashingMachine },
];

export function getCategoryIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  for (const entry of CATEGORY_ICON_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.icon;
    }
  }
  return Package;
}
