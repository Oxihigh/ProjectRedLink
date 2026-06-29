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

# Ensure all required variables are present
if not all([SUPABASE_URL, SUPABASE_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
    logger.warning("Missing environment variables. Make sure to set SUPABASE and TWILIO credentials.")

# Initialize clients lazily or handle missing vars gracefully
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN else None


async def send_sms_async(to_number: str, message_body: str) -> bool:
    """
    Sends an SMS using Twilio asynchronously by wrapping the synchronous call in a thread pool.
    """
    if not twilio_client:
        logger.error("Twilio client is not initialized.")
        return False

    loop = asyncio.get_running_loop()
    try:
        # Twilio's Python library is synchronous, run it in an executor
        message = await loop.run_in_executor(
            None,
            lambda: twilio_client.messages.create(
                body=message_body,
                from_=TWILIO_PHONE_NUMBER,
                to=to_number
            )
        )
        logger.info(f"SMS sent successfully to {to_number} (SID: {message.sid})")
        return True
    except TwilioRestException as e:
        logger.error(f"Twilio error sending SMS to {to_number}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending SMS to {to_number}: {e}")
        return False


def can_send_sms(phone_number: str) -> bool:
    """
    Rate limit check: verifies if an SMS was already sent to this number within the last 24 hours.
    Relies on an `sms_logs` table with columns `phone_number` and `sent_at`.
    """
    if not supabase:
        return False

    try:
        twenty_four_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        
        # Query sms_logs to check for recent messages
        response = supabase.table("sms_logs") \
            .select("id", count="exact") \
            .eq("phone_number", phone_number) \
            .gte("sent_at", twenty_four_hours_ago) \
            .execute()
            
        count = response.count if response.count is not None else 0
        return count == 0
    except Exception as e:
        logger.error(f"Error checking rate limit for {phone_number}: {e}")
        # Fail safe: block sending if we can't verify rate limit to avoid abuse
        return False


def log_sms_sent(phone_number: str):
    """
    Logs the successful SMS dispatch to enforce future rate limits.
    """
    if not supabase:
        return

    try:
        supabase.table("sms_logs").insert({
            "phone_number": phone_number,
            "sent_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        logger.error(f"Error logging SMS for {phone_number}: {e}")


async def trigger_urgent_blood_alert(pincode: int, blood_group: str):
    """
    Finds eligible donors for a specific pincode and blood group, and sends them a masked SMS alert.
    """
    if not supabase:
        logger.error("Supabase client is not initialized.")
        return

    logger.info(f"Triggering urgent blood alert for {blood_group} at pincode {pincode}")
    
    # 1. Efficiently Query Eligible Donors using Supabase filtering
    try:
        ninety_days_ago = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
        
        # Query users: match role=donor, pincode, blood_group, and cooldown check
        response = supabase.table("users") \
            .select("phone_number") \
            .eq("role", "donor") \
            .eq("pincode", pincode) \
            .eq("blood_group", blood_group) \
            .or_(f"last_donation_date.lte.{ninety_days_ago},last_donation_date.is.null") \
            .execute()
            
        eligible_donors = [donor["phone_number"] for donor in response.data]
                
    except Exception as e:
        logger.error(f"Error querying Supabase for donors: {e}")
        return

    if not eligible_donors:
        logger.info("No eligible donors found matching the criteria.")
        return

    logger.info(f"Found {len(eligible_donors)} eligible donor(s).")

    # 2. Process and Send SMS
    # Generic alert maintaining patient privacy
    alert_message = (
        f"Urgent: {blood_group} needed in your pincode {pincode}. "
        f"Open the Red Link app to respond securely."
    )

    tasks = []
    processed_numbers = set() # Prevent duplicates in the same run

    for phone_number in eligible_donors:
        if phone_number in processed_numbers:
            continue
        processed_numbers.add(phone_number)
        
        # Check strict rate-limiting
        if can_send_sms(phone_number):
            logger.info(f"Rate limit passed for {phone_number}. Queuing SMS...")
            
            # Wrapper to log to database only if Twilio successfully sends the SMS
            async def send_and_log(num: str, msg: str):
                success = await send_sms_async(num, msg)
                if success:
                    log_sms_sent(num)
                    
            tasks.append(send_and_log(phone_number, alert_message))
        else:
            logger.warning(f"Rate limit exceeded for {phone_number} (already contacted within 24h). Skipping.")

    if tasks:
        logger.info(f"Sending {len(tasks)} SMS alerts concurrently...")
        await asyncio.gather(*tasks)
        logger.info("Alert broadcast completed successfully.")
    else:
        logger.info("No SMS sent. All eligible donors were rate-limited.")


# Example execution
if __name__ == "__main__":
    # Example test trigger
    asyncio.run(trigger_urgent_blood_alert(pincode=110001, blood_type="O+"))
