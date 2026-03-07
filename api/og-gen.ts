import React from 'react';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Use Node.js runtime which is confirmed to work in this project
export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log(`[DEBUG-OG-GEN] Request received. Query: ${JSON.stringify(req.query)}`);

    try {
        const { ImageResponse } = await import('@vercel/og');

        // Robust parameter extraction
        let nameParam: any = req.query.recipeName;

        // Fallback: manually parse URL if req.query is empty or missing expected key
        if (!nameParam && req.url) {
            const fullUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
            nameParam = fullUrl.searchParams.get('recipeName');
        }

        const name = (Array.isArray(nameParam) ? nameParam[0] : (nameParam || '')) || '黄金比レシピ';
        const cb = req.query.cb || 'no-cb';

        console.log(`[DEBUG-OG-GEN] [${new Date().toISOString()}] Rendering. Name: "${name}", Raw Query: ${JSON.stringify(req.query)}`);

        const debugLabel = `v2.2-${cb.toString().slice(-4)}`;

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
                },
            },
            [
                // Debug Corner
                React.createElement('div', {
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
                                },
                            },
                            name
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
