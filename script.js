const RRR_RATES = {
    "bonus": { noFocus: 0.367, focus: 0.539 },
    "no-bonus": { noFocus: 0.152, focus: 0.435 }
};

const CITY_BONUSES = {
    "ore": "thetford", "wood": "fort sterling", "hide": "martlock", "fiber": "lymhurst", "rock": "bridgewatch"
};

const RESOURCE_NAMES = {
    "ore": { raw: "Ore", refined: "Metal Bar", idRaw: "ORE", idRef: "METALBAR" },
    "wood": { raw: "Wood", refined: "Plank", idRaw: "WOOD", idRef: "PLANKS" },
    "hide": { raw: "Hide", refined: "Leather", idRaw: "HIDE", idRef: "LEATHER" },
    "fiber": { raw: "Fiber", refined: "Cloth", idRaw: "FIBER", idRef: "CLOTH" },
    "rock": { raw: "Stone", refined: "Stone Block", idRaw: "ROCK", idRef: "STONEBLOCK" }
};

const RECIPE_REQ = { "T2": 1, "T3": 2, "T4": 2, "T5": 3, "T6": 4, "T7": 5, "T8": 5 };

const formElements = document.querySelectorAll('input, select');
const resTypeSelect = document.getElementById('res-type');
const tierSelect = document.getElementById('tier');
const enchantSelect = document.getElementById('enchant');
const enchantContainer = enchantSelect.parentElement;

const rawQtyInput = document.getElementById('raw-qty');
const prevQtyInput = document.getElementById('prev-qty');
const rawName = document.getElementById('raw-name');
const prevName = document.getElementById('prev-name');
const rawIcon = document.getElementById('raw-icon');
const prevIcon = document.getElementById('prev-icon');

const labelRawPrice = document.getElementById('label-raw-price');
const labelPrevPrice = document.getElementById('label-prev-price');
const craftAmountDisplay = document.getElementById('craft-amount');
const prevPriceInput = document.getElementById('prev-price');

const useFocusCheckbox = document.getElementById('use-focus');
const focusCostInput = document.getElementById('focus-cost');
const buyOrderCheckbox = document.getElementById('buy-order-fee');
const marketTaxSelect = document.getElementById('market-tax'); 
const citySelect = document.getElementById('city'); 
const copyBtn = document.getElementById('copy-btn');
const resetBtn = document.getElementById('reset-btn');

function setupCustomDropdowns() {
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const selected = dropdown.querySelector('.dropdown-selected');
        const options = dropdown.querySelector('.dropdown-options');
        const hiddenInput = dropdown.nextElementSibling; 

        // --- ACCESSIBILITY: make the trigger focusable and announce its role ---
        selected.setAttribute('tabindex', '0');
        selected.setAttribute('role', 'combobox');
        selected.setAttribute('aria-haspopup', 'listbox');
        selected.setAttribute('aria-expanded', 'false');
        options.setAttribute('role', 'listbox');

        let kbIndex = -1;

        function getOptionEls() {
            return Array.from(options.querySelectorAll('.dropdown-option'));
        }

        function clearHighlight() {
            getOptionEls().forEach(o => o.classList.remove('kb-active'));
        }

        function highlight(index) {
            const opts = getOptionEls();
            if (opts.length === 0) return;
            kbIndex = Math.max(0, Math.min(index, opts.length - 1));
            clearHighlight();
            opts[kbIndex].classList.add('kb-active');
            opts[kbIndex].scrollIntoView({ block: 'nearest' });
        }

        function openDropdown(focusFirst) {
            if (dropdown.classList.contains('disabled')) return;
            document.querySelectorAll('.custom-dropdown').forEach(d => { if (d !== dropdown) closeDropdown(d); });
            dropdown.classList.add('open');
            selected.setAttribute('aria-expanded', 'true');
            if (focusFirst) highlight(0);
        }

        function closeDropdown(d = dropdown) {
            d.classList.remove('open');
            const trigger = d.querySelector('.dropdown-selected');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
            clearHighlight();
            kbIndex = -1;
        }

        function selectOption(optionEl) {
            if (!optionEl) return;
            selected.innerHTML = optionEl.innerHTML;
            hiddenInput.value = optionEl.getAttribute('data-value');
            closeDropdown();
            hiddenInput.dispatchEvent(new Event('change'));
        }

        selected.addEventListener('click', (e) => {
            if (dropdown.classList.contains('disabled')) return;
            const isOpen = dropdown.classList.contains('open');
            document.querySelectorAll('.custom-dropdown').forEach(d => { if (d !== dropdown) closeDropdown(d); });
            if (isOpen) { closeDropdown(); } else { openDropdown(false); }
            e.stopPropagation();
        });

        selected.addEventListener('keydown', (e) => {
            if (dropdown.classList.contains('disabled')) return;
            const isOpen = dropdown.classList.contains('open');

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isOpen) { openDropdown(true); }
                else if (kbIndex >= 0) { selectOption(getOptionEls()[kbIndex]); }
                else { openDropdown(true); }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!isOpen) { openDropdown(true); }
                else { highlight(kbIndex + 1); }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!isOpen) { openDropdown(true); }
                else { highlight(kbIndex - 1); }
            } else if (e.key === 'Escape') {
                if (isOpen) { e.preventDefault(); closeDropdown(); selected.focus(); }
            }
        });

        options.addEventListener('click', (e) => {
            const option = e.target.closest('.dropdown-option');
            if (option) selectOption(option);
        });
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown').forEach(d => {
            d.classList.remove('open');
            const trigger = d.querySelector('.dropdown-selected');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
        });
    });
}

resTypeSelect.addEventListener('change', function() {
    const type = this.value;
    const tierDropdown = document.getElementById('dropdown-tier');
    const tierOptions = document.getElementById('options-tier');
    const tierSelected = document.getElementById('selected-tier');
    tierSelected.innerHTML = '<span class="dropdown-placeholder">Select Tier</span>';
    tierSelect.value = '';

    if (type) {
        tierDropdown.classList.remove('disabled');
        const idRaw = RESOURCE_NAMES[type].idRaw;
        let optionsHtml = '';
        for (let i = 2; i <= 8; i++) {
            optionsHtml += `<div class="dropdown-option" data-value="T${i}"><img src="https://render.albiononline.com/v1/item/T${i}_${idRaw}.png"> Tier ${i}</div>`;
        }
        tierOptions.innerHTML = optionsHtml;
    } else {
        tierDropdown.classList.add('disabled');
        tierOptions.innerHTML = '';
    }
});
setupCustomDropdowns();

function updateCityDropdown() {
    const type = resTypeSelect.value;
    const isFocus = useFocusCheckbox.checked;
    const currentCity = citySelect.value || 'thetford';
    const cityOptions = document.getElementById('options-city');
    const citySelected = document.getElementById('selected-city');

    const cities = [
        { id: 'thetford', name: 'Thetford', defaultBonus: 'Ore Bonus' },
        { id: 'fort sterling', name: 'Fort Sterling', defaultBonus: 'Wood Bonus' },
        { id: 'lymhurst', name: 'Lymhurst', defaultBonus: 'Fiber Bonus' },
        { id: 'bridgewatch', name: 'Bridgewatch', defaultBonus: 'Stone Bonus' },
        { id: 'martlock', name: 'Martlock', defaultBonus: 'Hide Bonus' },
        { id: 'caerleon', name: 'Caerleon', defaultBonus: 'No Bonus' },
        { id: 'brecilien', name: 'Brecilien', defaultBonus: 'No Bonus' }
    ];

    let html = '', selectedText = '';
    cities.forEach(c => {
        const isBonus = type ? (CITY_BONUSES[type] === c.id) : (c.defaultBonus !== 'No Bonus');
        const rate = isFocus ? (isBonus ? RRR_RATES.bonus.focus : RRR_RATES["no-bonus"].focus) : (isBonus ? RRR_RATES.bonus.noFocus : RRR_RATES["no-bonus"].noFocus);
        const label = isBonus && type ? `${c.name} (⭐ Best - ${(rate*100).toFixed(1)}%)` : `${c.name} (${(rate*100).toFixed(1)}%)`;
        html += `<div class="dropdown-option" data-value="${c.id}">${label}</div>`;
        if (c.id === currentCity) selectedText = label;
    });

    if (cityOptions) cityOptions.innerHTML = html;
    if (citySelected) citySelected.innerHTML = selectedText;
}

function autoFillRecipe(source = 'prev') {
    const type = resTypeSelect.value, tier = tierSelect.value;
    if (!type || !tier) {
        rawName.value = ""; prevName.value = "";
        rawIcon.style.display = 'none'; prevIcon.style.display = 'none';
        enchantContainer.style.display = 'none';
        return;
    }
    rawIcon.style.display = 'block';
    const canEnchant = ["T4", "T5", "T6", "T7", "T8"].includes(tier) && type !== "rock";
    enchantContainer.style.display = canEnchant ? 'flex' : 'none';
    if (!canEnchant) enchantSelect.value = ".0";

    const enchant = enchantSelect.value, names = RESOURCE_NAMES[type], rawPerCraft = RECIPE_REQ[tier];
    rawName.value = `${tier}${enchant !== ".0" ? enchant : ""} ${names.raw}`;
    rawIcon.src = `https://render.albiononline.com/v1/item/${tier}_${names.idRaw}${enchant !== ".0" ? '@'+enchant.replace('.','') : ''}.png`;
    
    if (tier === "T2") {
        prevName.value = "None"; prevQtyInput.disabled = true; prevPriceInput.disabled = true; prevIcon.style.display = 'none';
        prevQtyInput.value = 0; prevPriceInput.value = 0;
    } else {
        const prevNum = parseInt(tier.replace("T","")) - 1;
        prevName.value = `T${prevNum} ${names.refined}`;
        prevQtyInput.disabled = false; prevPriceInput.disabled = false;
        prevIcon.src = `https://render.albiononline.com/v1/item/T${prevNum}_${names.idRef}.png`;
        prevIcon.style.display = 'block';
    }

    if (tier === "T2") {
        craftAmountDisplay.textContent = rawQtyInput.value;
    } else {
        if (source === 'raw') {
            const raw = parseInt(rawQtyInput.value) || 0;
            const crafts = Math.floor(raw / rawPerCraft);
            prevQtyInput.value = crafts;
            craftAmountDisplay.textContent = crafts;
        } else {
            const crafts = parseInt(prevQtyInput.value) || 0;
            rawQtyInput.value = crafts * rawPerCraft;
            craftAmountDisplay.textContent = crafts;
        }
    }
    labelRawPrice.textContent = rawName.value + " Price";
    labelPrevPrice.textContent = tier === "T2" ? "Not Needed" : (prevName.value + " Price");
}

function calculate() {
    if (useFocusCheckbox.checked) {
        focusCostInput.classList.remove('hidden');
    } else {
        focusCostInput.classList.add('hidden');
    }

    const type = resTypeSelect.value, tier = tierSelect.value, chosenCity = citySelect.value, isFocus = useFocusCheckbox.checked;
    let rrr = 0;
    if (type) {
        const isBonusCity = (CITY_BONUSES[type] === chosenCity);
        rrr = isFocus ? (isBonusCity ? RRR_RATES.bonus.focus : RRR_RATES["no-bonus"].focus) : (isBonusCity ? RRR_RATES.bonus.noFocus : RRR_RATES["no-bonus"].noFocus);
    } else {
        rrr = isFocus ? RRR_RATES["no-bonus"].focus : RRR_RATES["no-bonus"].noFocus;
    }
    
    document.getElementById('out-rrr').textContent = (rrr * 100).toFixed(1) + "%";

    if (!type || !tier) {
        document.getElementById('out-mat-cost').textContent = "0";
        document.getElementById('out-returns').textContent = "+0";
        document.getElementById('out-fee').textContent = "-0";
        document.getElementById('out-taxes').textContent = "-0";
        document.getElementById('out-net-cost').textContent = "0";
        document.getElementById('out-revenue').textContent = "0";
        document.getElementById('out-breakeven').textContent = "0.00";
        
        const profitEl = document.getElementById('out-profit');
        profitEl.textContent = "0";
        profitEl.className = '';
        profitEl.style.color = "var(--text-main)";
        
        const roiEl = document.getElementById('out-roi');
        roiEl.textContent = "0.00%";
        roiEl.className = '';
        
        document.getElementById('silver-focus-row').style.display = 'none';
        return;
    }

    const rawQty = parseFloat(rawQtyInput.value) || 0, prevQty = parseFloat(prevQtyInput.value) || 0;
    const rawPrice = parseFloat(document.getElementById('raw-price').value) || 0;
    const prevPrice = parseFloat(prevPriceInput.value) || 0;
    const stationTaxInput = parseFloat(document.getElementById('station-tax').value) || 0;
    const sellPrice = parseFloat(document.getElementById('sell-price').value) || 0;
    const focusPerItem = parseFloat(focusCostInput.value) || 0;
    const isBuyOrder = buyOrderCheckbox.checked;
    const marketTaxRate = parseFloat(marketTaxSelect.value) || 0;

    const crafts = tier === "T2" ? rawQty : prevQty;
    const effectivePrevQty = tier === "T2" ? 0 : prevQty;
    const effectivePrevPrice = tier === "T2" ? 0 : prevPrice;
    const baseCost = (rawQty * rawPrice) + (effectivePrevQty * effectivePrevPrice);
    const buyOrderFee = isBuyOrder ? (baseCost * 0.025) : 0;
    const returnVal = baseCost * rrr;
    const totalStationFee = (stationTaxInput / 100) * rawQty;
    
    const revenue = crafts * sellPrice; 
    const marketSellTax = revenue * marketTaxRate;
    const totalMarketFees = buyOrderFee + marketSellTax;
    const netCost = baseCost + buyOrderFee + totalStationFee + marketSellTax - returnVal;
    
    const profit = revenue - netCost;
    const roi = netCost > 0 ? (profit / netCost) * 100 : 0;
    
    const expensesBeforeSellTax = baseCost + buyOrderFee + totalStationFee - returnVal;
    const breakEven = (crafts > 0 && marketTaxRate < 1) ? (expensesBeforeSellTax / (crafts * (1 - marketTaxRate))) : 0;
    
    const totalFocusCost = crafts * focusPerItem;
    const silverPerFocus = (isFocus && totalFocusCost > 0) ? (profit / totalFocusCost) : null;

    document.getElementById('out-mat-cost').textContent = Math.round(baseCost).toLocaleString();
    document.getElementById('out-returns').textContent = "+" + Math.round(returnVal).toLocaleString();
    document.getElementById('out-fee').textContent = "-" + Math.round(totalStationFee).toLocaleString();
    document.getElementById('out-taxes').textContent = "-" + Math.round(totalMarketFees).toLocaleString();
    document.getElementById('out-net-cost').textContent = Math.round(netCost).toLocaleString();
    document.getElementById('out-revenue').textContent = Math.round(revenue).toLocaleString();
    document.getElementById('out-breakeven').textContent = breakEven.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const profitEl = document.getElementById('out-profit');
    const roundedProfit = Math.round(profit);
    profitEl.textContent = roundedProfit.toLocaleString();
    
    if (roundedProfit > 0) {
        profitEl.className = 'positive';
        profitEl.textContent = "+" + profitEl.textContent;
    } else if (roundedProfit < 0) {
        profitEl.className = 'negative';
    } else {
        profitEl.className = '';
        profitEl.style.color = "var(--text-main)";
    }

    const roiEl = document.getElementById('out-roi');
    roiEl.textContent = roi.toFixed(2) + "%";
    roiEl.className = roi > 0 ? 'positive' : (roi < 0 ? 'negative' : '');

    const focusRow = document.getElementById('silver-focus-row');
    if (isFocus) {
        focusRow.style.display = 'flex';
        document.getElementById('out-silver-focus').textContent = silverPerFocus !== null ? (silverPerFocus.toFixed(2) + " / point") : "0 / point";
    } else {
        focusRow.style.display = 'none';
    }

    updateStickyBar();
    saveState();
}

// --- LOCAL STORAGE PERSISTENCE ---
const STORAGE_KEY = 'rc-albion-calculator-state';
const PERSISTED_IDS = [
    'res-type', 'tier', 'enchant', 'city', 'use-focus', 'focus-cost',
    'raw-qty', 'prev-qty', 'raw-price', 'prev-price', 'buy-order-fee',
    'station-tax', 'sell-price', 'market-tax'
];

function saveState() {
    const state = {};
    PERSISTED_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        state[id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    // Also persist the visible label text for custom dropdowns
    state['selected-res-html'] = document.getElementById('selected-res').innerHTML;
    state['selected-tier-html'] = document.getElementById('selected-tier').innerHTML;
    state['selected-city-html'] = document.getElementById('selected-city').innerHTML;
    state['selected-tax-html'] = document.getElementById('selected-tax').innerHTML;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save calculator state:', e);
    }
}

function loadState() {
    let raw;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
        return;
    }
    if (!raw) return;

    let state;
    try {
        state = JSON.parse(raw);
    } catch (e) {
        return;
    }

    // Restore resource type & tier first so dependent dropdowns rebuild correctly
    if (state['res-type']) {
        resTypeSelect.value = state['res-type'];
        resTypeSelect.dispatchEvent(new Event('change'));
    }
    if (state['tier']) {
        tierSelect.value = state['tier'];
        if (state['selected-tier-html']) document.getElementById('selected-tier').innerHTML = state['selected-tier-html'];
    }
    if (state['selected-res-html']) document.getElementById('selected-res').innerHTML = state['selected-res-html'];
    if (state['selected-city-html']) document.getElementById('selected-city').innerHTML = state['selected-city-html'];
    if (state['selected-tax-html']) document.getElementById('selected-tax').innerHTML = state['selected-tax-html'];

    PERSISTED_IDS.forEach(id => {
        if (!(id in state)) return;
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') {
            el.checked = state[id];
        } else {
            el.value = state[id];
        }
    });
}

// --- MOBILE STICKY PROFIT BAR ---
const stickyBar = document.getElementById('sticky-profit-bar');
const stickyProfitValue = document.getElementById('sticky-profit-value');
const stickyRoiValue = document.getElementById('sticky-roi-value');

function updateStickyBar() {
    if (!stickyBar) return;
    const profitEl = document.getElementById('out-profit');
    const roiEl = document.getElementById('out-roi');
    if (!profitEl || !roiEl) return;

    stickyProfitValue.textContent = profitEl.textContent;
    stickyProfitValue.className = 'sticky-profit-value ' + profitEl.className;
    stickyRoiValue.textContent = roiEl.textContent + ' ROI';

    const calculatorVisible = !document.getElementById('view-calculator').classList.contains('hidden');
    const isMobile = window.innerWidth <= 768;
    stickyBar.classList.toggle('hidden', !(calculatorVisible && isMobile));
}

window.addEventListener('resize', updateStickyBar);

// --- INPUT VALIDATION ---
const MAX_SAFE_VALUE = 999999999; // 999 million cap, prevents absurd overflow

function sanitizeNumberInput(el) {
    if (el.value === '') return; // allow empty while typing
    let num = parseFloat(el.value);
    if (isNaN(num) || !isFinite(num)) {
        el.value = 0;
        return;
    }
    if (num < 0) num = 0;
    if (num > MAX_SAFE_VALUE) num = MAX_SAFE_VALUE;
    // Snap to the field's own min/step precision (avoid float noise like 1.0000000002)
    num = Math.round(num * 100) / 100;
    if (String(num) !== el.value) el.value = num;
}

document.querySelectorAll('input[type="number"]').forEach(el => {
    el.addEventListener('input', () => sanitizeNumberInput(el));
    el.addEventListener('blur', () => {
        if (el.value === '' || isNaN(parseFloat(el.value))) el.value = 0;
        sanitizeNumberInput(el);
        calculate();
    });
});

// --- EVENT LISTENERS ---
[resTypeSelect, useFocusCheckbox, citySelect].forEach(el => el.addEventListener('change', updateCityDropdown));
[resTypeSelect, tierSelect, enchantSelect, citySelect, marketTaxSelect].forEach(el => {
    el.addEventListener('change', () => { autoFillRecipe('prev'); calculate(); });
});

rawQtyInput.addEventListener('input', () => { autoFillRecipe('raw'); calculate(); });
prevQtyInput.addEventListener('input', () => { autoFillRecipe('prev'); calculate(); });

formElements.forEach(el => {
    if (![resTypeSelect, tierSelect, enchantSelect, citySelect, marketTaxSelect, rawQtyInput, prevQtyInput].includes(el)) {
        el.addEventListener('input', calculate);
        el.addEventListener('change', calculate);
    }
});

// --- COPY RESULTS BUTTON ---
copyBtn.addEventListener('click', () => {
    const itemCrafted = rawName.value || "Unknown Item";
    const amountCrafted = document.getElementById('craft-amount').textContent;
    const profit = document.getElementById('out-profit').textContent;
    const roi = document.getElementById('out-roi').textContent;
    const cityDisplay = document.getElementById('selected-city').textContent.trim();
    
    const plainText = 
`R&C Albion - Refining Report
Item: ${amountCrafted}x ${itemCrafted}
City Setup: ${cityDisplay}
Net Profit: ${profit} Silver
ROI: ${roi}`;

    navigator.clipboard.writeText(plainText).then(() => {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = "✓ COPIED!";
        copyBtn.style.color = "#fff";
        setTimeout(() => {
            copyBtn.innerText = originalText;
            copyBtn.style.color = "var(--profit-green)";
        }, 2000);
    });
});

// --- RESET BUTTON ---
resetBtn.addEventListener('click', () => {
    resTypeSelect.value = '';
    document.getElementById('selected-res').innerHTML = '<span class="dropdown-placeholder">Select Item</span>';
    tierSelect.value = '';
    document.getElementById('selected-tier').innerHTML = '<span class="dropdown-placeholder">Select Tier</span>';
    document.getElementById('dropdown-tier').classList.add('disabled');
    document.getElementById('options-tier').innerHTML = ''; 
    enchantSelect.value = '.0';
    citySelect.value = 'thetford';
    marketTaxSelect.value = '0.065';
    document.getElementById('selected-tax').innerHTML = 'Premium Account (4% Tax + 2.5% Setup) = 6.5%';
    useFocusCheckbox.checked = false;
    buyOrderCheckbox.checked = false;
    rawQtyInput.value = 0;
    prevQtyInput.value = 0;
    document.getElementById('raw-price').value = 0;
    prevPriceInput.value = 0;
    document.getElementById('station-tax').value = 0;
    document.getElementById('sell-price').value = 0;
    focusCostInput.value = 100;
    autoFillRecipe('prev');
    updateCityDropdown();
    calculate();
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
});

// --- NAVIGATION ---
const navLinks = document.querySelectorAll('.header-nav .nav-link');
const views = document.querySelectorAll('.app-view');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = `view-${link.getAttribute('data-target')}`;
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        views.forEach(v => v.id === targetId ? v.classList.remove('hidden') : v.classList.add('hidden'));
        updateStickyBar();
    });
});

document.getElementById('home-logo').addEventListener('click', () => {
    document.querySelector('.header-nav .nav-link[data-target="home"]').click();
});

// --- MODALS ---
const modalBug = document.getElementById('modal-bug');
const modalSupport = document.getElementById('modal-support');
const bugInput = document.getElementById('bug-input');

document.getElementById('link-bug').addEventListener('click', (e) => { e.preventDefault(); modalBug.classList.remove('hidden'); });
document.getElementById('bug-close').addEventListener('click', () => modalBug.classList.add('hidden'));

const bugStatus = document.getElementById('bug-status');
const bugSubmitBtn = document.getElementById('bug-submit');
const bugWebsiteField = document.getElementById('bug-website');
const BUG_COOLDOWN_MS = 60000; // 1 minute between submissions

document.getElementById('bug-submit').addEventListener('click', async () => {
    const description = bugInput.value.trim();

    // Honeypot check: real users never fill this hidden field, bots often do
    if (bugWebsiteField && bugWebsiteField.value.trim() !== '') {
        bugStatus.textContent = 'Thank you! Your bug report has been submitted.';
        bugStatus.className = 'form-status success';
        bugInput.value = '';
        bugWebsiteField.value = '';
        setTimeout(() => modalBug.classList.add('hidden'), 1200);
        return; // silently drop, pretend success so bots don't adapt
    }

    if (description === '') {
        bugStatus.textContent = 'Please describe the bug before submitting.';
        bugStatus.className = 'form-status error';
        return;
    }

    const lastSubmit = parseInt(localStorage.getItem('rc-albion-last-bug-report') || '0', 10);
    const now = Date.now();
    if (now - lastSubmit < BUG_COOLDOWN_MS) {
        const waitSec = Math.ceil((BUG_COOLDOWN_MS - (now - lastSubmit)) / 1000);
        bugStatus.textContent = `Please wait ${waitSec}s before submitting another report.`;
        bugStatus.className = 'form-status error';
        return;
    }

    bugSubmitBtn.disabled = true;
    bugSubmitBtn.textContent = 'Submitting...';
    bugStatus.textContent = '';
    bugStatus.className = 'form-status';

    try {
        const { error } = await supabaseClient.from('bug_reports').insert({
            description: description,
            page_url: window.location.href,
            user_agent: navigator.userAgent
        });

        if (error) throw error;

        localStorage.setItem('rc-albion-last-bug-report', String(now));
        bugStatus.textContent = 'Thank you! Your bug report has been submitted.';
        bugStatus.className = 'form-status success';
        bugInput.value = '';
        setTimeout(() => {
            modalBug.classList.add('hidden');
            bugStatus.textContent = '';
            bugStatus.className = 'form-status';
        }, 1500);
    } catch (err) {
        console.error('Bug report submission failed:', err);
        bugStatus.textContent = 'Something went wrong. Please try again later.';
        bugStatus.className = 'form-status error';
    } finally {
        bugSubmitBtn.disabled = false;
        bugSubmitBtn.textContent = 'Submit Report';
    }
});

document.getElementById('link-support').addEventListener('click', (e) => { e.preventDefault(); modalSupport.classList.remove('hidden'); });
document.getElementById('support-close').addEventListener('click', () => modalSupport.classList.add('hidden'));

window.addEventListener('click', (e) => {
    if (e.target === modalBug) modalBug.classList.add('hidden');
    if (e.target === modalSupport) modalSupport.classList.add('hidden');
});

// --- LIGHTWEIGHT VISIT ANALYTICS (no cookies, no personal data) ---
async function logPageView() {
    try {
        await supabaseClient.from('page_views').insert({
            page_url: window.location.pathname
        });
    } catch (e) {
        // fail silently, analytics should never break the site
        console.warn('Analytics log failed:', e);
    }
}
logPageView();

// --- SHARE LINK ---
const shareBtn = document.getElementById('share-btn');
const SHARE_PARAM_IDS = [
    'res-type', 'tier', 'enchant', 'city', 'use-focus', 'focus-cost',
    'raw-qty', 'prev-qty', 'raw-price', 'prev-price', 'buy-order-fee',
    'station-tax', 'sell-price', 'market-tax'
];

function buildShareUrl() {
    const params = new URLSearchParams();
    SHARE_PARAM_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        params.set(id, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value);
    });
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function syncDropdownLabel(selectedElId, optionsElId, value) {
    const selectedEl = document.getElementById(selectedElId);
    const optionsEl = document.getElementById(optionsElId);
    if (!selectedEl || !optionsEl) return;
    const match = optionsEl.querySelector(`.dropdown-option[data-value="${value}"]`);
    if (match) selectedEl.innerHTML = match.innerHTML;
}

function applyShareParamsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length === 0) return false;

    if (params.has('res-type')) {
        resTypeSelect.value = params.get('res-type');
        resTypeSelect.dispatchEvent(new Event('change'));
        syncDropdownLabel('selected-res', 'options-res', resTypeSelect.value);
    }
    if (params.has('tier')) {
        tierSelect.value = params.get('tier');
        syncDropdownLabel('selected-tier', 'options-tier', tierSelect.value);
    }

    SHARE_PARAM_IDS.forEach(id => {
        if (!params.has(id)) return;
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'checkbox') {
            el.checked = params.get(id) === '1';
        } else {
            el.value = params.get(id);
        }
    });

    syncDropdownLabel('selected-tax', 'options-tax', marketTaxSelect.value);
    return true;
}

if (shareBtn) {
    shareBtn.addEventListener('click', () => {
        const url = buildShareUrl();
        navigator.clipboard.writeText(url).then(() => {
            const originalText = shareBtn.innerText;
            shareBtn.innerText = "✓ LINK COPIED!";
            setTimeout(() => { shareBtn.innerText = originalText; }, 2000);
        }).catch(() => {
            shareBtn.innerText = "Copy failed";
            setTimeout(() => { shareBtn.innerText = "Share Link"; }, 2000);
        });
    });
}

// --- TRANSPORT CALCULATOR ---
const tBuyPriceInput = document.getElementById('t-buy-price');
const tQuantityInput = document.getElementById('t-quantity');
const tSetupFeeCheckbox = document.getElementById('t-setup-fee');
const tSellPriceInput = document.getElementById('t-sell-price');
const tMarketTaxSelect = document.getElementById('t-market-tax');
const tSellSetupFeeCheckbox = document.getElementById('t-sell-setup-fee');
const tResetBtn = document.getElementById('t-reset-btn');

function calculateTransport() {
    const buyPrice = parseFloat(tBuyPriceInput.value) || 0;
    const quantity = parseFloat(tQuantityInput.value) || 0;
    const hasSetupFee = tSetupFeeCheckbox.checked;
    const sellPrice = parseFloat(tSellPriceInput.value) || 0;
    const marketTaxRate = parseFloat(tMarketTaxSelect.value) || 0;
    const hasSellSetupFee = tSellSetupFeeCheckbox.checked;

    const buyCost = quantity * buyPrice;
    const setupFee = hasSetupFee ? (buyCost * 0.025) : 0;
    const totalCost = buyCost + setupFee;

    const grossRevenue = quantity * sellPrice;
    const marketTax = grossRevenue * marketTaxRate;
    const sellSetupFee = hasSellSetupFee ? (grossRevenue * 0.025) : 0;
    const netRevenue = grossRevenue - marketTax - sellSetupFee;

    const profit = netRevenue - totalCost;
    const profitPerItem = quantity > 0 ? (profit / quantity) : 0;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    document.getElementById('t-out-buy-cost').textContent = Math.round(buyCost).toLocaleString();
    document.getElementById('t-out-setup-fee').textContent = "-" + Math.round(setupFee).toLocaleString();
    document.getElementById('t-out-total-cost').textContent = Math.round(totalCost).toLocaleString();
    document.getElementById('t-out-gross-revenue').textContent = Math.round(grossRevenue).toLocaleString();
    document.getElementById('t-out-market-tax').textContent = "-" + Math.round(marketTax).toLocaleString();
    document.getElementById('t-out-sell-setup-fee').textContent = "-" + Math.round(sellSetupFee).toLocaleString();
    document.getElementById('t-out-net-revenue').textContent = Math.round(netRevenue).toLocaleString();

    const profitEl = document.getElementById('t-out-profit');
    const roundedProfit = Math.round(profit);
    profitEl.textContent = roundedProfit.toLocaleString();
    if (roundedProfit > 0) {
        profitEl.className = 'positive';
        profitEl.textContent = "+" + profitEl.textContent;
    } else if (roundedProfit < 0) {
        profitEl.className = 'negative';
    } else {
        profitEl.className = '';
    }

    const perItemEl = document.getElementById('t-out-profit-per-item');
    const roundedPerItem = Math.round(profitPerItem);
    perItemEl.textContent = roundedPerItem.toLocaleString();
    perItemEl.className = roundedPerItem > 0 ? 'positive' : (roundedPerItem < 0 ? 'negative' : '');
    if (roundedPerItem > 0) perItemEl.textContent = "+" + perItemEl.textContent;

    const roiEl = document.getElementById('t-out-roi');
    roiEl.textContent = roi.toFixed(2) + "%";
    roiEl.className = roi > 0 ? 'positive' : (roi < 0 ? 'negative' : '');

    saveTransportState();
}

[tBuyPriceInput, tQuantityInput, tSellPriceInput].forEach(el => {
    el.addEventListener('input', () => { sanitizeNumberInput(el); calculateTransport(); });
    el.addEventListener('blur', () => {
        if (el.value === '' || isNaN(parseFloat(el.value))) el.value = 0;
        sanitizeNumberInput(el);
        calculateTransport();
    });
});
[tSetupFeeCheckbox, tMarketTaxSelect, tSellSetupFeeCheckbox].forEach(el => el.addEventListener('change', calculateTransport));

tResetBtn.addEventListener('click', () => {
    tBuyPriceInput.value = 0;
    tQuantityInput.value = 0;
    tSetupFeeCheckbox.checked = false;
    tSellPriceInput.value = 0;
    tSellSetupFeeCheckbox.checked = false;
    tMarketTaxSelect.value = '0.04';
    document.getElementById('selected-t-tax').innerHTML = 'Premium Account (4% Tax)';
    calculateTransport();
    try { localStorage.removeItem(TRANSPORT_STORAGE_KEY); } catch (e) {}
});

const TRANSPORT_STORAGE_KEY = 'rc-albion-transport-state';
const TRANSPORT_PERSISTED_IDS = ['t-buy-price', 't-quantity', 't-setup-fee', 't-sell-price', 't-market-tax', 't-sell-setup-fee'];

function saveTransportState() {
    const state = {};
    TRANSPORT_PERSISTED_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        state[id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    state['selected-t-tax-html'] = document.getElementById('selected-t-tax').innerHTML;
    try {
        localStorage.setItem(TRANSPORT_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save transport calculator state:', e);
    }
}

function loadTransportState() {
    let raw;
    try {
        raw = localStorage.getItem(TRANSPORT_STORAGE_KEY);
    } catch (e) {
        return false;
    }
    if (!raw) return false;
    let state;
    try {
        state = JSON.parse(raw);
    } catch (e) {
        return false;
    }
    TRANSPORT_PERSISTED_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !(id in state)) return;
        if (el.type === 'checkbox') el.checked = state[id];
        else el.value = state[id];
    });
    if (state['selected-t-tax-html']) document.getElementById('selected-t-tax').innerHTML = state['selected-t-tax-html'];
    return true;
}

loadTransportState();
calculateTransport();

// Initial Setup
const loadedFromShareLink = applyShareParamsFromUrl();
if (!loadedFromShareLink) loadState();
autoFillRecipe('prev');
updateCityDropdown();
calculate();
updateStickyBar();
