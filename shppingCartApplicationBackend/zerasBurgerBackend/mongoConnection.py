import pymongo
import os
from dotenv import load_dotenv


load_dotenv()
# print("env loaded MONGO_URI =", os.getenv("MONGO_URI"))

# MONGO_URL = os.getenv("MONGO_URI")
# client = pymongo.MongoClient(MONGO_URL)
# db = client['shopCart']
# print("✅ MongoDB connected successfully!")

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError(" MONGO_URI not found in .env file!")

try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client['shopCart']
    client.server_info()
    if os.environ.get('RUN_MAIN') == 'true':
        print(" MongoDB connected successfully to shopCart database!")
    
except pymongo.errors.ConnectionFailure as e:
    print(f" MongoDB connection failed: {e}")
    raise
except Exception as e:
    print(f" Error connecting to MongoDB: {e}")
    raise

__all__ = ['client', 'db', 'MONGO_URI']



