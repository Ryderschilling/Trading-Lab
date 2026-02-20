"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { askAI, getConversationHistory } from "@/lib/actions/ai";

type ChatMessage = { role: string; content: string; timestamp: Date };

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadHistory() {
    try {
      const history = await getConversationHistory(20);
      setMessages(
        history.reverse().map((msg: { role: string; content: string; createdAt: Date }) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt,
        }))
      );
    } catch (error) {
      console.error("Failed to load conversation history:", error);
    }
  }

  async function sendMessage(messageText: string) {
    const trimmed = messageText.trim();
    if (!trimmed || loading) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: trimmed, timestamp: new Date() },
    ]);
    setLoading(true);

    try {
      const response = await askAI(trimmed);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response, timestamp: new Date() },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "I'm sorry, I encountered an error. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errorMessage, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="relative">
      {/* Chat panel (messages only) */}
      <Card className="flex flex-col h-[calc(100vh-280px)]">
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-28">
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
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
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
        </CardContent>
      </Card>

      {/* Sticky footer input (AI page only because this component is only used there) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-6 py-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter to send, Shift+Enter for newline
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!loading && input.trim()) void sendMessage(input);
                }
              }}
              placeholder="Ask me anything about your trading..."
              disabled={loading}
              className="min-h-[44px] max-h-40 resize-none"
            />
            <Button type="submit" disabled={loading || !input.trim()} className="h-[44px]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Press Enter to send • Shift+Enter for a new line
          </p>
        </div>
      </div>
    </div>
  );
}

