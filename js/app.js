/* ==========================================================
   🧠 BEVERAGE MASTERCLASS - APP LOGIC (Bilingual Version)
   ========================================================== */

// ตัวแปรเก็บภาษาปัจจุบัน (ค่าเริ่มต้น: ไทย)
let currentLang = localStorage.getItem('preferredLang') || 'th';

// แปลงรหัสหมวดหมู่เป็นชื่อ (2 ภาษา)
const CATEGORY_NAMES = {
  'herbal': { 'th': 'สมุนไพรไทย', 'en': 'Thai Herbs' },
  'tea': { 'th': 'ชา & เครื่องดื่มร้อน', 'en': 'Tea & Hot Drinks' },
  'milk': { 'th': 'นม & ธัญพืช', 'en': 'Milk & Cereals' },
  'ferment': { 'th': 'เครื่องดื่มหมัก', 'en': 'Fermented Beverages' }
};

// ฟังก์ชันหลัก: โหลดสูตรจากไฟล์ JSON
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

// ฟังก์ชันโหลดรายการสูตรจากหมวดหมู่
async function loadCategoryIndex(category) {
  const response = await fetch(`recipes/${category}/index.json`);
  if (!response.ok) throw new Error('Failed to load category');
  return await response.json();
}

// ฟังก์ชันสลับภาษา
function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('preferredLang', lang); // จำภาษาที่ผู้ใช้เลือก
  
  // อัปเดตปุ่ม
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Render หน้าใหม่
  renderRecipePage();
}

// ฟังก์ชันดึงข้อความตามภาษา
function getText(obj, lang = currentLang) {
  if (typeof obj === 'string') return obj; // กรณีเป็น string ธรรมดา
  if (typeof obj === 'object' && obj !== null) {
    return obj[lang] || obj['th'] || Object.values(obj)[0]; // ลองดึงตามภาษา, ถ้าไม่มีให้ใช้ th, ถ้าไม่มีอีกให้ใช้ค่าแรก
  }
  return '';
}

// ฟังก์ชันดาวน์โหลด JSON สำหรับเครื่อง
function downloadRecipeJSON(recipe) {
  const machineData = {
    recipe_id: recipe.id,
    recipe_name: getText(recipe.name),
    total_volume: recipe.machineSteps.find(s => s.function === "Fill Water")?.target_value || 0,
    total_time: recipe.machineSteps.reduce((acc, curr) => acc + (curr.duration || 0), 0),
    target_temp: recipe.machineSteps.find(s => s.function.includes("Heat") || s.function.includes("Hold"))?.target_value || 0,
    steps: recipe.machineSteps
  };

  const jsonString = JSON.stringify(machineData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${recipe.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  const msg = currentLang === 'th' 
    ? `ดาวน์โหลดสูตร "${getText(recipe.name)}" สำเร็จ!` 
    : `Recipe "${getText(recipe.name)}" downloaded successfully!`;
  alert(msg);
}

// ฟังก์ชันสลับแท็บสื่อ (รูปภาพ/วิดีโอ)
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

// ฟังก์ชันเปลี่ยนรูปภาพหลัก
function changeMainImage(imageUrl, thumbnailElement) {
  document.getElementById('mainRecipeImage').src = imageUrl;
  
  document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
  if (thumbnailElement) {
    thumbnailElement.classList.add('active');
  }
}

// ฟังก์ชันแสดงสูตรบนหน้า recipe.html
async function renderRecipePage() {
  const urlParams = new URLSearchParams(window.location.search);
  const recipeId = urlParams.get('id');

  if (!recipeId) {
    document.getElementById('errorContainer').style.display = 'block';
    document.getElementById('recipeContainer').style.display = 'none';
    return;
  }

  try {
    const recipe = await loadRecipe(recipeId);
    
    document.getElementById('recipeContainer').style.display = 'block';
    document.title = `${getText(recipe.name)} | Beverage Masterclass`;
    
    // ข้อมูลพื้นฐาน
    document.getElementById('recipeCategory').textContent = getText(CATEGORY_NAMES[recipe.category] || { th: 'สูตรทั่วไป', en: 'General Recipe' });
    document.getElementById('recipeTitle').textContent = getText(recipe.name);
    document.getElementById('recipeIntro').textContent = getText(recipe.intro);
    document.getElementById('prepTime').textContent = getText(recipe.prepTime);
    document.getElementById('cookTime').textContent = getText(recipe.cookTime);
    document.getElementById('servings').textContent = getText(recipe.servings);
    document.getElementById('rating').textContent = `${recipe.rating} / 5`;
    
    // รูปภาพและวิดีโอ
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
    
    // ข้อมูลสุขภาพ
    document.getElementById('benefitBox').innerHTML = `<strong> ${currentLang === 'th' ? 'สรรพคุณ' : 'Benefits'}:</strong> ${getText(recipe.benefits)}`;
    document.getElementById('warningBox').innerHTML = getText(recipe.warnings);
    
    // วัตถุดิบ
    const ingredients = recipe.ingredients;
    const ingredientsList = Array.isArray(ingredients) ? ingredients : getText(ingredients);
    document.getElementById('ingredientsList').innerHTML = ingredientsList.map(ing => `<li>${ing}</li>`).join('');
    
    // ขั้นตอนการทำ
    document.getElementById('stepsList').innerHTML = recipe.steps.map(step => `
      <div class="step-item">
        <div class="step-num">${step.step}</div>
        <div class="step-content">
          <h4>${getText(step.title)}</h4>
          <p>${getText(step.desc)}</p>
          
          ${step.image ? `
            <img src="${step.image}" 
                 alt="${currentLang === 'th' ? 'ขั้นตอนที่' : 'Step'} ${step.step}: ${getText(step.title)}" 
                 class="step-image" 
                 loading="lazy">
          ` : ''}
          
        </div>
      </div>
    `).join('');
    
    // โภชนาการ
    const nutritionLabels = {
      calories: { th: 'พลังงาน', en: 'Calories' },
      carbs: { th: 'คาร์โบไฮเดรต', en: 'Carbs' },
      sugar: { th: 'น้ำตาล', en: 'Sugar' },
      protein: { th: 'โปรตีน', en: 'Protein' }
    };
    
    document.getElementById('nutritionList').innerHTML = Object.entries(recipe.nutrition).map(([key, value]) => `
      <div class="nutrition-row">
        <span>${getText(nutritionLabels[key] || { th: key, en: key })}</span>
        <span>${value}</span>
      </div>
    `).join('');

    // ปุ่มดาวน์โหลด
    const downloadText = currentLang === 'th' 
      ? '⬇ ดาวน์โหลดสูตรเข้าเครื่อง (.json)' 
      : '⬇ Download Recipe for Machine (.json)';
    document.getElementById('downloadBtn').textContent = downloadText;
    document.getElementById('downloadBtn').onclick = () => downloadRecipeJSON(recipe);
    
    // ตั้งค่าเริ่มต้น
    switchMediaTab('gallery');
    
    // อัปเดตปุ่มภาษา
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.textContent.toLowerCase() === currentLang) {
        btn.classList.add('active');
      }
    });
    
  } catch (error) {
    console.error('Error loading recipe:', error);
    document.getElementById('errorContainer').style.display = 'block';
    document.getElementById('recipeContainer').style.display = 'none';
  }
}

// ฟังก์ชันแสดงรายการสูตรในหมวดหมู่
async function renderCategoryPage(category) {
  try {
    const recipes = await loadCategoryIndex(category);
    const container = document.getElementById('recipeList');
    
    container.innerHTML = recipes.map(r => `
      <a href="recipe.html?id=${category}/${r.id}" class="recipe-card-item">
        <img src="${r.image}" alt="${getText(r.name)}" class="recipe-card-img">
        <div class="recipe-card-body">
          <div class="recipe-card-title">${getText(r.name)}</div>
          <div class="recipe-card-meta">
            <span>⏱️ ${getText(r.prepTime)}</span>
            <span>⭐ ${r.rating}</span>
          </div>
        </div>
      </a>
    `).join('');
    
  } catch (error) {
    console.error('Error loading category:', error);
  }
}

// เริ่มต้นทำงานเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
  // ถ้าเป็นหน้า recipe.html
  if (document.getElementById('recipeContainer')) {
    renderRecipePage();
  }
  
  // ถ้าเป็นหน้าหมวดหมู่
  const categoryContainer = document.getElementById('recipeList');
  if (categoryContainer) {
    const category = categoryContainer.dataset.category;
    if (category) renderCategoryPage(category);
  }
});