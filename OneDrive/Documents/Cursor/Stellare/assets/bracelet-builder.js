// Stellare Bracelet Builder
// Interactive charm bracelet builder with live preview using real Shopify products

class BraceletBuilder {
  constructor() {
    this.maxCharms = 16; // Default size
    this.selectedCharms = new Array(this.maxCharms).fill(null); // Fixed size array with positions
    this.selectedBracelet = null;
    this.charms = []; // Products from "Colgantes y dijes" collection
    this.bracelets = []; // Products from "Pulseras" collection
    this.currentFilter = 'all';
    this.isLoading = true;
    this.touchStartX = null;
    this.touchStartY = null;
    this.draggedElement = null;
    this.isDragging = false;
    
    this.init();
  }

  async init() {
    // Get settings from Shopify
    const maxCharmsElement = document.getElementById('maxCharms');
    if (maxCharmsElement) {
      this.maxCharms = parseInt(maxCharmsElement.textContent) || 16;
      this.selectedCharms = new Array(this.maxCharms).fill(null); // Reinitialize with correct size
    }

    // Setup bracelet size selector
    this.setupBraceletSizeSelector();

    // Show loading state
    this.showLoading();
    
    // Load products from Shopify collections
    await Promise.all([
      this.loadBracelets(),
      this.loadCharms()
    ]);
    
    this.isLoading = false;
    this.hideLoading();
    
    // Show bracelet selection first
    this.showBraceletSelection();
  }

  setupBraceletSizeSelector() {
    const sizeSelector = document.getElementById('braceletSize');
    if (sizeSelector) {
      // Set initial value to match current maxCharms
      const maxCharmsElement = document.getElementById('maxCharms');
      if (maxCharmsElement) {
        const initialSize = parseInt(maxCharmsElement.textContent) || 16;
        sizeSelector.value = initialSize;
        this.maxCharms = initialSize;
        this.selectedCharms = new Array(this.maxCharms).fill(null);
      }
      
      sizeSelector.addEventListener('change', (e) => {
        const newSize = parseInt(e.target.value);
        if (newSize !== this.maxCharms) {
          // Confirm if there are charms already placed
          const hasCharms = this.selectedCharms.some(slot => slot !== null);
          if (hasCharms) {
            if (!confirm(`¿Cambiar el tamaño de la pulsera? Esto eliminará los dijes ya colocados.`)) {
              e.target.value = this.maxCharms;
              return;
            }
          }
          
          // Adjust array size
          if (newSize > this.maxCharms) {
            // Increase size - add null slots
            this.selectedCharms = [...this.selectedCharms, ...new Array(newSize - this.maxCharms).fill(null)];
          } else {
            // Decrease size - remove excess charms
            const excessCharms = this.selectedCharms.slice(newSize);
            const removedCount = excessCharms.filter(c => c !== null).length;
            this.selectedCharms = this.selectedCharms.slice(0, newSize);
            if (removedCount > 0) {
              this.showToast(`${removedCount} dije(s) removido(s)`, 'success');
            }
          }
          
          this.maxCharms = newSize;
          
          // Update maxCharms display
          const maxCharmsElement = document.getElementById('maxCharms');
          if (maxCharmsElement) {
            maxCharmsElement.textContent = newSize;
          }
          
          this.updatePreview();
          this.showToast(`Tamaño de pulsera cambiado a ${newSize} dijes`, 'success');
        }
      });
    }
  }

  async loadBracelets() {
    try {
      console.log('Loading bracelets from /collections/pulseras/products.json');
      let allProducts = [];
      let page = 1;
      let hasMore = true;
      
      // Load all pages of products (Shopify limits to 50 per page)
      while (hasMore) {
        const url = `/collections/pulseras/products.json?page=${page}`;
        console.log(`Loading page ${page}: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          if (page === 1) {
            console.error('Response not OK:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          } else {
            // If it's not the first page, we've reached the end
            hasMore = false;
            break;
          }
        }
        
        const data = await response.json();
        console.log(`Page ${page} data received:`, data.products?.length || 0, 'products');
        
        if (!data.products || data.products.length === 0) {
          hasMore = false;
          break;
        }
        
        allProducts = allProducts.concat(data.products);
        
        // If we got less than 50 products, we've reached the last page
        if (data.products.length < 50) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      console.log('Total bracelets fetched:', allProducts.length);
      
      if (allProducts.length === 0) {
        console.warn('No products found in Pulseras collection');
        this.bracelets = [];
        return;
      }
      
      // Filter only published products (allow out of stock items as they can be ordered)
      this.bracelets = allProducts
        .filter(product => {
          // Check if product is published (ignore stock availability)
          const hasVariant = product.variants && product.variants.length > 0;
          const isPublished = product.published_at !== null;
          
          if (!hasVariant || !isPublished) {
            console.log(`Skipping bracelet: ${product.title} - Has variant: ${hasVariant}, Published: ${isPublished}`);
          }
          
          return hasVariant && isPublished;
        })
        .map(product => ({
          id: product.id,
          variantId: parseInt(product.variants[0].id), // Ensure numeric ID
          title: product.title,
          price: parseFloat(product.variants[0].price), // Price already in correct format
          image: product.images[0]?.src || '',
          handle: product.handle,
          available: product.variants[0].available
        }));
      
      console.log('Bracelets loaded:', this.bracelets.length);
    } catch (error) {
      console.error('Error loading bracelets:', error);
      this.bracelets = [];
      this.showToast('Error: No se pudo cargar la colección "Pulseras". Verifica que existe.', 'error');
    }
  }

  async loadCharms() {
    try {
      console.log('Loading charms from /collections/colgantes-y-dijes/products.json');
      let allProducts = [];
      let page = 1;
      let hasMore = true;
      
      // Load all pages of products (Shopify limits to 50 per page)
      while (hasMore) {
        const url = `/collections/colgantes-y-dijes/products.json?page=${page}`;
        console.log(`Loading page ${page}: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          if (page === 1) {
            console.error('Response not OK:', response.status, response.statusText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          } else {
            // If it's not the first page, we've reached the end
            hasMore = false;
            break;
          }
        }
        
        const data = await response.json();
        console.log(`Page ${page} data received:`, data.products?.length || 0, 'products');
        
        if (!data.products || data.products.length === 0) {
          hasMore = false;
          break;
        }
        
        allProducts = allProducts.concat(data.products);
        
        // If we got less than 50 products, we've reached the last page
        if (data.products.length < 50) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      console.log('Total charms fetched:', allProducts.length);
      
      if (allProducts.length === 0) {
        console.warn('No products found in Colgantes y dijes collection');
        this.charms = [];
        return;
      }
      
      // Filter only published products (allow out of stock items as they can be ordered)
      this.charms = allProducts
        .filter(product => {
          // Check if product is published (ignore stock availability)
          const hasVariant = product.variants && product.variants.length > 0;
          const isPublished = product.published_at !== null;
          
          if (!hasVariant || !isPublished) {
            console.log(`Skipping charm: ${product.title} - Has variant: ${hasVariant}, Published: ${isPublished}`);
          }
          
          return hasVariant && isPublished;
        })
        .map(product => ({
          id: product.id,
          variantId: parseInt(product.variants[0].id), // Ensure numeric ID
          title: product.title,
          price: parseFloat(product.variants[0].price), // Price already in correct format
          image: product.images[0]?.src || '',
          handle: product.handle,
          tags: product.tags, // For filtering by category
          available: product.variants[0].available
        }));
      
      console.log('Charms loaded:', this.charms.length);
    } catch (error) {
      console.error('Error loading charms:', error);
      this.charms = [];
      this.showToast('Error: No se pudo cargar la colección "Colgantes y dijes". Verifica que existe.', 'error');
    }
  }

  showLoading() {
    const charmsGrid = document.getElementById('charmsGrid');
    if (charmsGrid) {
      charmsGrid.innerHTML = '<div style="text-align: center; padding: 2rem;"><div class="spinner" style="margin: 0 auto 1rem;"></div><p>Cargando productos...</p></div>';
    }
  }

  hideLoading() {
    // Loading complete
  }

  showBraceletSelection() {
    console.log('showBraceletSelection called, bracelets:', this.bracelets.length);
    
    const builderContainer = document.querySelector('.builder-container');
    if (!builderContainer) {
      console.error('Builder container not found');
      return;
    }

    // Check if we have bracelets
    if (this.bracelets.length === 0) {
      console.warn('No bracelets available');
      this.showToast('No hay pulseras disponibles. Por favor agrega productos a la colección "Pulseras".', 'error');
      const charmsGrid = document.getElementById('charmsGrid');
      if (charmsGrid) {
        charmsGrid.innerHTML = `
          <div style="text-align: center; padding: 3rem; color: #E91E8C;">
            <h3>⚠️ Configuración Requerida</h3>
            <p style="margin: 1rem 0;">Para que el constructor funcione, necesitas:</p>
            <ol style="text-align: left; max-width: 500px; margin: 0 auto; line-height: 2;">
              <li>Crear colección llamada "Pulseras"</li>
              <li>URL handle debe ser exactamente: <code style="background: #FFE5F3; padding: 2px 8px; border-radius: 3px;">pulseras</code></li>
              <li>Agregar al menos 1 producto de pulsera a esa colección</li>
              <li>El producto debe estar activo y publicado</li>
            </ol>
            <p style="margin-top: 2rem;">Abre la consola del navegador (F12) para más detalles</p>
          </div>
        `;
      }
      return;
    }

    // Create bracelet selection overlay
    const overlay = document.createElement('div');
    overlay.className = 'bracelet-selection-overlay';
    overlay.innerHTML = `
      <div class="bracelet-selection-modal">
        <h2>✨ Paso 1: Elige Tu Pulsera Base ✨</h2>
        <p>Selecciona el estilo de pulsera que deseas personalizar</p>
        <div class="bracelets-grid" id="braceletsGrid">
          ${this.bracelets.map(bracelet => `
            <div class="bracelet-option" onclick="builder.selectBracelet(${bracelet.id})">
              <img src="${bracelet.image}" alt="${bracelet.title}" class="bracelet-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23FFE5F3%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2240%22%3E💎%3C/text%3E%3C/svg%3E'">
              <h3>${bracelet.title}</h3>
              <p class="bracelet-price">L${bracelet.price.toFixed(2)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    console.log('Modal added to body');
  }

  selectBracelet(braceletId) {
    this.selectedBracelet = this.bracelets.find(b => b.id === braceletId);
    
    // Remove overlay
    const overlay = document.querySelector('.bracelet-selection-overlay');
    if (overlay) {
      overlay.remove();
    }

    // Update bracelet name display
    const braceletNameElement = document.getElementById('braceletName');
    if (braceletNameElement) {
      braceletNameElement.textContent = this.selectedBracelet.title;
      braceletNameElement.style.color = '#E91E8C';
    }

    // Show success message
    this.showToast(`${this.selectedBracelet.title} selected!`, 'success');
    
    // Now show charms for selection
    this.renderCharms();
    this.updatePreview();
    this.setupFilters();
  }

  renderCharms(filter = 'all') {
    const charmsGrid = document.getElementById('charmsGrid');
    if (!charmsGrid) return;

    if (this.charms.length === 0) {
      charmsGrid.innerHTML = '<p style="text-align: center; padding: 2rem; color: #E91E8C;"><strong>⚠️ Configuración Requerida:</strong><br><br>Por favor crea la colección "Colgantes y dijes" y agrega productos de dijes.<br><br>URL de la colección debe ser: <code>colgantes-y-dijes</code></p>';
      return;
    }

    // Show all charms without filtering by sections
    const filteredCharms = this.charms;

    charmsGrid.innerHTML = filteredCharms.map(charm => `
      <div class="charm-item" 
           data-charm-id="${charm.id}" 
           draggable="true"
           ondragstart="builder.handleDragStart(event, ${charm.id})"
           ontouchstart="builder.handleTouchStart(event, ${charm.id})"
           ontouchmove="builder.handleTouchMove(event)"
           ontouchend="builder.handleTouchEnd(event)"
           onclick="builder.addCharm(${charm.id})">
        <img src="${charm.image}" alt="${charm.title}" class="charm-image">
        <div class="charm-name">${charm.title}</div>
        <div class="charm-price">L${charm.price.toFixed(2)}</div>
      </div>
    `).join('');
  }

  setupFilters() {
    // Filters removed - showing all charms without sections
  }

  addCharm(charmId) {
    // Don't add if we're in the middle of a drag operation
    if (this.isDragging) {
      return;
    }
    
    if (!this.selectedBracelet) {
      this.showToast('¡Por favor selecciona una pulsera primero!', 'error');
      return;
    }

    // Find first empty slot
    const firstEmptyIndex = this.selectedCharms.findIndex(slot => slot === null);
    if (firstEmptyIndex === -1) {
      this.showToast('¡Máximo de dijes alcanzado!', 'error');
      return;
    }

    const charm = this.charms.find(c => c.id === charmId);
    if (charm) {
      this.selectedCharms[firstEmptyIndex] = {
        ...charm,
        uniqueId: Date.now() + Math.random() // Unique ID for removal
      };
      this.updatePreview();
      this.showToast(`¡${charm.title} agregado en posición ${firstEmptyIndex + 1}!`, 'success');
    }
  }

  removeCharm(uniqueId) {
    const index = this.selectedCharms.findIndex(c => c && c.uniqueId === uniqueId);
    if (index !== -1) {
      this.selectedCharms[index] = null;
      this.updatePreview();
      this.showToast('Dije removido', 'success');
    }
  }

  clearBracelet() {
    const hasCharms = this.selectedCharms.some(slot => slot !== null);
    if (!hasCharms) return;
    
    if (confirm('¿Estás seguro que deseas eliminar todos los dijes?')) {
      this.selectedCharms = new Array(this.maxCharms).fill(null);
      this.updatePreview();
      this.showToast('Pulsera limpiada', 'success');
    }
  }

  updatePreview() {
    const braceletStrip = document.getElementById('braceletLinksStrip');
    const charmCount = document.getElementById('charmCount');
    const totalPrice = document.getElementById('totalPrice');

    if (!braceletStrip) return;

    // Calculate total price (bracelet + non-null charms)
    const braceletPrice = this.selectedBracelet ? this.selectedBracelet.price : 0;
    const charmsTotal = this.selectedCharms
      .filter(charm => charm !== null)
      .reduce((sum, charm) => sum + charm.price, 0);
    const total = braceletPrice + charmsTotal;
    
    // Count non-null charms
    const activeCharms = this.selectedCharms.filter(charm => charm !== null).length;
    
    if (totalPrice) totalPrice.textContent = total.toFixed(2);
    if (charmCount) charmCount.textContent = activeCharms;

    // Render ALL slots (filled and empty) in their fixed positions
    let html = '';
    
    this.selectedCharms.forEach((charm, index) => {
      if (charm !== null) {
        // Filled slot
        html += `
          <div class="link-slot filled" title="${charm.title}" data-index="${index}"
               ondragover="builder.handleDragOver(event)"
               ondrop="builder.handleDrop(event, ${index})"
               ondragleave="builder.handleDragLeave(event)"
               draggable="true"
               ondragstart="builder.handleCharmDragStart(event, ${index})"
               ontouchstart="builder.handleSlotTouchStart(event, ${index})"
               ontouchmove="builder.handleSlotTouchMove(event)"
               ontouchend="builder.handleSlotTouchEnd(event, ${index})">
            <img src="${charm.image}" alt="${charm.title}">
            <span class="remove-charm-btn" onclick="event.stopPropagation(); builder.removeCharmAtIndex(${index})">×</span>
          </div>
        `;
      } else {
        // Empty slot
        html += `
          <div class="link-slot empty" data-index="${index}"
               ondragover="builder.handleDragOver(event)"
               ondrop="builder.handleDrop(event, ${index})"
               ondragleave="builder.handleDragLeave(event)"
               ontouchstart="builder.handleSlotTouchStart(event, ${index})"
               ontouchmove="builder.handleSlotTouchMove(event)"
               ontouchend="builder.handleSlotTouchEnd(event, ${index})"></div>
        `;
      }
    });

    braceletStrip.innerHTML = html;

    // Update add to cart button
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
      const hasItems = this.selectedBracelet && activeCharms > 0;
      addToCartBtn.disabled = !hasItems;
      addToCartBtn.style.opacity = hasItems ? '1' : '0.5';
    }
  }

  removeCharmAtIndex(index) {
    if (index >= 0 && index < this.maxCharms && this.selectedCharms[index] !== null) {
      const removedCharm = this.selectedCharms[index];
      this.selectedCharms[index] = null;
      this.updatePreview();
      this.showToast(`${removedCharm.title} removido`, 'success');
    }
  }

  // Drag and Drop handlers
  handleDragStart(event, charmId) {
    const charm = this.charms.find(c => c.id === charmId);
    if (charm) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'new-charm',
        charm: charm
      }));
      event.target.style.opacity = '0.5';
    }
  }

  handleCharmDragStart(event, index) {
    if (this.selectedCharms[index] === null) return; // Can't drag empty slot
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'existing-charm',
      sourceIndex: index
    }));
    event.target.style.opacity = '0.5';
  }

  handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    
    // Visual feedback
    const slot = event.currentTarget;
    if (slot.classList.contains('link-slot')) {
      slot.style.transform = 'scale(1.1)';
      slot.style.borderColor = '#E91E8C';
      slot.style.borderWidth = '3px';
    }
  }

  handleDragLeave(event) {
    const slot = event.currentTarget;
    if (slot.classList.contains('link-slot')) {
      slot.style.transform = '';
      slot.style.borderColor = '';
      slot.style.borderWidth = '';
    }
  }

  handleDrop(event, targetIndex) {
    event.preventDefault();
    event.stopPropagation();

    // Reset visual feedback
    const slot = event.currentTarget;
    slot.style.transform = '';
    slot.style.borderColor = '';
    slot.style.borderWidth = '';

    try {
      const data = JSON.parse(event.dataTransfer.getData('application/json'));
      
      if (data.type === 'new-charm') {
        // Adding new charm from library to EXACT position
        if (!this.selectedBracelet) {
          this.showToast('¡Por favor selecciona una pulsera primero!', 'error');
          return;
        }

        // Check if target slot is occupied
        if (this.selectedCharms[targetIndex] !== null) {
          this.showToast('Esta posición ya está ocupada. Arrastra a una casilla vacía.', 'error');
          return;
        }

        const newCharm = {
          ...data.charm,
          uniqueId: Date.now() + Math.random()
        };

        // Place charm at EXACT target position
        this.selectedCharms[targetIndex] = newCharm;

        this.updatePreview();
        this.showToast(`¡${newCharm.title} agregado en posición ${targetIndex + 1}!`, 'success');
        
      } else if (data.type === 'existing-charm') {
        // Moving existing charm to EXACT position
        const sourceIndex = data.sourceIndex;
        
        if (sourceIndex === targetIndex) {
          // Same position, do nothing
          return;
        }

        const movedCharm = this.selectedCharms[sourceIndex];
        
        if (this.selectedCharms[targetIndex] !== null) {
          // Swap charms if target is occupied
          this.selectedCharms[targetIndex] = movedCharm;
          this.selectedCharms[sourceIndex] = null;
          this.showToast(`Dije movido a posición ${targetIndex + 1}`, 'success');
        } else {
          // Move to empty slot
          this.selectedCharms[targetIndex] = movedCharm;
          this.selectedCharms[sourceIndex] = null;
          this.showToast(`Dije movido a posición ${targetIndex + 1}`, 'success');
        }
        
        this.updatePreview();
      }
    } catch (error) {
      console.error('Error en drag and drop:', error);
    }

    // Reset dragged element opacity
    document.querySelectorAll('[draggable="true"]').forEach(el => {
      el.style.opacity = '';
    });
  }

  // Touch event handlers for mobile drag and drop
  handleTouchStart(event, charmId) {
    if (!this.selectedBracelet) {
      this.showToast('¡Por favor selecciona una pulsera primero!', 'error');
      return;
    }
    
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.draggedElement = { type: 'new-charm', charmId: charmId };
    const charmItem = event.target.closest('.charm-item');
    if (charmItem) {
      charmItem.style.opacity = '0.5';
      charmItem.style.transform = 'scale(0.95)';
    }
  }

  handleTouchMove(event) {
    if (!this.draggedElement) return;
    // Only prevent default if we're actually dragging (moved more than 10px)
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    if (deltaX > 10 || deltaY > 10) {
      this.isDragging = true;
      event.preventDefault();
    }
  }

  handleTouchEnd(event) {
    if (!this.draggedElement) return;
    
    const touch = event.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    
    // Only process if moved significantly (more than 10px)
    if (deltaX > 10 || deltaY > 10) {
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Find the closest slot
      let targetSlot = elementBelow;
      while (targetSlot && !targetSlot.classList.contains('link-slot')) {
        targetSlot = targetSlot.parentElement;
      }
      
      if (targetSlot && targetSlot.dataset.index !== undefined) {
        const targetIndex = parseInt(targetSlot.dataset.index);
        
        if (this.draggedElement.type === 'new-charm') {
          const charm = this.charms.find(c => c.id === this.draggedElement.charmId);
          if (charm) {
            if (this.selectedCharms[targetIndex] === null) {
              this.selectedCharms[targetIndex] = {
                ...charm,
                uniqueId: Date.now() + Math.random()
              };
              this.updatePreview();
              this.showToast(`¡${charm.title} agregado en posición ${targetIndex + 1}!`, 'success');
            } else {
              this.showToast('Esta posición ya está ocupada. Arrastra a una casilla vacía.', 'error');
            }
          }
        }
      }
    }
    
    // Reset
    document.querySelectorAll('.charm-item').forEach(el => {
      el.style.opacity = '';
      el.style.transform = '';
    });
    this.draggedElement = null;
    this.touchStartX = null;
    this.touchStartY = null;
  }

  handleSlotTouchStart(event, index) {
    if (this.selectedCharms[index] === null) return;
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.draggedElement = { type: 'existing-charm', sourceIndex: index };
    event.currentTarget.style.opacity = '0.5';
    event.currentTarget.style.transform = 'scale(0.95)';
  }

  handleSlotTouchMove(event) {
    if (!this.draggedElement || this.draggedElement.type !== 'existing-charm') return;
    // Only prevent default if we're actually dragging
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    if (deltaX > 10 || deltaY > 10) {
      event.preventDefault();
    }
  }

  handleSlotTouchEnd(event, index) {
    if (!this.draggedElement || this.draggedElement.type !== 'existing-charm') return;
    
    const touch = event.changedTouches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    
    // Only process if moved significantly (more than 10px)
    if (deltaX > 10 || deltaY > 10) {
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Find the closest slot
      let targetSlot = elementBelow;
      while (targetSlot && !targetSlot.classList.contains('link-slot')) {
        targetSlot = targetSlot.parentElement;
      }
      
      if (targetSlot && targetSlot.dataset.index !== undefined) {
        const targetIndex = parseInt(targetSlot.dataset.index);
        const sourceIndex = this.draggedElement.sourceIndex;
        
        if (sourceIndex !== targetIndex) {
          const movedCharm = this.selectedCharms[sourceIndex];
          if (this.selectedCharms[targetIndex] === null) {
            this.selectedCharms[targetIndex] = movedCharm;
            this.selectedCharms[sourceIndex] = null;
            this.updatePreview();
            this.showToast(`Dije movido a posición ${targetIndex + 1}`, 'success');
          } else {
            // Swap
            const temp = this.selectedCharms[targetIndex];
            this.selectedCharms[targetIndex] = movedCharm;
            this.selectedCharms[sourceIndex] = temp;
            this.updatePreview();
            this.showToast(`Dijes intercambiados`, 'success');
          }
        }
      }
    }
    
    // Reset
    document.querySelectorAll('.link-slot').forEach(el => {
      el.style.opacity = '';
      el.style.transform = '';
    });
    this.draggedElement = null;
    this.touchStartX = null;
    this.touchStartY = null;
    
    // Reset dragging flag after a short delay
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
  }

  async addToCart() {
    console.log('🛒 addToCart() called');
    
    if (!this.selectedBracelet) {
      console.warn('No bracelet selected');
      this.showToast('¡Por favor selecciona una pulsera primero!', 'error');
      return;
    }

    // Filter out null/empty slots
    const activeCharms = this.selectedCharms.filter(charm => charm !== null);
    
    if (activeCharms.length === 0) {
      console.warn('No charms selected');
      this.showToast('¡Por favor agrega algunos dijes primero!', 'error');
      return;
    }

    const addToCartBtn = document.getElementById('addToCartBtn');
    if (!addToCartBtn) {
      console.error('Add to cart button not found!');
      return;
    }
    
    const originalText = addToCartBtn.innerHTML;
    addToCartBtn.innerHTML = '⏳ Agregando...';
    addToCartBtn.disabled = true;
    
    console.log('Button disabled, starting cart process...');

    try {
      console.log('=== STARTING ADD TO CART ===');
      console.log('Selected Bracelet:', this.selectedBracelet);
      console.log('Active Charms:', activeCharms);

      // Add items one by one (more reliable than batch add)
      const itemsToAdd = [];
      
      // Add base bracelet
      const braceletItem = {
        id: String(this.selectedBracelet.variantId),
        quantity: 1,
        properties: {
          '_Custom Bracelet': 'Yes',
          '_Charms Count': activeCharms.length.toString(),
          '_Bracelet Size': this.maxCharms.toString()
        }
      };
      itemsToAdd.push(braceletItem);
      console.log('Bracelet item:', braceletItem);
      
      // Add each charm with its actual position
      this.selectedCharms.forEach((charm, index) => {
        if (charm !== null) {
          const charmItem = {
            id: String(charm.variantId),
            quantity: 1,
            properties: {
              '_Part of Custom Bracelet': this.selectedBracelet.title,
              '_Position': (index + 1).toString() // Use actual slot position
            }
          };
          itemsToAdd.push(charmItem);
          console.log(`Charm at position ${index + 1}:`, charmItem);
        }
      });

      console.log('All items to add:', itemsToAdd);

      // Try adding all items at once first
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: itemsToAdd })
      });

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cart API error response:', errorText);
        
        // Try alternative: add items one by one
        console.log('Trying to add items individually...');
        for (const item of itemsToAdd) {
          const singleResponse = await fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(item)
          });
          
          if (!singleResponse.ok) {
            const singleError = await singleResponse.text();
            console.error('Failed to add item:', item, 'Error:', singleError);
            throw new Error(`No se pudo agregar: ${item.properties._Part_of_Custom_Bracelet || 'Pulsera'}`);
          }
          console.log('Successfully added item:', item);
        }
      }

      const result = await response.json().catch(() => ({}));
      console.log('Cart API result:', result);
      
      this.showToast('🎉 ¡Pulsera personalizada agregada al carrito!', 'success');
      
      // Update cart count in header
      if (window.updateCartCount) {
        window.updateCartCount();
      }
      
      // Redirect to cart after short delay
      setTimeout(() => {
        window.location.href = '/cart';
      }, 1500);
      
    } catch (error) {
      console.error('=== ERROR ADDING TO CART ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      this.showToast(`Error: ${error.message || 'No se pudo agregar al carrito'}`, 'error');
      addToCartBtn.innerHTML = originalText;
      addToCartBtn.disabled = false;
    }
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideInUp 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize builder ONLY if we're on the builder page
let builder;

function initBuilder() {
  // Check if we're on the builder page by looking for the builder container
  const builderPage = document.querySelector('.bracelet-builder-page');
  
  if (builderPage) {
    console.log('Builder page detected, initializing...');
    builder = new BraceletBuilder();
  } else {
    console.log('Not on builder page, skipping initialization');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBuilder);
} else {
  initBuilder();
}

// Global functions for onclick handlers (exposed to window)
window.clearBracelet = function() {
  console.log('clearBracelet called, builder exists:', !!builder);
  if (builder) {
    builder.clearBracelet();
  } else {
    console.error('Builder not initialized!');
  }
}

window.addToCart = function() {
  console.log('addToCart called, builder exists:', !!builder);
  if (builder) {
    builder.addToCart();
  } else {
    console.error('Builder not initialized!');
    alert('Error: El builder no está inicializado. Por favor recarga la página.');
  }
}

