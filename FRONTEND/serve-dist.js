#!/usr/bin/env node

import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 8000;
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.jsx': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.map': 'application/json'
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Handle root path
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Resolve the file path
    const filePath = join(DIST_DIR, pathname);
    
    try {
        // Check if file exists
        await fs.access(filePath, fs.constants.F_OK);
        
        // Get file extension for MIME type
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // Read and serve the file
        const data = await fs.readFile(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (err) {
        console.log(`File not found: ${filePath}`);
        // File not found, serve index.html for SPA routing
        const indexPath = join(DIST_DIR, 'index.html');
        try {
            const data = await fs.readFile(indexPath);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        } catch (indexErr) {
            console.error(`Index file not found: ${indexPath}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1><p>Index file not found.</p>');
        }
    }
});

server.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${DIST_DIR}`);
    console.log(`\n💡 Open your browser and navigate to: http://localhost:${PORT}`);
    console.log(`\n🛑 Press Ctrl+C to stop the server\n`);
    
    // Try to open browser automatically
    import('child_process').then(({ spawn }) => {
        try {
            if (process.platform === 'darwin') {
                spawn('open', [`http://localhost:${PORT}`]);
            } else if (process.platform === 'win32') {
                // On Windows, use 'cmd' with '/c start' to open browser
                spawn('cmd', ['/c', 'start', `http://localhost:${PORT}`]);
            } else {
                spawn('xdg-open', [`http://localhost:${PORT}`]);
            }
        } catch (e) {
            // Ignore errors when trying to open browser
        }
    }).catch(err => {
        // Ignore import errors
    });
});