import os
import json
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, messaging

load_dotenv()

FIREBASE_SERVICE_ACCOUNT = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
cert_dict = json.loads(FIREBASE_SERVICE_ACCOUNT)
cred = credentials.Certificate(cert_dict)
firebase_admin.initialize_app(cred)

# The token from DB
token = 'fIXCLMsRd1KoO4D8iYq3Uy:APA91bExxfL5mu0MOeWVTe8Dc12O2oDGtOjLEZkzbSkQXge48xdzCskFwErE53XxTYXhQhuCMcntvEhGeUnRyCCA6LoRIsHWN-zHSpHgT-c3hhS5uwU7aLU'

message = messaging.Message(
    notification=messaging.Notification(
        title="Test Notification",
        body="This is a test to see if notifications work.",
    ),
    data={"request_id": "test", "url": "/"},
    token=token
)

try:
    response = messaging.send(message)
    print("Successfully sent message:", response)
except Exception as e:
    print("Error sending message:", e)
