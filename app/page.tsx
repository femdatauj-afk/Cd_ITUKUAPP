"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import logoImage from "../ITUKUAPP LOGO.png";
import homepagePreview from "../ITUKUAPP HOMEPAGE.png";
import developerPortrait from "../HENRY-OF-ITUKU PICTURE.jpeg";

const villages = ["Amokolo", "Umukulu", "Ugwunagbo", "Okwenachala", "Ofeinyi", "Amata", "Umunevonta", "Umuowoh", "Umuonyiba"];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="landing-page">
      <nav className="landing-nav-new">
        <Link className="brand" href="#top"><Image src={logoImage} alt="ItukuApp logo" width={42} height={42} className="brand-logo" /><span>Ituku<span>App</span></span></Link>
        <div className="nav-icons">
          <a href="#top" title="Home" aria-label="Home"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M9 20v-7h6v7"/></svg></a>
          <a href="#" title="Friends" aria-label="Friends"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1"/><circle cx="10" cy="7" r="3.5"/><path d="M20 19v-1a4 4 0 0 0-3-3.87"/><path d="M16 4.13a4 4 0 0 1 0 7.74"/></svg></a>
          <a href="#" title="Inbox" aria-label="Inbox"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"/><path d="M4 9.5h5.5l2 2.5h1l2-2.5H20"/></svg></a>
          <a href="#" title="Notifications" aria-label="Notifications"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></a>
          <button className="nav-search" title="Search" aria-label="Search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="5.5"/><path d="m16 16 4.5 4.5"/></svg></button>
        </div>
        <div className="nav-menu-wrapper">
          <button className="nav-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
          {menuOpen && (
            <div className="nav-dropdown">
              <a href="#about">About</a>
              <a href="#villages">Villages</a>
              <a href="#community">Community</a>
              <hr />
              <a href="/feed">Dashboard</a>
              <a href="/profile">Friends</a>
              <a href="/chat">Videos</a>
              <a href="/feed">Birthdays</a>
              <a href="/communities">Events</a>
              <a href="/marketplace">Marketplace</a>
              <a href="/pages">Pages</a>
              <a href="/groups">Groups</a>
              <a href="/about">Settings & Privacy</a>
              <hr />
              <a href="/auth/register">Add account</a>
              <a href="/auth/login">Log in</a>
            </div>
          )}
        </div>
      </nav>
      <section className="hero-section" id="top">
        <div className="hero-copy"><p className="eyebrow">THE OFFICIAL DIGITAL PLATFORM</p><h1>One Community.<br /><em>Nine Villages.</em><br />One Voice.</h1><p className="intro">A welcoming digital home where Ituku people can connect, share opportunities, celebrate progress and build a stronger community together.</p><div className="hero-actions"><Link className="button" href="/auth/register">Create your account <span>→</span></Link><Link className="text-link" href="/feed">Open the community feed <span>↓</span></Link></div><div className="trust"><div className="faces"><i>AO</i><i>CN</i><i>EU</i></div><p><strong>Built for Ituku people</strong><br />at home and around the world.</p></div></div>
        <div className="hero-media"><Image src={homepagePreview} alt="ItukuApp homepage preview" fill className="hero-image" priority /></div>
      </section>
      <section className="village-section" id="villages"><p className="eyebrow">OUR COMMUNITY</p><h2>Nine villages, beautifully connected.</h2><div className="villages">{villages.map((village, index) => <div className="village" key={village}><span>0{index + 1}</span>{village}</div>)}</div></section>
      <section className="features" id="community"><div><p className="eyebrow">A PLACE TO BELONG</p><h2>Everything your community needs, in one place.</h2></div><div className="feature-grid"><article className="feature-card"><span>◌</span><h3>Connect</h3><p>Share news, moments and conversations with people who understand home.</p></article><article className="feature-card"><span>⌁</span><h3>Grow</h3><p>Discover local businesses, opportunities and community projects.</p></article><article className="feature-card"><span>✦</span><h3>Celebrate</h3><p>Keep culture, stories and the spirit of Ituku close—wherever you are.</p></article></div></section>
      <section className="spotlight-card" id="about"><div><p className="eyebrow">FOUNDER SPOTLIGHT</p><h2>Meet the voice behind the community.</h2><p>Henry brings the practical energy of Ituku to every conversation, helping members discover opportunity, connection and belonging in one safe space.</p><Link className="button" href="/auth/register">Create your account <span>→</span></Link></div><div className="spotlight-portrait"><Image src={developerPortrait} alt="Henry of Ituku" fill className="spotlight-image" /></div></section>
      <section className="join" id="join"><p className="eyebrow">YOUR COMMUNITY IS WAITING</p><h2>Come home to your<br /><em>community.</em></h2><p>Create a free account and find your place in the Ituku story.</p><Link className="button gold" href="/auth/register">Join ItukuApp <span>→</span></Link></section>
      <footer><div className="brand"><Image src={logoImage} alt="ItukuApp logo" width={32} height={32} className="brand-logo" /><span>Ituku<span>App</span></span></div><p>One Community. Nine Villages. One Voice.</p><div className="footer-links"><a href="#about">About</a><a href="#">Privacy</a><a href="#">Terms</a><a href="mailto:Henry4683328@gmail.com">Support</a></div><small>© 2026 ItukuApp. Built with pride for Ituku Community.</small></footer>
    </main>
  );
}
