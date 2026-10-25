/* ==========================================================
    BEVERAGE MASTERCLASS - APP LOGIC (Final Merged Version)
   ========================================================== */

// Global Variables
let currentLang = localStorage.getItem('preferredLang') || 'th';
let currentMode = 'manual';
let currentRecipe = null;
let currentVolume = 10;

const CATEGORY_NAMES = {
  'herbal': { 'th': 'สมุนไพรไทย', 'en': 'Thai Herbs' },
  'tea': { 'th': 'ชา & เครื่องดื่มร้อน', 'en': 'Tea & Hot Drinks' },
  'milk': { 'th': 'นม & ธัญพืช', 'en': 'Milk & Cereals' },
  'ferment': { 'th': 'เครื่องดื่มหมัก', 'en': 'Fermented Beverages' }
};

const UI_LABELS = {
  headerTitle: { 'th': 'สูตรเครื่องดื่ม', 'en': 'Beverage Recipes' },
  titleVolume: { 'th': 'ปรับปริมาณที่ต้องการทำ', 'en': 'Adjust the desired quantity' },
  modeManual: { 'th': 'ทำเอง', 'en': 'Manual' },
  modeMachine: { 'th': 'ใช้เครื่อง', 'en': 'Machine' },
  tabGallery: { 'th': ' รูปภาพ', 'en': '📷 Gallery' },
  tabVideo: { 'th': '🎬 วิดีโอ', 'en': ' Video' },
  prepTime: { 'th': 'เวลาเตรียม', 'en': 'Prep Time' },
  cookTime: { 'th': 'เวลาทำ', 'en': 'Cook Time' },
  servings: { 'th': 'ปริมาณ', 'en': 'Servings' },
  rating: { 'th': 'คะแนน', 'en': 'Rating' },
  ingredients: { 'th': ' วัตถุดิบ', 'en': '📝 Ingredients' },
  steps: { 'th': '👩‍🍳 ขั้นตอนการทำ', 'en': '👩‍🍳 Instructions' },
  nutrition: { 'th': ' ข้อมูลโภชนาการ (ต่อ 100 มล.)', 'en': '📊 Nutrition Facts (per 100ml)' },
  backToHome: { 'th': 'ดูสูตรอื่นๆ', 'en': 'Browse More Recipes' },
  copyLink: { 'th': '📋 คัดลอกลิงก์สูตรสำหรับเครื่อง', 'en': '📋 Copy Machine Recipe Link' },
  downloadBtn: { 'th': '📋 คัดลอกสูตรเข้าเครื่อง', 'en': '📋 Copy Recipe for Machine' },
  benefits: { 'th': 'สรรพคุณ', 'en': 'Benefits' },
  calories: { 'th': 'พลังงาน', 'en': 'Calories' },
  carbs: { 'th': 'คาร์โบไฮเดรต', 'en': 'Carbs' },
  sugar: { 'th': 'น้ำตาล', 'en': 'Sugar' },
  protein: { 'th': 'โปรตีน', 'en': 'Protein' }
};

// ===== Helper Functions =====

function getText(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) return obj; // ส่งคืน Array โดยตรงถ้าเป็น Array
  if (typeof obj === 'object' && obj !== null) {
    return obj[currentLang] || obj['th'] || Object.values(obj)[0];
  }
  return '';
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function showError() {
  const errContainer = document.getElementById('errorContainer');
  const recContainer = document.getElementById('recipeContainer');
  if(errContainer) errContainer.style.display = 'block';
  if(recContainer) recContainer.style.display = 'none';
  
  const errTitle = document.getElementById('errorTitle');
  const errMsg = document.getElementById('errorMsg');
  if(errTitle) errTitle.textContent = currentLang === 'th' ? 'ไม่พบสูตรนี้' : 'Recipe Not Found';
  if(errMsg) errMsg.textContent = currentLang === 'th' ? 'อาจมีการเปลี่ยนแปลงลิงก์ หรือสูตรนี้ถูกลบไปแล้ว' : 'The recipe may have been moved or deleted';
}

// ===== Language & Mode Functions =====

function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('preferredLang', lang);
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase().includes(lang)) btn.classList.add('active');
  });
  
  if (currentRecipe) updateLanguageUI();
}

function switchMode(mode) {
  currentMode = mode;
  
  // 1. จัดการสถานะปุ่ม (Active / Inactive)
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === mode) {
      btn.classList.add('active');
    }
  });

  if (currentRecipe) {
    // 2. ✅ แก้ปัญหาหลัก: บังคับเปลี่ยนหัวข้อ "titleIngredients" ตามโหมดที่เลือก
    const titleIng = document.getElementById('titleIngredients');
    if (titleIng) {
      if (mode === 'machine') {
        titleIng.textContent = currentLang === 'th' ? '⚙️ การตั้งค่าเครื่อง' : '⚙️ Machine Setup';
      } else {
        titleIng.textContent = getText(UI_LABELS.ingredients); // กลับไปใช้ "📝 วัตถุดิบ" เมื่อเป็น Manual
      }
    }

    // 3. อัปเดตรายการวัตถุดิบให้คำนวณตาม Volume ปัจจุบันเสมอ (ป้องกัน bug ปริมาณไม่เปลี่ยน)
    renderIngredients(currentRecipe, currentVolume);

    // 4. อัปเดตขั้นตอนการทำ (แยกตามโหมด)
    if (mode === 'machine') {
      renderMachineSteps(currentRecipe, currentVolume);
    } else {
      renderSteps(currentRecipe); // โหมด Manual
    }

    // 5. อัปเดตปุ่ม Action ด้านล่าง (Download / Copy Link)
    updateActionButtons();
  }
}

// ===== Media Functions =====

function switchMediaTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.media-view').forEach(v => v.classList.remove('active'));

  if (tabName === 'gallery') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('view-gallery').classList.add('active');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('view-video').classList.add('active');
  }
}

function changeMainImage(imageUrl, thumbnailElement) {
  document.getElementById('mainRecipeImage').src = imageUrl;
  document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
  if (thumbnailElement) thumbnailElement.classList.add('active');
}

// ===== Data Loading =====

async function loadRecipe(recipeId) {
  let filePath = recipeId.includes('/') ? `recipes/${recipeId}.json` : null;
  if (!filePath) {
    for (const cat of Object.keys(CATEGORY_NAMES)) {
      try {
        const res = await fetch(`recipes/${cat}/${recipeId}.json`);
        if (res.ok) { filePath = `recipes/${cat}/${recipeId}.json`; break; }
      } catch (e) { continue; }
    }
  }
  if (!filePath) throw new Error('Recipe not found');
  const response = await fetch(filePath);
  if (!response.ok) throw new Error('Failed to load recipe');
  return await response.json();
}

// ===== 🧮 Dynamic Calculator Logic =====

function formatAmount(amount, unit) {
  const unitLower = unit.toLowerCase();
  if (unitLower.includes('teaspoon') || unitLower.includes('tablespoon') || unitLower.includes('ช้อน')) {
    const fractions = [{ v: 0.25, t: '¼' }, { v: 0.33, t: '⅓' }, { v: 0.5, t: '½' }, { v: 0.67, t: '' }, { v: 0.75, t: '¾' }];
    for (const f of fractions) { if (Math.abs(amount - f.v) < 0.1) return f.t; }
    return Math.round(amount).toString();
  }
  if (unitLower.includes('piece') || unitLower.includes('leaf') || unitLower.includes('ใบ') || unitLower.includes('ชิ้น')) {
    return Math.round(amount).toString();
  }
  return amount % 1 === 0 ? amount.toString() : amount.toFixed(1);
}

// ✅ หาหน่วยที่ถูกต้อง (กรณี target_value ไปอยู่ descVariables)
function getStepUnit(step) {
  if (step.unit && step.unit !== '-') return step.unit;
  const vars = Object.values(step.descVariables || {});
  return vars.length ? vars[0].unit : '';
}

// ✅ หาค่าตั้งต้น: ใช้ target_value ก่อน ถ้าเป็น 0 ให้ดึงจาก descVariables
function getStepBaseValue(step) {
  if (step.target_value > 0) return step.target_value;
  const vars = Object.values(step.descVariables || {});
  if (vars.length) return vars[0].amount || 0;
  return 0;
}

// ✅ ตัดสินใจว่า "ขั้นตอนนี้ควร Scale ไหม"
function isStepScalable(step) {
  if (step.scalable === false) return false;
  const unit = getStepUnit(step);
  // อุณหภูมิ และ งานที่ไม่มีหน่วย (User Alert) ไม่scale
  if (unit === '°C' || unit === '-' || unit === '') return false;
  return true;
}

function scaleRecipe(recipe, targetVolume) {
  if (!recipe) return { scaledIngredients: [], scaledSteps: [] };

  const baseVolume = recipe.baseVolume || 10;
  const scaleFactor = targetVolume / baseVolume;

  const scaledIngredients = (recipe.ingredients || []).map(ing => ({
    ...ing,
    scaledAmount: ing.scalable !== false && ing.amount
      ? ing.amount * scaleFactor
      : ing.amount
  }));

  const scaledSteps = (recipe.machineSteps || []).map(step => {
    const baseValue = getStepBaseValue(step);
    const canScale = isStepScalable(step);

    // ⏱️ เวลา: Scale เฉพาะเมื่อระบุชัดว่า durationScalable: true
    // (เวลาต้ม/สกัด ไม่ควรคูณตามปริมาณน้ำ)
    const scaleTime = step.durationScalable === true;
    const baseDuration = step.duration || 0;
    const baseTimeout = step.timeout !== undefined ? step.timeout : baseDuration;

    return {
      ...step,
      scaledValue: canScale ? baseValue * scaleFactor : baseValue,
      scaledUnit: getStepUnit(step),
      scaledDuration: scaleTime
        ? parseFloat((baseDuration * scaleFactor).toFixed(2))
        : baseDuration,
      scaledTimeout: scaleTime
        ? parseFloat((baseTimeout * scaleFactor).toFixed(2))
        : baseTimeout
    };
  });

  return { scaledIngredients, scaledSteps };
}

function renderIngredients(recipe, volume) {
  const ingList = document.getElementById('ingredientsList');
  if (!ingList) return;

  // รองรับสูตรเก่า (Array ของ String)
  if (Array.isArray(recipe.ingredients) && typeof recipe.ingredients[0] === 'string') {
    ingList.innerHTML = recipe.ingredients.map(ing => `<li>${ing}</li>`).join('');
    return;
  }

  // สูตรใหม่ (Object)
  const { scaledIngredients } = scaleRecipe(recipe, volume);
  ingList.innerHTML = scaledIngredients.map(ing => {
    const amount = formatAmount(ing.scaledAmount, ing.unit);
    const scalableIcon = ing.scalable !== false ? '⚖️' : '📌';
    return `<li>${scalableIcon} <strong>${getText(ing.name)}:</strong> ${amount} ${ing.unit}</li>`;
  }).join('');
}

function renderMachineSteps(recipe, volume) {
  const stepsContainer = document.getElementById('stepsList');
  if (!stepsContainer) return;

  const { scaledSteps } = scaleRecipe(recipe, volume);
  const baseVolume = recipe.baseVolume || 10;
  const scaleFactor = volume / baseVolume;
  
  stepsContainer.innerHTML = scaledSteps.map((step) => {
    const processedDesc = processDesc(step.desc, step.descVariables, scaleFactor);
    const unit = step.scaledUnit || step.unit;
    
    // สร้าง HTML สำหรับ machine-info-box (ด้านบน)
    let infoBoxHTML = `<div class="machine-info-box">`;
    infoBoxHTML += `<span class="function-name">⚙️ ${step.function}</span>`;
    
    // Target Value (ไม่แสดงสำหรับอุณหภูมิ และงานที่ไม่มีหน่วย)
    if (step.scaledValue > 0 && unit !== '°C' && unit !== '-') {
      infoBoxHTML += `
        <div class="info-item">
          <span class="label">Target:</span>
          <span class="value">${formatAmount(step.scaledValue, unit)} ${unit}</span>
        </div>
      `;
    }
    
    // Temperature (แสดงแยกต่างหาก)
    if (step.target_value > 0 && unit === '°C') {
      infoBoxHTML += `
        <div class="info-item">
          <span class="label">Temp:</span>
          <span class="value">${step.target_value} ${unit}</span>
        </div>
      `;
    }
    
    // Duration
    if (step.scaledDuration > 0) {
      infoBoxHTML += `
        <div class="info-item">
          <span class="label">Duration:</span>
          <span class="value">${step.scaledDuration} min</span>
        </div>
      `;
    }
    
    infoBoxHTML += `</div>`;
    
    return `
      <div class="step-item">
        <div class="step-num">${step.step}</div>
        <div class="step-content">
          ${infoBoxHTML}
          <h4>${getText(step.title)}</h4>
          <p>${processedDesc}</p>
        </div>
      </div>
    `;
  }).join('');

  stepsContainer.innerHTML += `
    <div style="margin-top: 32px; text-align: center;">
      <button id="copyRecipeBtn2" class="btn-download">📋 ${currentLang === 'th' ? 'คัดลอกสูตรเข้าเครื่อง (' + volume + 'L)' : 'Copy Recipe for Machine (' + volume + 'L)'}</button>
    </div>
  `;
  document.getElementById('copyRecipeBtn2').onclick = () => copyMachineRecipeToClipboard(recipe, volume);
}

// ✅ ใหม่: คัดลอกสูตรสำหรับเครื่องลง Clipboard (แทนการดาวน์โหลดไฟล์)
function copyMachineRecipeToClipboard(recipe, volume) {
  if (!recipe || !recipe.machineSteps) {
    showToast(currentLang === 'th' ? '❌ ไม่มีข้อมูลขั้นตอนเครื่อง' : '❌ No machine steps available');
    return;
  }

  const baseVolume = recipe.baseVolume || 10;
  const scaleFactor = volume / baseVolume;

  // คำนวณ total_time และ target_temp จาก steps ที่ scale แล้ว
  let totalTime = 0;
  let targetTemp = 0;

  const scaledSteps = recipe.machineSteps.map((step, idx) => {
    const isScalable = step.scalable !== false;
    const scaledValue = isScalable ? step.target_value * scaleFactor : step.target_value;
    const scaledDuration = isScalable ? (step.duration || 0) * scaleFactor : (step.duration || 0);
    
    // คำนวณ timeout (ถ้าไม่มีให้ใช้ duration + 1)
    const baseTimeout = step.timeout !== undefined ? step.timeout : (step.duration || 0) + 1;
    const scaledTimeout = isScalable ? baseTimeout * scaleFactor : baseTimeout;

    totalTime += scaledDuration;

    // หา target_temp จาก step ที่เป็น Heat หรือ Hold
    if ((step.function === 'Heat Water' || step.function === 'Hold Temp') && step.target_value > targetTemp) {
      targetTemp = step.target_value;
    }

    // แทนที่ placeholder ใน sub_name (ถ้ามี)
    let subName = getText(step.title) || "";
    if (step.descVariables) {
      for (const [key, varInfo] of Object.entries(step.descVariables)) {
        const scaledAmount = varInfo.scalable !== false ? varInfo.amount * scaleFactor : varInfo.amount;
        const formatted = formatAmount(scaledAmount, varInfo.unit);
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        subName = subName.replace(regex, `${formatted} ${varInfo.unit}`);
      }
    }

    return {
      step_id: idx + 1,
      function: step.function,
      sub_name: subName,
      target_value: parseFloat(scaledValue.toFixed(2)),
      unit: step.unit,
      duration: parseFloat(scaledDuration.toFixed(2)),
      duration_unit: step.duration_unit || "minute",
      timeout: parseFloat(scaledTimeout.toFixed(2)),
      timeout_unit: step.timeout_unit || "minute",
      outputs_csv: step.outputs_csv || ""
    };
  });

  // สร้างโครงสร้าง JSON ตามรูปแบบ FML
  const machineData = {
    recipe_id: recipe.id || "unknown_recipe",
    recipe_name: getText(recipe.name) || "Unknown Recipe",
    icon: recipe.icon || "🌺",
    category: recipe.category || "herbal",
    description: getText(recipe.intro) || getText(recipe.description) || "",
    total_time: Math.round(totalTime),
    target_temp: targetTemp,
    total_volume: volume,
    steps: scaledSteps
  };

  const jsonString = JSON.stringify(machineData, null, 2);

  // ✅ คัดลอกลง Clipboard
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(jsonString).then(() => {
      showToast(currentLang === 'th' 
        ? `✅ คัดลอกสูตร ${volume}L ลงคลิปบอร์ดแล้ว! (${scaledSteps.length} ขั้นตอน)` 
        : `✅ Copied ${volume}L recipe to clipboard! (${scaledSteps.length} steps)`);
      console.log('📋 FML JSON copied to clipboard:', machineData);
    }).catch(err => {
      console.error('Clipboard error:', err);
      fallbackCopy(jsonString, volume, scaledSteps.length);
    });
  } else {
    fallbackCopy(jsonString, volume, scaledSteps.length);
  }
}

// ✅ Fallback สำหรับเบราว์เซอร์เก่า
function fallbackCopy(text, volume, stepCount) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast(currentLang === 'th' 
      ? `✅ คัดลอกสูตร ${volume}L ลงคลิปบอร์ดแล้ว! (${stepCount} ขั้นตอน)` 
      : `✅ Copied ${volume}L recipe to clipboard! (${stepCount} steps)`);
  } catch (err) {
    showToast(currentLang === 'th' ? '❌ คัดลอกไม่สำเร็จ' : '❌ Copy failed');
  }
  document.body.removeChild(textarea);
}

function initVolumeSelector(recipe) {
  const slider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  const volumeUnit = document.getElementById('volumeUnit');
  const volumeRange = document.getElementById('volumeRange');
  const servingsDisplay = document.getElementById('servings'); // ✅ เพิ่มตัวแปรนี้
  const presetBtns = document.querySelectorAll('.preset-btn');
  
  if (!slider) return;
  
  const baseVolume = recipe.baseVolume || 10;
  const minVolume = recipe.minVolume || 1;
  const maxVolume = recipe.maxVolume || 20;
  const unitText = getText(recipe.volumeUnit || { th: 'ลิตร', en: 'Liter' }); // ดึงหน่วยภาษา
  
  slider.min = minVolume;
  slider.max = maxVolume;
  slider.value = baseVolume;
  currentVolume = baseVolume;
  
  volumeValue.textContent = baseVolume;
  volumeUnit.textContent = unitText;
  
  // ✅ 1. อัปเดตกล่อง "ปริมาณ" ใน info-grid ตอนโหลดครั้งแรก
  if (servingsDisplay) servingsDisplay.textContent = `${baseVolume} ${unitText}`;
  
  volumeRange.textContent = `${minVolume} - ${maxVolume} ${getText(recipe.volumeUnit || { th: 'ลิตร', en: 'Liters' })}`;
  
  presetBtns.forEach(btn => {
    btn.classList.remove('active');
    if (parseInt(btn.dataset.volume) === baseVolume) btn.classList.add('active');
  });
  
  // ✅ 2. เมื่อเลื่อน Slider
  slider.oninput = (e) => {
    const newVolume = parseInt(e.target.value);
    currentVolume = newVolume;
    volumeValue.textContent = newVolume;
    
    // ✅ อัปเดตกล่อง "ปริมาณ" ใน info-grid ทันที
    if (servingsDisplay) servingsDisplay.textContent = `${newVolume} ${unitText}`;
    
    presetBtns.forEach(btn => {
      btn.classList.remove('active');
      if (parseInt(btn.dataset.volume) === newVolume) btn.classList.add('active');
    });
    
    // อัปเดตวัตถุดิบและขั้นตอนตามโหมด
    renderIngredients(recipe, newVolume);
    if (currentMode === 'machine') {
      renderMachineSteps(recipe, newVolume);
    } else {
      renderSteps(recipe);
    }
  };
  
  // ✅ 3. เมื่อกดปุ่ม Preset
  presetBtns.forEach(btn => {
    btn.onclick = () => {
      const newVolume = parseInt(btn.dataset.volume);
      currentVolume = newVolume;
      slider.value = newVolume;
      volumeValue.textContent = newVolume;
      
      // ✅ อัปเดตกล่อง "ปริมาณ" ใน info-grid ทันที
      if (servingsDisplay) servingsDisplay.textContent = `${newVolume} ${unitText}`;
      
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // อัปเดตวัตถุดิบและขั้นตอนตามโหมด
      renderIngredients(recipe, newVolume);
      if (currentMode === 'machine') {
        renderMachineSteps(recipe, newVolume);
      } else {
        renderSteps(recipe);
      }
    };
  });
}


// ฟังก์ชันประมวลผลข้อความแบบ Dynamic (แทนที่ {placeholder} ด้วยค่าที่ scale แล้ว)
function processDesc(descObj, variables, scaleFactor) {
  if (!descObj) return '';
  
  const text = getText(descObj); // ได้ข้อความ th หรือ en
  if (!variables || Object.keys(variables).length === 0) return text;
  
  let result = text;
  
  for (const [key, varInfo] of Object.entries(variables)) {
    const scaledAmount = varInfo.scalable !== false ? varInfo.amount * scaleFactor : varInfo.amount;
    const formatted = formatAmount(scaledAmount, varInfo.unit);
    const placeholder = `{${key}}`;
    
    // แทนที่ทุก occurrence ของ placeholder
    const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
    result = result.replace(regex, `${formatted} ${varInfo.unit}`);
  }
  
  return result;
}

// ===== Rendering & UI Updates =====
function renderSteps(recipe) {
  const stepsContainer = document.getElementById('stepsList');
  if (!stepsContainer) return;
  
  if (currentMode === 'manual') {
    const manualSteps = recipe.manualSteps || [];
    const baseVolume = recipe.baseVolume || 10;
    const scaleFactor = currentVolume / baseVolume;
    
    stepsContainer.innerHTML = manualSteps.map(step => {
      // ประมวลผลข้อความแบบ Dynamic
      const processedDesc = processDesc(step.desc, step.descVariables, scaleFactor);
      const processedTips = step.tips ? processDesc(step.tips, step.descVariables, scaleFactor) : null;
      
      return `
        <div class="step-item">
          <div class="step-num">${step.step}</div>
          <div class="step-content">
            <h4>${getText(step.title)}</h4>
            <p>${processedDesc}</p>
            ${step.image ? `<img src="${step.image}" alt="${getText(step.title)}" class="step-image" loading="lazy">` : ''}
            ${processedTips ? `<div class="tips-box">${processedTips}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } else {
    renderMachineSteps(recipe, currentVolume);
  }
}

function updateActionButtons() {
  const container = document.getElementById('actionButtons');
  if (!container) return;
  
  // ✅ ปรับเหลือเฉพาะปุ่ม "ดูสูตรอื่นๆ" 
  // (เนื่องจากปุ่มคัดลอกสูตรเข้าเครื่อง ถูกย้ายไปอยู่ใน renderMachineSteps แล้ว)
  container.innerHTML = `
    <a href="index.html" class="btn-back" id="btnBackToHome">${getText(UI_LABELS.backToHome)}</a>
  `;
}

function updateLanguageUI() {
  if (!currentRecipe) return;

  const setTxt = (id, labelKey) => { const el = document.getElementById(id); if (el) el.textContent = getText(UI_LABELS[labelKey]); };

  setTxt('headerTitle', 'headerTitle');
  setTxt('titleVolume', 'titleVolume');
  //setTxt('labelPrepTime', 'prepTime'); setTxt('labelCookTime', 'cookTime');
  //setTxt('labelServings', 'servings'); setTxt('labelRating', 'rating');
  setTxt('titleIngredients', 'ingredients'); setTxt('titleSteps', 'steps');
  setTxt('titleNutrition', 'nutrition'); setTxt('btnBackToHome', 'backToHome');

  const btnManual = document.getElementById('btnModeManual');
  if (btnManual) btnManual.innerHTML = `🖐️ <span class="mode-text">${getText(UI_LABELS.modeManual)}</span>`;
  const btnMachine = document.getElementById('btnModeMachine');
  if (btnMachine) btnMachine.innerHTML = `🤖 <span class="mode-text">${getText(UI_LABELS.modeMachine)}</span>`;

  setTxt('tabGallery', 'tabGallery'); setTxt('tabVideo', 'tabVideo');

  document.getElementById('recipeCategory').textContent = getText(CATEGORY_NAMES[currentRecipe.category] || { th: 'สูตรทั่วไป', en: 'General Recipe' });
  document.getElementById('recipeTitle').textContent = getText(currentRecipe.name);
  document.getElementById('recipeIntro').textContent = getText(currentRecipe.intro);
  //document.getElementById('prepTime').textContent = getText(currentRecipe.prepTime);
  //document.getElementById('cookTime').textContent = getText(currentRecipe.cookTime);
  //document.getElementById('servings').textContent = getText(currentRecipe.servings);
  //document.getElementById('rating').textContent = `${currentRecipe.rating} / 5`;
  
  document.getElementById('benefitBox').innerHTML = `<strong>${getText(UI_LABELS.benefits)}:</strong> ${getText(currentRecipe.benefits)}`;
  document.getElementById('warningBox').innerHTML = getText(currentRecipe.warnings);
  
  // ✅ แก้ไขจุดที่ Error: ใช้ renderIngredients แทนการ map โดยตรง
  renderIngredients(currentRecipe, currentVolume);
  
  renderSteps(currentRecipe);
  
  const nutritionLabels = { calories: UI_LABELS.calories, carbs: UI_LABELS.carbs, sugar: UI_LABELS.sugar, protein: UI_LABELS.protein };
  const nutList = document.getElementById('nutritionList');
  if (nutList) {
    nutList.innerHTML = Object.entries(currentRecipe.nutrition).map(([key, value]) => `
      <div class="nutrition-row"><span>${getText(nutritionLabels[key] || { th: key, en: key })}</span><span>${value}</span></div>
    `).join('');
  }

  updateActionButtons();
}

function copyMachineLink() {
  if (!currentRecipe || !currentRecipe.machineFile) {
    showToast(currentLang === 'th' ? '❌ ไม่มีลิงก์สูตรสำหรับเครื่อง' : '❌ No machine recipe link available');
    return;
  }
  const baseUrl = window.location.origin + window.location.pathname.replace(/recipe\.html.*/, '');
  const machineUrl = `${baseUrl}recipes/${currentRecipe.category}/${currentRecipe.machineFile}`;
  navigator.clipboard.writeText(machineUrl).then(() => {
    showToast(currentLang === 'th' ? '✅ คัดลอกลิงก์แล้ว!' : '✅ Link copied!');
  }).catch(() => showToast(currentLang === 'th' ? '✅ คัดลอกลิงก์แล้ว!' : '✅ Link copied!'));
}

async function renderRecipePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  if (!recipeId) { showError(); return; }

  try {
    const recipe = await loadRecipe(recipeId);
    currentRecipe = recipe;
    currentVolume = recipe.baseVolume || 10; // รีเซ็ตปริมาณเมื่อโหลดสูตรใหม่
    
    document.getElementById('recipeContainer').style.display = 'block';
    document.getElementById('errorContainer').style.display = 'none';
    document.title = `${getText(recipe.name)} | Beverage Masterclass`;
    
    const images = recipe.images || [];
    const mainImg = document.getElementById('mainRecipeImage');
    const thumbStrip = document.getElementById('thumbnailStrip');
    
    if (images.length > 0) {
      mainImg.src = images[0];
      if (images.length > 1) {
        thumbStrip.innerHTML = images.map((imgUrl, index) => `
          <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${imgUrl}', this)">
            <img src="${imgUrl}" alt="Thumbnail ${index + 1}">
          </div>
        `).join('');
      } else { thumbStrip.innerHTML = ''; }
    } else {
      mainImg.src = 'https://via.placeholder.com/800x450/4CAF50/FFFFFF?text=No+Image';
      thumbStrip.innerHTML = '';
    }
    document.getElementById('recipeVideo').src = recipe.videoUrl || '';
    
    updateLanguageUI();
    initVolumeSelector(recipe); // ✅ เรียกใช้ Volume Selector หลังจากโหลดข้อมูลเสร็จ
    switchMediaTab('gallery');
    
  } catch (error) {
    console.error('Error loading recipe:', error);
    showError();
  }
}

// ===== Categories Logic =====

const CATEGORIES_DATA = {
  herbal: { name: { th: 'สมุนไพรไทย', en: 'Thai Herbs' }, desc: { th: 'รวมสูตรเครื่องดื่มจากภูมิปัญญาไทย...', en: 'Traditional Thai herbal drinks...' }, image: 'images/categories/herbal.jpg', count: 2 },
  tea: { name: { th: 'ชา & เครื่องดื่มร้อน', en: 'Tea & Hot Drinks' }, desc: { th: 'ชาไทย ชาเขียว และเครื่องดื่มร้อนหลากสไตล์', en: 'Thai tea, green tea, and various hot beverages' }, image: 'images/categories/tea.jpg', count: 0 },
  milk: { name: { th: 'นม & ธัญพืช', en: 'Milk & Cereals' }, desc: { th: 'นมถั่วเหลือง นมข้าวโพด และเครื่องดื่มธัญพืช', en: 'Soy milk, corn milk, and cereal-based drinks' }, image: 'images/categories/milk.jpg', count: 0 },
  ferment: { name: { th: 'เครื่องดื่มหมัก', en: 'Fermented Beverages' }, desc: { th: 'คอมบูฉะ เบียร์คราฟต์ และโยเกิร์ต', en: 'Kombucha, craft beer, and yogurt drinks' }, image: 'images/categories/ferment.jpg', count: 0 }
};

function renderCategoriesPage() {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return;
  
  const pageTitle = document.getElementById('pageTitle');
  const pageHeading = document.getElementById('pageHeading');
  const pageSubheading = document.getElementById('pageSubheading');
  
  if (pageTitle) pageTitle.textContent = getText({ th: 'หมวดหมู่', en: 'Categories' });
  if (pageHeading) pageHeading.textContent = getText({ th: 'หมวดหมู่เครื่องดื่ม', en: 'Beverage Categories' });
  if (pageSubheading) pageSubheading.textContent = getText({ th: 'เลือกหมวดหมู่เพื่อสำรวจสูตรเครื่องดื่ม', en: 'Choose a category to explore recipes' });
  
  grid.innerHTML = Object.entries(CATEGORIES_DATA).map(([id, cat]) => `
    <a href="category.html?id=${id}" class="category-card">
      <img src="${cat.image}" alt="${getText(cat.name)}" class="category-card-img">
      <div class="category-card-body">
        <div class="category-card-title">${getText(cat.name)}</div>
        <div class="category-card-desc">${getText(cat.desc)}</div>
        <div class="category-card-count">${cat.count} ${getText({ th: 'สูตร', en: 'recipes' })}</div>
      </div>
    </a>
  `).join('');
}

async function renderCategoryPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('id');
  if (!categoryId) {
    document.getElementById('errorContainer').style.display = 'block';
    document.getElementById('categoryContainer').style.display = 'none';
    return;
  }
  try {
    const response = await fetch(`recipes/${categoryId}/index.json`);
    if (!response.ok) throw new Error('Category not found');
    const recipes = await response.json();
    const categoryInfo = CATEGORIES_DATA[categoryId];
    if (!categoryInfo) throw new Error('Category info not found');
    
    document.getElementById('categoryContainer').style.display = 'block';
    document.getElementById('errorContainer').style.display = 'none';
    document.getElementById('heroTitle').textContent = getText(categoryInfo.name);
    document.getElementById('heroDesc').textContent = getText(categoryInfo.desc);
    document.getElementById('headerTitle').textContent = getText(categoryInfo.name);
    document.title = `${getText(categoryInfo.name)} | Beverage Masterclass`;
    
    const grid = document.getElementById('recipeGrid');
    if (recipes.length === 0) {
      grid.innerHTML = `<div class="empty-state">${getText({ th: 'ยังไม่มีสูตรในหมวดหมู่นี้', en: 'No recipes in this category yet' })}</div>`;
    } else {
      grid.innerHTML = recipes.map(r => `
        <a href="recipe.html?id=${categoryId}/${r.id}" class="recipe-card">
          <img src="${r.image}" alt="${getText(r.name)}" class="recipe-card-img">
          <div class="recipe-card-body">
            <div class="recipe-card-title">${getText(r.name)}</div>
            <div class="recipe-card-meta"><span>️ ${getText(r.prepTime)}</span><span>⭐ ${r.rating}</span></div>
            ${r.badges && r.badges[currentLang] ? `<div class="recipe-card-badges">${r.badges[currentLang].map(b => `<span class="badge">${b}</span>`).join('')}</div>` : ''}
          </div>
        </a>
      `).join('');
    }
    document.getElementById('btnBackToCategories').textContent = getText({ th: '← กลับไปหน้าหมวดหมู่', en: '← Back to Categories' });
  } catch (error) {
    console.error('Error loading category:', error);
    document.getElementById('errorContainer').style.display = 'block';
    document.getElementById('categoryContainer').style.display = 'none';
  }
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('categoryGrid')) renderCategoriesPage();
  else if (document.getElementById('recipeGrid')) renderCategoryPage();
  else if (document.getElementById('recipeContainer')) renderRecipePage();
});