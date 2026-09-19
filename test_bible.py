import urllib.request
import json

try:
    en_url = "https://raw.githubusercontent.com/godlytalias/Bible-Database/master/English%20(KJV)/bible.json"
    req = urllib.request.Request(en_url, headers={'User-Agent': 'Mozilla/5.0'})
    en_data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print("English JSON fetched. Books:", len(en_data))
    print("Example:", en_data[0]['BookName'])
except Exception as e:
    print("Error English:", e)

try:
    te_url = "https://raw.githubusercontent.com/godlytalias/Bible-Database/master/Telugu/bible.json"
    req = urllib.request.Request(te_url, headers={'User-Agent': 'Mozilla/5.0'})
    te_data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print("Telugu JSON fetched. Books:", len(te_data))
    print("Example:", te_data[0]['BookName'])
except Exception as e:
    print("Error Telugu:", e)
