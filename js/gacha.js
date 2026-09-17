/**
 * Golden Egg Gacha - Core Game Logic & State Management
 * Handles board generation, local persistence (anti-exploit), pricing, and reset rules.
 */

const STORAGE_KEY = 'golden_egg_gacha_v1_save';

const GRAND_PRIZES = [
  {
    id: 'grand_avatar',
    name: 'กรอบรูปอวตารดวงดาวสีรุ้ง',
    type: 'GRAND',
    icon: 'assets/icon_grand_avatar.png',
    badge: 'Grand Prize',
    rarity: 'UR (Legendary)',
    desc: 'กรอบรูปโปรไฟล์พิเศษเรืองแสงออร่า 7 สี เฉพาะผู้โชคดีแห่งตู้ไข่ทองคำ'
  },
  {
    id: 'grand_crown',
    name: 'มงกุฎพรีเมียมจักรพรรดิ',
    type: 'GRAND',
    icon: 'assets/icon_grand_avatar.png',
    badge: 'Grand Prize',
    rarity: 'UR (Imperial)',
    desc: 'เครื่องประดับศีรษะทองคำแท้ เพิ่มบารมีและสถานะ VIP ระดับสูงสุด'
  },
  {
    id: 'grand_puzzle',
    name: 'ชิ้นส่วนจิ๊กซอว์ระดับแรร์ UR',
    type: 'GRAND',
    icon: 'assets/icon_grand_avatar.png',
    badge: 'Grand Prize',
    rarity: 'UR (Mythic)',
    desc: 'ชิ้นส่วนปริศนาสีทองสำหรับปลดล็อกสมบัติมหาศาลในเกมหลัก'
  },
  {
    id: 'grand_dragon',
    name: 'การ์ดมังกรทองคำในตำนาน',
    type: 'GRAND',
    icon: 'assets/icon_grand_avatar.png',
    badge: 'Grand Prize',
    rarity: 'UR (Divine)',
    desc: 'การ์ดแรร์ระดับเทพเจ้า เพิ่มอัตราโชคและสิทธิพิเศษในเกม'
  }
];

const CHIP_PRIZES = [
  { amount: 10000, label: '10K', icon: 'assets/icon_chips_10k.png', name: '10,000 Chips' },
  { amount: 50000, label: '50K', icon: 'assets/icon_chips_50k.png', name: '50,000 Chips' },
  { amount: 100000, label: '100K', icon: 'assets/icon_chips_100k.png', name: '100,000 Chips' }
];

class GachaGame {
  constructor() {
    this.state = {
      gold: 1248,
      chips: 500000,
      boardRound: 1,
      phase: 'PREVIEW', // 'PREVIEW' | 'SHUFFLE' | 'OPENING'
      slots: [],        // 10 slots
      grandPrize: null,
      hasWonGrandPrize: false,
      isRefreshUnlocked: false,
      history: [],
      inventory: {
        chipsWon: 0,
        grandPrizesWon: []
      }
    };

    this.listeners = [];
    this.loadState();
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify(event, payload) {
    this.listeners.forEach(cb => cb(event, payload, this.state));
    this.saveState();
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save state to localStorage', e);
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = { ...this.state, ...parsed };
        // If loaded in SHUFFLE state, fall back to OPENING or PREVIEW safely
        if (this.state.phase === 'SHUFFLE') {
          this.state.phase = 'OPENING';
        }
        return;
      }
    } catch (e) {
      console.warn('Could not load saved state, generating new board', e);
    }
    this.generateBoard(true);
  }

  resetAllData() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = {
      gold: 1248,
      chips: 500000,
      boardRound: 1,
      phase: 'PREVIEW',
      slots: [],
      grandPrize: null,
      hasWonGrandPrize: false,
      isRefreshUnlocked: false,
      history: [],
      inventory: {
        chipsWon: 0,
        grandPrizesWon: []
      }
    };
    this.generateBoard(false);
  }

  addGold(amount = 100) {
    this.state.gold += amount;
    this.notify('GOLD_CHANGED', { amount, current: this.state.gold });
  }

  generateBoard(isInitial = false) {
    // 1. Pick 1 Grand Prize
    const gpIndex = Math.floor(Math.random() * GRAND_PRIZES.length);
    const chosenGrandPrize = { ...GRAND_PRIZES[gpIndex] };

    // 2. Generate 9 Normal Prizes (Distribution roughly matching mockup: ~3x 10k, ~4x 50k, ~2x 100k)
    const normalPool = [
      CHIP_PRIZES[0], CHIP_PRIZES[0], CHIP_PRIZES[0], // 3x 10K
      CHIP_PRIZES[1], CHIP_PRIZES[1], CHIP_PRIZES[1], CHIP_PRIZES[1], // 4x 50K
      CHIP_PRIZES[2], CHIP_PRIZES[2]  // 2x 100K
    ];

    // Shuffle normal pool
    for (let i = normalPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [normalPool[i], normalPool[j]] = [normalPool[j], normalPool[i]];
    }

    // Combine 1 Grand Prize + 9 normal prizes
    // In Preview phase, slot 0 is displayed as Grand Prize or randomized position
    // As in mockup image 1: slot 0 is Grand Prize in the preview!
    const slotPrizes = [
      { ...chosenGrandPrize, isGrand: true },
      ...normalPool.map((p, idx) => ({ ...p, id: `chip_${idx}`, isGrand: false, type: 'CHIPS' }))
    ];

    this.state.slots = slotPrizes.map((reward, index) => ({
      index,
      displayOrder: index,
      reward,
      isOpened: false
    }));

    this.state.grandPrize = chosenGrandPrize;
    this.state.phase = 'PREVIEW';
    this.state.hasWonGrandPrize = false;
    this.state.isRefreshUnlocked = false;

    if (!isInitial) {
      this.state.boardRound++;
    }

    this.notify('BOARD_GENERATED', { round: this.state.boardRound });
  }

  // Transitions from PREVIEW to SHUFFLE then OPENING
  startShuffle(onComplete) {
    if (this.state.phase !== 'PREVIEW') {
      if (onComplete) onComplete();
      return;
    }

    this.state.phase = 'SHUFFLE';

    // Fisher-Yates shuffle the actual rewards across the 10 slots
    const rewards = this.state.slots.map(s => s.reward);
    for (let i = rewards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rewards[i], rewards[j]] = [rewards[j], rewards[i]];
    }

    // Reassign shuffled rewards to slots
    this.state.slots.forEach((slot, i) => {
      slot.reward = rewards[i];
      slot.displayOrder = i;
    });

    this.notify('SHUFFLE_STARTED');

    setTimeout(() => {
      this.state.phase = 'OPENING';
      this.notify('SHUFFLE_COMPLETED');
      if (onComplete) onComplete();
    }, 1800);
  }

  // Open single egg (5 Gold)
  openSingleEgg(slotIndex) {
    const slot = this.state.slots[slotIndex];
    if (!slot || slot.isOpened) {
      return { success: false, error: 'ALREADY_OPENED' };
    }

    if (this.state.gold < 5) {
      return { success: false, error: 'INSUFFICIENT_GOLD', required: 5, current: this.state.gold };
    }

    // Deduct Gold
    this.state.gold -= 5;
    slot.isOpened = true;

    // Process reward
    this.processReward(slot.reward);

    const openedCount = this.getOpenedCount();
    const isGrand = slot.reward.isGrand;

    if (isGrand) {
      this.state.hasWonGrandPrize = true;
      // If there are still unopened eggs, unlock manual refresh!
      if (openedCount < 10) {
        this.state.isRefreshUnlocked = true;
      }
    }

    const autoReset = (openedCount === 10);

    this.notify('EGG_OPENED', {
      slotIndex,
      reward: slot.reward,
      isGrand,
      openedCount,
      autoReset,
      isRefreshUnlocked: this.state.isRefreshUnlocked
    });

    return {
      success: true,
      reward: slot.reward,
      isGrand,
      openedCount,
      autoReset,
      isRefreshUnlocked: this.state.isRefreshUnlocked
    };
  }

  // Bulk open all remaining eggs (49 Gold)
  openBulkAll() {
    const unopenedSlots = this.state.slots.filter(s => !s.isOpened);
    if (unopenedSlots.length === 0) {
      return { success: false, error: 'NO_EGGS_LEFT' };
    }

    if (this.state.gold < 49) {
      return { success: false, error: 'INSUFFICIENT_GOLD', required: 49, current: this.state.gold };
    }

    // Deduct 49 Gold
    this.state.gold -= 49;

    const claimedRewards = [];
    let foundGrand = false;

    unopenedSlots.forEach(slot => {
      slot.isOpened = true;
      claimedRewards.push(slot.reward);
      if (slot.reward.isGrand) {
        foundGrand = true;
        this.state.hasWonGrandPrize = true;
      }
      this.processReward(slot.reward);
    });

    this.notify('BULK_OPENED', {
      claimedRewards,
      foundGrand,
      totalOpened: 10
    });

    return {
      success: true,
      claimedRewards,
      foundGrand
    };
  }

  processReward(reward) {
    if (reward.isGrand) {
      this.state.inventory.grandPrizesWon.push({
        ...reward,
        timestamp: Date.now(),
        round: this.state.boardRound
      });
      this.state.history.unshift({
        type: 'GRAND',
        name: reward.name,
        icon: reward.icon,
        time: new Date().toLocaleTimeString(),
        round: this.state.boardRound
      });
    } else {
      this.state.chips += (reward.amount || 0);
      this.state.inventory.chipsWon += (reward.amount || 0);
      this.state.history.unshift({
        type: 'CHIPS',
        name: `+${reward.name}`,
        amount: reward.amount,
        icon: reward.icon,
        time: new Date().toLocaleTimeString(),
        round: this.state.boardRound
      });
    }

    // Limit history to 50 entries
    if (this.state.history.length > 50) {
      this.state.history.pop();
    }
  }

  // Manual board refresh (allowed when Grand Prize is obtained and unopened eggs remain)
  refreshBoard() {
    if (!this.state.isRefreshUnlocked && !this.state.hasWonGrandPrize) {
      return { success: false, error: 'REFRESH_LOCKED' };
    }

    this.generateBoard(false);
    this.notify('BOARD_REFRESHED');
    return { success: true };
  }

  getOpenedCount() {
    return this.state.slots.filter(s => s.isOpened).length;
  }

  getRemainingCount() {
    return this.state.slots.filter(s => !s.isOpened).length;
  }
}

window.GachaGame = GachaGame;
