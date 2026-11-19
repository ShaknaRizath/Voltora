import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaTiktok } from "react-icons/fa6";
import { FiMapPin, FiPhone } from "react-icons/fi";
import Logo from "./Logo";

const socials = [
  { label: "Facebook", Icon: FaFacebookF },
  { label: "Instagram", Icon: FaInstagram },
  { label: "WhatsApp", Icon: FaWhatsapp },
  { label: "TikTok", Icon: FaTiktok },
];

const stores = [
  { address: "182 Colombo - Galle Main Rd, Colombo 4", phone: "+94 77 017 6666" },
  { address: "No 500, Peradeniya Road, Kandy", phone: "+94 77 109 4444" },
];

const Col = ({ title, links }) => (
  <div>
    <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
    <ul className="mt-4 space-y-3">
      {links.map(([to, label]) => (
        <li key={label}>
          <Link to={to} className="text-sm text-zinc-500 transition hover:text-zinc-900">
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 bg-white">
      <div className="container-page grid gap-12 py-14 md:grid-cols-12">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
            Phones, laptops and accessories, backed by genuine warranty checks and an in-house repair centre.
          </p>
          <ul className="mt-6 space-y-4">
            {stores.map((s) => (
              <li key={s.phone} className="text-sm text-zinc-600">
                <span className="flex items-start gap-2">
                  <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  {s.address}
                </span>
                <span className="mt-1 flex items-center gap-2">
                  <FiPhone className="h-4 w-4 shrink-0 text-zinc-400" />
                  {s.phone}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 md:col-span-7 md:grid-cols-3">
          <Col
            title="Shop"
            links={[
              ["/home#mobile", "Mobiles"],
              ["/home#laptop", "Laptops"],
              ["/home#accessories", "Accessories"],
              ["/cart", "Cart"],
            ]}
          />
          <Col
            title="Services"
            links={[
              ["/repair", "Repairs"],
              ["/view-repair-images", "Before & after gallery"],
              ["/warranty-validate", "Warranty check"],
            ]}
          />
          <Col
            title="Account"
            links={[
              ["/login", "Sign in"],
              ["/register", "Create account"],
              ["/order-history", "My orders"],
              ["/my-warranties", "My warranties"],
              ["/profile", "Profile"],
            ]}
          />
        </div>
      </div>

      <div className="border-t border-zinc-100">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-sm text-zinc-500">© {new Date().getFullYear()} Voltora. All rights reserved.</p>
          <div className="flex items-center gap-2">
            {socials.map(({ label, Icon }) => (
              <span
                key={label}
                role="img"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-600"
              >
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
