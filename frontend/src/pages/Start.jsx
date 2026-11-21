import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiCpu,
  FiMessageCircle,
  FiShield,
  FiShoppingBag,
  FiTool,
} from "react-icons/fi";

const phone = "/products/Iphone-18-pro-max.png";
const laptop = "/products/macbook-air-m4.png";
const airpods = "/products/apple-airpods-max.png";
const samsung = "/products/samsung-s-pen.png";
const rog = "/products/ROG-strix-scar-16.png";
const bengo = "/products/bengoo-g9000.png";

const categories = [
  { title: "Mobiles", hash: "mobile", img: phone, blurb: "iPhone, Samsung, Oppo" },
  { title: "Laptops", hash: "laptop", img: laptop, blurb: "MacBook, ASUS, MSI" },
  { title: "Accessories", hash: "accessories", img: airpods, blurb: "Headphones & more" },
];

const features = [
  {
    icon: FiShoppingBag,
    title: "Shop with confidence",
    text: "Genuine devices at honest prices, with secure Stripe checkout.",
  },
  {
    icon: FiShield,
    title: "Warranty checker",
    text: "Verify coverage in seconds with a serial number or QR code.",
  },
  {
    icon: FiTool,
    title: "Trusted repairs",
    text: "Certified technicians, original parts and same-day turnaround for most devices.",
  },
  {
    icon: FiMessageCircle,
    title: "AI assistant",
    text: "Get product suggestions and repair answers any time from our chat assistant.",
  },
];

const repairSteps = [
  "Bring or send your device to our service centre",
  "Receive a free diagnosis and repair quote",
  "Track repair progress online with your repair ID",
  "Pick up or get it delivered to your door",
];

const covered = [
  "Smartphones: screen, battery, charging port, camera",
  "Laptops: keyboard, display, hardware upgrades",
  "Tablets & accessories: connectivity issues, replacement",
  "Water damage diagnosis and recovery",
];

// Same <Link>, now animatable. Colours and sizes still come from the .btn classes.
const MotionLink = motion.create(Link);

export default function Start() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-gradient-to-b from-brand-50 via-white to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-[-12rem] -z-10 h-[32rem] w-[48rem] -translate-x-1/2 rounded-full bg-brand-200/50 blur-[120px]" />

        <div className="container-page grid items-center gap-12 pb-16 pt-14 lg:grid-cols-2 lg:pb-24 lg:pt-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-soft ring-1 ring-brand-100">
              <FiCpu className="h-3.5 w-3.5" /> New arrivals now in stock
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] text-zinc-900 sm:text-6xl">
              Smart tech,
              <br />
              <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">
                expertly looked after.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-600">
              Buy the latest phones, laptops and accessories, then keep them running with warranty checks and an
              in-house repair centre.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <MotionLink
                to="/home"
                className="btn btn-primary btn-lg !transition-colors"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.25, ease: "easeOut" }}
                whileHover={{ y: -2, scale: 1.03, transition: { type: "spring", stiffness: 700, damping: 30 } }}
                whileTap={{ scale: 0.96, transition: { duration: 0.06 } }}
              >
                Shop now
              </MotionLink>
              <MotionLink
                to="/repair"
                className="btn btn-secondary btn-lg !transition-colors"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.25, ease: "easeOut" }}
                whileHover={{ y: -2, scale: 1.03, transition: { type: "spring", stiffness: 700, damping: 30 } }}
                whileTap={{ scale: 0.96, transition: { duration: 0.06 } }}
              >
                Book a repair
              </MotionLink>
            </div>
          </div>

          {/* Product collage */}
          <div className="relative mx-auto grid w-full max-w-lg grid-cols-2 gap-7">
            {[
              { img: phone, label: "iPhone 18 Pro Max", anim: "animate-float-down" },
              { img: laptop, label: "MacBook Air M4", anim: "animate-float-down" },
              { img: rog, label: "ROG Strix Scar 16", anim: "animate-float-up" },
              { img: samsung, label: "Samsung Galaxy with S Pen", anim: "animate-float-up" },
            ].map(({ img, label, anim }) => (
              <div
                key={label}
                // Same duration and phase for all four, so they move together.
                className={`card ${anim} overflow-hidden`}
              >
                <div className="aspect-square bg-zinc-100">
                  <img
                    src={img}
                    alt={label}
                    fetchPriority="high"
                    decoding="async"
                    className="h-full w-full object-contain p-4 mix-blend-multiply"
                  />
                </div>
                <p className="px-4 py-3 text-sm font-semibold text-zinc-800">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow mb-2">Browse</p>
            <h2 className="text-3xl font-bold sm:text-4xl">Shop by category</h2>
          </div>
          <Link to="/home" className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 sm:inline-flex">
            View all
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.title}
              to={`/home#${c.hash}`}
              className="group card relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <h3 className="text-xl font-semibold">{c.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">{c.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                Explore
              </span>
              <div className="mt-4 aspect-[4/3] rounded-xl bg-zinc-100">
                <img
                  src={c.img}
                  alt={c.title}
                  className="h-full w-full object-contain p-4 mix-blend-multiply transition duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container-page py-16">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="eyebrow mb-2">Why Voltora</p>
          <h2 className="text-3xl font-bold sm:text-4xl">Everything for your devices, in one place</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <Icon className="h-9 w-9 text-zinc-900" strokeWidth={1.25} aria-hidden="true" />
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Repair band */}
      <section className="container-page py-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-zinc-950 px-6 py-14 text-white sm:px-12 lg:px-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand-600/40 blur-[110px]" />
          <div className="relative grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-brand-300">Repair centre</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Broken screen? Dead battery? We've got it.</h2>
              <ul className="mt-6 space-y-3">
                {covered.map((c) => (
                  <li key={c} className="flex items-start gap-3 text-zinc-300">
                    <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                    {c}
                  </li>
                ))}
              </ul>
              <Link to="/repair" className="btn btn-lg mt-8 bg-white text-zinc-900 hover:bg-zinc-100">
                Start a repair
              </Link>
            </div>

            <ol className="space-y-4">
              {repairSteps.map((s, i) => (
                <li key={s} className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 font-bold">
                    {i + 1}
                  </span>
                  <span className="text-zinc-200">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-20 text-center">
        <img src={bengo} alt="" className="mx-auto h-28 w-28 object-contain mix-blend-multiply" />
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Ready to upgrade?</h2>
        <p className="mx-auto mt-3 max-w-md text-zinc-500">Browse the full catalogue and add your favourites to the cart.</p>
        <Link to="/home" className="btn btn-primary btn-lg mt-8">
          Go to the shop
        </Link>
      </section>
    </div>
  );
}
