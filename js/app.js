/**
 * Golden Egg Gacha - Master Application & UI Controller
 * Orchestrates animations, particle physics, sounds, and user interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  const game = new GachaGame();
  window.game = game;

  // DOM Elements
  const gameContainer = document.querySelector('.game-container');
  const iphoneChassis = document.getElementById('iphone-chassis');
  const goldAmountEl = document.getElementById('gold-amount');
  const mascotRibbonImg = document.getElementById('mascot-ribbon-img');
  const slotsGrid = document.getElementById('slots-grid');
  const btnOpen1 = document.getElementById('btn-open-1');
  const btnOpen10 = document.getElementById('btn-open-10');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnMute = document.getElementById('btn-mute');
  const btnToggleFrame = document.getElementById('btn-toggle-frame');
  const btnAddGold = document.getElementById('btn-add-gold');
  const btnHistory = document.getElementById('btn-history');
  const btnRules = document.getElementById('btn-rules');
  const btnResetData = document.getElementById('btn-reset-data');

  // Modals
  const rewardModal = document.getElementById('reward-modal');
  const rewardTitle = document.getElementById('reward-modal-title');
  const rewardCardDisplay = document.getElementById('reward-card-display');
  const rewardNameEl = document.getElementById('reward-name');
  const rewardDescEl = document.getElementById('reward-desc');
  const btnClaimReward = document.getElementById('btn-claim-reward');

  const bulkModal = document.getElementById('bulk-modal');
  const bulkGrid = document.getElementById('bulk-grid');
  const bulkTotalChips = document.getElementById('bulk-total-chips');
  const btnClaimBulk = document.getElementById('btn-claim-bulk');

  const historyModal = document.getElementById('history-modal');
  const historyList = document.getElementById('history-list');

  const rulesModal = document.getElementById('rules-modal');
  const topupModal = document.getElementById('topup-modal');

  // Canvas Particle System
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = 1024;
    canvas.height = 575;
  }
  resizeCanvas();

  // Responsive Scaling to fit viewport nicely framed with iPhone 18 mockup or frameless
  function handleResize() {
    const isFrameless = iphoneChassis && iphoneChassis.classList.contains('frameless');
    const targetW = isFrameless ? 1024 : 1060;
    const targetH = isFrameless ? 575 : 611;

    const scaleX = window.innerWidth / targetW;
    const scaleY = window.innerHeight / targetH;
    // Scale to ~80% of viewport to leave comfortable margins around the floating iPhone
    // On small mobile screens, adapt to fit comfortably (96%)
    const marginFactor = (window.innerWidth <= 768 || window.innerHeight <= 500) ? 0.96 : 0.80;
    const scale = Math.min(scaleX, scaleY) * marginFactor;

    if (iphoneChassis) {
      iphoneChassis.style.transform = `scale(${scale})`;
    } else {
      gameContainer.style.transform = `scale(${scale})`;
    }
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // Particle Emitter
  class Particle {
    constructor(x, y, color, speed, size, life, angle = null) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size;
      this.life = life;
      this.maxLife = life;
      const a = angle !== null ? angle : Math.random() * Math.PI * 2;
      const s = speed * (0.5 + Math.random());
      this.vx = Math.cos(a) * s;
      this.vy = Math.sin(a) * s;
      this.gravity = 0.15;
      this.friction = 0.96;
      this.alpha = 1;
      this.rotation = Math.random() * Math.PI * 2;
      this.vRot = (Math.random() - 0.5) * 0.2;
    }

    update() {
      this.vx *= this.friction;
      this.vy = this.vy * this.friction + this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.vRot;
      this.life--;
      this.alpha = Math.max(0, this.life / this.maxLife);
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      // Draw diamond or star
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size * 0.7, 0);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function spawnBurst(x, y, count = 40, colors = ['#ffd700', '#fff275', '#ff4d6d', '#ffffff']) {
    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      particles.push(new Particle(x, y, color, 8, 4 + Math.random() * 4, 45 + Math.random() * 25));
    }
  }

  function spawnConfetti() {
    const colors = ['#ff2a7a', '#ffd700', '#00b4d8', '#70e000', '#ffffff', '#ff9e00'];
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * 1024;
      const y = -10 - Math.random() * 50;
      const p = new Particle(x, y, colors[Math.floor(Math.random() * colors.length)], 4, 6 + Math.random() * 5, 100 + Math.random() * 50, Math.PI * 0.5 + (Math.random() - 0.5) * 0.8);
      p.gravity = 0.08;
      particles.push(p);
    }
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  // Toast notifications
  function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2600);
  }

  // Update UI components based on game state
  function render() {
    const { gold, phase, slots, isRefreshUnlocked, hasWonGrandPrize } = game.state;

    // 1. Gold update
    goldAmountEl.textContent = Number(gold).toLocaleString();

    // 2. Background phase toggle (mockup_preview vs mockup_eggs)
    if (phase === 'PREVIEW') {
      gameContainer.classList.remove('phase-eggs');
    } else {
      gameContainer.classList.add('phase-eggs');
    }

    if (mascotRibbonImg) {
      mascotRibbonImg.src = (phase === 'PREVIEW') ? 'assets/ribbon_preview.png' : 'assets/ribbon_eggs.png';
    }

    // 3. Render 10 Board Slots
    slotsGrid.innerHTML = '';
    const remainingCount = game.getRemainingCount();

    slots.forEach((slot, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'slot-wrapper';
      wrapper.dataset.index = index;

      if (slot.isOpened) {
        wrapper.classList.add('opened');

        // Render revealed prize card over the opened egg slot
        const card = document.createElement('div');
        card.className = `slot-card revealed ${slot.reward.isGrand ? 'grand-card' : ''}`;

        const content = document.createElement('div');
        content.className = 'prize-content';

        const iconWrap = document.createElement('div');
        iconWrap.className = 'prize-icon-wrap';

        const iconImg = document.createElement('img');
        iconImg.className = 'prize-icon';
        iconImg.src = slot.reward.icon;
        iconImg.alt = slot.reward.name;
        iconWrap.appendChild(iconImg);

        const badge = document.createElement('div');
        badge.className = `prize-badge ${slot.reward.isGrand ? 'grand-badge' : ''}`;
        badge.textContent = slot.reward.isGrand ? 'Grand Prize' : slot.reward.label;

        content.appendChild(iconWrap);
        content.appendChild(badge);
        card.appendChild(content);
        wrapper.appendChild(card);
      } else if (phase === 'OPENING') {
        wrapper.classList.add('can-open');

        const eggLayer = document.createElement('div');
        eggLayer.className = 'egg-layer';

        const eggImg = document.createElement('img');
        eggImg.className = 'egg-sprite';
        eggImg.src = 'assets/egg.png';
        eggImg.alt = 'Golden Egg';

        eggLayer.appendChild(eggImg);
        wrapper.appendChild(eggLayer);

        // Unopened egg click handler
        wrapper.addEventListener('click', () => {
          handleSlotClick(index, wrapper);
        });
      } else if (phase === 'SHUFFLE') {
        const eggLayer = document.createElement('div');
        eggLayer.className = 'egg-layer';

        const eggImg = document.createElement('img');
        eggImg.className = 'egg-sprite';
        eggImg.src = 'assets/egg.png';
        eggImg.alt = 'Golden Egg';

        eggLayer.appendChild(eggImg);
        wrapper.appendChild(eggLayer);
      } else if (phase === 'PREVIEW') {
        // In preview phase, slots are display-only (no click action)
      }

      slotsGrid.appendChild(wrapper);
    });

    // 4. Update Refresh Board button state
    if (isRefreshUnlocked) {
      btnRefresh.classList.add('unlocked');
      btnRefresh.disabled = false;
      btnRefresh.title = 'สุ่มได้รางวัลใหญ่แล้ว! กดเพื่อเปลี่ยนกระดานใหม่ฟรี';
    } else {
      btnRefresh.classList.remove('unlocked');
      btnRefresh.disabled = true;
      btnRefresh.title = 'เปิดได้รางวัลใหญ่ (Grand Prize) เพื่อปลดล็อกปุ่มนี้';
    }

    // 5. Update Action Buttons
    btnOpen1.disabled = (remainingCount === 0);
    btnOpen10.disabled = (remainingCount === 0);
  }

  // Handle Slot Click (Open 1 egg)
  function handleSlotClick(slotIndex, wrapperEl) {
    if (game.state.phase !== 'OPENING') return;

    openSingleEggWithFX(slotIndex, wrapperEl);
  }

  function openSingleEggWithFX(slotIndex, wrapperEl) {
    const slot = game.state.slots[slotIndex];
    if (!slot || slot.isOpened) return;

    if (game.state.gold < 5) {
      window.soundEngine.playError();
      showToast('Gold ไม่เพียงพอ! (ต้องการ 5 Gold)');
      openTopupModal();
      return;
    }

    // Play tactile audio
    window.soundEngine.playClick();
    window.soundEngine.playCoin();

    // Crack animation
    wrapperEl.classList.add('cracking');

    setTimeout(() => {
      window.soundEngine.playEggCrack();
      wrapperEl.classList.remove('cracking');
      wrapperEl.classList.add('bursting');

      // Spawn golden particles
      const rect = wrapperEl.getBoundingClientRect();
      const contRect = gameContainer.getBoundingClientRect();
      const cx = (rect.left + rect.width / 2 - contRect.left) / (contRect.width / 1024);
      const cy = (rect.top + rect.height / 2 - contRect.top) / (contRect.height / 575);

      spawnBurst(cx, cy, slot.reward.isGrand ? 70 : 40);

      const res = game.openSingleEgg(slotIndex);

      setTimeout(() => {
        wrapperEl.classList.remove('bursting');
        wrapperEl.classList.add('opened');
        render();

        // Show reward claim modal
        showRewardClaimModal(res.reward);

        if (res.isGrand) {
          window.soundEngine.playGrandPrize();
          spawnConfetti();
        } else {
          window.soundEngine.playNormalReward();
        }

        // Auto reset if opened all 10
        if (res.autoReset) {
          setTimeout(() => {
            showToast('เปิดไข่ครบทั้งกระดานแล้ว! ระบบกำลังโหลดกระดานชุดใหม่...');
            setTimeout(() => {
              game.generateBoard(false);
              render();
            }, 1600);
          }, 2000);
        }
      }, 450);
    }, 450);
  }

  // =========================================================
  // ⚙️ การตั้งค่าความเร็ว Shuffle (สามารถปรับแต่งได้ที่นี่)
  // =========================================================
  const SHUFFLE_CONFIG = {
    totalRounds: 7,       // จำนวนรอบการสลับตำแหน่ง (ค่าเริ่มต้น: 7 รอบ)
    speedMs: 200,         // ความเร็วต่อ 1 รอบ ยิ่งน้อยยิ่งไว (เช่น 70 = ไวมาก, 120 = กำลังสวย, 200 = ช้าลง)
    blurAmount: '10px'   // ระดับความเบลอของ Motion Blur (เช่น '2px', '4.5px', '6px')
  };

  // High-Speed Motion Blur Shuffle Sequence
  function startShuffleSequence(onFinished) {
    window.soundEngine.playShuffle();

    // 1. Shuffle the actual rewards across the 10 slots
    const rewards = game.state.slots.map(s => s.reward);
    for (let i = rewards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rewards[i], rewards[j]] = [rewards[j], rewards[i]];
    }
    game.state.slots.forEach((slot, i) => {
      slot.reward = rewards[i];
    });

    game.state.phase = 'SHUFFLE';
    game.saveState();

    if (mascotRibbonImg) {
      mascotRibbonImg.src = 'assets/ribbon_eggs.png';
      mascotRibbonImg.classList.add('bounce');
      setTimeout(() => mascotRibbonImg.classList.remove('bounce'), 500);
    }

    render();

    const wrappers = document.querySelectorAll('.slot-wrapper');
    wrappers.forEach(w => {
      w.classList.remove('settling');
      w.classList.add('shuffling');
      // กำหนดความเร็วและค่า blur ให้ตรงกับ SHUFFLE_CONFIG
      w.style.transition = `transform ${SHUFFLE_CONFIG.speedMs}ms cubic-bezier(0.2, 0.9, 0.3, 1), filter 100ms ease`;
      w.style.filter = `blur(${SHUFFLE_CONFIG.blurAmount}) brightness(1.3) drop-shadow(0 0 18px rgba(255, 215, 0, 0.9))`;
    });

    // Helper to calculate pixel coordinate of any slot index (0..9)
    const getCoord = (idx) => ({
      x: (idx % 5) * 115,
      y: Math.floor(idx / 5) * 145
    });

    let round = 0;
    const interval = setInterval(() => {
      round++;

      // Create a random permutation of targets [0..9]
      const perm = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = perm.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
      }

      // Move each egg rapidly towards a target slot with motion blur
      wrappers.forEach((w, origIdx) => {
        const targetIdx = perm[origIdx];
        const orig = getCoord(origIdx);
        const target = getCoord(targetIdx);
        const dx = target.x - orig.x;
        const dy = target.y - orig.y;

        const curveY = (origIdx % 2 === 0 ? -14 : 14);
        const rot = (dx > 0 ? 5 : dx < 0 ? -5 : 0);

        w.style.transform = `translate(${dx}px, ${dy + curveY}px) rotate(${rot}deg) scale(1.08)`;

        // Spawn gold speed-trail sparks on canvas
        if (round % 2 === 0) {
          const rect = w.getBoundingClientRect();
          const contRect = gameContainer.getBoundingClientRect();
          const cx = (rect.left + rect.width / 2 - contRect.left) / (contRect.width / 1024);
          const cy = (rect.top + rect.height / 2 - contRect.top) / (contRect.height / 575);
          spawnBurst(cx, cy, 3, ['#ffd700', '#fff275', '#ffffff']);
        }
      });

      if (round >= SHUFFLE_CONFIG.totalRounds) {
        clearInterval(interval);

        // Snap back into place cleanly with landing sparkle poofs
        setTimeout(() => {
          wrappers.forEach((w, idx) => {
            w.classList.remove('shuffling');
            w.classList.add('settling');
            w.style.transition = '';
            w.style.filter = '';
            w.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';

            const rect = w.getBoundingClientRect();
            const contRect = gameContainer.getBoundingClientRect();
            const cx = (rect.left + rect.width / 2 - contRect.left) / (contRect.width / 1024);
            const cy = (rect.top + rect.height / 2 - contRect.top) / (contRect.height / 575);
            spawnBurst(cx, cy, 6, ['#ffd700', '#ffffff']);
          });

          window.soundEngine.playCoin();

          setTimeout(() => {
            wrappers.forEach(w => w.classList.remove('settling'));
            game.state.phase = 'OPENING';
            game.saveState();
            render();
            if (onFinished) onFinished();
          }, 280);
        }, 80);
      }
    }, SHUFFLE_CONFIG.speedMs);
  }

  // Bottom Button: "เปิด 1 ฟอง (5 Gold)"
  btnOpen1.addEventListener('click', () => {
    window.soundEngine.playClick();
    if (game.getRemainingCount() === 0) return;

    // 1. Check Gold balance before starting
    if (game.state.gold < 5) {
      window.soundEngine.playError();
      showToast('Gold ไม่เพียงพอ! (ต้องการ 5 Gold)');
      openTopupModal();
      return;
    }

    // 2. If currently in PREVIEW, start animation and wait until finished
    if (game.state.phase === 'PREVIEW') {
      btnOpen1.disabled = true;
      btnOpen10.disabled = true;

      // Run shuffle animation to completion
      startShuffleSequence(() => {
        btnOpen1.disabled = false;
        btnOpen10.disabled = false;
        window.soundEngine.playCoin();

        // Add subtle inviting pulse on all unopened eggs
        const unopened = document.querySelectorAll('.slot-wrapper.can-open');
        unopened.forEach(u => u.classList.add('ready-pulse'));
        setTimeout(() => {
          unopened.forEach(u => u.classList.remove('ready-pulse'));
        }, 1500);
      });
      return;
    }

    // 3. If already in OPENING phase, pulse unopened eggs to highlight
    if (game.state.phase === 'OPENING') {
      const unopened = document.querySelectorAll('.slot-wrapper.can-open');
      unopened.forEach(u => u.classList.add('ready-pulse'));
      setTimeout(() => {
        unopened.forEach(u => u.classList.remove('ready-pulse'));
      }, 1000);
    }
  });

  // Bottom Button: "เหมา 10 ฟอง! (49 Gold)"
  btnOpen10.addEventListener('click', () => {
    window.soundEngine.playClick();
    if (game.getRemainingCount() === 0) return;

    if (game.state.gold < 49) {
      window.soundEngine.playError();
      showToast('Gold ไม่เพียงพอสำหรับเหมาทั้งกระดาน! (ต้องการ 49 Gold)');
      openTopupModal();
      return;
    }

    const executeBulk = () => {
      window.soundEngine.playCoin();
      const res = game.openBulkAll();
      if (!res.success) return;

      const wrappers = document.querySelectorAll('.slot-wrapper:not(.opened)');
      wrappers.forEach((w, idx) => {
        setTimeout(() => {
          window.soundEngine.playEggCrack();
          w.classList.add('bursting');
          const rect = w.getBoundingClientRect();
          const contRect = gameContainer.getBoundingClientRect();
          const cx = (rect.left + rect.width / 2 - contRect.left) / (contRect.width / 1024);
          const cy = (rect.top + rect.height / 2 - contRect.top) / (contRect.height / 575);
          spawnBurst(cx, cy, 35);
        }, idx * 120);
      });

      setTimeout(() => {
        render();
        showBulkModal(res.claimedRewards, res.foundGrand);
        if (res.foundGrand) {
          window.soundEngine.playGrandPrize();
          spawnConfetti();
        } else {
          window.soundEngine.playNormalReward();
        }
      }, wrappers.length * 120 + 350);
    };

    if (game.state.phase === 'PREVIEW') {
      startShuffleSequence(() => {
        executeBulk();
      });
    } else {
      executeBulk();
    }
  });

  // Refresh Board Button
  btnRefresh.addEventListener('click', () => {
    if (!game.state.isRefreshUnlocked) {
      window.soundEngine.playError();
      showToast('ต้องเปิดได้รางวัลใหญ่ (Grand Prize) ก่อน จึงจะรีเฟรชฟรีได้!');
      return;
    }

    window.soundEngine.playClick();
    if (confirm('🎉 ยินดีด้วยที่คุณได้รับรางวัลใหญ่แล้ว!\nต้องการเปลี่ยนกระดานใหม่ฟรีทันทีหรือไม่?')) {
      window.soundEngine.playRefresh();
      game.refreshBoard();
      render();
      showToast('สร้างกระดานชุดใหม่เรียบร้อยแล้ว!');
    }
  });

  // Modal Handlers: Single Reward Claim
  function showRewardClaimModal(reward) {
    if (reward.isGrand) {
      rewardTitle.textContent = '🎉 ยินดีด้วย! รางวัลใหญ่แตก! 🎉';
      rewardTitle.className = 'reward-title grand-title';
      rewardDescEl.textContent = `${reward.desc} [${reward.rarity}]`;
    } else {
      rewardTitle.textContent = 'ยินดีด้วย! คุณได้รับรางวัล';
      rewardTitle.className = 'reward-title';
      rewardDescEl.textContent = 'ไอเทมถูกส่งเข้ากระเป๋าของคุณเรียบร้อยแล้ว';
    }

    rewardCardDisplay.innerHTML = `<img src="${reward.icon}" alt="${reward.name}">`;
    rewardNameEl.textContent = reward.name;
    rewardModal.classList.add('active');
  }

  btnClaimReward.addEventListener('click', () => {
    window.soundEngine.playClick();
    rewardModal.classList.remove('active');
  });

  // Modal Handlers: Bulk Summary
  function showBulkModal(rewards, foundGrand) {
    bulkGrid.innerHTML = '';
    let totalChips = 0;

    rewards.forEach(r => {
      const item = document.createElement('div');
      item.className = `bulk-item ${r.isGrand ? 'is-grand' : ''}`;
      item.innerHTML = `
        <img src="${r.icon}" alt="${r.name}">
        <span>${r.isGrand ? '★ Grand Prize' : r.label}</span>
      `;
      bulkGrid.appendChild(item);
      if (r.amount) totalChips += r.amount;
    });

    bulkTotalChips.textContent = `+${totalChips.toLocaleString()} Chips`;
    bulkModal.classList.add('active');
  }

  btnClaimBulk.addEventListener('click', () => {
    window.soundEngine.playClick();
    bulkModal.classList.remove('active');
    // Auto reset after bulk
    setTimeout(() => {
      showToast('เหมาเปิดครบกระดานแล้ว! ระบบกำลังโหลดกระดานใหม่...');
      setTimeout(() => {
        game.generateBoard(false);
        render();
      }, 1200);
    }, 600);
  });

  // Sound Mute Toggle
  btnMute.addEventListener('click', () => {
    const isMuted = window.soundEngine.toggleMute();
    btnMute.textContent = isMuted ? '🔇' : '🔊';
    btnMute.title = isMuted ? 'เปิดเสียง' : 'ปิดเสียง';
    showToast(isMuted ? 'ปิดเสียงเรียบร้อย' : 'เปิดเสียงแล้ว');
  });

  // Toggle iPhone 18 Mockup Frame
  if (btnToggleFrame && iphoneChassis) {
    const savedFrame = localStorage.getItem('gacha_iphone_frame');
    if (savedFrame === 'off') {
      iphoneChassis.classList.add('frameless');
      btnToggleFrame.textContent = '🔲 กรอบเดิม';
    } else {
      btnToggleFrame.textContent = '📱 iPhone 18';
    }

    btnToggleFrame.addEventListener('click', () => {
      window.soundEngine.playClick();
      const isFrameless = iphoneChassis.classList.toggle('frameless');
      if (isFrameless) {
        localStorage.setItem('gacha_iphone_frame', 'off');
        btnToggleFrame.textContent = '🔲 กรอบเดิม';
        showToast('สลับเป็นโหมดไม่ใส่กรอบมือถือ');
      } else {
        localStorage.setItem('gacha_iphone_frame', 'on');
        btnToggleFrame.textContent = '📱 iPhone 18';
        showToast('เปิดกรอบ iPhone 18 Pro Mockup');
      }
      handleResize();
    });
  }

  // Topup Gold Modal
  function openTopupModal() {
    topupModal.classList.add('active');
  }

  btnAddGold.addEventListener('click', () => {
    window.soundEngine.playClick();
    openTopupModal();
  });

  document.querySelectorAll('.btn-add-amount').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount, 10);
      window.soundEngine.playCoin();
      game.addGold(amount);
      render();
      topupModal.classList.remove('active');
      showToast(`เติมฟรี +${amount} Gold สำเร็จ!`);
    });
  });

  // History Drawer
  btnHistory.addEventListener('click', () => {
    window.soundEngine.playClick();
    historyList.innerHTML = '';
    const { history, inventory } = game.state;

    document.getElementById('history-total-chips').textContent = Number(inventory.chipsWon).toLocaleString();
    document.getElementById('history-total-grands').textContent = inventory.grandPrizesWon.length;

    if (history.length === 0) {
      historyList.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">ยังไม่มีประวัติการเปิดไข่</div>';
    } else {
      history.forEach(item => {
        const div = document.createElement('div');
        div.className = `history-item ${item.type === 'GRAND' ? 'is-grand' : ''}`;
        div.innerHTML = `
          <div class="history-item-left">
            <img src="${item.icon}" alt="">
            <div>
              <strong style="color: ${item.type === 'GRAND' ? '#c9184a' : '#4a2800'}">${item.name}</strong>
              <div style="font-size: 11px; color: #888;">รอบที่ #${item.round} • ${item.time}</div>
            </div>
          </div>
          <span style="font-weight: 800; font-size: 13px; color: #2b8a3e;">✓ ได้รับแล้ว</span>
        `;
        historyList.appendChild(div);
      });
    }

    historyModal.classList.add('active');
  });

  // Rules Modal
  btnRules.addEventListener('click', () => {
    window.soundEngine.playClick();
    rulesModal.classList.add('active');
  });

  // Reset Data (Dev Tool)
  btnResetData.addEventListener('click', () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลกระดานและยอดเงินทั้งหมดกลับสู่ค่าเริ่มต้นใช่หรือไม่?')) {
      window.soundEngine.playRefresh();
      game.resetAllData();
      render();
      showToast('รีเซ็ตข้อมูลทั้งหมดเรียบร้อยแล้ว');
    }
  });

  // Close modals on close button or overlay click
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      window.soundEngine.playClick();
      const overlay = e.target.closest('.modal-overlay');
      if (overlay) overlay.classList.remove('active');
    });
  });

  // Close modals when clicking backdrop outside dialog
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Initial Render
  render();
});
