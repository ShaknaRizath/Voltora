# Deploying Voltora

Free tier setup: **MongoDB Atlas** (database), **Cloudinary** (uploaded photos), **Render** (backend), **Vercel** (frontend).

Do the steps in order. Keep a notes file open, because you will copy a few values between services.

## 0. Before you start
- Push the latest code to GitHub.
- Rotate any Stripe or Groq key that was ever pasted into a chat or a public place, and use the new ones below.
- Make a long random secret for tokens: run `openssl rand -hex 32` in Terminal and keep the output as `JWT_SECRET`.

## 1. Database (MongoDB Atlas)
1. Sign up at mongodb.com/atlas and create a free **M0** cluster.
2. **Database Access**: add a user with a password (use letters and numbers only, to avoid escaping).
3. **Network Access**: add the IP address `0.0.0.0/0` (Render's address changes).
4. **Connect**, then **Drivers**, and copy the connection string. Put the database name before the `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/voltora?retryWrites=true&w=majority`

## 2. Photo storage (Cloudinary)
1. Sign up at cloudinary.com (free).
2. On the dashboard, open **API Keys** and copy the **API environment variable**. It looks like `cloudinary://123456:abcdef@your-cloud-name`. This is `CLOUDINARY_URL`.

## 3. Load the shop data
Run this on your laptop, once, with your Atlas string:
```
cd backend
MONGO_URI='your-atlas-string' npm run seed
MONGO_URI='your-atlas-string' ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' npm run seed:admin
```
The first command adds the 29 sample products (it replaces any existing products). The second creates your admin login (username `admin`).

## 4. Backend (Render)
1. Sign up at render.com with GitHub, then **New**, **Web Service**, and pick the Voltora repo.
2. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance type: Free
3. Add these environment variables:

| Name | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGO_URI` | your Atlas string |
| `JWT_SECRET` | the random secret from step 0 |
| `CLOUDINARY_URL` | from step 2 |
| `CLIENT_URL` | leave a placeholder for now, set it in step 6 |
| `STRIPE_SECRET_KEY` | your Stripe test secret key |
| `GROQ_API_KEY` | your Groq key (the chat assistant) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | see step 7 |

4. Deploy. When it finishes, open `https://YOUR-SERVICE.onrender.com/api/health`. It should show `{"status":"ok"}`. Copy this base URL.

## 5. Frontend (Vercel)
1. Sign up at vercel.com with GitHub, then **Add New**, **Project**, and pick the Voltora repo.
2. Set **Root Directory** to `frontend`. The Vite settings are detected automatically.
3. Add environment variables:
   - `VITE_API_URL` = your Render URL, with no trailing slash
   - `VITE_STRIPE_PUBLISABLE_KEY` = your Stripe test publishable key (`pk_test_...`)
4. Deploy. Copy the site address, for example `https://voltora.vercel.app`.

## 6. Connect them
In Render, set `CLIENT_URL` to your Vercel address (no trailing slash), then let it redeploy. This lets the browser call the API and tells Stripe where to send customers after paying.

## 7. Email (needed for sign up and password reset)
In production, new accounts and password resets send a code by email, so SMTP must be set.

Render's free instances block the usual SMTP ports (25, 465 and 587), so Gmail will not work there. Use **Brevo** (free, 300 emails a day) on port 2525:
1. Sign up at brevo.com.
2. **Senders, Domains & Dedicated IPs**, then **Senders**: add your own email address as a sender and confirm it from the email Brevo sends you.
3. Open **SMTP & API**, then **SMTP**. Note the **Login** shown there (it ends in `@smtp-brevo.com`) and click **Generate a new SMTP key**. Copy the key.
4. In Render, set:

| Name | Value |
| --- | --- |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `2525` |
| `SMTP_USER` | the Login from step 3 |
| `SMTP_PASS` | the SMTP key from step 3 |
| `MAIL_FROM` | `Voltora <the sender address you verified>` |

Gmail with an app password works fine when you run the backend on your own computer, or on a paid Render instance.

## 8. Test before the demo
- Open the Vercel address on your phone. Browse, open a product, refresh a deep page such as `/admin` (it must not 404).
- Sign in as `admin`, add a product with a photo, and check the photo still shows after the backend restarts.
- Register a new account and confirm the email arrives.
- Pay with the Stripe test card `4242 4242 4242 4242`, any future date and any CVC.
- Open the chat assistant and send a message.

## Good to know
- **The free Render backend sleeps** after about 15 minutes idle. The first request after that takes up to a minute. Open the site 5 minutes before the client demo, or upgrade to a paid instance.
- Product photos shipped with the code live in `frontend/public/products`. Photos uploaded through the admin go to Cloudinary.
- Stripe is in test mode, so no real money moves. Switch to live keys only for a real launch.
- A custom domain can be added in Vercel under **Settings**, **Domains**.
