import React, { useEffect, useState } from "react";

function App() {
  const [emails, setEmails] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/emails", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setEmails(data.emails || []))
      .catch((err) => console.error(err));
  }, []);

  const filteredEmails = emails.filter(
    (mail) =>
      mail.subject?.toLowerCase().includes(search.toLowerCase()) ||
      mail.from?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>📬 Pryoport Dashboard</h1>

      <input
        type="text"
        placeholder="Search emails..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "10px",
          width: "100%",
          marginBottom: "20px",
        }}
      />

      <button
        onClick={() =>
          (window.location.href = "http://127.0.0.1:8000/auth/google")
        }
        style={{ marginBottom: "20px", padding: "10px 20px" }}
      >
        Login with Google
      </button>

      {filteredEmails.map((mail, idx) => (
        <div
          key={idx}
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "10px",
          }}
        >
          <h3>{mail.subject}</h3>
          <p><strong>From:</strong> {mail.from}</p>
          <p>{mail.snippet}</p>
        </div>
      ))}
    </div>
  );
}

export default App;