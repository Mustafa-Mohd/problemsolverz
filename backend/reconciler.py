import json
from groq import Groq
from memory import recall_vendor_rules

# Initialize Groq client
client = Groq()

def reconcile_documents(voucher_data: dict, invoice_data: dict) -> dict:
    """
    Compare a voucher against an invoice using Hindsight memory for context.
    """
    hotel_name = voucher_data.get("hotel_name", "")
    voucher_id = voucher_data.get("voucher_id", "")
    
    # Recall vendor rules from memory
    memories = []
    if hotel_name:
        memories = recall_vendor_rules(hotel_name)
    
    prompt = f"""
You are an AI reconciliation agent. Your task is to compare a hotel booking voucher against an invoice provided by the supplier. 

Here is the context about past exceptions and rules for this specific hotel:
Recalled Memories:
{json.dumps(memories, indent=2)}

Voucher Data:
{json.dumps(voucher_data, indent=2)}

Invoice Data:
{json.dumps(invoice_data, indent=2)}

You must return a JSON object strictly following this structure:
{{
  "hotel_name": "{hotel_name}",
  "voucher_id": "{voucher_id}",
  "guest_name": "string",
  "stay_dates": "string",
  "total_booked": float,
  "total_invoiced": float,
  "overall_status": "APPROVED" | "AUTO_CLEARED" | "DISCREPANCY_DETECTED",
  "line_items": [
    {{
      "description": "string",
      "booked_amount": float,
      "invoiced_amount": float,
      "variance": float,
      "status": "MATCH" | "AUTO_CLEARED" | "DISCREPANCY",
      "provenance": "string or null"
    }}
  ],
  "recalled_memories": {json.dumps(memories)},
  "dispute_email": "string or empty string"
}}

Matching rules:
1. If amounts and items match exactly -> status: "MATCH", provenance: null.
2. If an item differs BUT is justified by a recalled memory -> status: "AUTO_CLEARED", provenance: "<exact memory sentence>".
3. If an item differs and NO memory justifies it -> status: "DISCREPANCY", provenance: null.

Additional Rules:
- If any line item has a "DISCREPANCY", the "overall_status" must be "DISCREPANCY_DETECTED", and you must generate a polite but firm B2B supplier dispute email inside "dispute_email".
- If there are no discrepancies, and at least one "AUTO_CLEARED", "overall_status" is "AUTO_CLEARED".
- If all items "MATCH", "overall_status" is "APPROVED".
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": "You are a precise data reconciliation API that outputs strictly in JSON format."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.0
    )
    
    content = response.choices[0].message.content
    if not content:
        raise ValueError("Received empty response from Groq.")
        
    return json.loads(content)
