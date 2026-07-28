// menu.js — the opening mode menu: name entry, COUCH or PLAY ONLINE, and then
// the session screen — start one and share its code, or type the code of the
// session already running on this server.
//
// js/net.js built this DOM inside an IIFE that ran the moment the script
// loaded. It is now mounted explicitly by the browser entry, so the dev harness
// pages that never wanted it can leave it out.
import { cleanName } from '../sim/lobby.js';
import { ensureAudio } from '../render/audio.js';
import { connect, hostSession, joinSession } from '../net/client.js';

function btnCss(color) {
  return `min-width:420px;padding:14px 26px;font-family:Georgia,serif;font-size:18px;cursor:pointer;background:transparent;border:2px solid ${color};color:${color};border-radius:8px;`;
}

export function mountMenu() {
  // js/net.js's IIFE bailed out on file:// — a double-clicked page went straight
  // to the couch lobby and never saw the online menu. Keep it that way.
  if (typeof location === 'undefined' || !location.protocol.startsWith('http')) return;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return;
  const menu = document.createElement('div');
  menu.id = 'netmenu';
  menu.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;gap:14px;align-items:center;justify-content:center;background:rgba(13,10,20,0.92);z-index:10;font-family:Georgia,serif;';
  const logoLetters = [...'HYPERSPELL']
    .map((ch, i) => `<span style="animation-delay:${(i * 0.13).toFixed(2)}s">${ch}</span>`).join('');
  menu.innerHTML = `
    <style>
      #hslogo { display:flex; font: italic 900 64px Georgia, serif; letter-spacing:.05em;
        filter: drop-shadow(0 0 18px rgba(165,94,234,.8)); animation: hsglow 2.4s ease-in-out infinite; }
      #hslogo span {
        background: linear-gradient(180deg, #bfe8ff 0%, #e8d5ff 44%, #5d3a8f 50%, #ff6b81 56%, #ffd166 100%);
        -webkit-background-clip: text; background-clip: text; color: transparent;
        animation: hsfloat 2.6s ease-in-out infinite;
      }
      @keyframes hsfloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
      @keyframes hsglow {
        0%,100% { filter: drop-shadow(0 0 12px rgba(165,94,234,.55)) }
        50% { filter: drop-shadow(0 0 26px rgba(165,94,234,.95)) }
      }
      #hstag { color:#9ef0f0; font-size:15px; letter-spacing:.3em; margin-bottom:12px;
        text-shadow: 0 0 10px rgba(158,240,240,.8); animation: hsflicker 3.7s linear infinite; }
      @keyframes hsflicker {
        0%,7%,9%,53%,56%,100% { opacity: 1 } 8%, 54.5% { opacity: .35 }
      }
    </style>
    <div id="hslogo">${logoLetters}</div>
    <div id="hstag">WIZARDS · PHYSICS · VIOLENCE</div>
    <input id="netname" maxlength="12" placeholder="YOUR WIZARD NAME" autocomplete="off"
      style="min-width:380px;padding:12px 20px;font-family:Georgia,serif;font-size:17px;text-align:center;background:transparent;border:2px solid #675a7d;color:#e8d5ff;border-radius:8px;text-transform:uppercase;outline:none;">
    <button data-mode="couch" style="${btnCss('#4ecdc4')}">COUCH — everyone on this computer</button>
    <button data-mode="online" style="${btnCss('#ffd166')}">PLAY ONLINE — join the match on this server</button>
    <div id="netstatus" style="color:#675a7d;font-size:13px;margin-top:10px"></div>`;
  document.body.appendChild(menu);
  const statusEl = () => document.getElementById('netstatus');
  const setStatus = (text) => { const el = statusEl(); if (el) el.textContent = text; };

  const nameInput = menu.querySelector('#netname');
  nameInput.value = localStorage.getItem('hs-name-0') || '';
  // typing here must not reach the game's shortcuts (B adds bots, digits set wins…)
  for (const ev of ['keydown', 'keyup']) nameInput.addEventListener(ev, e => e.stopPropagation());

  // An invite link carries the code (?code=ABC-DEF), and a mid-match refresh
  // remembers the one this tab was in. Either way the player should not have to
  // type six characters they were handed.
  const urlCode = new URLSearchParams(location.search).get('code') || '';
  let storedCode = '';
  try { storedCode = sessionStorage.getItem('hs-code') || ''; } catch {}

  // The second screen lives in its own element so the first one — logo, name,
  // the two mode buttons — is untouched until PLAY ONLINE is clicked.
  const panel = document.createElement('div');
  panel.id = 'hspanel';
  panel.style.cssText = 'display:none;flex-direction:column;gap:12px;align-items:center;';
  menu.appendChild(panel);

  function showSessionScreen(sessionLive) {
    for (const b of menu.querySelectorAll('button[data-mode]')) b.style.display = 'none';
    nameInput.style.display = 'none';
    panel.style.display = 'flex';
    panel.innerHTML = sessionLive
      ? `<div style="color:#9c8ab8;font-size:14px">a session is running on this server — enter its code</div>
         <input id="hscode" maxlength="9" placeholder="ABC-DEF" autocomplete="off"
           style="min-width:280px;padding:12px 20px;font-family:Menlo,monospace;font-size:24px;text-align:center;letter-spacing:.25em;background:transparent;border:2px solid #675a7d;color:#e8d5ff;border-radius:8px;text-transform:uppercase;outline:none;">
         <button data-act="join" style="${btnCss('#ffd166')}">JOIN THE SESSION</button>`
      : `<div style="color:#9c8ab8;font-size:14px">no session is running — start one and share the code</div>
         <button data-act="host" style="${btnCss('#7bd88f')}">START A SESSION</button>`;
    const codeInput = panel.querySelector('#hscode');
    if (!codeInput) return;
    codeInput.value = urlCode || storedCode;
    // same guard the name box needs: a code is letters and digits, and those
    // are the game's lobby shortcuts
    for (const ev of ['keydown', 'keyup']) codeInput.addEventListener(ev, e => e.stopPropagation());
    codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') joinSession(codeInput.value); });
    codeInput.focus();
    if (urlCode) { setStatus('joining…'); joinSession(urlCode); } // an invite link is already an answer
  }

  // the host's own screen: the code, big enough to read across a room
  let inviteLink = '';
  function showCodeScreen(code) {
    inviteLink = `${location.origin}/?code=${encodeURIComponent(code)}`;
    panel.innerHTML = `
      <div style="color:#9c8ab8;font-size:14px">your session is live — share this</div>
      <div id="hscodebig" style="font:900 64px Menlo,monospace;letter-spacing:.15em;color:#ffd166;text-shadow:0 0 22px rgba(255,209,102,.5)"></div>
      <button data-act="copy" style="${btnCss('#4ecdc4')}">COPY THE INVITE LINK</button>
      <button data-act="play" style="${btnCss('#ffd166')}">ENTER THE LOBBY</button>`;
    // textContent, not interpolation: the code arrives over the wire, and a
    // string from the network has no business being parsed as markup
    panel.querySelector('#hscodebig').textContent = `${code.slice(0, 3)}-${code.slice(3)}`;
    setStatus('the code stays on screen in the lobby too');
  }

  panel.addEventListener('click', (e) => {
    const act = e.target?.dataset?.act;
    if (act === 'host') { setStatus('starting a session…'); hostSession(); }
    if (act === 'join') { setStatus('joining…'); joinSession(panel.querySelector('#hscode').value); }
    if (act === 'play') menu.remove();
    if (act === 'copy') {
      navigator.clipboard?.writeText(inviteLink)
        .then(() => { e.target.textContent = 'COPIED — PASTE IT IN SLACK'; })
        .catch(() => { e.target.textContent = inviteLink; }); // no clipboard permission: show it to copy by hand
    }
  });

  menu.addEventListener('click', e => {
    const mode = e.target?.dataset?.mode;
    if (!mode) return;
    const typed = cleanName(nameInput.value);
    if (typed) localStorage.setItem('hs-name-0', typed);
    globalThis.nameSetViaMenu = true; // the menu was player 1's name UI — lobby must not re-open an edit
    ensureAudio();
    if (mode === 'couch') { menu.remove(); return; }
    setStatus('connecting…');
    connect({
      status: setStatus,
      welcome: ({ sessionLive }) => showSessionScreen(sessionLive),
      // a session this tab did not mint means we are in and playing; one it did
      // mint shows the code first
      session: ({ code, host }) => { if (host) showCodeScreen(code); else menu.remove(); },
      sessionState: ({ live }) => showSessionScreen(live),
      denied: (reason) => setStatus(
        reason === 'exists' ? 'someone else just started one — enter their code'
        : reason === 'code' ? 'that code does not match — check it and try again'
        : reason === 'full' ? 'the match is full — you are watching'
        : 'no session is running yet'),
    });
  });
}
