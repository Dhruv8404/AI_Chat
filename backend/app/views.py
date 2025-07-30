import json
import requests
import uuid
import datetime
from django.http import StreamingHttpResponse
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from pymongo import MongoClient
from django.shortcuts import render, get_object_or_404
from django.http import StreamingHttpResponse, HttpResponse

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["ollama_chat"]
chat_collection = db["chats"]

class OllamaChatView(APIView):
    def post(self, request):
        prompt = request.data.get("prompt", "").strip()
        user_id = request.data.get("user_id", "anonymous")
        model = request.data.get("model", "mistral")
        chat_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow()
        full_response = []

        def stream_response_and_collect():
            try:
                resp = requests.post(
                    "http://localhost:11434/api/generate",
                    json={"model": model, "prompt": prompt, "stream": True},
                    stream=True,
                    headers={"Content-Type": "application/json"},
                )
                for line in resp.iter_lines():
                    if line:
                        try:
                            data = json.loads(line.decode("utf-8"))
                            content = data.get("response", "")
                            full_response.append(content)
                            yield content
                        except:
                            yield "\n[Error parsing response line]"
            except Exception as e:
                yield f"\n[Error connecting: {str(e)}]"
            finally:
                # Save initial prompt + full AI response to MongoDB
                try:
                    chat_collection.insert_one({
                        "_id": chat_id,
                        "user_id": user_id,
                        "model": model,
                        "prompt": prompt,
                        "response": "".join(full_response),
                        "timestamp": timestamp
                    })
                except Exception as e:
                    print("MongoDB Error:", e)

        response = StreamingHttpResponse(
            stream_response_and_collect(), content_type="text/plain"
        )
        response["X-Chat-ID"] = chat_id
        return response

class ChatHistoryView(APIView):
    def get(self, request, user_id):
        chats = list(chat_collection.find({"user_id": user_id}, {"_id": 0}))
        return Response({"history": chats})

def chat_history_page(request, user_id):
    chats = list(chat_collection.find({"user_id": user_id}))
    return render(request, 'chat_history.html', {"history": chats})

def chat_detail_page(request, chat_id):
    chat = chat_collection.find_one({"_id": chat_id})
    if not chat:
        return render(request, 'not_found.html', status=404)
    return render(request, 'chat_detail.html', {"chat": chat})
