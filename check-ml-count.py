import pickle

data = pickle.load(open("/home/ubuntu/ssabiroad/ml-models/faiss_index/metadata.pkl", "rb"))
print(f"Total trained: {len(data)} images")

nga = [d for d in data if d.get("address") and "nigeria" in d.get("address", "").lower()]
print(f"Nigerian images: {len(nga)}")

if nga:
    print("\nLast 5 Nigerian entries:")
    for d in nga[-5:]:
        print(f"  - {d.get('address', 'No address')}")
else:
    print("\nNo Nigerian images found. Sample addresses:")
    for d in data[:5]:
        print(f"  - {d.get('address', 'No address')}")
