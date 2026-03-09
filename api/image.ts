import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/store/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { recipeId } = req.query;

    if (!recipeId || typeof recipeId !== 'string') {
        return res.status(400).send('Missing recipeId');
    }

    try {
        const rRef = doc(db, 'recipes', recipeId);
        const rSnap = await getDoc(rRef);

        if (!rSnap.exists()) {
            return res.status(404).send('Recipe not found');
        }

        const data = rSnap.data();
        const imageUrl = data.imageUrl;

        if (!imageUrl || !imageUrl.startsWith('data:image/')) {
            // Not a base64 image or no image at all
            return res.status(404).send('No base64 image found');
        }

        // Parse data URI: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        const matches = imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (!matches || matches.length !== 3) {
            return res.status(400).send('Invalid base64 image format');
        }

        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
        res.status(200).send(buffer);

    } catch (e: any) {
        console.error(`[DEBUG-IMAGE] Error serving image for recipe ${recipeId}: ${e.message}`);
        res.status(500).send('Internal Server Error');
    }
}
