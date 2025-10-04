import React, { useState } from 'react';
import '../styles/StaticPages.css';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you could post the message to an API
    setSent(true);
  }

  return (
    <div className="static-page container">
      <div className="hero">
        <h1>Contact</h1>
        <p>Nous sommes là pour vous aider. Envoyez-nous un message et nous vous répondrons rapidement.</p>
      </div>

      {!sent ? (
        <form className="contact-form" onSubmit={handleSubmit}>
          <label>Nom</label>
          <input name="name" value={form.name} onChange={handleChange} required />
          <label>Email</label>
          <input name="email" value={form.email} onChange={handleChange} type="email" required />
          <label>Message</label>
          <textarea name="message" value={form.message} onChange={handleChange} required />
          <button type="submit">Envoyer</button>
        </form>
      ) : (
        <div className="sent">Merci, votre message a été envoyé.</div>
      )}
    </div>
  );
}

export default Contact;
