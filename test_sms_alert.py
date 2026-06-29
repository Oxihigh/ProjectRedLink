import asyncio
from unittest.mock import MagicMock, patch

# Patch os.environ before importing sms_alert so that it doesn't fail on missing vars
with patch.dict('os.environ', {
    'SUPABASE_URL': 'https://mock.supabase.co',
    'SUPABASE_KEY': 'mock_key',
    'TWILIO_ACCOUNT_SID': 'mock_sid',
    'TWILIO_AUTH_TOKEN': 'mock_token',
    'TWILIO_PHONE_NUMBER': '+1234567890'
}):
    from api import sms_alert

async def main():
    print("\n--- Testing Project Red Link SMS Alert ---")
    
    # 1. Mock Supabase
    mock_supabase = MagicMock()
    sms_alert.supabase = mock_supabase
    
    # Mocking the `users` table response for donors
    mock_table = MagicMock()
    mock_supabase.table.return_value = mock_table
    
    # Mock chain for `.select().eq().eq().eq().or_().execute()`
    mock_execute = MagicMock()
    # Let's say it finds two donors matching pincode and blood group
    mock_execute.execute.return_value = MagicMock(data=[
        {"phone_number": "+919876543210"},
        {"phone_number": "+919999999999"}
    ])
    
    # Setup the chain to return mock_execute at the end
    mock_table.select.return_value.eq.return_value.eq.return_value.eq.return_value.or_.return_value = mock_execute
    
    # Mock the rate-limiting logic (can_send_sms)
    original_can_send = sms_alert.can_send_sms
    def mock_can_send_sms(phone):
        if phone == "+919876543210":
            print(f"[Mock DB] Rate limit check for {phone}: FAILED (already contacted within 24h)")
            return False
        print(f"[Mock DB] Rate limit check for {phone}: PASSED")
        return True
    
    sms_alert.can_send_sms = MagicMock(side_effect=mock_can_send_sms)
    
    # Mock Twilio SMS Sending (send_sms_async)
    async def mock_send_sms_async(num, msg):
        print(f"[Mock Twilio] Sending SMS to {num}:\n  Message: '{msg}'")
        return True
        
    sms_alert.send_sms_async = MagicMock(side_effect=mock_send_sms_async)
    
    # Mock log_sms_sent
    sms_alert.log_sms_sent = MagicMock(side_effect=lambda num: print(f"[Mock DB] Logged successful SMS sent to {num}"))
    
    print("\nTriggering alert for Pincode: 110001, Blood Group: O+")
    print("-" * 50)
    await sms_alert.trigger_urgent_blood_alert(110001, "O+")
    print("-" * 50)
    print("--- Test Completed ---\n")

if __name__ == "__main__":
    asyncio.run(main())
