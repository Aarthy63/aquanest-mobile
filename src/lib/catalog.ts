import roWall from "@/assets/p-ro-wall.jpg";
import roBlack from "@/assets/p-ro-black.jpg";
import underSink from "@/assets/p-under-sink.jpg";
import uvCounter from "@/assets/p-uv-counter.jpg";
import dispFloor from "@/assets/p-dispenser-floor.jpg";
import dispTable from "@/assets/p-dispenser-table.jpg";
import pump from "@/assets/p-pump.jpg";
import filterSediment from "@/assets/p-filter-sediment.jpg";
import filterCarbon from "@/assets/p-filter-carbon.jpg";
import membrane from "@/assets/p-membrane.jpg";
import spares from "@/assets/p-spares.jpg";

export type CategoryId = "purifiers" | "dispensers" | "pumps" | "filters" | "membranes" | "spare-parts";

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  image: string;
}

export const categories: Category[] = [
  { id: "purifiers", name: "Water Purifiers", short: "Purifiers", image: roWall },
  { id: "dispensers", name: "Water Dispensers", short: "Dispensers", image: dispFloor },
  { id: "pumps", name: "Booster Pumps", short: "Pumps", image: pump },
  { id: "filters", name: "Filters & Cartridges", short: "Filters", image: filterSediment },
  { id: "membranes", name: "RO Membranes", short: "Membranes", image: membrane },
  { id: "spare-parts", name: "Spare Parts", short: "Spares", image: spares },
];

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: CategoryId;
  image: string;
  images: string[];
  price: number;
  mrp: number;
  wholesalePrice: number;
  moq: number;
  stock: number;
  rating: number;
  reviews: number;
  warranty: string;
  description: string;
  specs: Record<string, string>;
  featured: boolean;
  createdOrder: number;
}

type Def = [name: string, cat: CategoryId, brand: string, img: string, price: number, stock: number, specs: Record<string, string>];

const defs: Def[] = [
  // Purifiers (14)
  ["AquaNest Crystal RO+UV+UF 8L", "purifiers", "AquaNest", roWall, 14999, 42, { Technology: "RO + UV + UF + TDS", Capacity: "8 L", Stages: "7", "Purification rate": "15 L/hr" }],
  ["PureWell Classic RO 7L", "purifiers", "PureWell", roWall, 9499, 60, { Technology: "RO + TDS", Capacity: "7 L", Stages: "6", "Purification rate": "12 L/hr" }],
  ["HydroNova Titan RO+UV Steel", "purifiers", "HydroNova", roBlack, 22999, 18, { Technology: "RO + UV + Mineral", Capacity: "9 L (SS tank)", Stages: "8", Display: "Digital TDS" }],
  ["AquaNest Onyx Smart RO", "purifiers", "AquaNest", roBlack, 27499, 12, { Technology: "RO + UV-LED + Alkaline", Capacity: "10 L", Stages: "9", Connectivity: "Wi-Fi app" }],
  ["BlueSpring Under-Sink 3-Stage", "purifiers", "BlueSpring", underSink, 7999, 35, { Technology: "Sediment + GAC + CTO", Installation: "Under sink", Stages: "3", "Flow rate": "2 L/min" }],
  ["BlueSpring Under-Sink RO Pro", "purifiers", "BlueSpring", underSink, 16499, 20, { Technology: "RO + Carbon", Installation: "Under sink", Stages: "5", "Flow rate": "1.5 L/min" }],
  ["PureFlo Compact UV 6L", "purifiers", "PureFlo", uvCounter, 6499, 55, { Technology: "UV + Carbon", Capacity: "6 L", Stages: "4", "Best for": "Municipal water" }],
  ["PureFlo Mini UV Countertop", "purifiers", "PureFlo", uvCounter, 4999, 70, { Technology: "UV", Capacity: "Direct flow", Stages: "3", Power: "20 W" }],
  ["HydroNova Alkaline RO 8L", "purifiers", "HydroNova", roWall, 18999, 26, { Technology: "RO + UV + Alkaline", Capacity: "8 L", "pH boost": "8.0 – 9.5", Stages: "8" }],
  ["Crystalline Copper RO 7L", "purifiers", "Crystalline", roWall, 15999, 30, { Technology: "RO + Copper + UV", Capacity: "7 L", Stages: "7", Feature: "Copper infusion" }],
  ["AquaNest Gravity Ultra 15L", "purifiers", "AquaNest", uvCounter, 2999, 90, { Technology: "Gravity UF", Capacity: "15 L", Power: "Not required", Stages: "2" }],
  ["PureWell Hot & Ambient RO", "purifiers", "PureWell", roBlack, 31999, 8, { Technology: "RO + UV + Hot water", Capacity: "8 L", Temperatures: "Ambient, 45°, 80°C", Stages: "8" }],
  ["Crystalline Commercial RO 25 LPH", "purifiers", "Crystalline", roBlack, 38999, 6, { Technology: "RO + UV", Output: "25 L/hr", Capacity: "20 L", Use: "Office / shop" }],
  ["BlueSpring Whole-Home Filter", "purifiers", "BlueSpring", underSink, 12499, 15, { Technology: "Sediment + Carbon", Installation: "Main inlet", "Flow rate": "20 L/min", Stages: "3" }],
  // Dispensers (8)
  ["AquaPrimo Floor Hot & Cold", "dispensers", "AquaPrimo", dispFloor, 11499, 25, { Type: "Floor standing", Bottle: "20 L top load", Cooling: "Compressor", Taps: "Hot + Cold" }],
  ["AquaPrimo Floor 3-Tap Cabinet", "dispensers", "AquaPrimo", dispFloor, 13999, 18, { Type: "Floor standing", Bottle: "20 L top load", Taps: "Hot + Cold + Normal", Storage: "Cabinet" }],
  ["AquaFresh Tabletop Hot & Cold", "dispensers", "AquaFresh", dispTable, 6999, 40, { Type: "Tabletop", Bottle: "20 L", Cooling: "Electronic", Taps: "Hot + Cold" }],
  ["AquaFresh Tabletop Normal & Cold", "dispensers", "AquaFresh", dispTable, 5999, 45, { Type: "Tabletop", Bottle: "20 L", Cooling: "Electronic", Taps: "Normal + Cold" }],
  ["HydroNova Bottom-Load Dispenser", "dispensers", "HydroNova", dispFloor, 17999, 10, { Type: "Floor standing", Bottle: "Bottom load", Cooling: "Compressor", Feature: "Child lock" }],
  ["PureWell Office Dispenser RO", "dispensers", "PureWell", dispFloor, 24999, 7, { Type: "Point-of-use", Purification: "RO + UV", Taps: "Hot + Cold", Capacity: "12 L" }],
  ["AquaFresh Compact Cooler", "dispensers", "AquaFresh", dispTable, 4499, 50, { Type: "Tabletop", Bottle: "20 L", Cooling: "Electronic", Taps: "Cold only" }],
  ["AquaPrimo Steel Cooler 40L", "dispensers", "AquaPrimo", dispFloor, 29999, 5, { Type: "Commercial cooler", Storage: "40 L SS tank", Cooling: "Compressor", Taps: "2 cold" }],
  // Pumps (7)
  ["FlowMax RO Booster Pump 75 GPD", "pumps", "FlowMax", pump, 1499, 120, { Voltage: "24 V DC", Flow: "0.8 L/min", Pressure: "100 PSI", Fits: "Domestic RO" }],
  ["FlowMax RO Booster Pump 100 GPD", "pumps", "FlowMax", pump, 1799, 110, { Voltage: "24 V DC", Flow: "1.0 L/min", Pressure: "110 PSI", Fits: "Domestic RO" }],
  ["FlowMax Booster Pump 150 GPD", "pumps", "FlowMax", pump, 2299, 80, { Voltage: "24 V DC", Flow: "1.2 L/min", Pressure: "120 PSI", Fits: "Large RO" }],
  ["HydroDrive Silent Pump 100 GPD", "pumps", "HydroDrive", pump, 2499, 60, { Voltage: "24 V DC", Noise: "< 45 dB", Pressure: "110 PSI", Fits: "Premium RO" }],
  ["HydroDrive Commercial Pump 400 GPD", "pumps", "HydroDrive", pump, 4999, 25, { Voltage: "36 V DC", Flow: "2.5 L/min", Pressure: "130 PSI", Fits: "Commercial RO" }],
  ["FlowMax Pump + 24V Adapter Kit", "pumps", "FlowMax", pump, 2199, 75, { Includes: "Pump + SMPS adapter", Voltage: "24 V DC", Pressure: "100 PSI", Fits: "Domestic RO" }],
  ["HydroDrive Pressure Pump 12V", "pumps", "HydroDrive", pump, 1299, 90, { Voltage: "12 V DC", Flow: "0.6 L/min", Pressure: "80 PSI", Fits: "Low-pressure lines" }],
  // Filters (9)
  ["PureAqua Spun PP Sediment 10\"", "filters", "PureAqua", filterSediment, 199, 400, { Type: "Spun polypropylene", Micron: "5 µ", Size: "10 inch", Life: "3–6 months" }],
  ["PureAqua Inline Sediment Filter", "filters", "PureAqua", filterSediment, 349, 300, { Type: "Inline PP", Micron: "5 µ", Connection: "1/4\" push-fit", Life: "6 months" }],
  ["PureAqua Sediment Pack of 5", "filters", "PureAqua", filterSediment, 799, 150, { Type: "Spun PP (x5)", Micron: "5 µ", Size: "10 inch", Life: "3–6 months each" }],
  ["CarbonPro Post Carbon Inline", "filters", "CarbonPro", filterCarbon, 399, 260, { Type: "Coconut GAC", Connection: "1/4\" push-fit", Removes: "Taste & odour", Life: "12 months" }],
  ["CarbonPro CTO Carbon Block 10\"", "filters", "CarbonPro", filterCarbon, 549, 200, { Type: "Carbon block", Micron: "10 µ", Removes: "Chlorine, VOCs", Life: "6–12 months" }],
  ["CarbonPro Pre-Carbon GAC 10\"", "filters", "CarbonPro", filterCarbon, 449, 220, { Type: "Granular carbon", Size: "10 inch", Removes: "Chlorine", Life: "6 months" }],
  ["PureAqua Mineral Cartridge", "filters", "PureAqua", filterCarbon, 699, 140, { Type: "Mineraliser", Adds: "Ca, Mg", Connection: "1/4\" push-fit", Life: "12 months" }],
  ["PureAqua Alkaline Inline Filter", "filters", "PureAqua", filterCarbon, 899, 110, { Type: "Alkaline ceramic", "pH boost": "+1 to +1.5", Connection: "1/4\" push-fit", Life: "12 months" }],
  ["AquaNest Annual Filter Kit", "filters", "AquaNest", filterSediment, 1899, 95, { Includes: "Sediment + Pre-carbon + Post-carbon", Fits: "Most domestic RO", Life: "12 months" }],
  // Membranes (7)
  ["MembraPure RO Membrane 75 GPD", "membranes", "MembraPure", membrane, 1599, 140, { Output: "75 GPD", Rejection: "96–98%", Size: "1812", Fits: "Domestic RO" }],
  ["MembraPure RO Membrane 80 GPD", "membranes", "MembraPure", membrane, 1799, 130, { Output: "80 GPD", Rejection: "96–98%", Size: "1812", Fits: "Domestic RO" }],
  ["MembraPure HiTDS Membrane 100 GPD", "membranes", "MembraPure", membrane, 2399, 90, { Output: "100 GPD", Rejection: "98%", Size: "2012", "Best for": "TDS up to 2500" }],
  ["AquaFilm Membrane 150 GPD", "membranes", "AquaFilm", membrane, 3299, 60, { Output: "150 GPD", Rejection: "97%", Size: "2012", Fits: "Large RO" }],
  ["AquaFilm Commercial 4040", "membranes", "AquaFilm", membrane, 9999, 20, { Output: "2400 GPD", Rejection: "99%", Size: "4040", Use: "Commercial plants" }],
  ["AquaFilm Commercial 2540", "membranes", "AquaFilm", membrane, 6499, 28, { Output: "850 GPD", Rejection: "99%", Size: "2540", Use: "Shops / offices" }],
  ["MembraPure UF Membrane", "membranes", "MembraPure", membrane, 899, 160, { Type: "Hollow fibre UF", Pore: "0.01 µ", Fits: "RO+UF purifiers", Life: "12–18 months" }],
  // Spare parts (7)
  ["Chrome Goose-Neck RO Faucet", "spare-parts", "AquaNest", spares, 499, 210, { Material: "Chrome-plated brass", Connection: "1/4\" tube", Type: "Goose-neck", Warranty: "6 months" }],
  ["RO Tubing Kit 10m (Blue + White)", "spare-parts", "PureAqua", spares, 299, 300, { Size: "1/4 inch", Length: "10 m", Material: "Food-grade PE", Colors: "Blue, White" }],
  ["24V Solenoid Valve (SV)", "spare-parts", "FlowMax", spares, 349, 180, { Voltage: "24 V DC", Connection: "1/4\" push-fit", Type: "Normally closed", Fits: "Domestic RO" }],
  ["Float Valve for RO Tank", "spare-parts", "PureAqua", spares, 149, 260, { Type: "Float valve", Connection: "1/4\" push-fit", Material: "ABS", Fits: "Storage tanks" }],
  ["Push-Fit Connector Set (20 pcs)", "spare-parts", "PureAqua", spares, 399, 240, { Includes: "Tees, elbows, unions", Size: "1/4 inch", Material: "Food-grade POM", Pieces: "20" }],
  ["24V SMPS Power Adapter", "spare-parts", "FlowMax", spares, 599, 170, { Output: "24 V, 2.5 A", Input: "100–240 V AC", Fits: "RO pumps", Protection: "Short circuit" }],
  ["RO Flow Restrictor 450 ml", "spare-parts", "AquaNest", spares, 99, 320, { Rating: "450 ml/min", Connection: "1/4\" inline", Fits: "75–100 GPD", Material: "Plastic" }],
];

const warrantyFor = (cat: CategoryId) =>
  ({
    purifiers: "1 year comprehensive + 2 years on RO membrane",
    dispensers: "1 year on product, 3 years on compressor",
    pumps: "1 year manufacturer warranty",
    filters: "6 months against manufacturing defects",
    membranes: "6 months against manufacturing defects",
    "spare-parts": "6 months replacement warranty",
  })[cat];

const moqFor = (cat: CategoryId) =>
  ({ purifiers: 5, dispensers: 3, pumps: 10, filters: 25, membranes: 10, "spare-parts": 20 })[cat];

const descriptionFor = (name: string, cat: CategoryId, brand: string) => {
  const base: Record<CategoryId, string> = {
    purifiers: "multi-stage purification for safe, great-tasting drinking water every day. Built for Indian water conditions with smart alerts for filter changes.",
    dispensers: "instant chilled and hot water for homes and offices, with an energy-efficient design and easy-clean drip tray.",
    pumps: "steady pressure for your RO system so it purifies faster and quieter, even when the inlet pressure is low.",
    filters: "a genuine replacement cartridge that keeps your purifier working at its best. Change regularly for clean, clear water.",
    membranes: "high-rejection reverse osmosis membrane that removes dissolved salts, heavy metals and impurities.",
    "spare-parts": "a reliable, food-safe spare part that fits most domestic RO purifiers. Simple to install.",
  };
  return `${name} by ${brand} — ${base[cat]}`;
};

function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export const products: Product[] = defs.map(([name, cat, brand, img, price, stock, specs], i) => {
  const r = seeded(i + 1);
  const mrp = Math.round((price * (1.15 + r * 0.3)) / 10) * 10 - 1;
  return {
    id: `wp-${String(i + 1).padStart(3, "0")}`,
    name,
    brand,
    category: cat,
    image: img,
    images: [img],
    price,
    mrp,
    wholesalePrice: Math.round((price * 0.72) / 10) * 10 - 1,
    moq: moqFor(cat),
    stock: i % 17 === 9 ? 0 : stock,
    rating: Math.round((3.9 + r * 1.0) * 10) / 10,
    reviews: Math.floor(40 + r * 1800),
    warranty: warrantyFor(cat),
    description: descriptionFor(name, cat, brand),
    specs: { Brand: brand, ...specs },
    featured: [0, 2, 3, 6, 8, 14, 16, 22, 38].includes(i),
    createdOrder: i,
  };
});


export const getProduct = (id: string) => products.find((p) => p.id === id);
export const getCategory = (id: string) => categories.find((c) => c.id === id);

export const discountPct = (p: Product) => Math.round(((p.mrp - p.price) / p.mrp) * 100);

export const brands = Array.from(new Set(products.map((p) => p.brand))).sort();

export type SortKey = "popular" | "price-asc" | "price-desc" | "rating" | "newest";

export interface CatalogQuery {
  q?: string;
  category?: CategoryId;
  brand?: string;
  maxPrice?: number;
  inStock?: boolean;
  sort?: SortKey;
}

export function queryCatalog(query: CatalogQuery): Product[] {
  const q = query.q?.trim().toLowerCase();
  let list = products.filter((p) => {
    if (query.category && p.category !== query.category) return false;
    if (query.brand && p.brand !== query.brand) return false;
    if (query.maxPrice && p.price > query.maxPrice) return false;
    if (query.inStock && p.stock <= 0) return false;
    if (q) {
      const hay = `${p.name} ${p.brand} ${p.category} ${Object.values(p.specs).join(" ")}`.toLowerCase();
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  switch (query.sort) {
    case "price-asc":
      list = [...list].sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list = [...list].sort((a, b) => b.price - a.price);
      break;
    case "rating":
      list = [...list].sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      list = [...list].sort((a, b) => b.createdOrder - a.createdOrder);
      break;
    default:
      list = [...list].sort((a, b) => b.reviews - a.reviews);
  }
  return list;
}

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
