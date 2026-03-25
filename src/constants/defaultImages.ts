// Categorized default images (using representative colors and icons for now)
// In a real app, these would be high-quality Base64 strings or remote assets.

export const DEFAULT_IMAGES: Record<string, string> = {
    'japanese': 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?q=80&w=600&auto=format&fit=crop', // Rice, salmon
    'western': 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop', // Steak
    'chinese': 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=600&auto=format&fit=crop', // Dim sum
    'italian': 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?q=80&w=600&auto=format&fit=crop', // Pasta
    'sweets': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=600&auto=format&fit=crop', // Dessert
    'drinks': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=600&auto=format&fit=crop', // Drink
    'others': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600&auto=format&fit=crop', // Kitchen ingredients
};

export const getDefaultImageForCategory = (categoryId: string) => {
    return DEFAULT_IMAGES[categoryId] || DEFAULT_IMAGES['others'];
};
