export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export const CATEGORIES: Category[] = [
    { id: 'japanese', name: '和食', icon: 'rice', color: '#D84315' },
    { id: 'western', name: '洋食', icon: 'food-steak', color: '#1565C0' },
    { id: 'chinese', name: '中華', icon: 'food-variant', color: '#C62828' },
    { id: 'italian', name: 'イタリアン・フレンチ', icon: 'pasta', color: '#2E7D32' },
    { id: 'sweets', name: 'スイーツ・パン', icon: 'muffin', color: '#AD1457' },
    { id: 'drinks', name: 'ドリンク', icon: 'glass-cocktail', color: '#00838F' },
    { id: 'others', name: 'その他', icon: 'dots-horizontal-circle-outline', color: '#4E342E' },
];

export const getCategoryById = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
