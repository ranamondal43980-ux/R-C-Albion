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

        selected.addEventListener('click', (e) => {
            if (dropdown.classList.contains('disabled')) return;
            document.querySelectorAll('.custom-dropdown').forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
            dropdown.classList.toggle('open');
            e.stopPropagation();
        });

        options.addEventListener('click', (e) => {
            const option = e.target.closest('.dropdown-option');
            if (option) {
                selected.innerHTML = option.innerHTML;
                hiddenInput.value = option.getAttribute('data-value');
                dropdown.classList.remove('open');
                hiddenInput.dispatchEvent(new Event('change'));
            }
        });
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
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
    const baseCost = (rawQty * rawPrice) + (prevQty * prevPrice);
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
}

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
    });
});

document.getElementById('home-logo').addEventListener('click', () => {
    document.querySelector('.header-nav .nav-link[data-target="home"]').click();
});

// --- MODALS ---
const modalBug = document.getElementById('modal-bug');
const modalSupport = document.getElementById('modal-support');
const bugInput = document.getElementById('bug-input');

document.getElementById('link-discord').addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://discord.gg/t3zv5NUB8R', '_blank');
});

document.getElementById('link-bug').addEventListener('click', (e) => { e.preventDefault(); modalBug.classList.remove('hidden'); });
document.getElementById('bug-close').addEventListener('click', () => modalBug.classList.add('hidden'));

document.getElementById('bug-submit').addEventListener('click', () => {
    if (bugInput.value.trim() !== '') {
        alert('Thank you! Your bug report has been submitted.');
        bugInput.value = '';
        modalBug.classList.add('hidden');
    } else {
        alert('Please describe the bug before submitting.');
    }
});

document.getElementById('link-support').addEventListener('click', (e) => { e.preventDefault(); modalSupport.classList.remove('hidden'); });
document.getElementById('support-close').addEventListener('click', () => modalSupport.classList.add('hidden'));

window.addEventListener('click', (e) => {
    if (e.target === modalBug) modalBug.classList.add('hidden');
    if (e.target === modalSupport) modalSupport.classList.add('hidden');
});

// Initial Setup
autoFillRecipe('prev');
updateCityDropdown(); 
calculate();