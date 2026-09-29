import os
import logging
from hindsight_client import Hindsight

# Set up basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load configuration
HINDSIGHT_BASE_URL = os.getenv('HINDSIGHT_BASE_URL', 'https://api.hindsight.vectorize.io')
BANK_ID = os.getenv('HINDSIGHT_BANK_ID')
HINDSIGHT_API_KEY = os.getenv('HINDSIGHT_API_KEY')

# Initialize Hindsight client
client = Hindsight(base_url=HINDSIGHT_BASE_URL, api_key=HINDSIGHT_API_KEY)

def recall_vendor_rules(hotel_name: str) -> list[str]:
    """
    Recall past rules, exceptions, and quirks for a given hotel.
    """
    # MOCK DATA FOR TESTING THE UI
    if "Munnar" in hotel_name:
        return [
            "Human accountant override for Munnar Valley Resort [Voucher #MV-8821]: The 1200 INR Kerala Flood Cess is a mandatory local tax. Always approve this.",
            "Human accountant override for Munnar Valley Resort [Voucher #MV-4019]: Room service up to 500 INR is covered under the corporate meal plan."
        ]

    try:
        query = f'What are the past approved exceptions, meal plan mappings, tax quirks, and billing rules for {hotel_name}?'
        results = client.recall(bank_id=BANK_ID, query=query)
        
        extracted_texts = []
        for result in results:
            # Handle different possible response object structures
            if isinstance(result, dict) and 'text' in result:
                extracted_texts.append(result['text'])
            elif hasattr(result, 'text'):
                extracted_texts.append(result.text)
            else:
                # Fallback
                extracted_texts.append(str(result))
                
        return extracted_texts
    except Exception as e:
        logger.error(f"Failed to recall vendor rules for '{hotel_name}': {e}")
        return []

def retain_override(hotel_name: str, voucher_id: str, note: str) -> bool:
    """
    Retain a human accountant override as precedent for future invoices.
    """
    try:
        content = f'Human accountant override for {hotel_name} [Voucher #{voucher_id}]: {note}. Apply this precedent to auto-clear identical charges on subsequent invoices.'
        client.retain(bank_id=BANK_ID, content=content, context='accounting_override')
        return True
    except Exception as e:
        logger.error(f"Failed to retain override for '{hotel_name}' (Voucher: {voucher_id}): {e}")
        return False
