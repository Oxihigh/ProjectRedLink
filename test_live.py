import os
import sys
import asyncio
import uuid
from dotenv import load_dotenv

load_dotenv()

from api.sms_alert import supabase, twilio_client, trigger_urgent_blood_alert

async def main():
    if not supabase or not twilio_client:
        print("Missing Supabase or Twilio credentials in .env")
        return
        
    test_phone = "+917975590933"
    print(f"--- Running REAL End-to-End Test ---")
    print(f"Target Phone Number: {test_phone}")
    
    # 1. Create a dummy user in auth.users
    try:
        user_res = supabase.auth.admin.create_user({
            "email": f"test_{uuid.uuid4().hex[:6]}@example.com",
            "password": "Password123!",
            "email_confirm": True
        })
        dummy_user_id = user_res.user.id
        print(f"Created Auth User: {dummy_user_id}")
    except Exception as e:
        print(f"Failed to create auth user: {e}")
        return

    # 2. Insert into public.users
    try:
        supabase.table("users").insert({
            "id": dummy_user_id,
            "name": "Live Test Donor",
            "role": "donor",
            "blood_group": "AB+",
            "pincode": 999999,
            "phone_number": test_phone
        }).execute()
        print("Inserted into public.users")
    except Exception as e:
        print(f"Failed to insert into public.users: {e}")
        return

    # 3. Create a dummy blood request
    try:
        req_res = supabase.table("blood_requests").insert({
            "requester_id": "live-test-ip",
            "blood_group": "AB+",
            "pincode": 999999,
            "hospital_name": "Test Hospital",
            "phone_number": "+910000000000",
            "success_token": "TESTOK"
        }).execute()
        req_id = req_res.data[0]["id"]
        print(f"Created blood request: {req_id}")
    except Exception as e:
        print(f"Failed to create blood request: {e}")
        return

    # 4. Trigger alert
    print("Triggering the cascading alert...")
    await trigger_urgent_blood_alert(req_id, 999999, "AB+")
    print("Process finished! Check your phone!")
    
    # Clean up
    print("Cleaning up dummy data...")
    supabase.auth.admin.delete_user(dummy_user_id)

if __name__ == "__main__":
    asyncio.run(main())
