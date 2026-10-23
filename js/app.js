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
  downloadBtn: { 'th': '⬇ ดาวน์โหลดสูตรเข้าเครื่อง (.json)', 'en': ' Download Recipe for Machine (.json)' },
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
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === mode) btn.classList.add('active');
  });
  if (currentRecipe) {
    renderSteps(currentRecipe);
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

function scaleRecipe(recipe, targetVolume) {
  if (!recipe) return { scaledIngredients: [], scaledSteps: [] };
  const baseVolume = recipe.baseVolume || 10;
  const scaleFactor = targetVolume / baseVolume;

  const scaledIngredients = (recipe.ingredients || []).map(ing => {
    if (ing.scalable !== false && ing.amount) {
      return { ...ing, scaledAmount: ing.amount * scaleFactor };
    }
    return { ...ing, scaledAmount: ing.amount };
  });

  const scaledSteps = (recipe.machineSteps || []).map(step => {
    if (step.scalable !== false && step.function === 'Fill Water') {
      return { ...step, scaledValue: step.target_value * scaleFactor };
    }
    return { ...step, scaledValue: step.target_value };
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
  stepsContainer.innerHTML = scaledSteps.map((step) => `
    <div class="step-item">
      <div class="step-num">${step.step}</div>
      <div class="step-content">
        <h4>${getText(step.title)}</h4>
        <p>${getText(step.desc)}</p>
        <div class="machine-info-box">
          <strong>️ ${step.function}</strong>
          ${step.scaledValue > 0 && step.unit !== '°C' && step.unit !== '-' ? ` | Target: ${step.scaledValue} ${step.unit}` : ''}
          ${step.target_value > 0 && step.unit === '°C' ? ` | Target: ${step.target_value} ${step.unit}` : ''}
          ${step.duration > 0 ? ` | Duration: ${step.duration} min` : ''}
        </div>
      </div>
    </div>
  `).join('');

  stepsContainer.innerHTML += `
    <div style="margin-top: 32px; text-align: center;">
      <button id="downloadBtn" class="btn-download">${getText(UI_LABELS.downloadBtn)}</button>
    </div>
  `;
  document.getElementById('downloadBtn').onclick = () => downloadRecipeJSON(recipe, volume);
}

function downloadRecipeJSON(recipe, volume) {
  const { scaledSteps } = scaleRecipe(recipe, volume);
  const machineData = {
    recipe_id: recipe.id,
    recipe_name: getText(recipe.name),
    volume: volume,
    total_volume: volume,
    total_time: scaledSteps.reduce((acc, curr) => acc + (curr.duration || 0), 0),
    target_temp: scaledSteps.find(s => s.function.includes('Heat') || s.function.includes('Hold'))?.target_value || 0,
    steps: scaledSteps.map(s => ({
      function: s.function,
      target_value: s.scaledValue,
      unit: s.unit,
      duration: s.duration || 0
    }))
  };

  const blob = new Blob([JSON.stringify(machineData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // เปลี่ยนชื่อไฟล์ตามปริมาณที่เลือก
  a.download = `FML_${recipe.id.replace(/_\d+L$/, '')}_${volume}L.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast(currentLang === 'th' ? `✅ ดาวน์โหลดสูตร ${volume}L สำเร็จ!` : `✅ Downloaded ${volume}L recipe!`);
}

function initVolumeSelector(recipe) {
  const slider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  const volumeUnit = document.getElementById('volumeUnit');
  const volumeRange = document.getElementById('volumeRange');
  const presetBtns = document.querySelectorAll('.preset-btn');
  
  if (!slider) return;
  
  const baseVolume = recipe.baseVolume || 10;
  const minVolume = recipe.minVolume || 1;
  const maxVolume = recipe.maxVolume || 20;
  
  slider.min = minVolume;
  slider.max = maxVolume;
  slider.value = baseVolume;
  currentVolume = baseVolume;
  
  volumeValue.textContent = baseVolume;
  volumeUnit.textContent = getText(recipe.volumeUnit || { th: 'ลิตร', en: 'Liter' });
  volumeRange.textContent = `${minVolume} - ${maxVolume} ${getText(recipe.volumeUnit || { th: 'ลิตร', en: 'Liters' })}`;
  
  presetBtns.forEach(btn => {
    btn.classList.remove('active');
    if (parseInt(btn.dataset.volume) === baseVolume) btn.classList.add('active');
  });
  
  slider.oninput = (e) => {
    const newVolume = parseInt(e.target.value);
    currentVolume = newVolume;
    volumeValue.textContent = newVolume;
    presetBtns.forEach(btn => {
      btn.classList.remove('active');
      if (parseInt(btn.dataset.volume) === newVolume) btn.classList.add('active');
    });
    if (currentMode === 'manual') renderIngredients(recipe, newVolume);
    else renderMachineSteps(recipe, newVolume);
  };
  
  presetBtns.forEach(btn => {
    btn.onclick = () => {
      const newVolume = parseInt(btn.dataset.volume);
      currentVolume = newVolume;
      slider.value = newVolume;
      volumeValue.textContent = newVolume;
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (currentMode === 'manual') renderIngredients(recipe, newVolume);
      else renderMachineSteps(recipe, newVolume);
    };
  });
}

// ===== Rendering & UI Updates =====

function renderSteps(recipe) {
  const stepsContainer = document.getElementById('stepsList');
  if (!stepsContainer) return;
  
  if (currentMode === 'manual') {
    const manualSteps = recipe.manualSteps || [];
    stepsContainer.innerHTML = manualSteps.map(step => `
      <div class="step-item">
        <div class="step-num">${step.step}</div>
        <div class="step-content">
          <h4>${getText(step.title)}</h4>
          <p>${getText(step.desc)}</p>
          ${step.image ? `<img src="${step.image}" alt="${getText(step.title)}" class="step-image" loading="lazy">` : ''}
          ${step.tips ? `<div class="tips-box">${getText(step.tips)}</div>` : ''}
        </div>
      </div>
    `).join('');
  } else {
    renderMachineSteps(recipe, currentVolume);
  }
}

function updateActionButtons() {
  const container = document.getElementById('actionButtons');
  if (!container) return;
  
  if (currentMode === 'manual') {
    container.innerHTML = `
      <button id="copyLinkBtn" class="btn-copy-link">📋 ${getText(UI_LABELS.copyLink)}</button>
      <a href="index.html" class="btn-back">${getText(UI_LABELS.backToHome)}</a>
    `;
    document.getElementById('copyLinkBtn').onclick = () => copyMachineLink();
  } else {
    container.innerHTML = `
      <button id="downloadBtn" class="btn-download">${getText(UI_LABELS.downloadBtn)}</button>
      <a href="index.html" class="btn-back">${getText(UI_LABELS.backToHome)}</a>
    `;
    document.getElementById('downloadBtn').onclick = () => downloadRecipeJSON(currentRecipe, currentVolume);
  }
}

function updateLanguageUI() {
  if (!currentRecipe) return;

  const setTxt = (id, labelKey) => { const el = document.getElementById(id); if (el) el.textContent = getText(UI_LABELS[labelKey]); };

  setTxt('headerTitle', 'headerTitle');
  setTxt('labelPrepTime', 'prepTime'); setTxt('labelCookTime', 'cookTime');
  setTxt('labelServings', 'servings'); setTxt('labelRating', 'rating');
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
  document.getElementById('prepTime').textContent = getText(currentRecipe.prepTime);
  document.getElementById('cookTime').textContent = getText(currentRecipe.cookTime);
  document.getElementById('servings').textContent = getText(currentRecipe.servings);
  document.getElementById('rating').textContent = `${currentRecipe.rating} / 5`;
  
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
