"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { askAI, getConversationHistory } from "@/lib/actions/ai";

export function AIAssistant() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string; timestamp: Date }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadHistory() {
    try {
      const history = await getConversationHistory(20);
      setMessages(
        history.reverse().map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt,
        }))
      );
    } catch (error) {
      console.error("Failed to load conversation history:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: new Date() },
    ]);
    setLoading(true);

    try {
      const response = await askAI(userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response, timestamp: new Date() },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "I'm sorry, I encountered an error. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)]">
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg mb-2">Ask me anything about your trading performance!</p>
              <p className="text-sm">Try questions like:</p>
              <ul className="text-sm mt-2 space-y-1">
                <li>"What patterns are hurting my performance?"</li>
                <li>"Which goals am I breaking?"</li>
                <li>"What days or times should I avoid trading?"</li>
                <li>"What should I focus on this week?"</li>
              </ul>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your trading..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

