FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++ libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py geolocation_model.py architectural_matcher.py enhanced_ocr.py ./
RUN python -c "from enhanced_ocr import EnhancedOCR; o=EnhancedOCR(); assert o.extract_addresses('123 Main Street') == ['123 Main Street']; assert o.extract_phone_numbers('(555) 123-4567') == ['(555) 123-4567']"

ENV PORT=8080

CMD exec uvicorn app:app --host 0.0.0.0 --port ${PORT} --workers 1
