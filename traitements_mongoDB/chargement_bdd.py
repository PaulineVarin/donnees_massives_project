from pymongo.mongo_client import MongoClient
from pymongo import MongoClient
import os 
import json

client = MongoClient('localhost', 27017)
database = client["UX_Projet"]
collection = database["wasabi"]

directory = os.fsencode("C:/Users/PaulineVarin/Documents/MIAGE/M2/cours/informatique/ux_donnees_massives/projet/bdd_brute/")
try : 
    for file in os.listdir(directory):
        filename = os.fsdecode(file)
        chemin_complet = "C:/Users/PaulineVarin/Documents/MIAGE/M2/cours/informatique/ux_donnees_massives/projet/bdd_brute/" + filename
        with open(chemin_complet)as f:
            for jsonObj in f:
                print("Fichier" + filename)
                myDict = json.loads(jsonObj)
                collection.insert_many(myDict)
except Exception as e:
    print("Erreur")
    print(e)

