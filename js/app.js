/* ==========================================================
   🧠 BEVERAGE MASTERCLASS - APP LOGIC (Fixed & Optimized)
   ========================================================== */

// Global Variables
let currentLang = localStorage.getItem('preferredLang') || 'th';
let currentMode = 'manual';
let currentRecipe = null;

// Category Names (Bilingual)
const CATEGORY_NAMES = {
  'herbal': { 'th': 'สมุนไพรไทย', 'en': 'Thai Herbs' },
  'tea': { 'th': 'ชา & เครื่องดื่มร้อน', 'en': 'Tea & Hot Drinks' },
  'milk': { 'th': 'นม & ธัญพืช', 'en': 'Milk & Cereals' },
  'ferment': { 'th': 'เครื่องดื่มหมัก', 'en': 'Fermented Beverages' }
};

// UI Labels (Bilingual)
const UI_LABELS = {
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

// ===== Helper Functions =====

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
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showError() {
  document.getElementById('errorContainer').style.display = 'block';
  document.getElementById('recipeContainer').style.display = 'none';
  document.getElementById('errorTitle').textContent = currentLang === 'th' ? 'ไม่พบสูตรนี้' : 'Recipe Not Found';
  document.getElementById('errorMsg').textContent = currentLang === 'th' 
    ? 'อาจมีการเปลี่ยนแปลงลิงก์ หรือสูตรนี้ถูกลบไปแล้ว' 
    : 'The recipe may have been moved or deleted';
}

// ===== Language & Mode Functions =====

function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('preferredLang', lang);
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent.toLowerCase() === lang) {
      btn.classList.add('active');
    }
  });
  
  // ✅ แก้ไขจุดสำคัญ: ไม่ต้อง fetch ใหม่ แค่วาด UI ใหม่จากข้อมูลที่โหลดไว้แล้ว
  if (currentRecipe) {
    updateLanguageUI();
  }
}

function switchMode(mode) {
  currentMode = mode;
  
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.mode === mode) {
      btn.classList.add('active');
    }
  });
  
  if (currentRecipe) {
    renderSteps(currentRecipe);
    updateActionButtons();
  }
}

// ===== Media Functions =====

function switchMediaTab(tabName) {
  const tabs = document.querySelectorAll('.tab-btn');
  const views = document.querySelectorAll('.media-view');
  
  tabs.forEach(t => t.classList.remove('active'));
  views.forEach(v => v.classList.remove('active'));

  if (tabName === 'gallery') {
    tabs[0].classList.add('active');
    document.getElementById('view-gallery').classList.add('active');
  } else {
    tabs[1].classList.add('active');
    document.getElementById('view-video').classList.add('active');
  }
}

function changeMainImage(imageUrl, thumbnailElement) {
  document.getElementById('mainRecipeImage').src = imageUrl;
  
  document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
  if (thumbnailElement) {
    thumbnailElement.classList.add('active');
  }
}

// ===== Data Loading =====

async function loadRecipe(recipeId) {
  let filePath;
  
  if (recipeId.includes('/')) {
    filePath = `recipes/${recipeId}.json`;
  } else {
    const categories = Object.keys(CATEGORY_NAMES);
    for (const cat of categories) {
      try {
        const response = await fetch(`recipes/${cat}/${recipeId}.json`);
        if (response.ok) {
          filePath = `recipes/${cat}/${recipeId}.json`;
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  if (!filePath) throw new Error('Recipe not found');

  const response = await fetch(filePath);
  if (!response.ok) throw new Error('Failed to load recipe');
  
  return await response.json();
}

// ===== Rendering Functions =====

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

// ✅ ฟังก์ชันใหม่: อัปเดตเฉพาะข้อความบนหน้าจอโดยไม่ต้องโหลดข้อมูลใหม่
function updateLanguageUI() {
  if (!currentRecipe) return;

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
  document.getElementById('titleNutrition').textContent = getText(UI_LABELS.nutrition);
  document.getElementById('btnBackToHome').textContent = getText(UI_LABELS.backToHome);
  
  document.getElementById('benefitBox').innerHTML = `<strong>${getText(UI_LABELS.benefits)}:</strong> ${getText(currentRecipe.benefits)}`;
  document.getElementById('warningBox').innerHTML = getText(currentRecipe.warnings);
  
  const ingredients = Array.isArray(currentRecipe.ingredients) ? currentRecipe.ingredients : getText(currentRecipe.ingredients);
  document.getElementById('ingredientsList').innerHTML = ingredients.map(ing => `<li>${ing}</li>`).join('');
  
  renderSteps(currentRecipe);
  
  const nutritionLabels = { calories: UI_LABELS.calories, carbs: UI_LABELS.carbs, sugar: UI_LABELS.sugar, protein: UI_LABELS.protein };
  document.getElementById('nutritionList').innerHTML = Object.entries(currentRecipe.nutrition).map(([key, value]) => `
    <div class="nutrition-row">
      <span>${getText(nutritionLabels[key] || { th: key, en: key })}</span>
      <span>${value}</span>
    </div>
  `).join('');

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
    showToast(currentLang === 'th' ? '✅ คัดลอกลิงก์แล้ว! นำไปวางในหน้าควบคุมเครื่องได้เลย' : '✅ Link copied! Paste it in the machine control page');
  }).catch(() => {
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
      function: s.function,
      target_value: s.target_value,
      unit: s.unit,
      duration: s.duration || 0
    }))
  };

  const jsonString = JSON.stringify(machineData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `FML_${recipe.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast(currentLang === 'th' ? `✅ ดาวน์โหลด "${getText(recipe.name)}" สำเร็จ!` : `✅ Recipe "${getText(recipe.name)}" downloaded!`);
}

// ===== Main Initialization =====

async function renderRecipePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  if (!recipeId) {
    showError();
    return;
  }

  try {
    // 1. โหลดข้อมูลจากเครือข่าย (ทำแค่ครั้งเดียวตอนเปิดหน้า)
    const recipe = await loadRecipe(recipeId);
    currentRecipe = recipe;
    
    // 2. แสดงคอนเทนเนอร์หลัก
    document.getElementById('recipeContainer').style.display = 'block';
    document.getElementById('errorContainer').style.display = 'none';
    document.title = `${getText(recipe.name)} | Beverage Masterclass`;
    
    // 3. Render ส่วนที่ไม่เปลี่ยนตามภาษา (รูปภาพ/วิดีโอ)
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
      } else {
        thumbStrip.innerHTML = '';
      }
    } else {
      mainImg.src = 'https://via.placeholder.com/800x450/4CAF50/FFFFFF?text=No+Image';
      thumbStrip.innerHTML = '';
    }
    document.getElementById('recipeVideo').src = recipe.videoUrl || '';
    
    // 4. Render ข้อความตามภาษาปัจจุบัน
    updateLanguageUI();
    
    // 5. ตั้งค่าเริ่มต้น
    switchMediaTab('gallery');
    
  } catch (error) {
    console.error('Error loading recipe:', error);
    showError();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderRecipePage();
});