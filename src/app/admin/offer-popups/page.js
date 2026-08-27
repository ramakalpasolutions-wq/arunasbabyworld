"use client";

import { useState, useEffect } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import styles from "./page.module.css";

export default function OfferPopupsPage() {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    imageUrl: "",
    link: "",
    active: true,
    sortOrder: 0,
  });
  const [uploading, setUploading] = useState(false);

  const fetchPopups = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch("/api/offer-popups");
      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setPopups(data);
      } else {
        setPopups([]);
        setErrorMsg(data.error || "Failed to load offer popups.");
      }
    } catch (err) {
      console.error("Error loading popups:", err);
      setPopups([]);
      setErrorMsg("Network error loading popups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPopups();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "offer-popups");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        alert("Image upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/offer-popups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setForm({ title: "", imageUrl: "", link: "", active: true, sortOrder: 0 });
      setShowForm(false);
      fetchPopups();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to create popup");
    }
  };

  const toggleActive = async (popup) => {
    await fetch("/api/offer-popups", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: popup.id, active: !popup.active }),
    });
    fetchPopups();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this popup?")) return;
    await fetch(`/api/offer-popups?id=${id}`, { method: "DELETE" });
    fetchPopups();
  };

  return (
    <AdminGuard>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Offer Popups</h1>
          <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "+ Add Popup"}
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: "#ffebee", color: "#c62828", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {showForm && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <input
              placeholder="Title (e.g. Summer Sale 50% Off)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <div className={styles.uploadRow}>
              <label className={styles.uploadLabel}>
                {uploading ? "Uploading..." : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  hidden
                />
              </label>
              {form.imageUrl && (
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className={styles.preview}
                />
              )}
            </div>

            <input
              placeholder="Redirect link (optional, e.g. /products)"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
            />

            <div className={styles.row}>
              <label>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Active
              </label>
              <input
                type="number"
                placeholder="Sort Order"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                }
                style={{ width: 100 }}
              />
            </div>

            <button type="submit" className={styles.saveBtn} disabled={uploading || !form.imageUrl}>
              Save Popup
            </button>
          </form>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : !popups || popups.length === 0 ? (
          <p className={styles.empty}>No offer popups yet.</p>
        ) : (
          <div className={styles.grid}>
            {popups.map((popup) => (
              <div
                key={popup.id}
                className={`${styles.card} ${!popup.active ? styles.inactive : ""}`}
              >
                <img src={popup.imageUrl} alt={popup.title} />
                <div className={styles.cardInfo}>
                  <h3>{popup.title}</h3>
                  <span className={popup.active ? styles.badgeActive : styles.badgeInactive}>
                    {popup.active ? "Active" : "Inactive"}
                  </span>
                  <div className={styles.actions}>
                    <button onClick={() => toggleActive(popup)}>
                      {popup.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(popup.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminGuard>
  );
}