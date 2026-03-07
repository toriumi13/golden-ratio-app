import React from 'react';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Standard Node.js runtime
export const config = {
    runtime: 'nodejs',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log('[DEBUG-OG-GEN] Node.js Handler started');
    try {
        console.log('[DEBUG-OG-GEN] Loading @vercel/og...');
        const { ImageResponse } = await import('@vercel/og');
        console.log('[DEBUG-OG-GEN] @vercel/og loaded');

        // Accessing query params from the req object (standard Node style)
        const host = (req.headers.host as string) || 'localhost';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const url = new URL(req.url || '/', `${protocol}://${host}`);
        const name = url.searchParams.get('recipeName') || '黄金比レシピ';
        const cb = url.searchParams.get('cb') || 'no-cb';
        console.log(`[DEBUG-OG-GEN] Request URL: ${req.url}`);
        console.log(`[DEBUG-OG-GEN] Name to render: ${name}, CacheBuster: ${cb}`);

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
                React.createElement('div', {
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
                }, [
                    React.createElement('div', {
                        key: 'label',
                        style: { fontSize: 24, color: '#fbc02d', fontWeight: 'bold', marginBottom: 10, letterSpacing: 2 },
                    }, 'Golden Ratio Recipe'),
                    React.createElement('div', {
                        key: 'name',
                        style: { fontSize: 60, color: '#212121', fontWeight: '900', textAlign: 'center', lineHeight: 1.2, maxWidth: 800 },
                    }, name),
                    React.createElement('div', {
                        key: 'btn',
                        style: { marginTop: 30, fontSize: 28, backgroundColor: '#fbc02d', color: 'white', padding: '10px 30px', borderRadius: '50px', fontWeight: 'bold' },
                    }, '黄金比を確認する'),
                ]),
                React.createElement('div', {
                    key: 'ft',
                    style: { position: 'absolute', bottom: 40, fontSize: 20, color: '#9e9e9e' },
                }, 'golden-ratio-app.vercel.app'),
            ]
        );

        console.log('[DEBUG-OG-GEN] Building ImageResponse...');
        const imgResponse = new ImageResponse(element, { width: 1200, height: 630 });

        console.log('[DEBUG-OG-GEN] Converting ImageResponse to buffer...');
        const buffer = await imgResponse.arrayBuffer();

        console.log('[DEBUG-OG-GEN] Sending response...');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).send(Buffer.from(buffer));
        console.log('[DEBUG-OG-GEN] Response sent!');

    } catch (e: any) {
        console.error(`[DEBUG-OG-GEN] Error: ${e.message}`);
        res.status(500).send(`Error: ${e.message}`);
    }
}
