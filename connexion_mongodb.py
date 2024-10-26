from pymongo.mongo_client import MongoClient, InsertOne
from pymongo.server_api import ServerApi

uri = "mongodb+srv://projet_ux:projet_ux_mdp@cluster0.efl1l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

# Create a new client and connect to the server
client = MongoClient(uri, server_api=ServerApi('1'))

# Connect to database and add json files to collection
try : 
    database = client["WASABI"]
    collection = database["wasabi_collection"]
except Exception as e:
    print("Erreur")
    print(e)
