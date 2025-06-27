import React, { useState } from "react";

export default function Chatbot() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setAnswer(data.answer);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", padding: 16, background: "#222", borderRadius: 8 }}>
      <h2>Supply Chain Chatbot</h2>
      <textarea
        value={question}
        onChange={e => setQuestion(e.target.value)}
        rows={3}
        style={{ width: "100%" }}
        placeholder="Ask a supply chain question..."
      />
      <button onClick={askQuestion} disabled={loading || !question} style={{ marginTop: 8 }}>
        {loading ? "Thinking..." : "Ask"}
      </button>
      {answer && (
  <div
    style={{
      marginTop: 16,
      background: "#333",
      padding: 12,
      borderRadius: 4,
      maxHeight: 300,         // Set a max height (in px)
      overflowY: "auto",      // Enable vertical scrolling
      whiteSpace: "pre-wrap", // Preserve line breaks
    }}
  >
    <strong>Answer:</strong>
    <div>{answer}</div>
  </div>
)}
    </div>
  );
}