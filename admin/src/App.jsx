import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { api, formatINR, getToken, setToken } from "./api";
import { enableAdminPush } from "./push";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "orders", label: "Orders" },
  { id: "users", label: "Customers" },
  { id: "dealers", label: "Dealers" },
  { id: "services", label: "Services" },
  { id: "push", label: "Notifications" },
  { id: "ai", label: "AI Posts" },
];

const ORDER_STATUSES = ["placed", "confirmed", "shipped", "out-for-delivery", "delivered", "cancelled"];

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@aquanest.in");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/admin/login", {
        method: "POST",
        body: { email, password },
        token: "",
      });
      setToken(data.token);
      onLogin(data.admin);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <h1 className="brand">AquaNest</h1>
        <p className="sub">Admin panel — separate credentials from the mobile app.</p>
        {error ? <div className="error">{error}</div> : null}
        <label htmlFor="email">Admin email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Signing in…" : "Sign in to admin"}
        </button>
      </form>
    </div>
  );
}

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

function Dashboard({ admin, onLogout }) {
  const [tab, setTab] = useState("overview");
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editOrder, setEditOrder] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editDealer, setEditDealer] = useState(null);
  const [pushForm, setPushForm] = useState({ title: "AquaNest update", body: "" });
  const [aiPosts, setAiPosts] = useState([]);
  const [aiMeta, setAiMeta] = useState(null);

  async function refresh() {
    setError("");
    try {
      const [s, o, u, b, ai] = await Promise.all([
        api("/api/admin/summary"),
        api("/api/admin/orders"),
        api("/api/admin/users"),
        api("/api/admin/bookings"),
        api("/api/admin/ai-posts").catch(() => ({ posts: [], ai: null })),
      ]);
      setSummary(s);
      setOrders(o);
      setUsers(u);
      setBookings(b);
      setAiPosts(ai.posts || []);
      setAiMeta(ai.ai || null);
    } catch (err) {
      setError(err.message || "Failed to load");
      if (/admin|token|sign in/i.test(err.message || "")) {
        onLogout();
      }
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const dealers = useMemo(
    () => users.filter((u) => u.dealer?.status && u.dealer.status !== "none"),
    [users],
  );

  function flash(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(""), 2800);
  }

  async function reviewDealer(userId, action) {
    setBusyId(`${userId}-${action}`);
    try {
      await api(`/api/admin/dealers/${userId}/${action}`, { method: "POST" });
      flash(action === "approve" ? "Dealer approved · email sent" : "Dealer rejected · email sent");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function saveOrder(e) {
    e.preventDefault();
    setBusyId(`order-${editOrder.id}`);
    try {
      await api(`/api/admin/orders/${editOrder.id}`, {
        method: "PATCH",
        body: {
          paymentRef: editOrder.paymentRef,
          paymentMethod: editOrder.paymentMethod,
          adminStatus: editOrder.adminStatus || editOrder.status,
          notify: true,
        },
      });
      setEditOrder(null);
      flash("Order updated · customer emailed");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function removeOrder(order) {
    const result = await Swal.fire({
      title: "Delete this order?",
      html: `Order <strong>#${order.id}</strong> for <strong>${order.userName || "customer"}</strong><br/><span style="color:#5a7380">${formatINR(order.total)} · ${order.paymentRef || "no payment ref"}</span>`,
      icon: "warning",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#b42318",
      cancelButtonColor: "#1b7c98",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    setBusyId(`del-order-${order.id}`);
    try {
      await api(`/api/admin/orders/${order.id}`, { method: "DELETE" });
      await refresh();
      await Swal.fire({
        title: "Deleted",
        text: `Order #${order.id} has been removed.`,
        icon: "success",
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      setError(err.message);
      await Swal.fire({ title: "Delete failed", text: err.message, icon: "error" });
    } finally {
      setBusyId("");
    }
  }

  async function saveUser(e) {
    e.preventDefault();
    setBusyId(`user-${editUser.id}`);
    try {
      await api(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        body: {
          name: editUser.name,
          phone: editUser.phone,
          email: editUser.email,
          role: editUser.role,
          notify: true,
        },
      });
      setEditUser(null);
      flash("Customer updated · email sent");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function removeUser(user) {
    const result = await Swal.fire({
      title: "Delete this customer?",
      html: `<strong>${user.email}</strong><br/><span style="color:#5a7380">Their orders will be removed too.</span>`,
      icon: "warning",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#b42318",
      cancelButtonColor: "#1b7c98",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    setBusyId(`del-user-${user.id}`);
    try {
      await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
      flash("Customer deleted");
      await refresh();
    } catch (err) {
      setError(err.message);
      await Swal.fire({ title: "Delete failed", text: err.message, icon: "error" });
    } finally {
      setBusyId("");
    }
  }

  async function saveDealer(e) {
    e.preventDefault();
    setBusyId(`dealer-${editDealer.id}`);
    try {
      await api(`/api/admin/dealers/${editDealer.id}`, {
        method: "PATCH",
        body: {
          businessName: editDealer.dealer.businessName,
          gstin: editDealer.dealer.gstin,
          city: editDealer.dealer.city,
          businessType: editDealer.dealer.businessType,
          status: editDealer.dealer.status,
          notify: true,
        },
      });
      setEditDealer(null);
      flash("Dealer updated · email sent if status changed");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function removeDealer(user) {
    const result = await Swal.fire({
      title: "Remove dealer profile?",
      html: `<strong>${user.email}</strong><br/><span style="color:#5a7380">They will become a normal customer.</span>`,
      icon: "warning",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#b42318",
      cancelButtonColor: "#1b7c98",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;

    setBusyId(`del-dealer-${user.id}`);
    try {
      await api(`/api/admin/dealers/${user.id}`, { method: "DELETE" });
      flash("Dealer profile removed · email sent");
      await refresh();
    } catch (err) {
      setError(err.message);
      await Swal.fire({ title: "Delete failed", text: err.message, icon: "error" });
    } finally {
      setBusyId("");
    }
  }

  async function saveBookingStatus(booking, status) {
    setBusyId(`booking-${booking.id}`);
    try {
      await api(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        body: { status, notify: true },
      });
      flash(`Booking ${booking.id} → ${status}`);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function enablePushHere() {
    try {
      await enableAdminPush();
      await Swal.fire({
        icon: "success",
        title: "Push enabled",
        text: "This browser will receive AquaNest admin notifications.",
        timer: 2000,
        showConfirmButton: false,
      });
      await refresh();
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Push failed", text: err.message });
    }
  }

  async function sendBroadcast(e) {
    e.preventDefault();
    if (!pushForm.body.trim()) return;
    setBusyId("broadcast");
    try {
      const r = await api("/api/admin/push/broadcast", {
        method: "POST",
        body: pushForm,
      });
      flash(
        `Inbox → ${r.inbox || r.targets || 0} user(s) · FCM/web devices ${r.sent || 0}. Open the mobile app (signed in) to see Alert + bell.`,
      );
      setPushForm((s) => ({ ...s, body: "" }));
      await Swal.fire({
        icon: "success",
        title: "Test notification sent",
        html: `<p>In-app inbox: <b>${r.inbox || 0}</b></p><p>Remote FCM/web: <b>${r.sent || 0}</b></p><p style="font-size:13px;color:#555">Expo Go: keep the app open → Alert popup + home bell. System tray FCM needs a native build.</p>`,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function runAiPost() {
    setBusyId("ai-run");
    try {
      const r = await api("/api/admin/ai-posts/run", { method: "POST" });
      flash("New AI post created (new image + caption + hashtags)");
      await refresh();
      const tags = (r.post?.hashtags || []).join(" ");
      await Swal.fire({
        icon: "success",
        title: "New AI draft ready",
        html: `<p><b>${(r.post?.product?.name || "Product").replace(/</g, "")}</b></p>
          <p style="font-size:12px;color:#666">Seed ${r.post?.seed ?? "—"} · image ${r.post?.imageSource || "—"}</p>
          <p style="white-space:pre-wrap;text-align:left;font-size:13px">${(r.post?.caption || "").replace(/</g, "")}</p>
          <p style="text-align:left;font-size:12px;color:#0B6E99">${tags.replace(/</g, "")}</p>
          ${r.post?.imageUrl ? `<img src="${r.post.imageUrl}" alt="post" style="max-width:100%;border-radius:8px;margin-top:8px" />` : ""}`,
        width: 480,
      });
    } catch (err) {
      setError(err.message);
      await Swal.fire({ icon: "error", title: "AI post failed", text: err.message });
    } finally {
      setBusyId("");
    }
  }

  async function deleteAiPost(post) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this post?",
      text: post.product?.name || post.id,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#b42318",
    });
    if (!result.isConfirmed) return;
    setBusyId(`ai-del-${post.id}`);
    try {
      await api(`/api/admin/ai-posts/${post.id}`, { method: "DELETE" });
      flash("Post deleted");
      await refresh();
    } catch (err) {
      setError(err.message);
      await Swal.fire({ icon: "error", title: "Delete failed", text: err.message });
    } finally {
      setBusyId("");
    }
  }

  async function setAiPostStatus(post, status) {
    setBusyId(`ai-st-${post.id}`);
    try {
      await api(`/api/admin/ai-posts/${post.id}`, { method: "PATCH", body: { status } });
      flash(status === "published" ? "Published to mobile app" : "Hidden from app (draft)");
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="shell">
      <aside className="side">
        <div>
          <h1>AquaNest</h1>
          <p>Admin · {admin.email}</p>
        </div>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`nav-btn${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button type="button" className="btn ghost" onClick={onLogout}>
          Sign out
        </button>
      </aside>

      <main className="main">
        <div className="top">
          <div>
            <h2>{TABS.find((t) => t.id === tab)?.label}</h2>
            <span>Signed in as {admin.name}</span>
          </div>
          <button type="button" className="btn ghost" onClick={refresh}>
            Refresh
          </button>
        </div>

        {error ? <div className="error">{error}</div> : null}
        {notice ? <div className="notice">{notice}</div> : null}

        {tab === "overview" && summary && (
          <>
            <div className="grid grid-6">
              <div className="stat">
                <span>Customers</span>
                <strong>{summary.users}</strong>
              </div>
              <div className="stat">
                <span>Orders</span>
                <strong>{summary.orders}</strong>
              </div>
              <div className="stat">
                <span>Revenue</span>
                <strong>{formatINR(summary.revenue)}</strong>
              </div>
              <div className="stat">
                <span>Services</span>
                <strong>{summary.bookings || 0}</strong>
              </div>
              <div className="stat">
                <span>Pending dealers</span>
                <strong>{summary.pendingDealers}</strong>
              </div>
              <div className="stat">
                <span>Push devices</span>
                <strong>{summary.devices || 0}</strong>
              </div>
            </div>

            <div className="dash-split">
              <div className="panel">
                <div className="panel-title">
                  <h3>Recent orders</h3>
                  <button type="button" className="btn ghost" onClick={() => setTab("orders")}>
                    View all
                  </button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary.recentOrders || []).length === 0 ? (
                      <tr>
                        <td colSpan={4}>No orders yet.</td>
                      </tr>
                    ) : (
                      (summary.recentOrders || []).map((o) => (
                        <tr key={o.id}>
                          <td>
                            <strong>#{o.id}</strong>
                            <div className="muted-line">{new Date(o.createdAt).toLocaleString()}</div>
                          </td>
                          <td>
                            {o.userName}
                            <div className="muted-line">{o.userEmail}</div>
                          </td>
                          <td>{formatINR(o.total)}</td>
                          <td>
                            <span className={`pill${o.status === "cancelled" ? " bad" : " ok"}`}>
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="dash-side">
                <div className="panel">
                  <div className="panel-title">
                    <h3>Order pipeline</h3>
                  </div>
                  <div className="status-list">
                    {Object.entries(summary.statusCounts || {}).length === 0 ? (
                      <p className="sub">No status data yet.</p>
                    ) : (
                      Object.entries(summary.statusCounts || {}).map(([status, count]) => (
                        <div key={status} className="status-row">
                          <span>{status}</span>
                          <strong>{count}</strong>
                          <div className="bar">
                            <i
                              style={{
                                width: `${Math.min(100, (count / Math.max(summary.orders, 1)) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-title">
                    <h3>Service desk</h3>
                    <button type="button" className="btn ghost" onClick={() => setTab("services")}>
                      Open
                    </button>
                  </div>
                  {(summary.recentBookings || []).length === 0 ? (
                    <p className="sub">No service bookings yet.</p>
                  ) : (
                    <ul className="activity">
                      {(summary.recentBookings || []).map((b) => (
                        <li key={b.id}>
                          <strong>{b.type}</strong>
                          <span>
                            {b.userName} · {b.date} {b.slot}
                          </span>
                          <em className={`pill${b.status === "requested" ? " warn" : " ok"}`}>{b.status}</em>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="panel">
                  <div className="panel-title">
                    <h3>Dealer queue</h3>
                    <button type="button" className="btn ghost" onClick={() => setTab("dealers")}>
                      Review
                    </button>
                  </div>
                  {(summary.pendingDealerList || []).length === 0 ? (
                    <p className="sub">No pending dealer applications.</p>
                  ) : (
                    <ul className="activity">
                      {(summary.pendingDealerList || []).map((d) => (
                        <li key={d.id}>
                          <strong>{d.businessName || d.name}</strong>
                          <span>
                            {d.email} · {d.city || "—"}
                          </span>
                          <em className="pill warn">pending</em>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="panel">
                  <div className="panel-title">
                    <h3>System</h3>
                  </div>
                  <ul className="activity">
                    <li>
                      <strong>Push</strong>
                      <span>
                        VAPID {summary.push?.vapid ? "ready" : "off"} · FCM{" "}
                        {summary.push?.fcm ? "ready" : "off"}
                      </span>
                    </li>
                    <li>
                      <strong>Devices</strong>
                      <span>{summary.devices || 0} registered tokens</span>
                    </li>
                    <li>
                      <strong>Dealers approved</strong>
                      <span>{summary.dealers || 0}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "orders" && (
          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No orders yet.</td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>#{o.id}</strong>
                        <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                          {new Date(o.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        {o.userName}
                        <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{o.userEmail}</div>
                      </td>
                      <td>{formatINR(o.total)}</td>
                      <td>
                        {o.paymentMethod}
                        <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{o.paymentRef}</div>
                      </td>
                      <td>
                        <span className={`pill${o.cancelled || o.status === "cancelled" ? " bad" : " ok"}`}>
                          {o.cancelled ? "cancelled" : o.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() =>
                              setEditOrder({
                                ...o,
                                adminStatus: o.adminStatus || o.status,
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn danger"
                            disabled={busyId === `del-order-${o.id}`}
                            onClick={() => removeOrder(o)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "users" && (
          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Orders</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                      <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{u.id}</div>
                    </td>
                    <td>
                      {u.email}
                      <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{u.phone || "—"}</div>
                    </td>
                    <td>
                      <span className="pill">{u.role}</span>
                    </td>
                    <td>{u.orderCount}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn ghost" onClick={() => setEditUser({ ...u })}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn danger"
                          disabled={busyId === `del-user-${u.id}`}
                          onClick={() => removeUser(u)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "dealers" && (
          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Applicant</th>
                  <th>GSTIN / City</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dealers.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No dealer applications yet.</td>
                  </tr>
                ) : (
                  dealers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.dealer?.businessName || "—"}</strong>
                        <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                          {u.dealer?.businessType || ""}
                        </div>
                      </td>
                      <td>
                        {u.name}
                        <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{u.email}</div>
                      </td>
                      <td>
                        {u.dealer?.gstin || "—"}
                        <div style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{u.dealer?.city}</div>
                      </td>
                      <td>
                        <span
                          className={`pill${
                            u.dealer?.status === "approved"
                              ? " ok"
                              : u.dealer?.status === "pending"
                                ? " warn"
                                : " bad"
                          }`}
                        >
                          {u.dealer?.status}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {u.dealer?.status === "pending" ? (
                            <>
                              <button
                                type="button"
                                className="btn"
                                disabled={!!busyId}
                                onClick={() => reviewDealer(u.id, "approve")}
                              >
                                {busyId === `${u.id}-approve` ? "…" : "Approve"}
                              </button>
                              <button
                                type="button"
                                className="btn danger"
                                disabled={!!busyId}
                                onClick={() => reviewDealer(u.id, "reject")}
                              >
                                {busyId === `${u.id}-reject` ? "…" : "Reject"}
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() =>
                              setEditDealer({
                                ...u,
                                dealer: { ...u.dealer },
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn danger"
                            disabled={busyId === `del-dealer-${u.id}`}
                            onClick={() => removeDealer(u)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "services" && (
          <div className="panel">
            <table>
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No service bookings yet.</td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>{b.id}</strong>
                        <div className="muted-line">{b.type}</div>
                      </td>
                      <td>
                        {b.userName}
                        <div className="muted-line">{b.userEmail}</div>
                      </td>
                      <td>
                        {b.date} · {b.slot}
                        <div className="muted-line">{b.address}</div>
                      </td>
                      <td>
                        <span className={`pill${b.status === "requested" ? " warn" : " ok"}`}>{b.status}</span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn ghost"
                            disabled={!!busyId}
                            onClick={() => saveBookingStatus(b, "assigned")}
                          >
                            Assign
                          </button>
                          <button
                            type="button"
                            className="btn"
                            disabled={!!busyId}
                            onClick={() => saveBookingStatus(b, "completed")}
                          >
                            Complete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "push" && (
          <div className="dash-split">
            <div className="panel">
              <div className="panel-title">
                <h3>Test / broadcast</h3>
              </div>
              <ol className="hint" style={{ margin: "0 0 12px", paddingLeft: 18, lineHeight: 1.5 }}>
                <li>Sign in on the mobile app (Expo Go is fine)</li>
                <li>Allow notifications if Android asks</li>
                <li>Send a message below — within ~8s you’ll get an Alert + bell badge</li>
              </ol>
              <form onSubmit={sendBroadcast}>
                <label>Title</label>
                <input
                  value={pushForm.title}
                  onChange={(e) => setPushForm((s) => ({ ...s, title: e.target.value }))}
                  required
                />
                <label>Message</label>
                <input
                  value={pushForm.body}
                  onChange={(e) => setPushForm((s) => ({ ...s, body: e.target.value }))}
                  placeholder="Order offers, service reminders…"
                  required
                />
                <button className="btn" type="submit" disabled={busyId === "broadcast"}>
                  {busyId === "broadcast" ? "Sending…" : "Send test to all customers"}
                </button>
              </form>
              <p className="hint" style={{ marginTop: 12 }}>
                Expo Go: in-app Alert + notification bell. True phone tray FCM needs{" "}
                <code>npx expo run:android</code> + <code>EXPO_PUBLIC_ENABLE_NATIVE_PUSH=1</code>.
              </p>
            </div>
            <div className="panel">
              <div className="panel-title">
                <h3>This browser</h3>
              </div>
              <p className="sub">Enable admin desktop notifications for order and dealer alerts.</p>
              <button type="button" className="btn" onClick={enablePushHere}>
                Enable web push
              </button>
              <ul className="activity" style={{ marginTop: 16 }}>
                <li>
                  <strong>VAPID</strong>
                  <span>{summary?.push?.vapid ? "Configured" : "Missing keys"}</span>
                </li>
                <li>
                  <strong>FCM</strong>
                  <span>{summary?.push?.fcm ? "Firebase Admin ready" : "Not configured"}</span>
                </li>
                <li>
                  <strong>Registered devices</strong>
                  <span>{summary?.devices || 0}</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {tab === "ai" && (
          <div className="dash-split">
            <div className="panel">
              <div className="panel-title">
                <h3>Daily AI social workflow</h3>
              </div>
              <p className="sub">
                Daily at <b>{aiMeta?.scheduleHour ?? 9}:00</b> (server local) → unique image + caption/hashtags →
                published to the <b>mobile app</b> (Home + product page) and emailed to admin.
              </p>
              <ul className="activity" style={{ marginTop: 12 }}>
                <li>
                  <strong>Schedule</strong>
                  <span>{aiMeta?.scheduleEnabled === false ? "Off" : "On"}</span>
                </li>
                <li>
                  <strong>Server time now</strong>
                  <span>{aiMeta?.serverLocalTime || "—"}</span>
                </li>
                <li>
                  <strong>Ran today</strong>
                  <span>{aiMeta?.ranToday ? "Yes" : "Not yet"}</span>
                </li>
                <li>
                  <strong>Next auto run</strong>
                  <span>{aiMeta?.nextRunAt ? new Date(aiMeta.nextRunAt).toLocaleString() : "—"}</span>
                </li>
                <li>
                  <strong>OpenAI</strong>
                  <span>{aiMeta?.openai ? "Key set (falls back if no credits)" : "Fallback images"}</span>
                </li>
              </ul>
              <button
                type="button"
                className="btn"
                style={{ marginTop: 16 }}
                onClick={runAiPost}
                disabled={busyId === "ai-run"}
              >
                {busyId === "ai-run" ? "Generating…" : "Run AI post now → publish to app"}
              </button>
              <p className="hint" style={{ marginTop: 12 }}>
                <code>AI_POST_HOUR=20</code> + restart backend. If that hour already passed today, it catch-ups
                once. Each run saves a different image for the app.
              </p>
            </div>
            <div className="panel">
              <div className="panel-title">
                <h3>Posts (app feed)</h3>
              </div>
              {aiPosts.length === 0 ? (
                <p className="sub">No posts yet — click Run AI post now.</p>
              ) : (
                <ul className="activity">
                  {aiPosts.map((p) => (
                    <li key={p.id} style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <div>
                          <strong>{p.product?.name || "Post"}</strong>
                          <div style={{ fontSize: 11, color: "#667", marginTop: 2 }}>
                            {p.status === "published" ? (
                              <span style={{ color: "#1f8a5b", fontWeight: 700 }}>LIVE on app</span>
                            ) : (
                              <span style={{ color: "#b42318", fontWeight: 700 }}>Draft (hidden)</span>
                            )}
                            {" · "}
                            {new Date(p.createdAt).toLocaleString()}
                            {p.seed != null ? ` · seed ${p.seed}` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {p.status !== "published" ? (
                            <button
                              type="button"
                              className="btn"
                              style={{ padding: "4px 10px" }}
                              disabled={busyId === `ai-st-${p.id}`}
                              onClick={() => setAiPostStatus(p, "published")}
                            >
                              Publish
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn ghost"
                              style={{ padding: "4px 10px" }}
                              disabled={busyId === `ai-st-${p.id}`}
                              onClick={() => setAiPostStatus(p, "draft")}
                            >
                              Unpublish
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn ghost"
                            style={{ color: "#b42318", borderColor: "#f0c4c0", padding: "4px 10px" }}
                            disabled={busyId === `ai-del-${p.id}` || busyId === "ai-run"}
                            onClick={() => deleteAiPost(p)}
                          >
                            {busyId === `ai-del-${p.id}` ? "…" : "Delete"}
                          </button>
                        </div>
                      </div>
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt=""
                          style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : null}
                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                          fontFamily: "inherit",
                          fontSize: 13,
                          color: "#334",
                        }}
                      >
                        {p.caption || p.fullCaption}
                      </pre>
                      {p.hashtags?.length ? (
                        <p style={{ margin: 0, fontSize: 12, color: "#0B6E99" }}>
                          {p.hashtags.join(" ")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>

      {editOrder ? (
        <Modal
          title={`Edit order #${editOrder.id}`}
          onClose={() => setEditOrder(null)}
          footer={
            <>
              <button type="button" className="btn ghost" onClick={() => setEditOrder(null)}>
                Cancel
              </button>
              <button
                type="submit"
                form="edit-order-form"
                className="btn"
                disabled={busyId === `order-${editOrder.id}`}
              >
                Save & email
              </button>
            </>
          }
        >
          <form id="edit-order-form" onSubmit={saveOrder}>
            <label>Payment ref</label>
            <input
              value={editOrder.paymentRef || ""}
              onChange={(e) => setEditOrder((s) => ({ ...s, paymentRef: e.target.value }))}
            />
            <label>Payment method</label>
            <input
              value={editOrder.paymentMethod || ""}
              onChange={(e) => setEditOrder((s) => ({ ...s, paymentMethod: e.target.value }))}
            />
            <label>Status</label>
            <select
              value={editOrder.adminStatus || editOrder.status || "placed"}
              onChange={(e) => setEditOrder((s) => ({ ...s, adminStatus: e.target.value }))}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="hint">Saving emails the customer with the new status.</p>
          </form>
        </Modal>
      ) : null}

      {editUser ? (
        <Modal
          title={`Edit customer ${editUser.name}`}
          onClose={() => setEditUser(null)}
          footer={
            <>
              <button type="button" className="btn ghost" onClick={() => setEditUser(null)}>
                Cancel
              </button>
              <button
                type="submit"
                form="edit-user-form"
                className="btn"
                disabled={busyId === `user-${editUser.id}`}
              >
                Save & email
              </button>
            </>
          }
        >
          <form id="edit-user-form" onSubmit={saveUser}>
            <label>Name</label>
            <input
              value={editUser.name || ""}
              onChange={(e) => setEditUser((s) => ({ ...s, name: e.target.value }))}
              required
            />
            <label>Email</label>
            <input
              type="email"
              value={editUser.email || ""}
              onChange={(e) => setEditUser((s) => ({ ...s, email: e.target.value }))}
              required
            />
            <label>Phone</label>
            <input
              value={editUser.phone || ""}
              onChange={(e) => setEditUser((s) => ({ ...s, phone: e.target.value }))}
            />
            <label>Role</label>
            <select
              value={editUser.role || "customer"}
              onChange={(e) => setEditUser((s) => ({ ...s, role: e.target.value }))}
            >
              <option value="customer">customer</option>
              <option value="dealer">dealer</option>
            </select>
          </form>
        </Modal>
      ) : null}

      {editDealer ? (
        <Modal
          title={`Edit dealer ${editDealer.name}`}
          onClose={() => setEditDealer(null)}
          footer={
            <>
              <button type="button" className="btn ghost" onClick={() => setEditDealer(null)}>
                Cancel
              </button>
              <button
                type="submit"
                form="edit-dealer-form"
                className="btn"
                disabled={busyId === `dealer-${editDealer.id}`}
              >
                Save
              </button>
            </>
          }
        >
          <form id="edit-dealer-form" onSubmit={saveDealer}>
            <label>Business name</label>
            <input
              value={editDealer.dealer?.businessName || ""}
              onChange={(e) =>
                setEditDealer((s) => ({ ...s, dealer: { ...s.dealer, businessName: e.target.value } }))
              }
            />
            <label>GSTIN</label>
            <input
              value={editDealer.dealer?.gstin || ""}
              onChange={(e) =>
                setEditDealer((s) => ({ ...s, dealer: { ...s.dealer, gstin: e.target.value } }))
              }
            />
            <label>City</label>
            <input
              value={editDealer.dealer?.city || ""}
              onChange={(e) =>
                setEditDealer((s) => ({ ...s, dealer: { ...s.dealer, city: e.target.value } }))
              }
            />
            <label>Business type</label>
            <input
              value={editDealer.dealer?.businessType || ""}
              onChange={(e) =>
                setEditDealer((s) => ({ ...s, dealer: { ...s.dealer, businessType: e.target.value } }))
              }
            />
            <label>Status</label>
            <select
              value={editDealer.dealer?.status || "pending"}
              onChange={(e) =>
                setEditDealer((s) => ({ ...s, dealer: { ...s.dealer, status: e.target.value } }))
              }
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
            <p className="hint">Approve / reject status changes email the applicant.</p>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setBooting(false);
      return;
    }
    api("/api/admin/me")
      .then((me) => setAdmin(me))
      .catch(() => setToken(""))
      .finally(() => setBooting(false));
  }, []);

  if (booting) {
    return (
      <div className="login-shell">
        <p className="sub">Loading admin…</p>
      </div>
    );
  }

  if (!admin) {
    return <Login onLogin={setAdmin} />;
  }

  return (
    <Dashboard
      admin={admin}
      onLogout={() => {
        setToken("");
        setAdmin(null);
      }}
    />
  );
}
