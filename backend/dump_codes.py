import os
import sys
import firebase_admin
from firebase_admin import firestore

sys.path.append('E:/APP E TEASER/new/NeuroLens-v2/NeuroLens-v2/backend')
os.chdir('E:/APP E TEASER/new/NeuroLens-v2/NeuroLens-v2/backend')

from dotenv import load_dotenv
load_dotenv()

# Initialize Firebase (it might use fallback logic)
try:
    firebase_admin.initialize_app()
except ValueError:
    pass

db = firestore.client()
docs = db.collection("email_verification_codes").get()

print(f"Found {len(docs)} verification documents:")
for doc in docs:
    d = doc.to_dict()
    print("---------------------------------")
    print(f"UID: {d.get('uid')}")
    print(f"Email: {d.get('email')}")
    print(f"Code: {repr(d.get('code'))}")
    print(f"Verified: {d.get('verified')}")
    
    # Check expires_at
    expires_at = d.get('expires_at')
    print(f"Expires: {expires_at} (type: {type(expires_at)})")
    if hasattr(expires_at, 'timestamp'):
        print(f"  timestamp(): {expires_at.timestamp()}")
