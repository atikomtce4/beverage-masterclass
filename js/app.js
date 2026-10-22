/* ==========================================================
   🧠 BEVERAGE MASTERCLASS - APP LOGIC (File-based Version)
   ========================================================== */

// แปลงรหัสหมวดหมู่เป็นชื่อโฟลเดอร์
const CATEGORY_MAP = {
  'herbal': 'herbal',
  'tea': 'tea',
  'milk': 'milk',
  'ferment': 'ferment'
};

const CATEGORY_NAMES = {
  'herbal': 'สมุนไพรไทย',
  'tea': 'ชา & เครื่องดื่มร้อน',
  'milk': 'นม & ธัญพืช',
  'ferment': 'เครื่องดื่มหมัก'
};

// ฟังก์ชันหลัก: โหลดสูตรจากไฟล์ JSON
async function loadRecipe(recipeId) {
  // ต้องมีรูปแบบ: "herbal/roselle_10L" หรือแค่ "roselle_10L" (จะเดาหมวดจากข้อมูล)
  let filePath;
  
  if (recipeId.includes('/')) {
    // กรณีมี slash มาแล้ว เช่น "herbal/roselle_10L"
    filePath = `recipes/${recipeId}.json`;
  } else {
    // กรณีมีแค่ ID ต้องค้นหาจากทุกหมวด (ช้ากว่านิดหน่อย)
    const categories = Object.keys(CATEGORY_MAP);
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

// ฟังก์ชันโหลดรายการสูตรจากหมวดหมู่ (ใช้ index.json)
async function loadCategoryIndex(category) {
  const response = await fetch(`recipes/${category}/index.json`);
  if (!response.ok) throw new Error('Failed to load category');
  return await response.json();
}

// ฟังก์ชันดาวน์โหลด JSON สำหรับเครื่อง
function downloadRecipeJSON(recipe) {
  const machineData = {
    recipe_id: recipe.id,
    recipe_name: recipe.name,
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
  
  alert(`ดาวน์โหลดสูตร "${recipe.name}" สำเร็จ!`);
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
    
    // แสดงข้อมูล
    document.getElementById('recipeContainer').style.display = 'block';
    document.title = `${recipe.name} | Beverage Masterclass`;
    
    document.getElementById('recipeCategory').textContent = CATEGORY_NAMES[recipe.category] || 'สูตรทั่วไป';
    document.getElementById('recipeTitle').textContent = recipe.name;
    document.getElementById('recipeIntro').textContent = recipe.intro;
    document.getElementById('prepTime').textContent = recipe.prepTime;
    document.getElementById('cookTime').textContent = recipe.cookTime;
    document.getElementById('servings').textContent = recipe.servings;
    document.getElementById('rating').textContent = `${recipe.rating} / 5`;
    
    document.getElementById('recipeImage').src = recipe.image || 'https://via.placeholder.com/600x400/4CAF50/FFFFFF?text=No+Image';
    document.getElementById('recipeVideo').src = recipe.videoUrl || '';
    
    document.getElementById('benefitBox').innerHTML = `<strong>🌿 สรรพคุณ:</strong> ${recipe.benefits}`;
    document.getElementById('warningBox').innerHTML = recipe.warnings;
    
    document.getElementById('ingredientsList').innerHTML = recipe.ingredients.map(ing => `<li>${ing}</li>`).join('');
    
    document.getElementById('stepsList').innerHTML = recipe.steps.map(step => `
      <div class="step-item">
        <div class="step-num">${step.step}</div>
        <div class="step-content">
          <h4>${step.title}</h4>
          <p>${step.desc}</p>
        </div>
      </div>
    `).join('');
    
    const nutritionLabels = { calories: 'พลังงาน', carbs: 'คาร์โบไฮเดรต', sugar: 'น้ำตาล', protein: 'โปรตีน' };
    document.getElementById('nutritionList').innerHTML = Object.entries(recipe.nutrition).map(([key, value]) => `
      <div class="nutrition-row">
        <span>${nutritionLabels[key] || key}</span>
        <span>${value}</span>
      </div>
    `).join('');
    
    document.getElementById('downloadBtn').onclick = () => downloadRecipeJSON(recipe);
    
  } catch (error) {
    console.error('Error loading recipe:', error);
    document.getElementById('errorContainer').style.display = 'block';
    document.getElementById('recipeContainer').style.display = 'none';
  }
}

// ฟังก์ชันแสดงรายการสูตรในหมวดหมู่ (ใช้กับหน้า category.html)
async function renderCategoryPage(category) {
  try {
    const recipes = await loadCategoryIndex(category);
    const container = document.getElementById('recipeList');
    
    container.innerHTML = recipes.map(r => `
      <a href="recipe.html?id=${category}/${r.id}" class="recipe-card-item">
        <img src="${r.image}" alt="${r.name}" class="recipe-card-img">
        <div class="recipe-card-body">
          <div class="recipe-card-title">${r.name}</div>
          <div class="recipe-card-meta">
            <span>️ ${r.prepTime}</span>
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
  
  // ถ้าเป็นหน้าหมวดหมู่ (ต้องมี data-category ใน HTML)
  const categoryContainer = document.getElementById('recipeList');
  if (categoryContainer) {
    const category = categoryContainer.dataset.category;
    if (category) renderCategoryPage(category);
  }
});