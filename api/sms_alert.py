import os
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List

from dotenv import load_dotenv
from supabase import create_client, Client
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioRestException

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Load credentials from environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")
BASE_URL = os.environ.get("BASE_URL", "")

# Ensure all required variables are present
if not all([SUPABASE_URL, SUPABASE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
    logger.warning("Missing environment variables. Make sure to set SUPABASE and TWILIO credentials.")

# Initialize clients lazily or handle missing vars gracefully
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN else None


async def send_voice_call_async(to_number: str, message_body: str, request_id: str = None) -> bool:
    """
    Makes an automated call using Twilio asynchronously and plays a text-to-speech message.
    Attaches a status callback if request_id is provided.
    """
    if not twilio_client:
        logger.error("Twilio client is not initialized.")
        return False

    loop = asyncio.get_running_loop()
    try:
        # We use the TwiML <Say> verb to convert text to speech
        twiml_instruction = f"<Response><Say voice='alice'>{message_body}</Say></Response>"
        
        call_kwargs = {
            "twiml": twiml_instruction,
            "from_": TWILIO_PHONE_NUMBER,
            "to": to_number
        }
        
        if request_id and BASE_URL:
            # We append the request_id so the webhook knows which campaign this belongs to
            call_kwargs["status_callback"] = f"{BASE_URL.rstrip('/')}/api/twilio-webhook?request_id={request_id}"
            call_kwargs["status_callback_event"] = ["completed", "failed", "busy", "no-answer", "canceled"]
            call_kwargs["status_callback_method"] = "POST"
            
        call = await loop.run_in_executor(
            None,
            lambda: twilio_client.calls.create(**call_kwargs)
        )
        logger.info(f"Voice call initiated successfully to {to_number} (SID: {call.sid})")
        return True
    except TwilioRestException as e:
        logger.error(f"Twilio error calling {to_number}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error calling {to_number}: {e}")
        return False


def can_make_call(phone_number: str) -> bool:
    """
    Rate limit check: verifies if a call was already made to this number within the last 24 hours.
    Relies on a `call_logs` table with columns `phone_number` and `sent_at`.
    """
    if not supabase:
        return False

    try:
        twenty_four_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        
        # Query call_logs to check for recent messages
        response = supabase.table("call_logs") \
            .select("id", count="exact") \
            .eq("phone_number", phone_number) \
            .gte("sent_at", twenty_four_hours_ago) \
            .execute()
            
        count = response.count if response.count is not None else 0
        return count == 0
    except Exception as e:
        logger.error(f"Error checking rate limit for {phone_number}: {e}")
        return False


def log_call_made(phone_number: str):
    """
    Logs the successful call dispatch to enforce future rate limits.
    """
    if not supabase:
        return

    try:
        supabase.table("call_logs").insert({
            "phone_number": phone_number,
            "sent_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        logger.error(f"Error logging call for {phone_number}: {e}")


async def start_next_calls(request_id: str, count: int = 1):
    """
    Fetches the next `count` pending calls for a request and starts them.
    """
    if not supabase: return
    
    # Check if request is still active and get details
    try:
        req_res = supabase.table("blood_requests").select("blood_group, pincode").eq("id", request_id).execute()
        if not req_res.data:
            logger.info(f"Request {request_id} is fulfilled or deleted. Halting queue.")
            return
            
        req_data = req_res.data[0]
        blood_group = req_data["blood_group"]
        pincode = req_data["pincode"]
        
        # Get pending calls
        pending_res = supabase.table("call_queue") \
            .select("id, phone_number") \
            .eq("request_id", request_id) \
            .eq("status", "pending") \
            .order("created_at") \
            .limit(count) \
            .execute()
            
        if not pending_res.data:
            logger.info(f"No more pending calls for request {request_id}.")
            return
            
        alert_message = (
            f"Urgent. Blood group {blood_group} is needed in your area, pincode {pincode}. "
            f"<Pause length='1'/> Please open the Red Link app to respond securely. Thank you."
        )
        
        tasks = []
        for item in pending_res.data:
            # Update status to calling immediately to prevent race conditions
            supabase.table("call_queue").update({"status": "calling"}).eq("id", item["id"]).execute()
            
            async def call_and_log(num: str, msg: str, req_id: str):
                success = await send_voice_call_async(num, msg, req_id)
                if success:
                    log_call_made(num)
            
            tasks.append(call_and_log(item["phone_number"], alert_message, request_id))
            
        if tasks:
            logger.info(f"Initiating {len(tasks)} queued calls for request {request_id}...")
            await asyncio.gather(*tasks)
            
    except Exception as e:
        logger.error(f"Error in start_next_calls: {e}")


async def handle_call_disconnect(request_id: str, phone_number: str):
    """
    Called by the webhook when a call finishes. Marks the call as completed and triggers the next one.
    """
    if not supabase: return
    
    logger.info(f"Call disconnected for {phone_number} on request {request_id}. Marking completed.")
    try:
        # Mark as completed
        supabase.table("call_queue") \
            .update({"status": "completed"}) \
            .eq("request_id", request_id) \
            .eq("phone_number", phone_number) \
            .execute()
        
        # Trigger the next call in the queue to replace this one
        await start_next_calls(request_id, count=1)
    except Exception as e:
        logger.error(f"Error in handle_call_disconnect: {e}")


async def trigger_urgent_blood_alert(request_id: str, pincode: int, blood_group: str):
    """
    Finds eligible donors, sorts them by nearest pincode, inserts them into the call_queue,
    and initiates the first batch of 5 calls. The rest is handled by Twilio Webhooks.
    """
    if not supabase:
        logger.error("Supabase client is not initialized.")
        return

    logger.info(f"Triggering webhook-based cascading alert for request {request_id} ({blood_group} near {pincode})")
    
    # 1. Fetch Eligible Donors
    try:
        ninety_days_ago = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
        
        response = supabase.table("users") \
            .select("phone_number, pincode") \
            .eq("role", "donor") \
            .eq("blood_group", blood_group) \
            .or_(f"last_donation_date.lte.{ninety_days_ago},last_donation_date.is.null") \
            .execute()
            
        donors = response.data
    except Exception as e:
        logger.error(f"Error querying Supabase for donors: {e}")
        return

    if not donors:
        logger.info("No eligible donors found matching the blood group.")
        return

    # Sort donors by nearest pincode
    donors.sort(key=lambda d: abs(d["pincode"] - pincode))
    
    # Filter unique phone numbers maintaining sorted order and rate limits
    eligible_numbers = []
    processed_numbers = set()
    for d in donors:
        phone = d["phone_number"]
        if phone not in processed_numbers:
            processed_numbers.add(phone)
            if can_make_call(phone):
                eligible_numbers.append(phone)
                
    if not eligible_numbers:
        logger.info("No eligible donors available after rate-limit checks.")
        return

    logger.info(f"Found {len(eligible_numbers)} eligible donor(s) after filtering. Queuing them...")

    # Insert into call_queue
    queue_inserts = [{"request_id": request_id, "phone_number": phone, "status": "pending"} for phone in eligible_numbers]
    try:
        supabase.table("call_queue").insert(queue_inserts).execute()
    except Exception as e:
        logger.error(f"Failed to queue calls: {e}")
        return
        
    # Kick off the first batch (up to 5)
    await start_next_calls(request_id, count=5)


# Example execution
if __name__ == "__main__":
    # Example test trigger
    import uuid
    dummy_req_id = str(uuid.uuid4())
    asyncio.run(trigger_urgent_blood_alert(request_id=dummy_req_id, pincode=110001, blood_group="O+"))
