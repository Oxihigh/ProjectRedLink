import asyncio
from unittest.mock import MagicMock, patch

# Patch os.environ before importing sms_alert so that it doesn't fail on missing vars
with patch.dict('os.environ', {
    'SUPABASE_URL': 'https://mock.supabase.co',
    'SUPABASE_KEY': 'mock_key',
    'TWILIO_ACCOUNT_SID': 'mock_sid',
    'TWILIO_AUTH_TOKEN': 'mock_token',
    'TWILIO_PHONE_NUMBER': '+1234567890',
    'BASE_URL': 'https://test.com'
}):
    from api import sms_alert

async def main():
    print("\n--- Testing Project Red Link Webhook Cascading Alert ---")
    
    # 1. Mock Supabase
    mock_supabase = MagicMock()
    sms_alert.supabase = mock_supabase
    
    # We use a simple list to simulate the pending call queue
    pending_queue = []
    
    # Mocking the tables
    def mock_table(table_name):
        mock_tbl = MagicMock()
        if table_name == "users":
            mock_execute = MagicMock()
            # 7 donors with varying pincodes to test sorting (Target: 110001)
            mock_execute.execute.return_value = MagicMock(data=[
                {"phone_number": "+910000000001", "pincode": 110010}, # diff 9
                {"phone_number": "+910000000002", "pincode": 110005}, # diff 4
                {"phone_number": "+910000000003", "pincode": 110001}, # diff 0 (Closest)
                {"phone_number": "+910000000004", "pincode": 110002}, # diff 1
                {"phone_number": "+910000000005", "pincode": 110020}, # diff 19
                {"phone_number": "+910000000006", "pincode": 110003}, # diff 2
                {"phone_number": "+910000000007", "pincode": 110050}, # diff 49
            ])
            mock_tbl.select.return_value.eq.return_value.eq.return_value.or_.return_value = mock_execute
        
        elif table_name == "blood_requests":
            mock_req_execute = MagicMock()
            # Mock that the request is still active and has data
            mock_req_execute.execute.return_value = MagicMock(data=[
                {"id": "req-123", "blood_group": "O+", "pincode": 110001}
            ])
            mock_tbl.select.return_value.eq.return_value = mock_req_execute
            
        elif table_name == "call_queue":
            # Mock insert
            def mock_insert(data):
                nonlocal pending_queue
                # Simulated insertion
                for item in data:
                    pending_queue.append({"id": f"q_{len(pending_queue)}", "phone_number": item["phone_number"]})
                return MagicMock(execute=MagicMock())
            mock_tbl.insert = mock_insert
            
            # Mock select pending
            def mock_select_execute():
                nonlocal pending_queue
                # We return the next item(s). If limit is 5, we pop 5. If limit is 1, we pop 1.
                # In the real code, `.limit(count)` is used. We'll simplify the mock here by hacking the chain.
                return MagicMock(data=pending_queue)
            
            # Create a mock chain that eventually returns `mock_select_execute`
            chain = MagicMock()
            chain.eq.return_value = chain
            chain.order.return_value = chain
            
            # When `.limit(count)` is called, we intercept the count
            def limit_mock(count):
                nonlocal pending_queue
                # Return exactly `count` items from our queue (and pop them for simulation)
                returned_items = pending_queue[:count]
                pending_queue = pending_queue[count:]
                return MagicMock(execute=lambda: MagicMock(data=returned_items))
                
            chain.limit = limit_mock
            mock_tbl.select.return_value = chain
            
            # Mock update (status changes)
            mock_tbl.update.return_value = chain
            
        return mock_tbl
        
    mock_supabase.table.side_effect = mock_table
    
    # Mock the rate-limiting logic (can_make_call) - let everyone pass
    sms_alert.can_make_call = MagicMock(return_value=True)
    
    # Mock Twilio Voice Calling
    async def mock_send_voice_call_async(num, msg, req_id):
        print(f"[Mock Twilio] Initiating Voice Call to {num} (Webhook set for {req_id})")
        return True
    sms_alert.send_voice_call_async = MagicMock(side_effect=mock_send_voice_call_async)
    
    # Mock log_call_made
    sms_alert.log_call_made = MagicMock()
    
    print("\nTriggering INITIAL alert for Request: req-123 (First 5 batches)")
    print("-" * 50)
    await sms_alert.trigger_urgent_blood_alert("req-123", 110001, "O+")
    
    print("\nSimulating Twilio Webhook -> Call Disconnected for +910000000003 (The closest donor)")
    print("-" * 50)
    await sms_alert.handle_call_disconnect("req-123", "+910000000003")
    
    print("\nSimulating Twilio Webhook -> Call Disconnected for +910000000004")
    print("-" * 50)
    await sms_alert.handle_call_disconnect("req-123", "+910000000004")
        
    print("\n--- Test Completed ---\n")

if __name__ == "__main__":
    asyncio.run(main())
