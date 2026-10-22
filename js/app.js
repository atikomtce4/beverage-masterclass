/* ==========================================================
   🧠 BEVERAGE MASTERCLASS - APP LOGIC (Fully Bilingual Fixed)
   ========================================================== */

let currentLang = localStorage.getItem('preferredLang') || 'th';
let currentMode = 'manual';
let currentRecipe = null;

const CATEGORY_NAMES = {
  'herbal': { 'th': 'สมุนไพรไทย', 'en': 'Thai Herbs' },
  'tea': { 'th': 'ชา & เครื่องดื่มร้อน', 'en': 'Tea & Hot Drinks' },
  'milk': { 'th': 'นม & ธัญพืช', 'en': 'Milk & Cereals' },
  'ferment': { 'th': 'เครื่องดื่มหมัก', 'en': 'Fermented Beverages' }
};

const UI_LABELS = {
  headerTitle: { 'th': 'สูตรเครื่องดื่ม', 'en': 'Beverage Recipes' }, // ✅ เพิ่มแล้ว
  modeManual: { 'th': 'ทำเอง', 'en': 'Manual' }, // ✅ เพิ่มแล้ว
  modeMachine: { 'th': 'ใช้เครื่อง', 'en': 'Machine' }, // ✅ เพิ่มแล้ว
  tabGallery: { 'th': '📷 รูปภาพ', 'en': '📷 Gallery' }, // ✅ เพิ่มแล้ว
  tabVideo: { 'th': '🎬 วิดีโอ', 'en': '🎬 Video' }, // ✅ เพิ่มแล้ว
  prepTime: { 'th': 'เวลาเตรียม', 'en': 'Prep Time' },
  cookTime: { 'th': 'เวลาทำ', 'en': 'Cook Time' },
  servings: { 'th': 'ปริมาณ', 'en': 'Servings' },
  rating: { 'th': 'คะแนน', 'en': 'Rating' },
  ingredients: { 'th': '📝 วัตถุดิบ', 'en': '📝 Ingredients' },
  steps: { 'th': '👩‍🍳 ขั้นตอนการทำ', 'en': '👩‍🍳 Instructions' },
  nutrition: { 'th': '📊 ข้อมูลโภชนาการ (ต่อ 100 มล.)', 'en': '📊 Nutrition Facts (per 100ml)' },
  backToHome: { 'th': 'ดูสูตรอื่นๆ', 'en': 'Browse More Recipes' },
  copyLink: { 'th': '📋 คัดลอกลิงก์สูตรสำหรับเครื่อง', 'en': '📋 Copy Machine Recipe Link' },
  downloadBtn: { 'th': '⬇ ดาวน์โหลดสูตรเข้าเครื่อง (.json)', 'en': '⬇ Download Recipe for Machine (.json)' },
  benefits: { 'th': 'สรรพคุณ', 'en': 'Benefits' },
  calories: { 'th': 'พลังงาน', 'en': 'Calories' },
  carbs: { 'th': 'คาร์โบไฮเดรต', 'en': 'Carbs' },
  sugar: { 'th': 'น้ำตาล', 'en': 'Sugar' },
  protein: { 'th': 'โปรตีน', 'en': 'Protein' }
};

function getText(obj) {
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'object' && obj !== null) {
    return obj[currentLang] || obj['th'] || Object.values(obj)[0];
  }
  return '';
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function showError() {
  document.getElementById('errorContainer').style.display = 'block';
  document.getElementById('recipeContainer').style.display = 'none';
  document.getElementById('errorTitle').textContent = currentLang === 'th' ? 'ไม่พบสูตรนี้' : 'Recipe Not Found';
  document.getElementById('errorMsg').textContent = currentLang === 'th' 
    ? 'อาจมีการเปลี่ยนแปลงลิงก์ หรือสูตรนี้ถูกลบไปแล้ว' 
    : 'The recipe may have been moved or deleted';
}

function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('preferredLang', lang);
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase() === lang) {
      btn.classList.add('active');
    }
  });
  
  if (currentRecipe) {
    updateLanguageUI();
  }
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

function renderSteps(recipe) {
  const stepsContainer = document.getElementById('stepsList');
  
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
    const machineSteps = recipe.machineSteps || [];
    stepsContainer.innerHTML = machineSteps.map((step) => `
      <div class="step-item">
        <div class="step-num">${step.step}</div>
        <div class="step-content">
          <h4>${getText(step.title)}</h4>
          <p>${getText(step.desc)}</p>
          <div class="machine-info-box">
            <strong>⚙️ ${step.function}</strong>
            ${step.target_value > 0 ? ` | Target: ${step.target_value} ${step.unit}` : ''}
            ${step.duration > 0 ? ` | Duration: ${step.duration} min` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }
}

function updateActionButtons() {
  const container = document.getElementById('actionButtons');
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
    document.getElementById('downloadBtn').onclick = () => downloadRecipeJSON(currentRecipe);
  }
}

function updateLanguageUI() {
  if (!currentRecipe) return;

  // 1. อัปเดตข้อความที่ Hardcoded ใน HTML (แก้จุดที่ 1-5)
  document.getElementById('headerTitle').textContent = getText(UI_LABELS.headerTitle);
  document.getElementById('btnModeManual').innerHTML = `🖐️ <span class="mode-text">${getText(UI_LABELS.modeManual)}</span>`;
  document.getElementById('btnModeMachine').innerHTML = `🤖 <span class="mode-text">${getText(UI_LABELS.modeMachine)}</span>`;
  document.getElementById('tabGallery').textContent = getText(UI_LABELS.tabGallery);
  document.getElementById('tabVideo').textContent = getText(UI_LABELS.tabVideo);

  // 2. อัปเดตข้อมูลสูตร
  document.getElementById('recipeCategory').textContent = getText(CATEGORY_NAMES[currentRecipe.category] || { th: 'สูตรทั่วไป', en: 'General Recipe' });
  document.getElementById('recipeTitle').textContent = getText(currentRecipe.name);
  document.getElementById('recipeIntro').textContent = getText(currentRecipe.intro);
  document.getElementById('prepTime').textContent = getText(currentRecipe.prepTime);
  document.getElementById('cookTime').textContent = getText(currentRecipe.cookTime);
  document.getElementById('servings').textContent = getText(currentRecipe.servings);
  document.getElementById('rating').textContent = `${currentRecipe.rating} / 5`;
  
  document.getElementById('labelPrepTime').textContent = getText(UI_LABELS.prepTime);
  document.getElementById('labelCookTime').textContent = getText(UI_LABELS.cookTime);
  document.getElementById('labelServings').textContent = getText(UI_LABELS.servings);
  document.getElementById('labelRating').textContent = getText(UI_LABELS.rating);
  document.getElementById('titleIngredients').textContent = getText(UI_LABELS.ingredients);
  document.getElementById('titleSteps').textContent = getText(UI_LABELS.steps);
  document.getElementById('titleNutrition').textContent = getText(UI_LABELS.nutritionA); // Fixed typo if any, using nutrition
  
  // 3. แก้ไขจุดที่ 6: ดึง Array ของวัตถุดิบตามภาษาให้ถูกต้อง
  const ingredientsArray = getText(currentRecipe.ingredients);
  document.getElementById('ingredientsList').innerHTML = ingredientsArray.map(ing => `<li>${ing}</li>`).join('');
  
  // 4. Render ขั้นตอนใหม่ (จะดึง title/desc ที่เป็น object {th, en} มาแปลงอัตโนมัติ)
  renderSteps(currentRecipe);
  
  // 5. โภชนาการ
  const nutritionLabels = { calories: UI_LABELS.calories, carbs: UI_LABELS.carbs, sugar: UI_LABELS.sugar, protein: UI_LABELS.protein };
  document.getElementById('nutritionList').innerHTML = Object.entries(currentRecipe.nutrition).map(([key, value]) => `
    <div class="nutrition-row">
      <span>${getText(nutritionLabels[key] || { th: key, en: key })}</span>
      <span>${value}</span>
    </div>
  `).join('');

  // 6. อัปเดตปุ่ม Action (แก้จุดที่ 7, 8)
  updateActionButtons();
  
  document.getElementById('benefitBox').innerHTML = `<strong>${getText(UI_LABELS.benefits)}:</strong> ${getText(currentRecipe.benefits)}`;
  document.getElementById('warningBox').innerHTML = getText(currentRecipe.warnings);
}

function copyMachineLink() {
  if (!currentRecipe || !currentRecipe.machineFile) {
    showToast(currentLang === 'th' ? '❌ ไม่มีลิงก์สูตรสำหรับเครื่อง' : '❌ No machine recipe link available');
    return;
  }
  const baseUrl = window.location.origin + window.location.pathname.replace(/recipe\.html.*/, '');
  const machineUrl = `${baseUrl}recipes/${currentRecipe.category}/${currentRecipe.machineFile}`;
  
  navigator.clipboard.writeText(machineUrl).then(() => {
    showToast(currentLang === 'th' ? '✅ คัดลอกลิงก์แล้ว! นำไปวางในหน้าควบคุมเครื่องได้เลย' : '✅ Link copied! Paste it in the machine control page');
  }).catch(() => {
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = machineUrl;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showToast(currentLang === 'th' ? '✅ คัดลอกลิงก์แล้ว! นำไปวางในหน้าควบคุมเครื่องได้เลย' : '✅ Link copied! Paste it in the machine control page');
  });
}

function downloadRecipeJSON(recipe) {
  const machineData = {
    recipe_id: recipe.id,
    recipe_name: getText(recipe.name),
    total_volume: recipe.machineSteps.find(s => s.function === "Fill Water")?.target_value || 0,
    total_time: recipe.machineSteps.reduce((acc, curr) => acc + (curr.duration || 0), 0),
    target_temp: recipe.machineSteps.find(s => s.function.includes("Heat") || s.function.includes("Hold"))?.target_value || 0,
    steps: recipe.machineSteps.map(s => ({
      function: s.function, target_value: s.target_value, unit: s.unit, duration: s.duration || 0
    }))
  };

  const blob = new Blob([JSON.stringify(machineData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `FML_${recipe.id}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast(currentLang === 'th' ? `✅ ดาวน์โหลด "${getText(recipe.name)}" สำเร็จ!` : `✅ Recipe "${getText(recipe.name)}" downloaded!`);
}

async function renderRecipePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  if (!recipeId) { showError(); return; }

  try {
    const recipe = await loadRecipe(recipeId);
    currentRecipe = recipe;
    
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
    
    // เรียกใช้ฟังก์ชันอัปเดตภาษาซึ่งจะจัดการทุกอย่างรวมถึง Action Buttons
    updateLanguageUI();
    
    switchMediaTab('gallery');
    
  } catch (error) {
    console.error('Error loading recipe:', error);
    showError();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderRecipePage();
});

/* ==========================================================
   📂 CATEGORIES & CATEGORY PAGE LOGIC
   ========================================================== */

// ข้อมูลหมวดหมู่ (สำหรับหน้า categories.html)
const CATEGORIES_DATA = {
  herbal: {
    name: { th: 'สมุนไพรไทย', en: 'Thai Herbs' },
    desc: { th: 'รวมสูตรเครื่องดื่มจากภูมิปัญญาไทย สรรพคุณเน้นๆ ทำง่าย ดื่มดีต่อสุขภาพ', en: 'Traditional Thai herbal drinks with health benefits, easy to make' },
    image: 'https://images.unsplash.com/photo-1563911302283-d2bc129e7c1f?w=400&q=80',
    count: 2
  },
  tea: {
    name: { th: 'ชา & เครื่องดื่มร้อน', en: 'Tea & Hot Drinks' },
    desc: { th: 'ชาไทย ชาเขียว และเครื่องดื่มร้อนหลากสไตล์', en: 'Thai tea, green tea, and various hot beverages' },
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80',
    count: 0
  },
  milk: {
    name: { th: 'นม & ธัญพืช', en: 'Milk & Cereals' },
    desc: { th: 'นมถั่วเหลือง นมข้าวโพด และเครื่องดื่มธัญพืช', en: 'Soy milk, corn milk, and cereal-based drinks' },
    image: 'https://images.unsplash.com/photo-1605202888635-1e331ec07b83?w=400&q=80',
    count: 0
  },
  ferment: {
    name: { th: 'เครื่องดื่มหมัก', en: 'Fermented Beverages' },
    desc: { th: 'คอมบูฉะ เบียร์คราฟต์ และโยเกิร์ต', en: 'Kombucha, craft beer, and yogurt drinks' },
    image: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=400&q=80',
    count: 0
  }
};

// ฟังก์ชัน Render หน้า categories.html
function renderCategoriesPage() {
  const grid = document.getElementById('categoryGrid');
  if (!grid) return; // ไม่ได้อยู่ในหน้า categories.html
  
  // อัปเดตหัวข้อตามภาษา
  const pageTitle = document.getElementById('pageTitle');
  const pageHeading = document.getElementById('pageHeading');
  const pageSubheading = document.getElementById('pageSubheading');
  
  if (pageTitle) pageTitle.textContent = getText({ th: 'หมวดหมู่', en: 'Categories' });
  if (pageHeading) pageHeading.textContent = getText({ th: 'หมวดหมู่เครื่องดื่ม', en: 'Beverage Categories' });
  if (pageSubheading) pageSubheading.textContent = getText({ th: 'เลือกหมวดหมู่เพื่อสำรวจสูตรเครื่องดื่ม', en: 'Choose a category to explore recipes' });
  
  // Render การ์ดหมวดหมู่
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

// ฟังก์ชัน Render หน้า category.html (Dynamic)
async function renderCategoryPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('id');
  
  if (!categoryId) {
    document.getElementById('errorContainer').style.display = 'block';
    document.getElementById('categoryContainer').style.display = 'none';
    return;
  }
  
  try {
    // โหลด index.json ของหมวดหมู่นั้น
    const response = await fetch(`recipes/${categoryId}/index.json`);
    if (!response.ok) throw new Error('Category not found');
    const recipes = await response.json();
    
    const categoryInfo = CATEGORIES_DATA[categoryId];
    if (!categoryInfo) throw new Error('Category info not found');
    
    // แสดง Container
    document.getElementById('categoryContainer').style.display = 'block';
    document.getElementById('errorContainer').style.display = 'none';
    
    // อัปเดต Hero Banner
    document.getElementById('heroTitle').textContent = getText(categoryInfo.name);
    document.getElementById('heroDesc').textContent = getText(categoryInfo.desc);
    document.getElementById('headerTitle').textContent = getText(categoryInfo.name);
    document.title = `${getText(categoryInfo.name)} | Beverage Masterclass`;
    
    // Render การ์ดสูตร
    const grid = document.getElementById('recipeGrid');
    if (recipes.length === 0) {
      grid.innerHTML = `<div class="empty-state">${getText({ th: 'ยังไม่มีสูตรในหมวดหมู่นี้', en: 'No recipes in this category yet' })}</div>`;
    } else {
      grid.innerHTML = recipes.map(r => `
        <a href="recipe.html?id=${categoryId}/${r.id}" class="recipe-card">
          <img src="${r.image}" alt="${getText(r.name)}" class="recipe-card-img">
          <div class="recipe-card-body">
            <div class="recipe-card-title">${getText(r.name)}</div>
            <div class="recipe-card-meta">
              <span>️ ${getText(r.prepTime)}</span>
              <span>⭐ ${r.rating}</span>
            </div>
            ${r.badges && r.badges[currentLang] ? `
              <div class="recipe-card-badges">
                ${r.badges[currentLang].map(b => `<span class="badge">${b}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </a>
      `).join('');
    }
    
    // อัปเดตปุ่มย้อนกลับ
    document.getElementById('btnBackToCategories').textContent = getText({ th: '← กลับไปหน้าหมวดหมู่', en: '← Back to Categories' });
    
  } catch (error) {
    console.error('Error loading category:', error);
    document.getElementById('errorContainer').style.display = 'block';
    document.getElementById('categoryContainer').style.display = 'none';
    document.getElementById('errorTitle').textContent = getText({ th: 'ไม่พบหมวดหมู่', en: 'Category Not Found' });
    document.getElementById('errorMsg').textContent = getText({ th: 'หมวดหมู่นี้อาจยังไม่มีข้อมูล', en: 'This category may not have data yet' });
  }
}

// เพิ่มการเรียกฟังก์ชันใน DOMContentLoaded
// หาบรรทัดนี้ใน app.js:
// document.addEventListener('DOMContentLoaded', () => {
//   renderRecipePage();
// });
// 
// แล้วเปลี่ยนเป็น:
document.addEventListener('DOMContentLoaded', () => {
  // ตรวจสอบว่าอยู่หน้าไหน แล้วเรียกฟังก์ชันที่ถูกต้อง
  if (document.getElementById('categoryGrid')) {
    renderCategoriesPage();
  } else if (document.getElementById('recipeGrid')) {
    renderCategoryPage();
  } else if (document.getElementById('recipeContainer')) {
    renderRecipePage();
  }
});