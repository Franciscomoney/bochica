# Bochica - Community Lending Platform

---

## What is Bochica? (Simple Explanation)

**Bochica is like a "neighborhood lending circle" but on the internet using modern technology.** Imagine you want to start a small business - maybe selling homemade cookies - but you need $1,000 to buy an oven. Instead of going to a bank, you put your idea on Bochica and explain what you need. People from around the world can chip in money to help you, like when neighbors used to help each other out, but now it's all done automatically through the internet. When you make money from your cookie business, you pay everyone back with a little extra as a "thank you" (that's the interest).

**For people who have extra money sitting around**, Bochica lets them help others while earning a bit of money back - kind of like planting seeds in a garden and watching them grow. You pick a project you like (maybe you love the idea of homemade cookies!), put your money in, and the computer system keeps track of everything automatically. When the person pays you back, you get your money plus a little bonus. It's all transparent and safe because it uses something called "blockchain" - think of it as a special notebook that everyone can see but nobody can erase or cheat with.

**Live Platform**: [https://localhost.com](https://localhost.com)

---

## ¿Qué es Bochica? (Explicación Sencilla)

**Bochica es como un "círculo de préstamos de vecinos" pero en internet usando tecnología moderna.** Imagina que quieres empezar un pequeño negocio - tal vez vendiendo galletas caseras - pero necesitas $1,000 para comprar un horno. En lugar de ir a un banco, publicas tu idea en Bochica y explicas lo que necesitas. Personas de todo el mundo pueden aportar dinero para ayudarte, como cuando los vecinos solían ayudarse mutuamente, pero ahora todo se hace automáticamente por internet. Cuando ganes dinero con tu negocio de galletas, le devuelves a todos con un poquito extra como "agradecimiento" (eso es el interés).

**Para las personas que tienen dinero extra guardado**, Bochica les permite ayudar a otros mientras ganan un poco de dinero de vuelta - como plantar semillas en un jardín y verlas crecer. Eliges un proyecto que te guste (¡tal vez te encanta la idea de las galletas caseras!), pones tu dinero, y el sistema de computadora lleva el control de todo automáticamente. Cuando la persona te devuelve el dinero, recibes tu dinero más un pequeño bono. Todo es transparente y seguro porque usa algo llamado "blockchain" - piénsalo como un cuaderno especial que todos pueden ver pero nadie puede borrar o hacer trampa.

**Plataforma en Vivo**: [https://localhost.com](https://localhost.com)

---

# Bochica - Decentralized Micro-Lending Platform

A blockchain-powered micro-lending platform built on Polkadot's parachain architecture, enabling investors to fund projects and entrepreneurs to access capital with transparent, on-chain transactions.

## 🚀 Live Demo

**Production URL**: [http://localhost:3000](https://localhost.com)

**Admin Dashboard**: [http://localhost:3000/admin](https://localhost.com)
- Username: `admin`
- Password: `yourpassword`

---

## ✅ Current Status: MVP Complete (October 2025)

### Working Features
- ✅ **Investment Flow** - Complete end-to-end investment with blockchain transactions
- ✅ **Batch Transactions** - Single wallet approval for fee + project transfer
- ✅ **Project Creation** - Full CRUD with Supabase
- ✅ **Project Browsing** - Kickstarter-style grid view
- ✅ **Wallet Integration** - Talisman connection with DOT balance detection
- ✅ **Real-time Balances** - Asset Hub USDT & DOT (Relay Chain)
- ✅ **Admin Dashboard** - Stats and transaction monitoring
- ✅ **Role Switcher** - Toggle between Investor/Creator
- ✅ **Custom Interest Rates** - Creators set their own rates (0-100%)
- ✅ **Lockup Periods** - 10min (testing), 24h, 7days
- ✅ **User Profile** - Shows created projects, funded projects, DOT and USDT balances

---

## 🎨 Design

### Kickstarter-Style Purple Theme
- **Primary Color**: Purple (#7C3AED)
- **Success Color**: Green (#10B981)
- **Typography**: Helvetica Neue
- **Logo**: Purple "BOCHICA" text logo
- **Cards**: Gradient placeholders, thin progress bars
- **Layout**: Clean, modern, mobile-responsive

---

## 🔧 Technical Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS**

### Blockchain
- **Polkadot.js API**
- **Talisman Wallet** integration
- **Asset Hub** (USDT storage + transactions)
- **Polkadot Relay Chain** (DOT balance display)
- **Batch Transactions** (utility.batchAll for atomic transfers)

### Backend
- **Supabase** (PostgreSQL database)
- **Next.js API Routes**
- **PM2** Process Manager
- **Self-signed HTTPS**

---

## 💰 How It Works

### Investment Flow

1. **Investor Browses Projects**
   - View projects on Kickstarter-style cards
   - See funding progress, interest rate, goal amount

2. **Select Investment Amount**
   - Choose lockup period: 10min, 24h, or 7days
   - See breakdown: Platform fee (2%) + Project amount (98%)

3. **Single Blockchain Transaction**
   - Approve once in Talisman wallet
   - Batch transfer executes both:
     - 2% platform fee → Bochica wallet
     - 98% project amount → Project escrow wallet

4. **Investment Recorded**
   - Database commitment created
   - Project funding updated
   - Transaction logged on-chain

### Gas Fees (DOT Requirements)

**IMPORTANT**: Users need DOT on Asset Hub for transaction fees!

| Transaction | Gas Cost |
|------------|----------|
| Investment | ~0.02 DOT |
| Project Creation | ~0.01 DOT |

**How to Get DOT on Asset Hub:**
- Option 1: Teleport from Relay Chain → Asset Hub using Polkadot.js Apps
- Option 2: Buy DOT directly to Asset Hub on exchanges
- See: `/home/debian/HOW-TO-TELEPORT-DOT.md` for detailed guide

---

## 📁 Project Structure

```
bochica/
├── app/
│   ├── layout.tsx                 # Main layout with WalletProvider
│   ├── page.tsx                   # Home with role switcher
│   ├── projects/page.tsx          # Browse projects
│   ├── create-project/page.tsx    # Create project form
│   ├── project/[id]/page.tsx      # Project detail + investment
│   ├── admin/
│   │   ├── page.tsx               # Admin login
│   │   └── dashboard/page.tsx     # Admin dashboard
│   └── api/
│       └── auth/admin/route.ts    # Admin authentication
├── components/
│   └── Header.tsx                 # Purple logo + wallet dropdown
├── contexts/
│   └── WalletContext.tsx          # Wallet state management
├── lib/
│   ├── supabase.ts                # Database client
│   ├── polkadot.ts                # Blockchain integration
│   └── financial.ts               # Financial calculations
└── README.md                      # This file
```

---

## 🗄️ Database Schema

### Tables

#### `projects`
- Project details, funding goals, interest rates
- Columns: id, title, description, funding_goal, current_funding, interest_rate, creator_address, status

#### `commitments`
- Investor commitments with lockup periods
- Columns: id, project_id, investor_address, amount, net_amount, platform_fee, lockup_period, unlock_date, status, transaction_hash

#### `loans`
- Borrower loans against funded amounts
- Columns: id, project_id, borrower_address, amount, interest_rate, repayment_due

#### `transactions`
- All financial movements on-chain
- Columns: id, wallet_address, type, amount, project_id, transaction_hash, details

#### `user_balances`
- Balance tracking (future feature)

---

## 🚀 Deployment (OVH Server)

### Server Details
- **Host**: your-server-ip
- **Port**: 8100 (HTTPS)
- **PM2 Process**: `bochica`
- **Location**: `/home/debian/bochica/`

### PM2 Commands
```bash
# SSH to OVH
ssh -i /path/to/your/key your-user@your-server-ip

# Manage process
pm2 list
pm2 restart bochica
pm2 logs bochica
pm2 stop bochica
```

### Build & Deploy
```bash
cd /home/debian/bochica
npm run build
pm2 restart bochica
```

---

## 🔑 Environment Variables

Create `.env.local`:

```env
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://yoursupabase.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Polkadot RPC Endpoints
NEXT_PUBLIC_ASSET_HUB_WSS=wss://polkadot-asset-hub-rpc.polkadot.io
NEXT_PUBLIC_MOONBEAM_WSS=wss://wss.api.moonbeam.network

# Platform Configuration
NEXT_PUBLIC_PLATFORM_FEE=0.02
NEXT_PUBLIC_USDT_ASSET_ID=1984

# Platform Wallets
NEXT_PUBLIC_BOCHICA_WALLET=your_bochica_wallet_address
NEXT_PUBLIC_PROJECT_ESCROW_WALLET=your_escrow_wallet_address

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=yourpassword!
```

---

## ⚡ Key Features Implemented

### 1. Batch Blockchain Transactions
- **Problem**: Previously required 2 wallet approvals (annoying!)
- **Solution**: Single `utility.batchAll` transaction
- **Result**: One approval, atomic execution, better UX

### 2. DOT Balance Detection
- **Relay Chain DOT**: Displayed in header for information
- **Asset Hub DOT**: Used for actual transaction gas fees
- **Warning System**: Alerts when DOT < 0.05

### 3. Smart Investment Flow
- Clear breakdown before investing
- Single transaction approval
- Automatic fee calculation (2%)
- Database commit only after blockchain success

### 4. Lockup Periods
- **10min**: For quick testing
- **24h**: Short-term lockup
- **7days**: Long-term lockup
- Auto-calculated expiry dates

---

## 📊 Financial Rules

- **Platform Fee**: 2% on all investments
- **Loan Interest**: Creator-defined (0-100%, default 5%)
- **Lockup Enforcement**: Only when funds are borrowed
- **Minimum Investment**: No minimum (subject to gas fees)

---

## 🛠️ Development

### Local Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

### Database Migrations
Run SQL files in Supabase SQL Editor:
- `supabase-setup.sql` - Initial schema
- `add-interest-rate.sql` - Interest rate column
- `complete-commitments-fix.sql` - All commitment columns

---

## ⏳ Pending Features

### Investment Workflow
- [ ] XCM transfer UI (Asset Hub → Moonbeam)
- [ ] Investment history dashboard
- [ ] Portfolio analytics

### Borrowing Workflow
- [ ] Borrow against funded amount
- [ ] Repayment with interest
- [ ] Loan status tracking
- [ ] Automatic interest calculation

### Project Management
- [ ] Edit project details
- [ ] Update interest rate
- [ ] Project status transitions
- [ ] Image uploads

### User Experience
- [ ] Search projects
- [ ] Filter by category
- [ ] Real-time updates (Supabase subscriptions)
- [ ] Email notifications
- [ ] Comments/updates on projects

---

## 🔒 Security

**Current (Development)**:
- Self-signed SSL certificate
- Basic admin authentication
- Supabase RLS policies enabled
- HTTP-only cookies

**Before Production**:
- [ ] Proper SSL certificate (Let's Encrypt)
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Security audit
- [ ] Input sanitization
- [ ] Penetration testing

---

## 🐛 Troubleshooting

### Investment Not Working
1. **Check DOT balance on Asset Hub** - Need at least 0.05 DOT
2. **Clear browser cache** - Ctrl+Shift+R
3. **Use incognito mode** - Avoid cache issues
4. **Check Supabase** - Verify database is online

### Wallet Not Connecting
1. **Install Talisman** - https://talisman.xyz
2. **Refresh page** after installing
3. **Check wallet has accounts**
4. **Try disconnecting and reconnecting**

### Database Errors
1. **Check Supabase is online** - Dashboard should be green
2. **Verify schema** - Run verification queries
3. **Reload schema cache** - `SELECT pg_notify('pgrst', 'reload schema');`
4. **Restart Supabase project** - Settings → General → Pause/Resume

---

## 📝 Admin Dashboard

**Access**: http://localhost:3000/admin

**Features**:
- Total funding across all projects
- Active loans count
- Platform fees collected
- Investor/borrower counts
- Recent transactions log
- Project overview

---

## 🎯 Roadmap

### Phase 1: Foundation ✅ (Complete)
- Wallet integration
- Database setup
- Project CRUD
- Admin dashboard

### Phase 2: Investment ✅ (Complete)
- Investment workflow
- Batch transactions
- DOT balance detection
- Commitment tracking

### Phase 3: Borrowing (Next)
- Borrow against commitments
- Repayment system
- Interest calculations
- Loan management

### Phase 4: Polish
- Real-time updates
- Notifications
- Search & filters
- Analytics

### Phase 5: Production
- Security audit
- Performance optimization
- Proper SSL
- Launch 🚀

---

## 📄 License

MIT

---

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org)
- [Polkadot.js](https://polkadot.js.org)
- [Supabase](https://supabase.com)
- [Talisman Wallet](https://talisman.xyz)
- [Tailwind CSS](https://tailwindcss.com)

---

**Last Updated**: October 8, 2025  
**Status**: MVP Complete ✅  
**Next Milestone**: Borrowing System

---

## Author

**Designed, conceived, and coded by Francisco Cordoba Otalora**

© 2025 Francisco Cordoba Otalora. All rights reserved.

---

## 🔒 Security & Configuration

### Important Security Notice

**This repository contains placeholder values for sensitive information.** Before deploying to production:

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Replace ALL placeholder values in `.env.local` with your actual credentials:**
   - Supabase project URL and anon key
   - Polkadot wallet addresses (platform and escrow)
   - Admin username and password
   - Admin session secret

3. **NEVER commit the following to version control:**
   - `.env.local` or any `.env` files with real credentials
   - Private keys (`.pem`, `.key` files)
   - Wallet seed phrases or mnemonics
   - Production server addresses
   - Real Supabase credentials

### What Has Been Sanitized

The following sensitive information has been replaced with placeholders:

| Item | Placeholder | What You Need |
|------|-------------|---------------|
| Server Address | `localhost:3000` | Your production server IP and port |
| Supabase Project | `fvehyzvdffnxrmupwgtv` | Your actual Supabase project ID |
| Platform Wallet | `5EXAMPLE_PLATFORM_WALLET...` | Your Polkadot platform commission wallet |
| Escrow Wallet | `5EXAMPLE_ESCROW_WALLET...` | Your Polkadot escrow wallet address |
| Admin Password | `CHANGE_ME_IN_PRODUCTION` | A strong, unique password |
| Admin Secret | `change-this-to-random-secret...` | A random 32+ character secret |

### Setting Up Your Wallets

1. **Create two Polkadot wallets** using [Talisman](https://talisman.xyz/) or [Polkadot.js](https://polkadot.js.org/):
   - **Platform Wallet**: Receives commission fees (2% by default)
   - **Escrow Wallet**: Holds investor funds until projects are fully funded

2. **Fund the wallets** with DOT for transaction fees

3. **Add wallet addresses** to your `.env.local` file

### Production Deployment Checklist

- [ ] Create `.env.local` from `.env.example`
- [ ] Replace all placeholder values
- [ ] Generate strong, unique admin password
- [ ] Generate random session secret (32+ characters)
- [ ] Set up production Supabase project
- [ ] Create and fund platform and escrow wallets
- [ ] Configure server with HTTPS
- [ ] Test all features with real transactions
- [ ] Enable database backups
- [ ] Set up monitoring and logging

### Support

For questions about security or configuration, please open an issue on GitHub.

