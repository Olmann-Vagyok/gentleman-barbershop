# Gentleman Barbershop — Setup Guide

---

## Step 1 — Install Node.js

Open a terminal and run these two commands one by one:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

```bash
sudo apt install -y nodejs
```

Verify it worked:

```bash
node --version
npm --version
```

You should see something like `v20.x.x` and `10.x.x`.

---

## Step 2 — Run the Website Locally

```bash
cd /home/olman/gentleman-barbershop
npm install
npm run dev
```

Open your browser and go to **http://localhost:3000**

The website is now running. Booking works in demo mode (all time slots show as available,
bookings are logged to the terminal but not saved anywhere yet).

To stop the server press `Ctrl + C` in the terminal.

---

## Step 3 — Set Up Google Calendar (Real Bookings)

This connects each barber's Google Calendar so bookings show up there automatically.

### 3a — Create a Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click the project dropdown at the top → **New Project**
3. Name it `gentleman-barbershop` → **Create**
4. Make sure the new project is selected in the dropdown

### 3b — Enable the Google Calendar API

1. In the left menu go to **APIs & Services → Library**
2. Search for **Google Calendar API**
3. Click it → **Enable**

### 3c — Create a Service Account

A service account is like a robot Google account the website uses to write to calendars.

1. Go to **APIs & Services → Credentials**
2. Click **+ Create Credentials → Service Account**
3. Name it `barbershop-booking` → **Create and Continue** → **Done**
4. Click the service account you just created
5. Go to the **Keys** tab → **Add Key → Create New Key → JSON → Create**
6. A `.json` file will download to your computer — keep it safe

Open that JSON file. You need two values from it:
- `"client_email"` — looks like `barbershop-booking@your-project.iam.gserviceaccount.com`
- `"private_key"` — a long block starting with `-----BEGIN RSA PRIVATE KEY-----`

### 3d — Share Each Barber's Calendar with the Service Account

Each barber does this on their own Google account (or you do it if you manage the calendars):

1. Go to **calendar.google.com**
2. In the left sidebar, hover over the calendar name → click the **three dots → Settings and sharing**
3. Scroll to **Share with specific people**
4. Click **+ Add people** → paste the `client_email` from step 3c
5. Set permission to **Make changes to events**
6. Click **Send**

Also on that same settings page, scroll to **Integrate calendar** and copy the **Calendar ID**
(looks like an email address). You'll need this in the next step.

### 3e — Create the .env.local File

```bash
cp /home/olman/gentleman-barbershop/.env.local.example /home/olman/gentleman-barbershop/.env.local
```

Open the file in a text editor and fill in the values:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=paste-the-client_email-here
GOOGLE_PRIVATE_KEY="paste-the-private_key-here"

CALENDAR_ID_MARIAM=mariam-calendar-id@gmail.com
CALENDAR_ID_GEORGE=george-calendar-id@gmail.com
CALENDAR_ID_NABI=nabi-calendar-id@gmail.com
CALENDAR_ID_RAOUL=raoul-calendar-id@gmail.com
CALENDAR_ID_SIDA=sida-calendar-id@gmail.com
```

For the private key: copy the entire value including the `-----BEGIN...` and `-----END...` lines,
and keep the quotes around it.

Restart the dev server after saving:

```bash
npm run dev
```

Bookings now create real events on the barber's Google Calendar. If a barber has an event
already, those time slots will show as unavailable in the booking form.

---

## Step 4 — Put It on the Internet (Deploy to Vercel)

Vercel hosts the website for free and takes about 5 minutes to set up.

### 4a — Push the Code to GitHub

1. Go to https://github.com and create a free account if you don't have one
2. Click **+** → **New repository** → name it `gentleman-barbershop` → **Create repository**
3. In your terminal:

```bash
cd /home/olman/gentleman-barbershop
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/gentleman-barbershop.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your actual GitHub username.

### 4b — Deploy on Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New → Project**
3. Find `gentleman-barbershop` in the list → **Import**
4. Click **Deploy** — it builds automatically

Your website is now live at a URL like `gentleman-barbershop.vercel.app`

### 4c — Add Environment Variables to Vercel

The Google Calendar credentials need to be added to Vercel too:

1. In Vercel, go to your project → **Settings → Environment Variables**
2. Add each variable from your `.env.local` file one by one:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `CALENDAR_ID_MARIAM`
   - `CALENDAR_ID_GEORGE`
   - `CALENDAR_ID_NABI`
   - `CALENDAR_ID_RAOUL`
   - `CALENDAR_ID_SIDA`
3. After adding all variables, go to **Deployments → Redeploy**

---

## Step 5 — Custom Domain (Optional)

If you want `gentlemanbarbershop.ge` or similar instead of the vercel.app URL:

1. Buy a domain (namecheap.com, godaddy.com, or a Georgian registrar)
2. In Vercel → **Settings → Domains** → Add your domain
3. Vercel shows you DNS records to add — go to your domain registrar and add them
4. Wait 10–30 minutes for it to go live

---

## Quick Reference

| Task | Command |
|---|---|
| Start local dev server | `npm run dev` |
| Build for production | `npm run build` |
| Open site locally | http://localhost:3000 |

## Files You Might Want to Edit

| File | What's in it |
|---|---|
| `lib/data.ts` | Barber names, service prices, shop info |
| `components/Hero.tsx` | Homepage headline and tagline |
| `app/globals.css` | Colors and fonts |
| `.env.local` | Google Calendar credentials |
