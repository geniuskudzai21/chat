# Chat Analyzer Backend

A Node.js backend for uploading and analyzing chat files.

## Features
- File upload with Multer
- MongoDB storage
- RESTful API
- CORS enabled
- Error handling

## API Endpoints

- `POST /api/upload` - Upload chat file
- `GET /api/files` - Get all files
- `GET /api/files/:id` - Get single file
- `PUT /api/files/:id/analysis` - Update analysis
- `DELETE /api/files/:id` - Delete file

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with your MongoDB URI
4. Run: `npm run dev`

## Deployment

This app is ready for deployment on Render.com
