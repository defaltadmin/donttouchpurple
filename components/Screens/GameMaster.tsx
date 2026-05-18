import React, { useState, useRef, useEffect } from "react";
import { logger } from "../../utils/logger";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function GameMaster({ onBack }: { onBack: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Greetings, player. I am the Game Master. Ask me anything about the patterns, difficulty, or how to avoid the purple cells." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8787", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error("Failed to reach Game Master");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        assistantContent += decoder.decode(value);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = assistantContent;
          return updated;
        });
      }
    } catch (err) {
      logger.error("AI Error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Could not connect to the void." }]);
    } finally {
      setIsLoading(true); // Artificial delay or just state management
      setIsLoading(false);
    }
  };

  return (
    <div className="game-over gamemaster-screen" style={{ zIndex: 1000 }}>
      <div className="game-over__content">
        <h1 className="game-over__title">Game Master</h1>
        
        <div 
          ref={scrollRef}
          className="gamemaster-chat"
          style={{
            maxHeight: '40vh',
            overflowY: 'auto',
            textAlign: 'left',
            padding: '1rem',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}
        >
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: '0.8rem', color: m.role === 'user' ? '#fff' : '#bb86fc' }}>
              <strong>{m.role === 'user' ? 'You: ' : 'GM: '}</strong>
              {m.content}
            </div>
          ))}
          {isLoading && <div style={{ color: '#666' }}>GM is thinking...</div>}
        </div>

        <div className="gamemaster-input-row" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask for advice..."
            style={{
              flex: 1,
              padding: '0.8rem',
              borderRadius: '8px',
              border: '1px solid #333',
              background: '#111',
              color: '#fff'
            }}
          />
          <button 
            className="go-btn go-btn--primary" 
            onClick={handleSend}
            disabled={isLoading}
            style={{ padding: '0.8rem 1.5rem', minWidth: 'auto' }}
          >
            Send
          </button>
        </div>

        <div className="game-over__actions">
          <button className="go-btn go-btn--secondary" onClick={onBack}>
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
