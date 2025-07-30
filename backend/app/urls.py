from .views import  OllamaChatView, ChatHistoryView, chat_history_page, chat_detail_page
from django.urls import path

urlpatterns = [
    path('ollama-chat/', OllamaChatView.as_view()),
    path('ollama-history/<str:user_id>/', ChatHistoryView.as_view()),
    path('chat-ui-history/<str:user_id>/', chat_history_page),
    path('chat-ui-detail/<str:chat_id>/', chat_detail_page),  # 👈 ADD THIS
]
