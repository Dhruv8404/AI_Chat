// === AiChat.jsx ===
import React, { useState, useEffect, useRef } from "react";
import "./AiChat.css";

const AiChat = () => {
  const [input, setInput] = useState("");
  const [livePrompt, setLivePrompt] = useState("");
  const [chatSessions, setChatSessions] = useState({});
  const [chatHistory, setChatHistory] = useState([]);
  const [viewedChatId, setViewedChatId] = useState(null);

  const userId = "falgu123";
  const streamChatIdRef = useRef(null);
  const bottomRef = useRef(null);
  const aiTextRef = useRef(""); // To store streaming AI text

  // Fetch chat history on component mount
  useEffect(() => {
    fetch(`http://localhost:8000/api/ollama-history/${userId}/`)
      .then(res => res.json())
      .then(data => {
        console.log("Chat history data:", data); // For debugging
        setChatHistory(data.history || []);
      })
      .catch(err => console.error("History error:", err));
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const prompt = input.trim();
    const chatId = `chat-${Date.now()}`;

    streamChatIdRef.current = chatId;
    setViewedChatId(chatId);
    setLivePrompt(prompt);
    setInput("");

    // Initialize chat session
    setChatSessions(prev => ({
      ...prev,
      [chatId]: {
        messages: [{ from: "user", text: prompt }, { from: "ai", text: "" }],
        typingText: "",
        prompt,
      },
    }));

    try {
      const res = await fetch("http://localhost:8000/api/ollama-chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, user_id: userId }),
      });

      if (!res.ok || !res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      aiTextRef.current = ""; // Reset before streaming

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiTextRef.current += chunk;

        setChatSessions(prev => {
          const current = prev[chatId];
          if (!current) return prev;
          return {
            ...prev,
            [chatId]: { ...current, typingText: aiTextRef.current },
          };
        });
      }

      // Finalize message after streaming
      setChatSessions(prev => {
        const current = prev[chatId];
        if (!current) return prev;
        return {
          ...prev,
          [chatId]: {
            ...current,
            messages: [
              { from: "user", text: prompt },
              { from: "ai", text: aiTextRef.current },
            ],
            typingText: "",
          },
        };
      });

      streamChatIdRef.current = null;
      setLivePrompt("");

      // Refresh chat history
      const historyRes = await fetch(`http://localhost:8000/api/ollama-history/${userId}/`);
      const data = await historyRes.json();
      setChatHistory(data.history || []);
    } catch (err) {
      console.error("Streaming error:", err);
      setChatSessions(prev => ({
        ...prev,
        [chatId]: {
          messages: [
            { from: "user", text: prompt },
            { from: "ai", text: "\u274c Failed to connect to AI." },
          ],
          typingText: "",
        },
      }));
      streamChatIdRef.current = null;
      setLivePrompt("");
    }
  };

  const handleHistoryClick = (chat, index) => {
    const chatId = `history-${index}`;
    setViewedChatId(chatId);
    setChatSessions(prev => ({
      ...prev,
      [chatId]: {
        messages: [
          { from: "user", text: chat.prompt || "" },
          { from: "ai", text: chat.response || "" },
        ],
        typingText: "",
      },
    }));
  };

  const handleNewChat = () => {
    const chatId = `chat-${Date.now()}`;
    setViewedChatId(chatId);
    streamChatIdRef.current = null;
    setChatSessions(prev => ({
      ...prev,
      [chatId]: { messages: [], typingText: "" },
    }));
  };

  const renderFormattedText = (text) => {
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const elements = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = codeRegex.exec(text)) !== null) {
      const [full, lang, code] = match;
      const start = match.index;

      if (start > lastIndex) {
        elements.push(<p key={key++}>{text.slice(lastIndex, start)}</p>);
      }

      elements.push(
        <div className="code-block" key={key++}>
          <pre><code className={`language-${lang || 'plaintext'}`}>{code}</code></pre>
          <button className="copy-button" onClick={() => navigator.clipboard.writeText(code)}>📋 Copy</button>
        </div>
      );

      lastIndex = start + full.length;
    }

    if (lastIndex < text.length) {
      elements.push(<p key={key++}>{text.slice(lastIndex)}</p>);
    }

    return elements;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatSessions, viewedChatId]);

  const currentSession = chatSessions[viewedChatId] || { messages: [], typingText: "" };

  return (
    <div className="chat-container">
      <aside className="sidebar">
        <h2>🤖 AI Chat</h2>
        <button className="new-chat-btn" onClick={handleNewChat}>+ New Chat</button>
        <div className="recent-chats">
          <p>Recent Chats</p>
          {chatHistory.length === 0 ? (
            <p>No history found</p>
          ) : (
            <ul>
              {chatHistory.slice().reverse().map((chat, index) => (
                <li key={index} onClick={() => handleHistoryClick(chat, index)}>
                  {chat.prompt ? chat.prompt.slice(0, 30) : "No prompt"}...
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <main className="chat-main">
        <div className="chat-messages">
          {currentSession.messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.from === "ai" ? "ai" : "user"}`}>
              {msg.from === "ai" ? renderFormattedText(msg.text) : <p>{msg.text}</p>}
            </div>
          ))}

          {currentSession.typingText && (
            <div className="chat-bubble ai typing">
              {renderFormattedText(currentSession.typingText)}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!!currentSession.typingText}
          />
          <button onClick={handleSend} disabled={!!currentSession.typingText}>Send</button>
        </div>

        {livePrompt && (
          <div className="live-prompt-preview">
            <p>📥 Prompt Sent: <strong>{livePrompt}</strong></p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AiChat;