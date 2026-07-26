// menu.js — the opening mode menu: name entry, COUCH or PLAY ONLINE.
//
// js/net.js built this DOM inside an IIFE that ran the moment the script
// loaded. It is now mounted explicitly by the browser entry, so the dev harness
// pages that never wanted it can leave it out.
import { cleanName } from '../sim/lobby.js';
import { ensureAudio } from '../render/audio.js';
import { connect } from '../net/client.js';

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

  const nameInput = menu.querySelector('#netname');
  nameInput.value = localStorage.getItem('hs-name-0') || '';
  // typing here must not reach the game's shortcuts (B adds bots, digits set wins…)
  for (const ev of ['keydown', 'keyup']) nameInput.addEventListener(ev, e => e.stopPropagation());
  menu.addEventListener('click', e => {
    const mode = e.target?.dataset?.mode;
    if (!mode) return;
    const typed = cleanName(nameInput.value);
    if (typed) localStorage.setItem('hs-name-0', typed);
    globalThis.nameSetViaMenu = true; // the menu was player 1's name UI — lobby must not re-open an edit
    ensureAudio();
    if (mode === 'couch') { menu.remove(); return; }
    connect({
      status(text) { const el = statusEl(); if (el) el.textContent = text; },
      welcome() { menu.remove(); },
    });
  });
}
