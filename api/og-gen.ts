import React from 'react';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/store/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Use Node.js runtime
export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log(`[DEBUG-OG-GEN] [${new Date().toISOString()}] Handler started. Query: ${JSON.stringify(req.query)}`);

    try {
        const { ImageResponse } = await import('@vercel/og');

        // Parameter extraction
        const recipeId = (Array.isArray(req.query.recipeId) ? req.query.recipeId[0] : req.query.recipeId) as string;
        const versionId = (Array.isArray(req.query.versionId) ? req.query.versionId[0] : req.query.versionId) as string;
        const cb = req.query.cb || 'no-cb';

        let name = (Array.isArray(req.query.recipeName) ? req.query.recipeName[0] : req.query.recipeName) as string;

        // If name is missing, fetch from Firestore
        if (!name && recipeId) {
            console.log(`[DEBUG-OG-GEN] Name missing in query, fetching from Firestore for recipeId: ${recipeId}`);
            try {
                const rRef = doc(db, 'recipes', recipeId);
                const rSnap = await getDoc(rRef);
                if (rSnap.exists()) {
                    name = rSnap.data().name;
                    console.log(`[DEBUG-OG-GEN] Fetched from DB: ${name}`);
                } else {
                    console.log(`[DEBUG-OG-GEN] Recipe not found for OGP: ${recipeId}`);
                }
            } catch (fsError: any) {
                console.error(`[DEBUG-OG-GEN] Firestore error: ${fsError.message}`);
            }
        }

        const displayName = name || '黄金比レシピ';
        console.log(`[DEBUG-OG-GEN] Rendering Image. Name: "${displayName}", CB: ${cb}`);

        const debugLabel = `v2.3-${cb.toString().slice(-4)}`;

        const element = React.createElement(
            'div',
            {
                style: {
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#fff',
                    backgroundImage: 'radial-gradient(circle at 25px 25px, #fbc02d 2%, transparent 0%), radial-gradient(circle at 75px 75px, #fbc02d 2%, transparent 0%)',
                    backgroundSize: '100px 100px',
                    fontFamily: 'sans-serif',
                },
            },
            [
                // Debug Corner
                React.createElement('div', {
                    key: 'debug',
                    style: { position: 'absolute', top: 10, right: 10, fontSize: 12, color: '#ccc' }
                }, debugLabel),

                React.createElement(
                    'div',
                    {
                        key: 'card',
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'white',
                            padding: '40px 60px',
                            borderRadius: '20px',
                            border: '8px solid #fbc02d',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                        },
                    },
                    [
                        React.createElement(
                            'div',
                            {
                                key: 'label',
                                style: { fontSize: 24, color: '#fbc02d', fontWeight: 'bold', marginBottom: 10, letterSpacing: 2 },
                            },
                            'Golden Ratio Recipe'
                        ),
                        React.createElement(
                            'div',
                            {
                                key: 'name',
                                style: {
                                    fontSize: 60,
                                    color: '#212121',
                                    fontWeight: '900',
                                    textAlign: 'center',
                                    lineHeight: 1.2,
                                    maxWidth: 800,
                                    display: 'flex',
                                },
                            },
                            displayName
                        ),
                        React.createElement(
                            'div',
                            {
                                key: 'btn',
                                style: {
                                    marginTop: 30,
                                    fontSize: 28,
                                    backgroundColor: '#fbc02d',
                                    color: 'white',
                                    padding: '10px 30px',
                                    borderRadius: '50px',
                                    fontWeight: 'bold',
                                },
                            },
                            '黄金比を確認する'
                        ),
                    ]
                ),
                React.createElement(
                    'div',
                    {
                        key: 'footer',
                        style: { position: 'absolute', bottom: 40, fontSize: 20, color: '#9e9e9e' },
                    },
                    'golden-ratio-app.vercel.app'
                ),
            ]
        );

        const imgResponse = new ImageResponse(element, { width: 1200, height: 630 });
        const buffer = await imgResponse.arrayBuffer();

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).send(Buffer.from(buffer));
        console.log('[DEBUG-OG-GEN] Successfully sent image');

    } catch (e: any) {
        console.error(`[DEBUG-OG-GEN] Error: ${e.message}`);
        res.status(500).send(`Error: ${e.message}`);
    }
}
