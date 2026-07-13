import os
import uuid
from typing import Optional, List, Dict
from datetime import date, datetime, timedelta, timezone

from fastapi import FastAPI, Depends, HTTPException, status, Request, Form, UploadFile, File, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

try:
    from api.fcm_alert import broadcast_fcm_alert
except ImportError:
    from fcm_alert import broadcast_fcm_alert

import base64
import json
from groq import Groq

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def encode_image(file_bytes):
    return base64.b64encode(file_bytes).decode('utf-8')

app = FastAPI(title="Project RedLink - Phase 3 (Complete)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For MVP, allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Initialization
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase configuration in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
security = HTTPBearer()

# --- Security Dependency ---
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        return user_res.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )

# --- Pydantic Models ---
class UserRegistrationRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    role: str = Field(..., description="'donor' or 'requester'")
    blood_group: Optional[str] = Field(None, description="e.g., 'A+', 'O-'")
    pincode: int = Field(..., ge=100000, le=999999)
    phone_number: str = Field(..., min_length=10, max_length=25)
    last_donation_date: Optional[date] = None

class UserUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[str] = Field(None, description="'donor' or 'requester'")
    blood_group: Optional[str] = Field(None, description="e.g., 'A+', 'O-'")
    pincode: Optional[int] = Field(None, ge=100000, le=999999)
    phone_number: Optional[str] = Field(None, min_length=10, max_length=25)

class SearchResponseDonor(BaseModel):
    id: str
    name: str
    blood_group: str
    pincode: int
    last_donation_date: Optional[date]
    lifesaver_points: int

class ReportRequest(BaseModel):
    reason: str = Field(..., min_length=5, max_length=500)

class DonationConfirmRequest(BaseModel):
    other_user_id: str

class BloodRequestCreate(BaseModel):
    blood_group: str = Field(..., description="e.g., 'A+', 'O-'")
    pincode: int = Field(..., ge=100000, le=999999)
    hospital_name: str = Field(..., min_length=2, max_length=200)
    location_details: Optional[str] = Field(None, max_length=500)
    phone_number: str = Field(..., min_length=10, max_length=25)

# --- Endpoints ---

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_profile(profile: UserRegistrationRequest, current_user = Depends(get_current_user)):
    if profile.role not in ["donor", "requester"]:
        raise HTTPException(status_code=400, detail="Invalid role.")
    if profile.role == "donor" and not profile.blood_group:
        raise HTTPException(status_code=400, detail="Blood group is required for donors.")

    try:
        user_data = {
            "id": current_user.id,
            "name": profile.name,
            "role": profile.role,
            "blood_group": profile.blood_group,
            "pincode": profile.pincode,
            "phone_number": profile.phone_number,
            "last_donation_date": profile.last_donation_date.isoformat() if profile.last_donation_date else None,
        }
        response = supabase.table("users").upsert(user_data).execute()
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create profile")
        return {"message": "Profile registered successfully", "user": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/profile", status_code=status.HTTP_200_OK)
def update_profile(profile_update: UserUpdateRequest, current_user = Depends(get_current_user)):
    update_data = profile_update.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")
    
    if "role" in update_data and update_data["role"] not in ["donor", "requester"]:
        raise HTTPException(status_code=400, detail="Invalid role.")
        
    try:
        response = supabase.table("users").update(update_data).eq("id", current_user.id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Profile not found.")
        return {"message": "Profile updated successfully", "user": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search", response_model=List[SearchResponseDonor])
def search_donors(pincode: int, blood_group: str):
    try:
        response = supabase.table("users").select("id, name, blood_group, pincode, last_donation_date, lifesaver_points").eq("role", "donor").eq("pincode", pincode).eq("blood_group", blood_group).eq("is_banned", False).eq("is_suspicious", False).execute()
        donors = response.data
        eligible_donors = []
        today = date.today()
        for donor in donors:
            if donor.get("last_donation_date"):
                last_donation = date.fromisoformat(donor["last_donation_date"])
                if (today - last_donation).days >= 90:
                    eligible_donors.append(donor)
            else:
                eligible_donors.append(donor)
        return eligible_donors
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/request-contact/{donor_id}")
def request_contact(donor_id: str, request: Request):
    ip_address = request.client.host
    try:
        twelve_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat()
        logs_res = supabase.table("contact_logs").select("id", count="exact").eq("requester_id", ip_address).gte("created_at", twelve_hours_ago).execute()
        count = logs_res.count if logs_res.count is not None else 0
        if count >= 5:
            # IP Banning logic could go here
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Max 5 contacts per 12 hours.")
        donor_res = supabase.table("users").select("phone_number").eq("id", donor_id).eq("role", "donor").eq("is_banned", False).execute()
        if not donor_res.data:
            raise HTTPException(status_code=404, detail="Donor not found or unavailable.")
        supabase.table("contact_logs").insert({"requester_id": ip_address, "donor_id": donor_id}).execute()
        return {"phone_number": donor_res.data[0]["phone_number"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/report/{reported_user_id}")
def report_user(reported_user_id: str, payload: ReportRequest, current_user = Depends(get_current_user)):
    try:
        supabase.table("reports").insert({"reporter_id": current_user.id, "reported_user_id": reported_user_id, "reason": payload.reason}).execute()
        reports_res = supabase.table("reports").select("id", count="exact").eq("reported_user_id", reported_user_id).execute()
        count = reports_res.count if reports_res.count is not None else 0
        if count >= 3:
            supabase.table("users").update({"is_banned": True}).eq("id", reported_user_id).execute()
        return {"message": "Report submitted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/donation/requester-confirm")
def requester_confirm_donation(payload: DonationConfirmRequest, request: Request):
    ip_address = request.client.host
    try:
        donor_id = payload.other_user_id
        existing = supabase.table("donations").select("*").eq("requester_id", ip_address).eq("donor_id", donor_id).order("created_at", desc=True).limit(1).execute()
        if existing.data and not (existing.data[0]["requester_confirmed"] and existing.data[0]["donor_confirmed"]):
            res = supabase.table("donations").update({"requester_confirmed": True}).eq("id", existing.data[0]["id"]).execute()
            donation_id = res.data[0]["id"]
        else:
            res = supabase.table("donations").insert({"requester_id": ip_address, "donor_id": donor_id, "requester_confirmed": True, "donor_confirmed": False}).execute()
            donation_id = res.data[0]["id"]
        return {"message": "Donation confirmed by requester.", "donation_id": donation_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/donation/donor-confirm")
def donor_confirm_donation(payload: DonationConfirmRequest, current_user = Depends(get_current_user)):
    try:
        requester_id = payload.other_user_id
        existing = supabase.table("donations").select("*").eq("requester_id", requester_id).eq("donor_id", current_user.id).order("created_at", desc=True).limit(1).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="No active donation handshake found.")
        donation_record = existing.data[0]
        supabase.table("donations").update({"donor_confirmed": True}).eq("id", donation_record["id"]).execute()
        if donation_record["requester_confirmed"]:
            today = date.today().isoformat()
            donor_res = supabase.table("users").select("lifesaver_points").eq("id", current_user.id).execute()
            current_points = donor_res.data[0].get("lifesaver_points", 0)
            supabase.table("users").update({"last_donation_date": today, "lifesaver_points": current_points + 10}).eq("id", current_user.id).execute()
            return {"message": "Handshake complete! Cooldown reset and points awarded."}
        return {"message": "Donation confirmed by donor. Waiting for requester confirmation."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# PHASE 3 ENDPOINTS
# ==========================================

@app.post("/blood-requests")
async def create_blood_request(
    request: Request,
    blood_group: str = Form(...),
    pincode: int = Form(...),
    hospital_name: str = Form(...),
    phone_number: str = Form(...),
    location_details: Optional[str] = Form(None),
    supporting_document: UploadFile = File(...)
):
    ip_address = request.client.host
    try:
        # 1. Read and encode the uploaded document
        file_bytes = await supporting_document.read()
        base64_image = encode_image(file_bytes)
        
        # 2. Verify document using Groq Llama-3.2-11b-vision-preview
        try:
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "Analyze this image. Is it a legitimate hospital document, admission slip, or doctor's prescription explicitly requesting a blood transfusion? Reply strictly with a JSON object: {\"is_legit\": true/false, \"reason\": \"string explanation\"}. Do not output any markdown or other text."},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            },
                        ],
                    }
                ],
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                temperature=0.0
            )
            
            response_text = chat_completion.choices[0].message.content.strip()
            # Clean up potential markdown formatting
            if response_text.startswith("```json"):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith("```"):
                response_text = response_text[3:-3].strip()
                
            ai_response = json.loads(response_text)
            
            if not ai_response.get("is_legit", False):
                raise HTTPException(status_code=400, detail=f"AI Verification Failed: {ai_response.get('reason', 'Document rejected.')}")
                
        except HTTPException:
            raise
        except Exception as e:
            print(f"Groq API Error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to verify document with AI.")

        # 3. Document is verified, save to database
        success_token = uuid.uuid4().hex[:6].upper()
        res = supabase.table("blood_requests").insert({
            "requester_id": ip_address,
            "blood_group": blood_group,
            "pincode": pincode,
            "hospital_name": hospital_name,
            "location_details": location_details,
            "phone_number": phone_number,
            "success_token": success_token
        }).execute()
        
        # 4. Trigger the FCM Push Notifications
        request_id = res.data[0]["id"]
        await broadcast_fcm_alert(request_id, pincode, blood_group)
        
        return {"message": "Blood request verified by AI and broadcasted.", "request": res.data[0], "success_token": success_token}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/blood-requests/{request_id}/volunteer")
def volunteer_for_request(request_id: str, current_user = Depends(get_current_user)):
    try:
        # Fetch the request
        req_res = supabase.table("blood_requests").select("*").eq("id", request_id).execute()
        if not req_res.data:
            raise HTTPException(status_code=404, detail="Request not found.")
        
        request_data = req_res.data[0]
        
        # Log contact in contact_logs to prevent abuse/scraping
        twelve_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=12)).isoformat()
        logs_res = supabase.table("contact_logs").select("id", count="exact").eq("requester_id", current_user.id).gte("created_at", twelve_hours_ago).execute()
        count = logs_res.count if logs_res.count is not None else 0
        if count >= 5:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Max 5 contacts per 12 hours.")
            
        supabase.table("contact_logs").insert({"requester_id": current_user.id, "donor_id": current_user.id}).execute()

        # Create a tentative donation record
        supabase.table("donations").insert({
            "requester_id": f"REQ_{request_id}",
            "donor_id": current_user.id,
            "requester_confirmed": False,
            "donor_confirmed": True
        }).execute()

        # Return the requester's phone number
        return {
            "message": "Thank you for volunteering!",
            "phone_number": request_data["phone_number"],
            "hospital_name": request_data["hospital_name"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/blood-requests/{success_token}/status")
def check_request_status(success_token: str):
    try:
        req_res = supabase.table("blood_requests").select("*").eq("success_token", success_token).execute()
        if not req_res.data:
            raise HTTPException(status_code=404, detail="Invalid token.")
        
        request_data = req_res.data[0]
        
        # Check if anyone has volunteered
        don_res = supabase.table("donations").select("*").eq("requester_id", f"REQ_{request_data['id']}").eq("donor_confirmed", True).order("created_at", desc=True).limit(1).execute()
        
        if not don_res.data:
            return {"status": "waiting"}
            
        # Fetch donor details
        donor_id = don_res.data[0]["donor_id"]
        donor_res = supabase.table("users").select("name", "phone_number").eq("id", donor_id).execute()
        
        if donor_res.data:
            return {
                "status": "volunteered",
                "donor_name": donor_res.data[0]["name"],
                "donor_phone": donor_res.data[0]["phone_number"]
            }
            
        return {"status": "waiting"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/blood-requests/success/{success_token}")
def confirm_success(success_token: str):
    try:
        # Find the request
        req_res = supabase.table("blood_requests").select("*").eq("success_token", success_token).execute()
        if not req_res.data:
            raise HTTPException(status_code=404, detail="Invalid or expired success token.")
        
        request_data = req_res.data[0]
        
        # Find the active donation (if multiple donors volunteered, this simplistic logic just takes the most recent one for MVP)
        don_res = supabase.table("donations").select("*").eq("requester_id", f"REQ_{request_data['id']}").eq("donor_confirmed", True).order("created_at", desc=True).limit(1).execute()
        
        if don_res.data:
            donor_id = don_res.data[0]["donor_id"]
            supabase.table("donations").update({"requester_confirmed": True}).eq("id", don_res.data[0]["id"]).execute()
            
            # Award points & cooldown
            today = date.today().isoformat()
            donor_user_res = supabase.table("users").select("lifesaver_points").eq("id", donor_id).execute()
            current_points = donor_user_res.data[0].get("lifesaver_points", 0)
            supabase.table("users").update({"last_donation_date": today, "lifesaver_points": current_points + 10}).eq("id", donor_id).execute()
            
        # Archive/Delete the request
        supabase.table("blood_requests").delete().eq("id", request_data["id"]).execute()
        
        return {"message": "Success recorded! Points awarded to the hero and request closed."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/heatmap")
def get_heatmap():
    """Returns count of donors vs requests grouped by pincode. (No auth required for MVP visualization)"""
    try:
        donors_res = supabase.table("users").select("pincode").eq("role", "donor").execute()
        requests_res = supabase.table("blood_requests").select("pincode").execute()
        
        heatmap = {}
        # Count donors
        for d in donors_res.data:
            p = d["pincode"]
            if p not in heatmap: heatmap[p] = {"donors": 0, "requests": 0}
            heatmap[p]["donors"] += 1
            
        # Count requests
        for r in requests_res.data:
            p = r["pincode"]
            if p not in heatmap: heatmap[p] = {"donors": 0, "requests": 0}
            heatmap[p]["requests"] += 1
            
        return heatmap
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/cron/cleanup")
def cleanup_old_requests():
    """Vercel cron endpoint: deletes blood requests older than 24 hours."""
    try:
        yesterday = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        res = supabase.table("blood_requests").delete().lt("created_at", yesterday).execute()
        return {"message": "Cleanup complete", "deleted_count": len(res.data) if res.data else 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cron/ping-supabase")
def ping_supabase():
    """Vercel cron endpoint: pings Supabase to prevent the free tier project from pausing due to inactivity."""
    try:
        # A simple query that is fast but registers as activity
        res = supabase.table("users").select("id").limit(1).execute()
        return {"message": "Ping successful, Supabase is awake!", "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/check-eligibility")
def check_eligibility(current_user = Depends(get_current_user)):
    """Check if donor cooldown is over."""
    try:
        user_res = supabase.table("users").select("role, last_donation_date").eq("id", current_user.id).execute()
        if not user_res.data or user_res.data[0]["role"] != "donor":
            return {"eligible": False, "message": "Not a donor."}
            
        last_donation = user_res.data[0].get("last_donation_date")
        if not last_donation:
            return {"eligible": True, "message": "You're a Hero (First time donor)"}
            
        days_since = (date.today() - date.fromisoformat(last_donation)).days
        if days_since < 0:
            days_since = 0 # Handle timezone differences (e.g., IST vs UTC)
            
        if days_since >= 90:
            return {"eligible": True, "message": "You're a Hero Again! You are eligible to donate."}
        else:
            return {"eligible": False, "message": f"Not eligible yet. Please wait {90 - days_since} more days."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Welcome to Project RedLink API - Phase 3 Complete"}

@app.patch("/users/fcm-token")
def update_fcm_token(fcm_token: str = Body(..., embed=True), current_user = Depends(get_current_user)):
    """Saves the user's Firebase Cloud Messaging token to Supabase for push notifications."""
    try:
        supabase.table("users").update({"fcm_token": fcm_token}).eq("id", current_user.id).execute()
        return {"message": "FCM token updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
