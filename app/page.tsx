"use client";

import { useEffect } from "react";
import Link from "next/link";

const LANDING_CSS = `:root {
  --gold: #D19900;
  --gold-dim: #D1990040;
  --gold-glow: #D1990012;
  --bg: #0D0D0D;
  --bg-card: #131313;
  --bg-card-hover: #1A1A1A;
  --white: #F5F5F0;
  --gray: #7A7A7A;
  --gray-light: #A8A8A0;
  --red: #E74C3C;
  --font-mono: 'DM Mono', monospace;
  --font-sans: 'DM Sans', sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html {
  scroll-behavior: smooth;
  background: var(--bg);
  color: var(--white);
  font-family: var(--font-sans);
  overflow-x: hidden;
}

.noise {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 1;
  opacity: 0.012;
  pointer-events: none;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 128px;
}

.content {
  position: relative;
  z-index: 2;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

/* === NAV === */
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0;
  max-width: 1100px;
  margin: 0 auto;
  padding-left: 24px;
  padding-right: 24px;
}

.nav-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: transparent;
  transition: background 0.3s, box-shadow 0.3s;
}

.nav-wrap.scrolled {
  background: var(--bg);
  box-shadow: 0 1px 0 #ffffff08;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.nav-logo img { width: 32px; height: 32px; }

.nav-logo span {
  font-family: var(--font-mono);
  font-size: 17px;
  font-weight: 500;
  color: var(--gold);
}

.nav-links {
  display: flex;
  gap: 28px;
  align-items: center;
}

.nav-links a {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--gray);
  text-decoration: none;
  transition: color 0.3s;
}

.nav-links a:hover { color: var(--gold); }

.nav-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--gold);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.nav-status .dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--gold);
  animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* === HERO: full-width image with text overlay === */
.hero-full {
  position: relative;
  overflow: hidden;
  cursor: crosshair;
  height: 740px;
}

.hero-full img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
  transform-origin: center;
}

.hero-full .spotlight {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle 220px at 50% 50%, transparent 0%, rgba(13,13,13,0.55) 100%);
  transition: background 0.08s ease;
}

.hero-full .hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(13,13,13,0.85) 0%, rgba(13,13,13,0.4) 50%, transparent 100%);
  pointer-events: none;
}

.hero-full .hero-overlay-bottom {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 200px;
  background: linear-gradient(transparent, var(--bg));
  pointer-events: none;
}

.hero-text-overlay {
  position: absolute;
  bottom: 80px;
  left: 48px;
  max-width: 600px;
  z-index: 3;
}

.hero-text-overlay h1 {
  font-family: var(--font-sans);
  font-size: clamp(36px, 5vw, 60px);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -2px;
  color: var(--white);
  margin-bottom: 20px;
  opacity: 0;
  animation: fade-up 0.8s ease forwards 0.3s;
}

.hero-text-overlay h1 em {
  color: var(--gold);
  font-style: normal;
}

.hero-text-overlay .sub {
  font-size: 17px;
  color: var(--gray-light);
  line-height: 1.65;
  margin-bottom: 32px;
  opacity: 0;
  animation: fade-up 0.8s ease forwards 0.5s;
}

.cta-row {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  opacity: 0;
  animation: fade-up 0.8s ease forwards 0.7s;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* === BUTTONS === */
.btn-primary {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  padding: 14px 32px;
  background: var(--gold);
  color: var(--bg);
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: conic-gradient(from var(--btn-angle, 0deg), var(--gold), #E5AA00, #FFD700, var(--gold));
  z-index: -1;
  animation: btn-glow-rotate 3s linear infinite;
  border-radius: 2px;
}

@keyframes btn-glow-rotate {
  to { --btn-angle: 360deg; }
}

@property --btn-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.btn-primary:hover {
  background: #E5AA00;
  transform: translateY(-1px);
  box-shadow: 0 8px 32px var(--gold-dim), 0 0 20px var(--gold-glow);
}

/* === SCROLL INDICATOR === */
.scroll-indicator {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  text-align: center;
  animation: fade-up 0.8s ease forwards 1.2s;
  opacity: 0;
}

.scroll-indicator span {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--gold);
  opacity: 0.5;
  display: block;
  margin-bottom: 6px;
}

.scroll-chevron {
  width: 20px;
  height: 20px;
  margin: 0 auto;
  border-right: 1.5px solid var(--gold);
  border-bottom: 1.5px solid var(--gold);
  transform: rotate(45deg);
  opacity: 0.4;
  animation: scroll-bounce 2s ease-in-out infinite;
}

@keyframes scroll-bounce {
  0%, 100% { transform: rotate(45deg) translateY(0); opacity: 0.4; }
  50% { transform: rotate(45deg) translateY(6px); opacity: 0.7; }
}



.btn-secondary {
  font-family: var(--font-mono);
  font-size: 14px;
  padding: 14px 32px;
  background: transparent;
  color: var(--gray-light);
  border: 1px solid #ffffff18;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
}

.btn-secondary:hover {
  border-color: var(--gold-dim);
  color: var(--gold);
}

/* === SECTIONS === */
.divider { height: 1px; background: #ffffff06; }
.section { padding: 100px 0; }

.section-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 12px;
}

.section-title {
  font-family: var(--font-sans);
  font-size: clamp(26px, 3.5vw, 38px);
  font-weight: 700;
  color: var(--white);
  letter-spacing: -1px;
  margin-bottom: 56px;
}

/* ===========================
   PROBLEM SECTION — INTERACTIVE
   =========================== */
.problem-section {
  padding: 100px 0 80px;
}

/* Big stat hero */
.problem-hero {
  text-align: center;
  margin-bottom: 64px;
}

.problem-hero .big-stat {
  font-family: var(--font-mono);
  font-size: clamp(48px, 8vw, 96px);
  font-weight: 500;
  color: var(--gold);
  line-height: 1;
  margin-bottom: 8px;
  opacity: 0;
  transform: translateY(20px) scale(0.7);
  filter: blur(8px);
  transition: opacity 1s, transform 1s cubic-bezier(0.16, 1, 0.3, 1), filter 1s;
}

.problem-hero .big-stat.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}

.problem-hero .big-label {
  font-family: var(--font-sans);
  font-size: 22px;
  color: var(--gray-light);
  margin-bottom: 8px;
}

.problem-hero .big-sub {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--gray);
}

/* Animated counter */
.counter-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
  margin-bottom: 64px;
}

.counter-card {
  background: var(--bg-card);
  padding: 40px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.counter-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--red);
  opacity: 0.6;
}

.counter-val {
  font-family: var(--font-mono);
  font-size: 36px;
  font-weight: 500;
  color: var(--white);
  margin-bottom: 8px;
}

.counter-val .unit {
  font-size: 20px;
  color: var(--gray);
}

.counter-label {
  font-size: 13px;
  color: var(--gray);
  line-height: 1.5;
}

/* Pain points — interactive cards */
.pain-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  margin-bottom: 48px;
}

.pain-card {
  background: var(--bg-card);
  padding: 28px 20px;
  text-align: center;
  cursor: default;
  transition: all 0.3s;
  border-bottom: 2px solid transparent;
  position: relative;
}

.pain-card:hover {
  background: var(--bg-card-hover);
  border-bottom-color: var(--red);
}

.pain-card:hover .pain-icon {
  transform: scale(1.15);
  opacity: 1;
}

.pain-icon {
  font-size: 28px;
  margin-bottom: 14px;
  display: block;
  opacity: 0.5;
  transition: all 0.3s;
}

.pain-card h4 {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--white);
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.pain-card p {
  font-size: 12px;
  color: var(--gray);
  line-height: 1.5;
}

/* Bottom line punchline */
.problem-punchline {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 32px;
  border: 1px solid #ffffff08;
  background: var(--bg-card);
  position: relative;
}

.problem-punchline::before {
  content: '';
  position: absolute;
  top: -1px; left: 50%;
  transform: translateX(-50%);
  width: 40px; height: 2px;
  background: var(--gold);
}

.problem-punchline p {
  font-family: var(--font-sans);
  font-size: 18px;
  color: var(--gray-light);
  line-height: 1.6;
}

.problem-punchline strong {
  color: var(--white);
}

.problem-punchline em {
  color: var(--gold);
  font-style: normal;
  font-family: var(--font-mono);
}

/* === HOW IT WORKS — HIGH-TECH === */
.how-it-works {
  padding: 100px 0 80px;
}

.flow-container {
  position: relative;
}

/* Connection line */
.flow-line {
  position: absolute;
  top: 56px;
  left: 80px;
  right: 80px;
  height: 2px;
  background: #ffffff08;
  z-index: 0;
}

.flow-line-progress {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, var(--gold), var(--gold-dim));
  transition: width 1.5s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 12px var(--gold-glow);
}

.flow-line-progress.active { width: 100%; }

.flow-steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  position: relative;
  z-index: 1;
}

.flow-step {
  text-align: center;
  cursor: pointer;
  transition: all 0.4s;
}

.flow-step:hover .flow-node {
  transform: scale(1.1);
  box-shadow: 0 0 0 8px var(--gold-glow), 0 0 32px var(--gold-glow);
}

.flow-step:hover .flow-label {
  color: var(--white);
}

/* Node circle */
.flow-node {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--gold-dim);
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  transition: all 0.4s;
  position: relative;
}

.flow-node.lit {
  border-color: var(--gold);
  box-shadow: 0 0 0 4px var(--gold-glow), 0 0 20px var(--gold-glow);
}

.flow-node-icon {
  font-family: var(--font-mono);
  font-size: 18px;
  color: var(--gold);
  opacity: 0.5;
  transition: opacity 0.3s;
}

.flow-node.lit .flow-node-icon {
  opacity: 1;
}

/* Pulse ring on lit nodes */
.flow-node.lit::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1px solid var(--gold);
  opacity: 0;
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.5); opacity: 0; }
}

.flow-label {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--gold);
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  transition: color 0.3s;
}

.flow-desc {
  font-size: 13px;
  color: var(--gray);
  line-height: 1.55;
  max-width: 200px;
  margin: 0 auto;
}

/* Detail panel */
.flow-detail {
  margin-top: 48px;
  background: var(--bg-card);
  border: 1px solid #ffffff08;
  padding: 32px 40px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 32px;
  align-items: center;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.4s ease;
  min-height: 120px;
}

.flow-detail.visible {
  opacity: 1;
  transform: translateY(0);
}

.flow-detail-num {
  font-family: var(--font-mono);
  font-size: 64px;
  font-weight: 300;
  color: var(--gold);
  opacity: 0.2;
  line-height: 1;
}

.flow-detail-content h3 {
  font-family: var(--font-sans);
  font-size: 20px;
  font-weight: 700;
  color: var(--white);
  margin-bottom: 8px;
}

.flow-detail-content p {
  font-size: 15px;
  color: var(--gray-light);
  line-height: 1.6;
}

.flow-detail-content .tech-tag {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--gold);
  border: 1px solid var(--gold-dim);
  padding: 3px 10px;
  margin-top: 12px;
  margin-right: 6px;
}

/* === PROTOCOLS === */
.protocols-section {
  text-align: center;
  padding: 72px 0;
  border-top: 1px solid #ffffff06;
  border-bottom: 1px solid #ffffff06;
}

.protocols-label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--gray);
  margin-bottom: 28px;
}

.protocols-list {
  display: flex;
  justify-content: center;
  gap: 48px;
  flex-wrap: wrap;
}

.protocol-name {
  font-family: var(--font-mono);
  font-size: 15px;
  color: #ffffff25;
  letter-spacing: 1px;
  transition: color 0.3s;
  cursor: default;
}

.protocol-name:hover { color: var(--gold); }


/* === WAITLIST === */
.waitlist-section {
  text-align: center;
  padding: 120px 0 100px;
}

.waitlist-section h2 {
  font-family: var(--font-sans);
  font-size: clamp(30px, 4.5vw, 48px);
  font-weight: 700;
  color: var(--white);
  letter-spacing: -1.5px;
  margin-bottom: 16px;
}

.waitlist-section .sub {
  font-size: 17px;
  color: var(--gray-light);
  margin-bottom: 40px;
  max-width: 440px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

.waitlist-form {
  display: flex;
  justify-content: center;
  gap: 0;
  max-width: 460px;
  margin: 0 auto;
}

.waitlist-form input {
  flex: 1;
  padding: 16px 20px;
  font-family: var(--font-mono);
  font-size: 14px;
  background: var(--bg-card);
  border: 1px solid #ffffff10;
  border-right: none;
  color: var(--white);
  outline: none;
  transition: border-color 0.3s;
}

.waitlist-form input::placeholder { color: #ffffff25; }
.waitlist-form input:focus { border-color: var(--gold-dim); }

.waitlist-form button {
  padding: 16px 28px;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  background: var(--gold);
  color: var(--bg);
  border: 1px solid var(--gold);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
}

.waitlist-form button:hover { background: #E5AA00; }

.waitlist-note {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--gray);
  margin-top: 14px;
}

/* === FOOTER === */
footer {
  border-top: 1px solid #ffffff06;
  padding: 32px 0;
  text-align: center;
}

.footer-links-row {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 20px;
}

.footer-links-row a {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--gray);
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links-row a:hover { color: var(--gold); }

.footer-copy {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #444;
}

/* === RESPONSIVE === */
@media (max-width: 860px) {
  .hero-full { height: 580px; }
  .hero-text-overlay { left: 24px; max-width: 90%; bottom: 60px; }
  .flow-steps { grid-template-columns: repeat(4, 1fr); gap: 16px; }
  .flow-line { display: none; }
  .flow-detail { grid-template-columns: 1fr; text-align: center; }
  .pain-grid { grid-template-columns: repeat(3, 1fr); }
  .section { padding: 64px 0; }
  /* Prevent scroll from overlapping: reserve space for scrollbar, add top padding under fixed nav */
  html { scrollbar-gutter: stable; }
  .content { padding-right: max(24px, env(safe-area-inset-right)); }
  .problem-section { padding-top: 72px; }
  .scroll-indicator { bottom: 24px; }
}

@media (max-width: 480px) {
  .hero-full { height: 500px; }
  .flow-steps { grid-template-columns: repeat(2, 1fr); gap: 24px; }
  .pain-grid { grid-template-columns: 1fr 1fr; }
  .counter-row { grid-template-columns: 1fr; }
  .waitlist-form { flex-direction: column; }
  .waitlist-form input { border-right: 1px solid #ffffff10; border-bottom: none; }
  .nav-links a:not(:last-child) { display: none; }
  /* More space so hero text and scroll indicator don't overlap on small screens */
  .hero-text-overlay { bottom: 72px; padding-bottom: 8px; }
  .scroll-indicator { bottom: 16px; }
  .problem-section { padding-top: 64px; }
  .content { padding-left: 16px; padding-right: max(16px, env(safe-area-inset-right)); }
}
`;

const FLOW_STEPS = [
  { num: "01", title: "Set Your Constraints", desc: "Three inputs define your strategy: risk tolerance (conservative to aggressive), investment timeline, and capital amount. No jargon. No pool selection. No manual research.", tags: ["3 Inputs", "Intent-based"] },
  { num: "02", title: "Engine Queries & Filters", desc: "Hive queries Solana lending protocols in real-time. The engine filters pools by utilization rate, TVL depth, audit status, and projected yield — then builds your optimal multi-pool allocation.", tags: ["Real-time", "Multi-protocol", "Risk-filtered"] },
  { num: "03", title: "Review Your Allocation", desc: "See exactly where every dollar goes, which protocols, which pools, at what expected APY. The engine explains its rationale. Full transparency before you commit a single dollar.", tags: ["Transparent", "Explainable"] },
  { num: "04", title: "One Signature. Done.", desc: "A single wallet signature executes the entire allocation as one atomic transaction on Solana. All positions deployed simultaneously. Monitor everything from one dashboard.", tags: ["Atomic", "Single-tx", "Solana"] },
];

// Logo: original base64 from HTML; Hero: saved to public/hero-landing.png
const LOGO_SRC = `data:image/png;base64,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`;
const HERO_SRC = "/hero-landing.png";

export default function LandingPage() {
  useEffect(() => {
    const navWrap = document.getElementById("navWrap");
    const heroFull = document.querySelector(".hero-full") as HTMLElement | null;
    const heroHeight = heroFull ? heroFull.offsetHeight : 740;
    const heroImg = document.getElementById("heroImg");
    const container = document.getElementById("heroContainer");
    const spotlight = document.getElementById("spotlight");

    const handleScroll = () => {
      const y = window.scrollY;
      if (navWrap) {
        if (y > 60) navWrap.classList.add("scrolled");
        else navWrap.classList.remove("scrolled");
      }
      if (heroImg && y < heroHeight) {
        heroImg.style.transform = `scale(1.04) translateY(${y * 0.25}px)`;
      }
      const scrollInd = document.querySelector(".scroll-indicator") as HTMLElement | null;
      if (scrollInd) scrollInd.style.opacity = String(Math.max(0, 1 - y / 200));
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!container || !spotlight || !heroImg) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      (spotlight as HTMLElement).style.background = `radial-gradient(circle 220px at ${x}% ${y}%, transparent 0%, rgba(13,13,13,0.55) 100%)`;
      const tiltX = ((x - 50) / 50) * 4;
      const tiltY = ((y - 50) / 50) * -4;
      heroImg.style.transform = `scale(1.04) translate(${tiltX}px, ${tiltY}px)`;
    };

    const handleMouseLeave = () => {
      if (spotlight && heroImg) {
        (spotlight as HTMLElement).style.background = "radial-gradient(circle 220px at 50% 50%, transparent 0%, rgba(13,13,13,0.55) 100%)";
        heroImg.style.transform = "scale(1)";
      }
    };

    function animateBigStat() {
      const el = document.getElementById("bigStat");
      if (!el) return;
      const bigStatEl = el;
      const target = 245;
      const duration = 2000;
      const start = performance.now();
      function update(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        bigStatEl.textContent = "$" + Math.round(eased * target) + "B";
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      bigStatEl.classList.add("visible");
    }

    let currentStep = 0;
    let flowAnimated = false;
    function setFlowStep(idx: number) {
      currentStep = idx;
      const detail = document.getElementById("flowDetail");
      const numEl = document.getElementById("flowDetailNum");
      const contentEl = document.getElementById("flowDetailContent");
      const step = FLOW_STEPS[idx];
      if (!detail || !numEl || !contentEl || !step) return;
      for (let i = 0; i < 4; i++) {
        const node = document.getElementById("node" + i);
        if (node) node.classList.toggle("lit", i <= idx);
      }
      const progress = document.getElementById("flowProgress");
      if (progress) progress.style.width = (idx / 3 * 100) + "%";
      detail.classList.remove("visible");
      setTimeout(() => {
        numEl.textContent = step.num;
        contentEl.innerHTML = "<h3>" + step.title + "</h3><p>" + step.desc + "</p>" + step.tags.map((t: string) => "<span class=\"tech-tag\">" + t + "</span>").join("");
        detail.classList.add("visible");
      }, 150);
    }

    function startFlowAnimation() {
      if (flowAnimated) return;
      flowAnimated = true;
      setFlowStep(0);
      const detail = document.getElementById("flowDetail");
      if (detail) detail.classList.add("visible");
      setTimeout(() => setFlowStep(1), 2500);
      setTimeout(() => setFlowStep(2), 5000);
      setTimeout(() => setFlowStep(3), 7500);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const t = entry.target as HTMLElement;
        t.style.opacity = "1";
        t.style.transform = "translateY(0)";
        if (t.id === "bigStat") animateBigStat();
        if (t.id === "howItWorks") startFlowAnimation();
      });
    }, { threshold: 0.2 });

    const bigStat = document.getElementById("bigStat");
    const howItWorks = document.getElementById("howItWorks");
    if (bigStat) observer.observe(bigStat);
    if (howItWorks) observer.observe(howItWorks);

    document.querySelectorAll(".flow-step").forEach((el) => {
      el.addEventListener("click", () => setFlowStep(parseInt((el as HTMLElement).dataset.step ?? "0")));
    });

    document.querySelectorAll(".pain-card").forEach((el, i) => {
      const h = el as HTMLElement;
      h.style.opacity = "0";
      h.style.transform = "translateY(16px)";
      h.style.transition = "all 0.5s ease";
      h.style.transitionDelay = (i * 0.08) + "s";
      observer.observe(h);
    });

    window.addEventListener("scroll", handleScroll);
    container?.addEventListener("mousemove", handleMouseMove);
    container?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      container?.removeEventListener("mousemove", handleMouseMove);
      container?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleWaitlist = () => {
    const input = document.getElementById("email-input") as HTMLInputElement;
    const msg = document.getElementById("waitlist-msg");
    const btn = document.querySelector(".waitlist-form button") as HTMLButtonElement;
    const email = input?.value?.trim() ?? "";
    if (!email || !email.includes("@") || !email.includes(".")) {
      if (msg) { msg.textContent = "Please enter a valid email."; (msg as HTMLElement).style.color = "#E74C3C"; }
      return;
    }
    if (btn) { btn.textContent = "Submitting..."; btn.disabled = true; }
    const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSeCKM5TfyetqGxtqT7SKsrAM3-G9ebOfgAeOV3WE9GaVTvVBQ/formResponse";
    const formData = new FormData();
    formData.append("entry.530388972", email);
    fetch(formUrl, { method: "POST", mode: "no-cors", body: formData })
      .then(() => {
        if (input) input.value = "";
        if (msg) { msg.innerHTML = "✓ You're on the list. We'll be in touch."; (msg as HTMLElement).style.color = "#2ECC71"; }
        if (btn) { btn.textContent = "Joined ✓"; }
      })
      .catch(() => {
        if (input) input.value = "";
        if (msg) { msg.innerHTML = "✓ You're on the list. We'll be in touch."; (msg as HTMLElement).style.color = "#2ECC71"; }
        if (btn) btn.textContent = "Joined ✓";
      });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700&display=swap" rel="stylesheet" />
      <div className="noise" />
      <div className="nav-wrap" id="navWrap">
        <nav>
          <Link href="/" className="nav-logo">
            <img src={LOGO_SRC} alt="Hive" width={32} height={32} />
            <span>Hive Labs</span>
          </Link>
          <div className="nav-links">
            <a href="https://the-hive-docs.gitbook.io/the-hive-docs/" target="_blank" rel="noopener noreferrer">Docs</a>
            <a href="https://x.com/askthehive_ai" target="_blank" rel="noopener noreferrer">X</a>
            <a href="https://discord.gg/8TVcFvySWG" target="_blank" rel="noopener noreferrer">Discord</a>
            <div className="nav-status"><span className="dot" />Building</div>
          </div>
        </nav>
      </div>
      <div className="hero-full" id="heroContainer">
        <img id="heroImg" src={HERO_SRC} alt="" className="hero-img" />
        <div className="spotlight" id="spotlight" />
        <div className="hero-overlay" />
        <div className="hero-overlay-bottom" />
        <div className="content">
          <div className="hero-text-overlay">
            <h1>The decision engine for <em>digital capital.</em></h1>
            <p className="sub">Idle tokens are a bug. Hive fixes it. Answer 3 questions — risk, timeline, capital. Hive routes your allocation across Solana&apos;s best lending protocols. One signature. Done in 2 minutes.</p>
            <div className="cta-row">
              <a href="#waitlist" className="btn-primary">Join the Waitlist</a>
              <a href="https://the-hive-docs.gitbook.io/the-hive-docs/" target="_blank" rel="noopener noreferrer" className="btn-secondary">Read the Docs</a>
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <span>Scroll</span>
          <div className="scroll-chevron" />
        </div>
      </div>
      <div className="content">
        <section className="problem-section">
          <div className="section-label">The Problem</div>
          <h2 className="section-title">$245B in stablecoins. 85% earning nothing.</h2>
          <div className="problem-hero">
            <div className="big-stat" id="bigStat">$0</div>
            <div className="big-label">in stablecoins earning nothing.</div>
            <div className="big-sub">On Solana alone, $27.6B sits idle — 85.5% undeployed</div>
          </div>
          <div className="pain-grid">
            <div className="pain-card"><span className="pain-icon">◈</span><h4>Fragmented liquidity</h4><p>Capital scattered across protocols. No single view.</p></div>
            <div className="pain-card"><span className="pain-icon">⚙</span><h4>Manual research</h4><p>APY hunting, pool picking, risk checks. Hours per week.</p></div>
            <div className="pain-card"><span className="pain-icon">◇</span><h4>Reallocation friction</h4><p>Moving capital = multiple txs, slippage, gas.</p></div>
            <div className="pain-card"><span className="pain-icon">↯</span><h4>Opaque risk</h4><p>Utilization, audits, TVL — who has the full picture?</p></div>
            <div className="pain-card"><span className="pain-icon">◎</span><h4>Idle capital</h4><p>Stablecoins in wallets earning 0%. The biggest leak.</p></div>
          </div>
          <div className="problem-punchline">
            <p><strong>Bottom line:</strong> DeFi yield is powerful. Getting it is a part-time job. <em>Hive turns that job into a 2-minute flow.</em></p>
          </div>
        </section>
        <div className="divider" />
        <section className="how-it-works" id="howItWorks">
          <div className="section-label">How It Works</div>
          <h2 className="section-title">2 minutes. One interface.</h2>
          <div className="flow-container">
            <div className="flow-line"><div className="flow-line-progress" id="flowProgress" /></div>
            <div className="flow-steps">
              <div className="flow-step" data-step="0"><div className="flow-node" id="node0"><span className="flow-node-icon">⊕</span></div><div className="flow-label">Input</div><div className="flow-desc">Set your risk, timeline, and capital</div></div>
              <div className="flow-step" data-step="1"><div className="flow-node" id="node1"><span className="flow-node-icon">⚡</span></div><div className="flow-label">Engine</div><div className="flow-desc">Real-time protocol query and filtering</div></div>
              <div className="flow-step" data-step="2"><div className="flow-node" id="node2"><span className="flow-node-icon">◈</span></div><div className="flow-label">Allocate</div><div className="flow-desc">Review your personalized allocation</div></div>
              <div className="flow-step" data-step="3"><div className="flow-node" id="node3"><span className="flow-node-icon">✓</span></div><div className="flow-label">Execute</div><div className="flow-desc">One signature. Atomic transaction</div></div>
            </div>
          </div>
          <div className="flow-detail" id="flowDetail">
            <div className="flow-detail-num" id="flowDetailNum">01</div>
            <div className="flow-detail-content" id="flowDetailContent">
              <h3>Set Your Constraints</h3>
              <p>Three inputs define your strategy.</p>
              <span className="tech-tag">3 Inputs</span>
              <span className="tech-tag">Intent-based</span>
            </div>
          </div>
        </section>
        <div className="protocols-section">
          <div className="protocols-label">Routing across Solana&apos;s top protocols</div>
          <div className="protocols-list">
            <span className="protocol-name">Kamino</span>
            <span className="protocol-name">Jupiter</span>
            <span className="protocol-name">Solend</span>
            <span className="protocol-name">Raydium</span>
            <span className="protocol-name">Sanctum</span>
            <span className="protocol-name">+ more</span>
          </div>
        </div>
      </div>
      <div className="content">
        <section className="waitlist-section" id="waitlist">
          <div className="section-label">Early Access</div>
          <h2>Launching April 2026.</h2>
          <p className="sub">Be first in line when Hive goes live on Solana.</p>
          <div className="waitlist-form">
            <input type="email" placeholder="your@email.com" id="email-input" />
            <button type="button" onClick={handleWaitlist}>Join Waitlist →</button>
          </div>
          <div className="waitlist-note" id="waitlist-msg">No spam. Unsubscribe anytime.</div>
        </section>
        <footer>
          <div className="footer-links-row">
            <a href="https://the-hive-docs.gitbook.io/the-hive-docs/" target="_blank" rel="noopener noreferrer">Docs</a>
            <a href="https://x.com/askthehive_ai" target="_blank" rel="noopener noreferrer">X</a>
            <a href="https://discord.gg/8TVcFvySWG" target="_blank" rel="noopener noreferrer">Discord</a>
            <a href="mailto:moshe@askthehive.ai">Contact</a>
          </div>
          <div className="footer-copy">© 2026 Hive Labs &middot; askthehive.ai</div>
        </footer>
      </div>
    </>
  );
}
