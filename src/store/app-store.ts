import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getProduct } from "@/lib/catalog";
import { cartTotals, clampQty, unitPrice } from "@/lib/pricing";

export type Role = "customer" | "dealer";
export type DealerStatus = "none" | "pending" | "approved" | "rejected";

export interface User {
  name: string;
  email: string;
  phone: string;
  role: Role;
}

export interface DealerProfile {
  status: DealerStatus;
  businessName: string;
  gstin: string;
  city: string;
  businessType: string;
  submittedAt?: string;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CartLine {
  productId: string;
  qty: number;
}

export type OrderStatus = "placed" | "confirmed" | "shipped" | "out-for-delivery" | "delivered" | "cancelled";

export interface Order {
  id: string;
  createdAt: string;
  items: { productId: string; name: string; image: string; qty: number; unitPrice: number }[];
  subtotal: number;
  delivery: number;
  total: number;
  address: Address;
  paymentMethod: string;
  paymentRef: string;
  isDealerOrder: boolean;
  cancelled?: boolean;
}

export type ServiceType = "installation" | "maintenance" | "repair" | "filter-replacement";
export type BookingStatus = "requested" | "technician-assigned" | "completed" | "cancelled";

export interface Booking {
  id: string;
  createdAt: string;
  type: ServiceType;
  date: string;
  slot: string;
  address: string;
  issue: string;
  product?: string;
  status: BookingStatus;
  technician?: string;
}

export interface AppNotification {
  id: string;
  createdAt: string;
  title: string;
  body: string;
  kind: "order" | "service" | "dealer" | "offer";
  read: boolean;
}

export interface Settings {
  theme: "light" | "dark";
  pushOrders: boolean;
  pushService: boolean;
  pushOffers: boolean;
  email: boolean;
  sms: boolean;
}

interface State {
  hydrated: boolean;
  user: User | null;
  dealer: DealerProfile;
  cart: CartLine[];
  wishlist: string[];
  addresses: Address[];
  orders: Order[];
  bookings: Booking[];
  notifications: AppNotification[];
  settings: Settings;
  recentSearches: string[];

  login: (email: string, name?: string) => void;
  register: (u: User, dealer?: Omit<DealerProfile, "status">) => void;
  logout: () => void;
  updateProfile: (p: Partial<Pick<User, "name" | "phone">>) => void;

  submitDealerApplication: (d: Omit<DealerProfile, "status">) => void;
  setDealerStatus: (s: DealerStatus) => void;

  addToCart: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;

  saveAddress: (a: Omit<Address, "id"> & { id?: string }) => void;
  deleteAddress: (id: string) => void;

  placeOrder: (addressId: string, paymentMethod: string, paymentRef: string) => Order | null;
  cancelOrder: (id: string) => void;

  bookService: (b: Omit<Booking, "id" | "createdAt" | "status">) => Booking;
  cancelBooking: (id: string) => void;

  markAllRead: () => void;
  updateSettings: (s: Partial<Settings>) => void;
  addRecentSearch: (q: string) => void;
}

const uid = (p: string) => `${p}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const note = (title: string, body: string, kind: AppNotification["kind"]): AppNotification => ({
  id: uid("N"),
  createdAt: new Date().toISOString(),
  title,
  body,
  kind,
  read: false,
});

const welcomeNotes = (): AppNotification[] => [
  note("Monsoon Sale is live 💧", "Up to 35% off on RO purifiers. Free installation this week.", "offer"),
];

export const isApprovedDealer = (s: Pick<State, "user" | "dealer">) =>
  s.user?.role === "dealer" && s.dealer.status === "approved";

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      user: null,
      dealer: { status: "none", businessName: "", gstin: "", city: "", businessType: "" },
      cart: [],
      wishlist: [],
      addresses: [],
      orders: [],
      bookings: [],
      notifications: [],
      settings: { theme: "light", pushOrders: true, pushService: true, pushOffers: true, email: true, sms: false },
      recentSearches: [],

      login: (email, name) =>
        set((s) => ({
          user: {
            name: name ?? s.user?.name ?? email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            email,
            phone: s.user?.phone ?? "",
            role: s.user?.email === email ? s.user.role : "customer",
          },
          notifications: s.notifications.length ? s.notifications : welcomeNotes(),
        })),
      register: (u, dealer) =>
        set({
          user: u,
          dealer: dealer
            ? { ...dealer, status: "pending", submittedAt: new Date().toISOString() }
            : { status: "none", businessName: "", gstin: "", city: "", businessType: "" },
          notifications: [
            ...(dealer ? [note("Dealer application received", "We'll review your business details within 24–48 hours.", "dealer")] : []),
            ...welcomeNotes(),
          ],
        }),
      logout: () => set({ user: null, cart: [] }),
      updateProfile: (p) => set((s) => (s.user ? { user: { ...s.user, ...p } } : {})),

      submitDealerApplication: (d) =>
        set((s) => ({
          user: s.user ? { ...s.user, role: "dealer" } : s.user,
          dealer: { ...d, status: "pending", submittedAt: new Date().toISOString() },
          notifications: [note("Dealer application received", "We'll review your business details within 24–48 hours.", "dealer"), ...s.notifications],
        })),
      setDealerStatus: (status) =>
        set((s) => ({
          dealer: { ...s.dealer, status },
          notifications: [
            status === "approved"
              ? note("You're an approved dealer 🎉", "Wholesale prices and bulk ordering are now unlocked.", "dealer")
              : note("Dealer application update", "Your application was not approved. Contact support for details.", "dealer"),
            ...s.notifications,
          ],
        })),

      addToCart: (productId, qty = 1) => {
        const p = getProduct(productId);
        if (!p || p.stock <= 0) return;
        set((s) => {
          const existing = s.cart.find((l) => l.productId === productId);
          const next = clampQty((existing?.qty ?? 0) + qty, p.stock);
          return {
            cart: existing
              ? s.cart.map((l) => (l.productId === productId ? { ...l, qty: next } : l))
              : [...s.cart, { productId, qty: next }],
          };
        });
      },
      setQty: (productId, qty) => {
        const p = getProduct(productId);
        if (!p) return;
        const next = clampQty(qty, p.stock);
        set((s) => ({
          cart: next <= 0 ? s.cart.filter((l) => l.productId !== productId) : s.cart.map((l) => (l.productId === productId ? { ...l, qty: next } : l)),
        }));
      },
      removeFromCart: (productId) => set((s) => ({ cart: s.cart.filter((l) => l.productId !== productId) })),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (productId) =>
        set((s) => ({
          wishlist: s.wishlist.includes(productId) ? s.wishlist.filter((id) => id !== productId) : [productId, ...s.wishlist],
        })),

      saveAddress: (a) =>
        set((s) => {
          if (a.id) return { addresses: s.addresses.map((x) => (x.id === a.id ? ({ ...a } as Address) : x)) };
          return { addresses: [...s.addresses, { ...a, id: uid("A") }] };
        }),
      deleteAddress: (id) => set((s) => ({ addresses: s.addresses.filter((a) => a.id !== id) })),

      placeOrder: (addressId, paymentMethod, paymentRef) => {
        const s = get();
        const address = s.addresses.find((a) => a.id === addressId);
        if (!address || s.cart.length === 0) return null;
        const dealer = isApprovedDealer(s);
        const lines = s.cart.map((l) => ({ product: getProduct(l.productId)!, qty: l.qty })).filter((l) => l.product);
        const totals = cartTotals(lines, dealer);
        const order: Order = {
          id: uid("AN"),
          createdAt: new Date().toISOString(),
          items: lines.map((l) => ({
            productId: l.product.id,
            name: l.product.name,
            image: l.product.image,
            qty: l.qty,
            unitPrice: unitPrice(l.product, dealer),
          })),
          subtotal: totals.subtotal,
          delivery: totals.delivery,
          total: totals.total,
          address,
          paymentMethod,
          paymentRef,
          isDealerOrder: dealer,
        };
        set({
          orders: [order, ...s.orders],
          cart: [],
          notifications: [note("Order confirmed", `Order #${order.id} has been placed. We'll notify you when it ships.`, "order"), ...s.notifications],
        });
        return order;
      },
      cancelOrder: (id) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, cancelled: true } : o)),
          notifications: [note("Order cancelled", `Order #${id} was cancelled. Refund will reach you in 5–7 days.`, "order"), ...s.notifications],
        })),

      bookService: (b) => {
        const booking: Booking = { ...b, id: uid("SR"), createdAt: new Date().toISOString(), status: "requested" };
        set((s) => ({
          bookings: [booking, ...s.bookings],
          notifications: [note("Service booked", `Your ${b.type.replace("-", " ")} visit is requested for ${b.date}, ${b.slot}.`, "service"), ...s.notifications],
        }));
        return booking;
      },
      cancelBooking: (id) => set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)) })),

      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      updateSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      addRecentSearch: (q) =>
        set((s) => ({ recentSearches: [q, ...s.recentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6) })),
    }),
    {
      name: "aquanest-app",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ hydrated: _h, ...rest }) => rest,
    },
  ),
);

/** Order status derived from time since purchase (frontend preview of tracking). */
export function orderStatus(o: Order, now = Date.now()): OrderStatus {
  if (o.cancelled) return "cancelled";
  const mins = (now - new Date(o.createdAt).getTime()) / 60000;
  if (mins < 2) return "placed";
  if (mins < 30) return "confirmed";
  if (mins < 240) return "shipped";
  if (mins < 1440) return "out-for-delivery";
  return "delivered";
}

export const canCancel = (o: Order) => ["placed", "confirmed"].includes(orderStatus(o));
