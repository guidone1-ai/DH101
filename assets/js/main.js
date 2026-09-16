/**
 * EVA GUIDONE // DH101 ARCHIVE
 * JavaScript for Interactive Noir Vinyl Experience & Markdown Reader
 */

document.addEventListener('DOMContentLoaded', () => {
  initFilterTabs();
  initReaderModal();
  initVinylAmbience();
  initActiveNavHighlight();
});

/* ==========================================================================
   1. TRACKLIST FILTERING (All, Side A: Makes, Side B: Reflections)
   ========================================================================== */
function initFilterTabs() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const trackRows = document.querySelectorAll('.track-row');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      trackRows.forEach(row => {
        const rowCategory = row.getAttribute('data-category');
        if (filterValue === 'all' || rowCategory === filterValue) {
          row.style.display = 'grid';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   2. INTERACTIVE MARKDOWN READER MODAL
   ========================================================================== */
function initReaderModal() {
  const modal = document.getElementById('readerModal');
  const modalTitle = document.getElementById('readerTitle');
  const modalBadge = document.getElementById('readerBadge');
  const modalContent = document.getElementById('readerContent');
  const closeBtn = document.getElementById('closeReaderBtn');
  const triggerLinks = document.querySelectorAll('[data-doc-path]');

  function openReader(path, label, badge) {
    modalBadge.textContent = badge || 'DH101 LINER NOTES';
    modalTitle.textContent = label || 'Reading Document';
    modalContent.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 0; gap:16px;">
        <div class="sound-bars" style="height:24px;">
          <div class="sound-bar" style="width:4px; height:12px; animation: soundPulse 0.8s infinite alternate;"></div>
          <div class="sound-bar" style="width:4px; height:20px; animation: soundPulse 0.5s infinite alternate 0.2s;"></div>
          <div class="sound-bar" style="width:4px; height:16px; animation: soundPulse 0.9s infinite alternate 0.4s;"></div>
        </div>
        <p style="font-family:var(--font-mono); font-size:0.8rem; letter-spacing:0.2em; text-transform:uppercase; color:var(--text-muted);">
          Loading track data...
        </p>
      </div>
    `;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Fetch markdown file
    fetch(path)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Could not load ${path} (Status ${response.status})`);
        }
        return response.text();
      })
      .then(text => {
        const parsedHtml = parseMarkdownToHtml(text);
        modalContent.innerHTML = `
          <div class="markdown-render">
            ${parsedHtml}
          </div>
        `;
      })
      .catch(err => {
        modalContent.innerHTML = `
          <div class="markdown-render">
            <h2 style="font-family:var(--font-serif); margin-bottom:12px;">Document Preview</h2>
            <p>Could not fetch file directly over local file protocol. You can view this file in the repository at <code>${path}</code> or serve locally with a web server.</p>
            <p style="color:var(--text-faint); font-family:var(--font-mono); font-size:0.8rem;">Details: ${err.message}</p>
          </div>
        `;
      });
  }

  function closeReader() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  triggerLinks.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const path = trigger.getAttribute('data-doc-path');
      const title = trigger.getAttribute('data-doc-title') || trigger.innerText;
      const badge = trigger.getAttribute('data-doc-badge') || 'TRACK DOCUMENTATION';
      openReader(path, title, badge);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeReader);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeReader();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeReader();
    }
  });
}

/* ==========================================================================
   3. LIGHTWEIGHT ROBUST CLIENT-SIDE MARKDOWN PARSER
   ========================================================================== */
function parseMarkdownToHtml(md) {
  if (!md) return '';

  let html = md;

  // Escape basic HTML entities inside inline codes later, but preserve markdown
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Code blocks (triple backtick)
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Blockquotes
  html = html.replace(/^\s*&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Horizontal Rules
  html = html.replace(/^\s*---+\s*$/gm, '<hr />');

  // Bold & Italics
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.*?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure><img src="$2" alt="$1" style="max-width:100%; border-radius:6px; margin:16px 0; border:1px solid var(--border-medium);" /><figcaption style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">$1</figcaption></figure>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Task lists
  html = html.replace(/^\s*-\s+\[ \]\s+(.*)$/gm, '<li style="list-style:none;">&#9634; $1</li>');
  html = html.replace(/^\s*-\s+\[x\]\s+(.*)$/gm, '<li style="list-style:none;">&#9632; $1</li>');

  // Unordered list items (- or *)
  html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  // Clean up nested <ul><ul> from naive regex
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  // Paragraphs: split by double newlines
  const paragraphs = html.split(/\n{2,}/);
  html = paragraphs.map(p => {
    const trimmed = p.trim();
    if (!trimmed) return '';
    // If it already starts with a block tag, leave it
    if (/^<(h[1-6]|ul|ol|pre|blockquote|figure|hr)/i.test(trimmed)) {
      return trimmed;
    }
    // Convert single newlines inside paragraph to <br /> if two spaces or just standard linebreaks
    const withBreaks = trimmed.replace(/\n/g, '<br />');
    return `<p>${withBreaks}</p>`;
  }).join('\n\n');

  return html;
}

/* ==========================================================================
   4. KWN — "BACK OF THE CLUB (INSTRUMENTAL)" VINYL PLAYER
   Plays the authentic studio instrumental audio directly via HTML5 Audio
   with real-time vinyl rotation and synchronized UI equalizer.
   ========================================================================== */
function initVinylAmbience() {
  const toggleBtn = document.getElementById('ambienceToggleBtn');
  const heroPlayBtn = document.getElementById('heroPlayBtn');
  const vinylDiscTrigger = document.getElementById('vinylDiscTrigger');
  const vinylRecord = document.getElementById('vinylRecord');
  const vinylBar = document.getElementById('vinylPlayerBar');
  const localAudio = document.getElementById('localTrackAudio');

  let isPlaying = false;
  let audioMode = 'none'; // 'local' or 'synth'
  let synthContext = null;
  let synthInterval = null;
  let crackleInterval = null;

  function setUIState(active) {
    isPlaying = active;
    
    // Toggle play/pause buttons & icons
    if (heroPlayBtn) {
      const playIcon = heroPlayBtn.querySelector('.play-icon');
      const pauseIcon = heroPlayBtn.querySelector('.pause-icon');
      if (playIcon && pauseIcon) {
        playIcon.style.display = active ? 'none' : 'block';
        pauseIcon.style.display = active ? 'block' : 'none';
      }
    }

    if (toggleBtn) {
      const label = toggleBtn.querySelector('.btn-label');
      if (active) {
        toggleBtn.classList.add('playing');
        if (label) label.textContent = 'Playing: kwn — back of the club';
      } else {
        toggleBtn.classList.remove('playing');
        if (label) label.textContent = 'kwn • back of the club';
      }
    }

    if (vinylRecord) {
      if (active) {
        vinylRecord.classList.add('playing');
      } else {
        vinylRecord.classList.remove('playing');
      }
    }

    if (vinylDiscTrigger) {
      if (active) {
        vinylDiscTrigger.classList.add('playing');
      } else {
        vinylDiscTrigger.classList.remove('playing');
      }
    }

    if (vinylBar) {
      if (active) {
        vinylBar.classList.add('playing');
      } else {
        vinylBar.classList.remove('playing');
      }
    }
  }

  async function playAudio() {
    if (localAudio) {
      try {
        await localAudio.play();
        audioMode = 'local';
        setUIState(true);
        return;
      } catch (err) {
        console.warn('Direct local audio play failed, activating Web Audio fallback:', err);
      }
    }

    // Smooth Web Audio Fallback (G# minor R&B chords @ 114 BPM + vinyl warmth)
    startRnBSynthFallback();
    audioMode = 'synth';
    setUIState(true);
  }

  function pauseAudio() {
    if (localAudio) {
      localAudio.pause();
    }
    if (audioMode === 'synth') {
      stopRnBSynthFallback();
    }
    setUIState(false);
  }

  function togglePlay() {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }

  // Event Listeners for All Play Triggers
  if (toggleBtn) {
    toggleBtn.addEventListener('click', togglePlay);
  }

  if (heroPlayBtn) {
    heroPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });
  }

  if (vinylDiscTrigger) {
    vinylDiscTrigger.addEventListener('click', togglePlay);
  }

  if (localAudio) {
    localAudio.addEventListener('play', () => setUIState(true));
    localAudio.addEventListener('pause', () => setUIState(false));
    localAudio.addEventListener('ended', () => setUIState(false));
  }

  // --- Web Audio Synthesizer: kwn "back of the club" G#m Vibe Fallback ---
  function startRnBSynthFallback() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      synthContext = new AudioContext();

      // Master Gain
      const masterGain = synthContext.createGain();
      masterGain.gain.setValueAtTime(0.22, synthContext.currentTime);

      // Lowpass Filter for warm, moody R&B tone
      const filter = synthContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 650;
      filter.connect(masterGain);
      masterGain.connect(synthContext.destination);

      // Soft Vinyl Surface Rumble Buffer
      const bufferSize = synthContext.sampleRate * 2;
      const noiseBuffer = synthContext.createBuffer(1, bufferSize, synthContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.04;
        b1 = 0.95 * b1 + white * 0.04;
        b2 = 0.85 * b2 + white * 0.04;
        output[i] = (b0 + b1 + b2) * 0.03;
      }
      const noiseNode = synthContext.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;
      const noiseGain = synthContext.createGain();
      noiseGain.gain.value = 0.15;
      noiseNode.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseNode.start();

      // "Back of the Club" Chord Progression in G# minor / B Major
      // Chords: G#m9 (G#3, B3, D#4, F#4, A#4) -> Emaj9 (E3, G#3, B3, D#4) -> F#sus (F#3, B3, C#4, E4) -> D#m7 (D#3, F#3, A#3, C#4)
      const chordNotes = [
        [207.65, 246.94, 311.13, 369.99, 466.16], // G#m9
        [164.81, 207.65, 246.94, 311.13, 392.00], // Emaj9
        [185.00, 246.94, 277.18, 329.63, 415.30], // F#sus
        [155.56, 185.00, 233.08, 277.18, 369.99]  // D#m7
      ];

      let chordIndex = 0;
      const beatDuration = (60 / 114) * 4 * 1000; // 4 beats per chord at 114 BPM

      function playNextChord() {
        if (!synthContext || synthContext.state === 'closed') return;
        const now = synthContext.currentTime;
        const currentChord = chordNotes[chordIndex];

        currentChord.forEach(freq => {
          const osc = synthContext.createOscillator();
          const noteGain = synthContext.createGain();

          osc.type = 'sine'; // Silky electric piano / Rhodes sine tone
          osc.frequency.setValueAtTime(freq, now);

          // Subtle detune for lush chorus effect
          osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

          // Attack - Decay - Sustain - Release envelope
          noteGain.gain.setValueAtTime(0.0001, now);
          noteGain.gain.exponentialRampToValueAtTime(0.04, now + 0.08);
          noteGain.gain.exponentialRampToValueAtTime(0.015, now + 1.2);
          noteGain.gain.exponentialRampToValueAtTime(0.0001, now + (beatDuration / 1000));

          osc.connect(noteGain);
          noteGain.connect(filter);

          osc.start(now);
          osc.stop(now + (beatDuration / 1000));
        });

        // Sub bass kick / pulse on 1
        const subOsc = synthContext.createOscillator();
        const subGain = synthContext.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(chordIndex === 0 ? 51.91 : chordIndex === 1 ? 41.20 : 46.25, now);
        subGain.gain.setValueAtTime(0.08, now);
        subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        subOsc.connect(subGain);
        subGain.connect(masterGain);
        subOsc.start(now);
        subOsc.stop(now + 0.85);

        chordIndex = (chordIndex + 1) % chordNotes.length;
      }

      playNextChord();
      synthInterval = setInterval(playNextChord, beatDuration);

      // Micro Vinyl Needle Pops
      crackleInterval = setInterval(() => {
        if (!synthContext || synthContext.state === 'closed') return;
        if (Math.random() > 0.4) {
          const popOsc = synthContext.createOscillator();
          const popGain = synthContext.createGain();
          popOsc.type = 'triangle';
          popOsc.frequency.setValueAtTime(900 + Math.random() * 1400, synthContext.currentTime);
          popGain.gain.setValueAtTime(0.012 + Math.random() * 0.015, synthContext.currentTime);
          popGain.gain.exponentialRampToValueAtTime(0.0001, synthContext.currentTime + 0.012);
          popOsc.connect(popGain);
          popGain.connect(masterGain);
          popOsc.start();
          popOsc.stop(synthContext.currentTime + 0.015);
        }
      }, 140);

    } catch (e) {
      console.warn('Web Audio R&B synth error:', e);
    }
  }

  function stopRnBSynthFallback() {
    if (synthInterval) clearInterval(synthInterval);
    if (crackleInterval) clearInterval(crackleInterval);
    if (synthContext) {
      try { synthContext.close(); } catch (e) {}
    }
  }
}

/* ==========================================================================
   5. NAVIGATION SCROLLSPY
   ========================================================================== */
function initActiveNavHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav .nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

