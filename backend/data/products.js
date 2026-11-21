// Seed data. Images are static files in frontend/public/products, so they work in development
// and on any static host (Vercel) with no backend involved.
const img = (file) => `/products/${encodeURIComponent(file)}`;

const products = [
  // ---- Mobiles ----
  { title: "iPhone 17 Pro Max", image: img("Iphone-17-pro-max.png"), price: 685000, discountPrice: 649000, category: "mobile", description: "Apple's flagship with a pro-grade camera system, ProMotion display and all-day battery." },
  { title: "iPhone 16 Pro Max", image: img("Iphone-16-pro-max.png"), price: 565000, discountPrice: 529000, category: "mobile", description: "6.9-inch Super Retina XDR display, A18 Pro chip and 5x telephoto camera." },
  { title: "iPhone 14 Pro Max", image: img("Iphone-14-pro-max.png"), price: 395000, discountPrice: 359000, category: "mobile", description: "Dynamic Island, 48MP main camera and A16 Bionic performance." },
  { title: "Samsung Galaxy S24", image: img("samsung-s24.png"), price: 289000, discountPrice: 265000, category: "mobile", description: "Galaxy AI features, bright 120Hz AMOLED display and a versatile triple camera." },
  { title: "Samsung Galaxy S23", image: img("samsung-s23.png"), price: 235000, discountPrice: 215000, category: "mobile", description: "Snapdragon 8 Gen 2 performance in a compact, premium design." },
  { title: "Samsung Galaxy S21", image: img("samsung-s21.png"), price: 165000, discountPrice: 149000, category: "mobile", description: "Reliable 5G flagship with a smooth 120Hz display and great cameras." },
  { title: "Oppo Find X8 Pro", image: img("Oppo-find-x8-pro.png"), price: 335000, discountPrice: 309000, category: "mobile", description: "Hasselblad-tuned dual periscope cameras and ultra-fast charging." },
  { title: "Oppo Reno 13 Pro", image: img("oppo reno 13 pro.png"), price: 169000, discountPrice: 155000, category: "mobile", description: "Portrait-focused camera system with a sleek curved-edge design." },
  { title: "Oppo A3X", image: img("Oppo-A3X.png"), price: 49000, discountPrice: 44900, category: "mobile", description: "Durable, budget-friendly smartphone with a large battery." },

  // ---- Laptops ----
  { title: "MacBook Air M4", image: img("macbook-air-m4.png"), price: 445000, discountPrice: 419000, category: "laptop", description: "Ultra-thin and fanless, powered by Apple's M4 chip with all-day battery life." },
  { title: "MacBook Air M2", image: img("macbook-air-m2.png"), price: 335000, discountPrice: 309000, category: "laptop", description: "13.6-inch Liquid Retina display and M2 performance in a 1.2 kg body." },
  { title: "MacBook Pro", image: img("macbook.png"), price: 595000, discountPrice: 565000, category: "laptop", description: "Pro performance for developers and creators with a stunning mini-LED display." },
  { title: "ASUS ROG Strix Scar 16", image: img("ROG-strix-scar-16.png"), price: 899000, discountPrice: 849000, category: "laptop", description: "Top-tier gaming laptop with a 240Hz display and high-end RTX graphics." },
  { title: "ASUS TUF Gaming F16", image: img("asus-tuf-f16.png"), price: 369000, discountPrice: 345000, category: "laptop", description: "Military-grade durability with RTX graphics for serious gaming." },
  { title: "ASUS Vivobook", image: img("asus-vivobook.png"), price: 189000, discountPrice: 172000, category: "laptop", description: "Slim everyday laptop for study and work with a vivid display." },
  { title: "MSI GL63", image: img("msi-gl-63.png"), price: 319000, discountPrice: 295000, category: "laptop", description: "Entry-level gaming laptop with a fast refresh-rate screen." },
  { title: "MSI Titan GT", image: img("msi-titan-gt.png"), price: 1250000, discountPrice: 1190000, category: "laptop", description: "Desktop-class gaming powerhouse with extreme cooling and performance." },
  { title: "MSI Modern (White)", image: img("msi-gcc.png"), price: 215000, discountPrice: 198000, category: "laptop", description: "Lightweight white-chassis laptop built for productivity on the go." },

  // ---- Accessories ----
  { title: "Apple AirPods Max", image: img("apple-airpods-max.png"), price: 215000, discountPrice: 198000, category: "accessory", description: "High-fidelity over-ear headphones with active noise cancellation and spatial audio." },
  { title: "Sony WH-CH720N", image: img("sony-wh-ch-720n.png"), price: 49500, discountPrice: 44900, category: "accessory", description: "Lightweight wireless headphones with noise cancelling and 35-hour battery." },
  { title: "Bengo G9000 Gaming Headset", image: img("bengoo-g9000.png"), price: 14500, discountPrice: 12900, category: "accessory", description: "RGB gaming headset with a flexible boom mic and immersive sound." },
];

export default products;
