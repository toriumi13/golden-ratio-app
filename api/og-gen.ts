import React from 'react';
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
        console.error('[DEBUG-OG-GEN] Firebase Admin init error:', e);
    }
}

const db = admin.firestore();

// Use Node.js runtime
export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const timestamp = new Date().toISOString();
    const ua = req.headers['user-agent'];
    console.log(`[DEBUG-OG-GEN] [${timestamp}] Request received. UA: ${ua}`);
    console.log(`[DEBUG-OG-GEN] Query: ${JSON.stringify(req.query)}`);

    try {
        const { ImageResponse } = await import('@vercel/og');

        // Parameter extraction
        const recipeId = (Array.isArray(req.query.recipeId) ? req.query.recipeId[0] : req.query.recipeId) as string;
        const cb = req.query.cb || 'no-cb';

        let name = (Array.isArray(req.query.recipeName) ? req.query.recipeName[0] : req.query.recipeName) as string;
        let imageUrl = null;

        // Fetch from Firestore
        if (recipeId) {
            console.log(`[DEBUG-OG-GEN] Fetching from Firestore for recipeId: ${recipeId}`);
            try {
                const rSnap = await db.collection('recipes').doc(recipeId).get();
                if (rSnap.exists) {
                    const data = rSnap.data();
                    if (data) {
                        if (!name) name = data.name;
                        imageUrl = data.imageUrl;
                        console.log(`[DEBUG-OG-GEN] Fetched from DB: ${name}, hasImage: ${!!imageUrl}`);
                    }
                }
            } catch (fsError: any) {
                console.error(`[DEBUG-OG-GEN] Firestore error: ${fsError.message}`);
            }
        }

        const displayName = name || '黄金比レシピ';
        const debugLabel = `v2.7-${cb.toString().slice(-4)}`;

        // Handle Base64 URL format
        let resolvedImageUrl = imageUrl;
        if (imageUrl?.startsWith('data:image')) {
            resolvedImageUrl = `${req.headers.host?.includes('localhost') ? 'http' : 'https'}://${req.headers.host}/api/image?recipeId=${recipeId}&cb=${cb}`;
        }

        const element = React.createElement(
            'div',
            {
                style: {
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    backgroundColor: '#fff',
                    fontFamily: 'sans-serif',
                },
            },
            [
                // Left Side Image (Only if exists)
                resolvedImageUrl ? React.createElement(
                    'div',
                    {
                        key: 'left',
                        style: { display: 'flex', width: '50%', height: '100%' }
                    },
                    React.createElement('img', {
                        src: resolvedImageUrl,
                        width: 600,
                        height: 630,
                        style: { width: '100%', height: '100%' }
                    })
                ) : null,

                // Right Side Content
                React.createElement(
                    'div',
                    {
                        key: 'right',
                        style: {
                            display: 'flex',
                            width: resolvedImageUrl ? '50%' : '100%',
                            height: '100%',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#F9F7F2',
                            backgroundImage: 'radial-gradient(circle at 25px 25px, #fbc02d 2%, transparent 0%), radial-gradient(circle at 75px 75px, #fbc02d 2%, transparent 0%)',
                            backgroundSize: '100px 100px',
                            padding: '40px',
                            position: 'relative'
                        }
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
                                    padding: '30px 40px',
                                    borderRadius: '20px',
                                    border: '6px solid #fbc02d',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                    width: '100%',
                                },
                            },
                            [
                                React.createElement(
                                    'div',
                                    {
                                        key: 'label',
                                        style: { fontSize: 18, color: '#fbc02d', fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
                                    },
                                    'Golden Ratio Recipe'
                                ),
                                React.createElement(
                                    'div',
                                    {
                                        key: 'name',
                                        style: {
                                            fontSize: resolvedImageUrl ? 42 : 54,
                                            color: '#212121',
                                            fontWeight: '900',
                                            textAlign: 'center',
                                            lineHeight: 1.1,
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
                                            marginTop: 20,
                                            fontSize: 22,
                                            backgroundColor: '#fbc02d',
                                            color: 'white',
                                            padding: '8px 24px',
                                            borderRadius: '50px',
                                            fontWeight: 'extrabold',
                                            display: 'flex',
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
                                style: { marginTop: 30, fontSize: 18, color: '#9e9e9e' },
                            },
                            'golden-ratio-app.vercel.app'
                        ),
                    ]
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
