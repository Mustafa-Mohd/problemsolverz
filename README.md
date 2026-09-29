# Recon-Agent

Recon-Agent is an AI-powered Accounts Payable (AP) reconciliation workspace. It automates the process of comparing hotel booking vouchers against tax invoices, instantly flagging discrepancies. Using Groq AI models and Vectorize Hindsight, it remembers past vendor interactions, exceptions, and human overrides—automatically applying your accounting policies to future reconciliations.

## Project Structure

- `backend/`: FastAPI Python backend powered by Groq (LLM structured extraction & comparison) and Vectorize Hindsight (contextual memory & overrides).
- `frontend/`: A modern React SPA (Vite + TypeScript) designed with stunning aesthetics, micro-animations (GSAP & Framer), and premium styling.

## 🚀 Getting Started

### 1. Backend Setup

Open a terminal and navigate to the backend directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
# On Windows
python -m venv venv
.\venv\Scripts\activate

# On Mac/Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Set up your Environment Variables:
Create a `.env` file in the root `recon-agent` directory (or edit the existing one) with your API keys:
```env
GROQ_API_KEY=your_groq_api_key_here
HINDSIGHT_BANK_ID=your_hindsight_bank_id_here
```

Run the API:
```bash
python main.py
```
The API will run at `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
The React frontend will be accessible at `http://localhost:5173`.

## 🧪 Testing the AI Flow

Three demo JSON files are included in `backend/test_data/` to test the reconciliation engine:
1. `voucher_munnar.json`: The original booking voucher.
2. `invoice_munnar_run1.json`: The first invoice containing an unbooked "Kerala Flood Cess" and a room service charge.
3. `invoice_munnar_run2.json`: A second invoice for a different guest, but containing the same Flood Cess fee.

**Workflow:**
1. Upload the voucher and `run1` invoice to the frontend. The AI will flag the unexpected fees as **DISCREPANCIES**.
2. Click "Approve override & retain" to accept the charge and log a memory note.
3. Next, upload `run2` invoice. The AI will cross-reference Hindsight Memory, detect your previous override, and mark the fee as **AUTO_CLEARED** instead of flagging a discrepancy!
