import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const config = {
    runtime: 'edge',
};

export default async function handler(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // Extract parameters
        const name = searchParams.get('recipeName') || '黄金比レシピ';
        const cb = searchParams.get('cb') || 'no-cb';

        console.log(`[DEBUG-OG-GEN-EDGE] Rendering: "${name}", CacheBuster: ${cb}`);

        return new ImageResponse(
            (
                <div
                    style={{
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
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'white',
                            padding: '40px 60px',
                            borderRadius: '20px',
                            border: '1px solid #fbc02d',
                            borderWidth: '8px',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 24,
                                color: '#fbc02d',
                                fontWeight: 'bold',
                                marginBottom: 10,
                                letterSpacing: 2,
                            }}
                        >
                            Golden Ratio Recipe
                        </div>
                        <div
                            style={{
                                fontSize: 60,
                                color: '#212121',
                                fontWeight: '900',
                                textAlign: 'center',
                                lineHeight: 1.2,
                                maxWidth: 800,
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            {name}
                        </div>
                        <div
                            style={{
                                marginTop: 30,
                                fontSize: 28,
                                backgroundColor: '#fbc02d',
                                color: 'white',
                                padding: '10px 30px',
                                borderRadius: '50px',
                                fontWeight: 'bold',
                            }}
                        >
                            黄金比を確認する
                        </div>
                    </div>
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 40,
                            fontSize: 20,
                            color: '#9e9e9e',
                        }}
                    >
                        golden-ratio-app.vercel.app
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
