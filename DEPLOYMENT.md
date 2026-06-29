# Free Deployment Guide

## 1. MongoDB Atlas

1. Create a free MongoDB Atlas cluster.
2. Create a database user.
3. Allow network access from anywhere: `0.0.0.0/0`.
4. Copy the connection string and use it as `MONGO_URI`.

## 2. Backend on Render

Create a new Render Web Service:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/health`

Environment variables:

```text
NODE_ENV=production
PORT=10000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=use_a_long_random_secret
CLIENT_URL=https://your-vercel-site.vercel.app
ADMIN_EMAIL=owner@mananaccessories.com
ADMIN_PASSWORD=@himanshi3
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

After deploy, your backend URL will look like:

```text
https://manan-accessories-api.onrender.com
```

Create the owner login after backend deploy:

1. Open Render dashboard.
2. Open the backend service.
3. Open Shell.
4. Run:

```bash
npm run seed
```

## 3. Frontend on Vercel

Create a new Vercel project:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Environment variable:

```text
VITE_API_URL=https://your-render-backend-url.onrender.com
```

After deploy, your buyer website URL will look like:

```text
https://manan-accessories.vercel.app
```

## 4. Update Render CORS

After Vercel gives the final frontend URL, put that exact URL in Render:

```text
CLIENT_URL=https://your-vercel-site.vercel.app
```

Then redeploy the backend.

## Important

Render free servers may sleep when unused. First request can take time.

Uploaded images on Render free disk may not be permanent after redeploy. For a real public shop, use Cloudinary or another permanent image storage service.
