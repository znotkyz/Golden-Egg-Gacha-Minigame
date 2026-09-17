/**
 * Golden Egg Gacha - Master Application & UI Controller
 * Orchestrates animations, particle physics, sounds, and user interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  const game = new GachaGame();
  window.game = game;

  // DOM Elements
  const gameContainer = document.querySelector('.game-container');
  const goldAmountEl = document.getElementById('gold-amount');
  const mascotRibbonImg = document.getElementById('mascot-ribbon-img');
  const slotsGrid = document.getElementById('slots-grid');
  const btnOpen1 = document.getElementById('btn-open-1');
  const btnOpen10 = document.getElementById('btn-open-10');
  const btnRefresh = document.getElementById('btn-refresh');
  const btnMute = document.getElementById('btn-mute');
  const btnAddGold = document.getElementById('btn-add-gold');
  const btnHistory = document.getElementById('btn-history');
  const btnRules = document.getElementById('btn-rules');
  const btnResetData = document.getElementById('btn-reset-data');
  const btnToggleBg = document.getElementById('btn-toggle-bg');
  const leftStageClean = document.getElementById('left-stage-clean');
  let isCleanMode = false;

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

  // Responsive Scaling to fit viewport
  function handleResize() {
    const scaleX = window.innerWidth / 1024;
    const scaleY = window.innerHeight / 575;
    const scale = Math.min(scaleX, scaleY) * 0.96;
    gameContainer.style.transform = `scale(${scale})`;
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

    // 2. Background phase toggle (mockup_preview vs mockup_eggs or clean_bg)
    if (isCleanMode) {
      gameContainer.classList.add('mode-clean');
      if (leftStageClean) leftStageClean.style.display = 'block';
    } else {
      gameContainer.classList.remove('mode-clean');
      if (leftStageClean) leftStageClean.style.display = 'none';
      if (phase === 'PREVIEW') {
        gameContainer.classList.remove('phase-eggs');
      } else {
        gameContainer.classList.add('phase-eggs');
      }
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

        // In Clean Mode, render egg sprite because board slots are empty.
        // In Original Mode, DO NOT render duplicate eggLayer in idle state (fixes double-egg bug!).
        if (isCleanMode) {
          const eggLayer = document.createElement('div');
          eggLayer.className = 'egg-layer';
          const eggImg = document.createElement('img');
          eggImg.className = 'egg-sprite';
          eggImg.src = 'assets/egg.png';
          eggImg.alt = 'Golden Egg';
          eggLayer.appendChild(eggImg);
          wrapper.appendChild(eggLayer);
        }

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
        // In Clean Mode, render the prize card in preview
        if (isCleanMode) {
          const card = document.createElement('div');
          card.className = `slot-card ${slot.reward.isGrand ? 'grand-card' : ''}`;
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
        }

        // In preview phase, clicking a slot starts shuffle
        wrapper.addEventListener('click', () => {
          handleSlotClick(index, wrapper);
        });
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
    if (game.state.phase === 'SHUFFLE') return;

    // Check if in PREVIEW -> must shuffle first
    if (game.state.phase === 'PREVIEW') {
      startShuffleSequence(() => {
        // After shuffle, open this egg
        openSingleEggWithFX(slotIndex, wrapperEl);
      });
      return;
    }

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
    // Ensure eggLayer exists during cracking
    if (!wrapperEl.querySelector('.egg-layer')) {
      const eggLayer = document.createElement('div');
      eggLayer.className = 'egg-layer';
      const eggImg = document.createElement('img');
      eggImg.className = 'egg-sprite';
      eggImg.src = 'assets/egg.png';
      eggImg.alt = 'Golden Egg';
      eggLayer.appendChild(eggImg);
      wrapperEl.appendChild(eggLayer);
    }

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

  // Shuffle Phase Sequence
  function startShuffleSequence(onFinished) {
    window.soundEngine.playShuffle();
    game.state.phase = 'SHUFFLE';
    if (mascotRibbonImg) {
      mascotRibbonImg.src = 'assets/ribbon_eggs.png';
      mascotRibbonImg.classList.add('bounce');
      setTimeout(() => mascotRibbonImg.classList.remove('bounce'), 500);
    }

    render();

    const wrappers = document.querySelectorAll('.slot-wrapper');
    wrappers.forEach(w => w.classList.add('shuffling'));

    // Perform multiple rapid swap motions
    let shuffleCount = 0;
    const maxShuffles = 3;

    const interval = setInterval(() => {
      shuffleCount++;
      wrappers.forEach(w => {
        const rx = (Math.random() - 0.5) * 60;
        const ry = (Math.random() - 0.5) * 40;
        const scale = 0.95 + Math.random() * 0.1;
        w.style.transform = `translate(${rx}px, ${ry}px) scale(${scale})`;
      });

      if (shuffleCount >= maxShuffles) {
        clearInterval(interval);
        setTimeout(() => {
          wrappers.forEach(w => {
            w.style.transform = '';
            w.classList.remove('shuffling');
          });
          game.state.phase = 'OPENING';
          render();
          if (onFinished) onFinished();
        }, 350);
      }
    }, 400);
  }

  // Bottom Button: "เปิด 1 ฟอง (5 Gold)"
  btnOpen1.addEventListener('click', () => {
    window.soundEngine.playClick();
    if (game.getRemainingCount() === 0) return;

    if (game.state.phase === 'PREVIEW') {
      startShuffleSequence(() => {
        showToast('เลือกไข่ 1 ฟองที่คุณต้องการเปิด!');
      });
      return;
    }

    if (game.state.phase === 'OPENING') {
      showToast('จิ้มเลือกตำแหน่งไข่บนกระดานได้เลย!');
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
