# ⚡ InstantPay AI – Gig Worker Instant Payout Agent

> **PayPal AI Hackathon Project** – An AI-powered chat agent that lets gig workers report completed jobs in natural language and get paid instantly via PayPal.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-green?logo=openai)
![PayPal](https://img.shields.io/badge/PayPal-Sandbox-blue?logo=paypal)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)

---

## 🎯 What It Does

1. Gig worker opens the chat and types: **"Job done for Ravi - Food Delivery - ₹720"**
2. AI extracts: client name, job type, and amount
3. AI shows a **confirmation card** with all details
4. Worker clicks **"Confirm & Send"**
5. PayPal Payout API is called → money lands in the worker's PayPal
6. Transaction ID is displayed, history is updated

---

## ✨ Features

- 🤖 **AI Chat Interface** – Natural language job reporting
- 💸 **Instant PayPal Payouts** – Real sandbox API integration
- 📋 **Confirmation Flow** – Review before sending
- 📊 **Payout History** – Sidebar with all past transactions
- 🎨 **Premium Dark UI** – Glassmorphism, animations, responsive design
- 📱 **Mobile Responsive** – Works on all screen sizes

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Custom CSS |
| AI | OpenAI GPT-4o-mini |
| Payments | PayPal Payouts API (Sandbox) |
| Storage | JSON file (`data/history.json`) |

---

## 📁 Project Structure

```
InstantPay/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # POST – AI message processing
│   │   ├── payout/route.ts      # POST – PayPal payout trigger
│   │   └── history/route.ts     # GET  – Payout history
│   ├── globals.css              # Design system & styles
│   ├── layout.tsx               # Root layout with metadata
│   └── page.tsx                 # Main chat UI
├── lib/
│   ├── ai.ts                    # OpenAI integration
│   ├── paypal.ts                # PayPal API client
│   └── storage.ts               # JSON file persistence
├── types/
│   └── index.ts                 # TypeScript interfaces
├── data/
│   └── history.json             # Payout records (auto-created)
├── .env.local.example           # Environment template
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd InstantPay
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your keys:

```env
OPENAI_API_KEY=sk-...
PAYPAL_CLIENT_ID=AYour-Client-ID
PAYPAL_CLIENT_SECRET=EYour-Client-Secret
PAYPAL_SANDBOX_RECEIVER_EMAIL=sb-xxxxx@personal.example.com
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Getting API Keys

### OpenAI API Key
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Add to `.env.local` as `OPENAI_API_KEY`

### PayPal Sandbox Credentials
1. Go to [developer.paypal.com](https://developer.paypal.com/dashboard/)
2. Log in with your PayPal account (free)
3. Navigate to **Apps & Credentials** → **Sandbox** tab
4. Click **Create App**, give it a name (e.g., "InstantPay AI")
5. Copy the **Client ID** and **Client Secret**
6. Go to **Sandbox Accounts** → note the **Personal** account email (this is the receiver)
7. Add all three values to `.env.local`

> **Note:** The sandbox uses USD internally, but we display amounts in INR for UX. In production, you'd use PayPal's currency conversion or set up an INR-enabled merchant account.

---

## 🧪 Testing the Full Flow

### Test Case 1: Basic Food Delivery
```
Type: "Job done for Ravi - Food Delivery - ₹720"
→ AI extracts details and shows confirmation card
→ Click "Confirm & Send"
→ See PayPal transaction ID appear
→ Check history sidebar for the new entry
```

### Test Case 2: Tutoring Session
```
Type: "Tutoring for Ananya, 2 hours, ₹900"
→ AI understands the natural language
→ Confirm → payout sent
```

### Test Case 3: Natural Conversation
```
Type: "Hi, what can you do?"
→ AI explains its capabilities
```

### Test Case 4: Text Confirmation
```
After seeing a confirm card, type "yes send it"
→ AI detects "confirm" intent and triggers payout
```

---

## 🌐 API Reference

### `POST /api/chat`
Process a message with AI.

**Request:**
```json
{
  "message": "Job done for Ravi - Food Delivery - ₹720",
  "history": [] 
}
```

**Response:**
```json
{
  "success": true,
  "aiResponse": {
    "intent": "create_payout",
    "client_name": "Ravi",
    "job_type": "Food Delivery",
    "amount": 720,
    "currency": "INR",
    "confidence": 0.99,
    "message": "Got it! Ready to process ₹720 for Food Delivery?"
  }
}
```

### `POST /api/payout`
Trigger a PayPal payout.

**Request:**
```json
{
  "client_name": "Ravi",
  "job_type": "Food Delivery",
  "amount": 720,
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "payout": {
    "id": "uuid",
    "transaction_id": "PAYPAL_BATCH_ID",
    "status": "SUCCESS",
    "created_at": "2024-01-01T00:00:00.000Z",
    ...
  }
}
```

### `GET /api/history`
Fetch all past payouts.

**Response:**
```json
{
  "success": true,
  "data": [...payouts],
  "stats": {
    "totalPayouts": 5,
    "totalAmount": 3650,
    "successCount": 5
  }
}
```

---

## 🏗 Architecture

```
User Chat Input
      │
      ▼
POST /api/chat
      │
      ▼
OpenAI GPT-4o-mini
(Intent Detection + Data Extraction)
      │
      ▼
  intent: "create_payout"?
      │
      Yes → Show Confirmation Card
      │
   User clicks "Confirm & Send"
      │
      ▼
POST /api/payout
      │
      ▼
PayPal OAuth2 → Access Token
      │
      ▼
PayPal Payouts API (Sandbox)
      │
      ▼
Save to data/history.json
      │
      ▼
Show Transaction ID to User
```

---

## 🎨 Design Highlights

- **Dark blue glassmorphism** theme with gradient accents
- **Animated typing indicator** while AI processes
- **Slide-in animations** for new messages
- **Pulse dot** for AI online status
- **Responsive layout** – sidebar collapses on mobile
- **Keyboard shortcuts** – Enter to send, Shift+Enter for new line

---

## 📝 License

MIT License – Built for the **PayPal AI Hackathon**.

---

## 🙏 Built With

- [Next.js](https://nextjs.org/) – React framework
- [OpenAI](https://openai.com/) – AI intelligence
- [PayPal Developer](https://developer.paypal.com/) – Payment processing
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first styling
# InstantPay-
