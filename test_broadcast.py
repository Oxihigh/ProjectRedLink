import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

from api.fcm_alert import broadcast_fcm_alert
import logging

logging.basicConfig(level=logging.INFO)

async def main():
    print("Triggering broadcast...")
    await broadcast_fcm_alert("test-req-123", 500032, "A+")

asyncio.run(main())
