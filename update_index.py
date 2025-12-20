import json
from pathlib import Path
from PIL import Image
import sys
sys.path.insert(0, '/home/ubuntu/ssabiroad/ml-models')
from utils.clip_faiss import CLIPFAISSRetriever

retriever = CLIPFAISSRetriever()
retriever.load('faiss_index')
print(f'Loaded index with {retriever.index.ntotal} entries')
batch = Path('/home/ubuntu/ssabiroad/ml-models/data/active_learning/batch_20251220_092609/train')
added = 0

for jf in batch.glob('*.json'):
    img = jf.with_suffix('.jpg')
    if not img.exists(): continue
    meta = json.load(open(jf))
    if not meta.get('latitude'): continue
    retriever.add_to_index(Image.open(img).convert('RGB'), {'latitude': meta['latitude'], 'longitude': meta['longitude'], 'address': meta.get('address','')})
    added += 1

retriever.save('faiss_index')
print(f'Added {added}, Total: {retriever.index.ntotal}')
