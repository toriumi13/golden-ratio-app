import { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        if (serviceAccount.project_id) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } else {
            // Fallback for local development
            admin.initializeApp({
                projectId: 'golden-raito-app',
            });
        }
    } catch (e) {
        console.error('[DEBUG-IMAGE] Firebase Admin init error:', e);
    }
}

const db = admin.firestore();

export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { recipeId } = req.query;

    if (!recipeId || typeof recipeId !== 'string') {
        return res.status(400).send('Missing recipeId');
    }

    try {
        const rSnap = await db.collection('recipes').doc(recipeId).get();

        if (!rSnap.exists) {
            return res.status(404).send('Recipe not found');
        }

        const data = rSnap.data();
        if (!data) {
            return res.status(404).send('No data found');
        }
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
