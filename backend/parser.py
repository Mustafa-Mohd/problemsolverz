import json
import io
import os
import pdfplumber
from groq import Groq

# Initialize Groq client
# The client automatically picks up the GROQ_API_KEY environment variable.
client = Groq()

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from a PDF file across all its pages."""
    text = ""
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    return text

def parse_document(file_bytes: bytes, filename: str) -> dict:
    """Parse a document (JSON or PDF) and return a structured dictionary."""
    if filename.lower().endswith('.json'):
        return json.loads(file_bytes.decode('utf-8'))
        
    if filename.lower().endswith('.pdf'):
        text = extract_text_from_pdf(file_bytes)
        
        prompt = f"""
Extract the following information from the provided document text.
You must return a JSON object that strictly follows this structure:
{{
  "hotel_name": "string",
  "voucher_id": "string",
  "guest_name": "string",
  "stay_dates": "string",
  "line_items": [
    {{
      "description": "string",
      "amount": float,
      "category": "ROOM" | "MEAL" | "TAX" | "FEE"
    }}
  ],
  "total_amount": float
}}

Document Text:
{text}
"""
        
        response = client.chat.completions.create(
            # Using the model suggested in the prompt (or a typical Groq fallback if needed)
            model="qwen-2.5-32b",
            messages=[
                {"role": "system", "content": "You are a precise data extraction API that outputs strictly in JSON format."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0
        )
        
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Received empty response from Groq.")
            
        return json.loads(content)
        
    raise ValueError(f"Unsupported file format for '{filename}'. Only .json and .pdf are supported.")
