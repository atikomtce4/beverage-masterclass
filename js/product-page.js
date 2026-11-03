(function(){
  const p = PRODUCTS_DETAIL[PRODUCT_ID];
  if (!p) { 
    document.body.innerHTML = '<div style="padding:60px;text-align:center;font-family:Prompt;"><h2>😕 ไม่พบสินค้า</h2><p style="color:#757575;margin-top:8px;">รหัสสินค้าไม่ถูกต้องหรือถูกนำออกแล้ว</p><a href="../system.html" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#4CAF50;color:white;border-radius:20px;text-decoration:none;">← กลับไปหน้าสินค้า</a></div>'; 
    return; 
  }
  
  document.title = p.name + ' — AllDrinks System';
  const gallery = Array.isArray(p.gallery) ? p.gallery : [];
  const videoId = p.video || '';
  
  document.body.innerHTML = `
    <div class="container">
      <a href="../system.html" class="back-link">← กลับไปหน้าสินค้า AllDrinks</a>
      
      <div class="product-detail">
        <div class="product-hero">
          <img id="heroImg" src="../${p.image}" alt="${p.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <span class="emoji-fallback" style="display:none;">${p.emoji}</span>
          ${p.badge ? `<span class="product-badge-large">${p.badge}</span>` : ''}
        </div>
        
        ${gallery.length ? `
          <div class="hero-caption" id="heroCaption">${p.name}</div>
          <div class="thumb-strip">
            <button class="thumb active" data-src="../${p.image}" data-cap="${p.name}">
              <img src="../${p.image}" alt="" onerror="this.parentElement.style.display='none';">
            </button>
            ${gallery.map(g => `
              <button class="thumb" data-src="../${g.src}" data-cap="${g.caption || ''}">
                <img src="../${g.src}" alt="${g.caption || ''}" onerror="this.parentElement.style.display='none';">
              </button>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="product-body">
          <div class="product-sku">รหัสสินค้า: ${PRODUCT_ID}</div>
          <h1 class="product-title">${p.name}</h1>
          
          <div class="product-price-section">
            <span class="price-large">฿${p.price.toLocaleString()}</span>
            ${p.oldPrice ? `<span class="price-old-large">฿${p.oldPrice.toLocaleString()}</span>` : ''}
          </div>
          
          <p class="product-description">${p.full_desc}</p>
          
          ${videoId ? `
            <div class="media-section">
              <h3 class="specs-title">🎬 วีดีโอสาธิตการทำงาน</h3>
              <div class="video-wrap">
                <iframe src="https://www.youtube-nocookie.com/embed/${videoId}" 
                        title="${p.name}" frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </div>
          ` : ''}
          
          ${gallery.length ? `
            <div class="media-section">
              <h3 class="specs-title">📷 ภาพประกอบ & สเปค</h3>
              <div class="gallery-grid">
                ${gallery.map(g => `
                  <figure class="gallery-item">
                    <img src="../${g.src}" alt="${g.caption || ''}" loading="lazy" onerror="this.closest('.gallery-item').style.display='none';">
                    <figcaption>${g.caption || ''}</figcaption>
                  </figure>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="specs-section">
            <h3 class="specs-title">คุณสมบัติทางเทคนิค</h3>
            <div class="specs-grid">
              ${p.specs.map(s => `<div class="spec-item"><div class="spec-label">${s[0]}</div><div class="spec-value">${s[1]}</div></div>`).join('')}
            </div>
          </div>
          
          <div class="cta-section">
            <a href="${p.order_link}" target="_blank" rel="noopener" class="btn btn-primary">🛒 สั่งซื้อ/สอบถามผ่าน LINE</a>
            <a href="../index.html" class="btn btn-secondary">🏠 กลับหน้าแรก AllDrinks</a>
          </div>
        </div>
      </div>
    </div>
  `;

  // คลิก thumbnail → สลับรูปใหญ่
  document.querySelectorAll('.thumb').forEach(btn => {
    btn.addEventListener('click', () => {
      const img = document.getElementById('heroImg');
      img.style.display = 'block';
      img.nextElementSibling.style.display = 'none';
      img.src = btn.dataset.src;
      const cap = document.getElementById('heroCaption');
      if (cap) cap.textContent = btn.dataset.cap || '';
      document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
    });
  });
})();