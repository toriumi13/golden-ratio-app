import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../src/store/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const host = req.headers.host || 'golden-ratio-app-zeta.vercel.app';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const origin = `${protocol}://${host}`;

        // Fetch all public recipes
        const recipesCol = collection(db, 'recipes');
        const q = query(recipesCol, where("isPublic", "==", true));
        const snapshot = await getDocs(q);
        const publicRecipes = snapshot.docs
            .map(doc => doc.data())
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Build XML
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Add Home
        xml += '  <url>\n';
        xml += `    <loc>${origin}/</loc>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>1.0</priority>\n';
        xml += '  </url>\n';

        // Add Showcase (to be implemented)
        xml += '  <url>\n';
        xml += `    <loc>${origin}/showcase</loc>\n`;
        xml += '    <changefreq>daily</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';

        // Add each public recipe
        for (const recipe of publicRecipes) {
            // IMPORTANT: XML must escape '&' as '&amp;' in URLs
            // Also ensure recipeName is double-encoded or at least XML-safe
            const safeName = encodeURIComponent(recipe.name);
            const recipeUrl = `${origin}/r/${recipe.id}?recipeName=${safeName}`;

            xml += '  <url>\n';
            xml += `    <loc>${recipeUrl}</loc>\n`;
            xml += `    <lastmod>${new Date(recipe.latestVersionDate || recipe.createdAt).toISOString().split('T')[0]}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.6</priority>\n';
            xml += '  </url>\n';
        }

        xml += '</urlset>';

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
        res.status(200).send(xml);
    } catch (e: any) {
        console.error('Sitemap error:', e);
        res.status(500).send('Error generating sitemap');
    }
}
