import os
import json
import logging
from datetime import datetime, timezone, timedelta
from supabase import create_client, Client
import firebase_admin
from firebase_admin import credentials, messaging
os.environ["PGEOCODE_DATA_DIR"] = "/tmp/pgeocode"
import pgeocode
import math

_nomi = None

def get_nomi():
    global _nomi
    if _nomi is None:
        try:
            _nomi = pgeocode.Nominatim('in')
        except Exception as e:
            logger.error(f"Failed to initialize pgeocode: {e}")
    return _nomi

logger = logging.getLogger(__name__)

# Initialize Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Firebase Admin
FIREBASE_SERVICE_ACCOUNT = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
if FIREBASE_SERVICE_ACCOUNT and not firebase_admin._apps:
    try:
        cert_dict = json.loads(FIREBASE_SERVICE_ACCOUNT)
        cred = credentials.Certificate(cert_dict)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin: {e}")

async def broadcast_fcm_alert(request_id: str, pincode: int, blood_group: str):
    """
    Finds eligible donors in the area and broadcasts a push notification using Firebase Cloud Messaging.
    """
    if not supabase:
        logger.error("Supabase client is not initialized.")
        return
        
    if not firebase_admin._apps:
        logger.error("Firebase Admin is not initialized. Cannot send push notifications.")
        return

    logger.info(f"Triggering FCM push notification for request {request_id} ({blood_group} near {pincode})")
    
    # 1. Fetch Eligible Donors with FCM tokens
    try:
        ninety_days_ago = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
        
        n = get_nomi()
        location = n.query_postal_code(str(pincode)) if n else None
        lat, lon = (location.latitude, location.longitude) if location else (None, None)
        
        eligible_donors = []
        
        if lat is None or math.isnan(lat):
            # Fallback to exact pincode match
            response = supabase.table("users") \
                .select("fcm_token") \
                .eq("role", "donor") \
                .eq("blood_group", blood_group) \
                .eq("pincode", pincode) \
                .not_.is_("fcm_token", "null") \
                .or_(f"last_donation_date.lte.{ninety_days_ago},last_donation_date.is.null") \
                .execute()
            eligible_donors = response.data
        else:
            # Use PostGIS proximity matching
            response = supabase.rpc('get_nearby_donors', {
                'target_lat': float(lat), 
                'target_lon': float(lon), 
                'target_blood_group': blood_group, 
                'radius_km': 10.0
            }).execute()
            
            # Filter donors by cooldown and token
            today = datetime.now(timezone.utc).date()
            for donor in response.data:
                if not donor.get("fcm_token"):
                    continue
                if donor.get("last_donation_date"):
                    try:
                        d_str = str(donor["last_donation_date"]).split('T')[0]
                        last_donation = datetime.strptime(d_str, "%Y-%m-%d").date()
                        if (today - last_donation).days >= 90:
                            eligible_donors.append(donor)
                    except Exception:
                        eligible_donors.append(donor)
                else:
                    eligible_donors.append(donor)
                    
        if not eligible_donors:
            logger.info("No eligible donors with FCM tokens found.")
            return
            
        tokens = [donor["fcm_token"] for donor in eligible_donors if donor.get("fcm_token")]
        
        if not tokens:
            logger.info("No valid FCM tokens found among eligible donors.")
            return
            
        logger.info(f"Found {len(tokens)} eligible donor(s). Broadcasting push notifications...")

        # 2. Construct the Push Notification payload
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title="URGENT: Blood Donation Needed!",
                body=f"Blood group {blood_group} is urgently needed near your location (Pincode: {pincode}). Please help!",
                image="https://theredlinkproject.vercel.app/icon.png" # Example icon
            ),
            data={
                "request_id": request_id,
                "url": f"/requests/{request_id}" # Click action
            },
            tokens=tokens,
        )

        # 3. Send the notifications
        response = messaging.send_multicast(message)
        logger.info(f"{response.success_count} messages were sent successfully.")
        if response.failure_count > 0:
            logger.warning(f"{response.failure_count} messages failed to send.")
            
    except Exception as e:
        logger.error(f"Error broadcasting FCM alert: {e}", exc_info=True)
