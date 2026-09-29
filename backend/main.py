import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env")

from parser import parse_document
from reconciler import reconcile_documents
from memory import retain_override, recall_vendor_rules

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OverrideRequest(BaseModel):
    hotel_name: str
    voucher_id: str
    note: str

@app.post("/api/reconcile")
async def reconcile(voucher_file: UploadFile = File(...), invoice_file: UploadFile = File(...)):
    voucher_bytes = await voucher_file.read()
    invoice_bytes = await invoice_file.read()
    
    voucher_data = parse_document(voucher_bytes, voucher_file.filename)
    invoice_data = parse_document(invoice_bytes, invoice_file.filename)
    
    result = reconcile_documents(voucher_data, invoice_data)
    return result

@app.post("/api/retain-override")
def override(request: OverrideRequest):
    success = retain_override(request.hotel_name, request.voucher_id, request.note)
    if success:
        return {"success": True, "message": "Decision retained into Hindsight"}
    return {"success": False, "message": "Failed to retain decision"}

@app.get("/api/vendor-memories/{hotel_name}")
def vendor_memories(hotel_name: str):
    memories = recall_vendor_rules(hotel_name)
    return {"hotel_name": hotel_name, "memories": memories}

if __name__ == '__main__':
    uvicorn.run('main:app', host='0.0.0.0', port=8000, reload=True)
