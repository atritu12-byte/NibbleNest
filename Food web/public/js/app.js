/**
 * NibbleNest — Modern Food & Dish Suggestion Studio
 * Interactive Frontend Client Logic
 */

// Application State
const state = {
  dishes: [],
  categories: [],
  moods: [],
  dietaryOptions: [],
  cuisines: [],
  favorites: JSON.parse(localStorage.getItem('nibblenest_favorites') || '[]'),
  
  // Active Filters
  filters: {
    category: 'all',
    mood: 'all',
    diet: 'all',
    spiceLevel: 'all',
    maxTime: 'all',
    search: '',
    sortBy: 'rating'
  },

  // Wizard state
  wizard: {
    mood: '',
    mealType: 'all',
    diet: 'all',
    maxTime: 45,
    cravingText: '',
    fridgeIngredients: []
  },

  // Wheel state
  wheel: {
    isSpinning: false,
    currentAngle: 0,
    items: []
  }
};

// DOM Selectors
const DOM = {
  globalSearch: document.getElementById('global-search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  dishesGrid: document.getElementById('dishes-grid'),
  dishCountLabel: document.getElementById('dish-count-label'),
  emptyState: document.getElementById('empty-state'),
  categoryTabsContainer: document.getElementById('category-tabs-container'),
  quickMoodContainer: document.getElementById('quick-mood-chips-container'),
  activeFilterTags: document.getElementById('active-filter-tags'),
  
  // Filter inputs
  sortSelect: document.getElementById('sort-select'),
  dietSelect: document.getElementById('diet-filter-select'),
  spiceSelect: document.getElementById('spice-filter-select'),
  timeChips: document.querySelectorAll('#time-filter-chips .chip'),
  resetFiltersBtn: document.getElementById('reset-all-filters-btn'),
  emptyResetBtn: document.getElementById('empty-reset-btn'),

  // Suggester Wizard
  suggesterSection: document.getElementById('suggester-section'),
  suggesterBody: document.getElementById('suggester-body'),
  toggleWizardBtn: document.getElementById('toggle-wizard-btn'),
  wizardToggleText: document.getElementById('wizard-toggle-text'),
  wizardToggleIcon: document.getElementById('wizard-toggle-icon'),
  wizardMoodGrid: document.getElementById('wizard-mood-grid'),
  wizardDietSelect: document.getElementById('wizard-diet-select'),
  prepTimeRange: document.getElementById('prep-time-range'),
  timeSliderVal: document.getElementById('time-slider-val'),
  cravingTextInput: document.getElementById('craving-text-input'),
  fridgeInput: document.getElementById('fridge-input'),
  addFridgeBtn: document.getElementById('add-fridge-tag-btn'),
  fridgeTagsContainer: document.getElementById('fridge-tags-container'),
  suggesterForm: document.getElementById('suggester-form'),
  resetWizardBtn: document.getElementById('reset-wizard-btn'),
  suggestionResultsPanel: document.getElementById('suggestion-results-panel'),
  suggestedDishesGrid: document.getElementById('suggested-dishes-grid'),
  closeSuggestionsBtn: document.getElementById('close-suggestions-btn'),

  // Hero & Nav buttons
  navSuggestBtn: document.getElementById('nav-suggest-btn'),
  heroSuggestBtn: document.getElementById('hero-get-suggest-btn'),
  heroSurpriseBtn: document.getElementById('hero-surprise-btn'),
  heroRouletteBtn: document.getElementById('hero-roulette-btn'),
  openRouletteBtn: document.getElementById('open-roulette-btn'),

  // Dish Modal
  dishModalOverlay: document.getElementById('dish-modal-overlay'),
  dishModalCard: document.getElementById('dish-modal-card'),
  dishModalContent: document.getElementById('dish-modal-content'),
  closeDishModalBtn: document.getElementById('close-dish-modal-btn'),

  // Roulette Modal
  rouletteModalOverlay: document.getElementById('roulette-modal-overlay'),
  closeRouletteModalBtn: document.getElementById('close-roulette-modal-btn'),
  rouletteCanvas: document.getElementById('roulette-canvas'),
  spinWheelBtn: document.getElementById('spin-wheel-btn'),
  rouletteResultCard: document.getElementById('roulette-result-card'),
  rouletteDishImg: document.getElementById('roulette-dish-img'),
  rouletteDishName: document.getElementById('roulette-dish-name'),
  rouletteDishTagline: document.getElementById('roulette-dish-tagline'),
  rouletteViewDishBtn: document.getElementById('roulette-view-dish-btn'),
  rouletteSpinAgainBtn: document.getElementById('roulette-spin-again-btn'),

  // Favorites
  favoritesBadge: document.getElementById('favorites-badge'),
  openFavoritesBtn: document.getElementById('open-favorites-btn'),
  favoritesDrawer: document.getElementById('favorites-drawer'),
  favoritesDrawerOverlay: document.getElementById('favorites-drawer-overlay'),
  closeFavoritesBtn: document.getElementById('close-favorites-btn'),
  favoritesListContainer: document.getElementById('favorites-list-container'),
  clearAllFavoritesBtn: document.getElementById('clear-all-favorites-btn'),

  // Toast
  toastContainer: document.getElementById('toast-container')
};

// ==========================================================================
// Initialization & API Fetching
// ==========================================================================
async function initApp() {
  updateFavoritesCount();
  setupEventListeners();

  try {
    // 1. Fetch metadata
    const metaRes = await fetch('/api/meta');
    const metaData = await metaRes.json();
    state.categories = metaData.categories;
    state.moods = metaData.moods;
    state.dietaryOptions = metaData.dietaryOptions;
    state.cuisines = metaData.cuisines;

    // Render category tabs, moods, and quick mood scroller
    renderCategoryTabs();
    renderQuickMoodChips();
    renderWizardMoods();

    // 2. Fetch dishes
    await fetchDishes();

    // Init Roulette Canvas setup
    initRouletteWheel();

  } catch (err) {
    console.error('Failed to initialize NibbleNest:', err);
    showToast('Failed to load food catalogue. Please check server.', 'error');
  }
}

// Fetch Dishes from API with current filter query params
async function fetchDishes() {
  const params = new URLSearchParams();
  if (state.filters.search) params.append('search', state.filters.search);
  if (state.filters.category !== 'all') params.append('category', state.filters.category);
  if (state.filters.mood !== 'all') params.append('mood', state.filters.mood);
  if (state.filters.diet !== 'all') params.append('diet', state.filters.diet);
  if (state.filters.spiceLevel !== 'all') params.append('spiceLevel', state.filters.spiceLevel);
  if (state.filters.maxTime !== 'all') params.append('maxTime', state.filters.maxTime);
  if (state.filters.sortBy) params.append('sortBy', state.filters.sortBy);

  try {
    const res = await fetch(`/api/dishes?${params.toString()}`);
    const data = await res.json();
    state.dishes = data.dishes;
    renderDishes();
    renderActiveFilterTags();
  } catch (err) {
    console.error('Error fetching dishes:', err);
  }
}

// ==========================================================================
// Rendering: Category Tabs & Mood Chips
// ==========================================================================
function renderCategoryTabs() {
  DOM.categoryTabsContainer.innerHTML = '';
  state.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cat-tab-btn ${state.filters.category === cat.id ? 'active' : ''}`;
    btn.innerHTML = `<span>${cat.icon}</span> <span>${cat.label}</span>`;
    btn.addEventListener('click', () => {
      state.filters.category = cat.id;
      document.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fetchDishes();
    });
    DOM.categoryTabsContainer.appendChild(btn);
  });
}

function renderQuickMoodChips() {
  DOM.quickMoodContainer.innerHTML = '';
  state.moods.forEach(mood => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `mood-chip-btn ${state.filters.mood === mood.id ? 'active' : ''}`;
    chip.innerHTML = `<span>${mood.icon}</span> <span>${mood.label}</span>`;
    chip.addEventListener('click', () => {
      if (state.filters.mood === mood.id) {
        state.filters.mood = 'all';
        chip.classList.remove('active');
      } else {
        state.filters.mood = mood.id;
        document.querySelectorAll('.mood-chip-btn').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      }
      fetchDishes();
      // Scroll to catalog section smoothly
      document.getElementById('catalog-section').scrollIntoView({ behavior: 'smooth' });
    });
    DOM.quickMoodContainer.appendChild(chip);
  });
}

function renderWizardMoods() {
  DOM.wizardMoodGrid.innerHTML = '';
  state.moods.forEach(mood => {
    const card = document.createElement('div');
    card.className = `wizard-mood-card ${state.wizard.mood === mood.id ? 'selected' : ''}`;
    card.dataset.moodId = mood.id;
    card.innerHTML = `
      <div class="wizard-mood-icon">${mood.icon}</div>
      <div class="wizard-mood-info">
        <h4>${mood.label}</h4>
        <p>${mood.desc}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      state.wizard.mood = mood.id;
      document.querySelectorAll('.wizard-mood-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
    });
    DOM.wizardMoodGrid.appendChild(card);
  });
}

// ==========================================================================
// Rendering: Dishes Grid
// ==========================================================================
function renderDishes() {
  const dishes = state.dishes;
  DOM.dishesGrid.innerHTML = '';

  if (!dishes || dishes.length === 0) {
    DOM.emptyState.style.display = 'block';
    DOM.dishCountLabel.textContent = '0 dishes found';
    return;
  }

  DOM.emptyState.style.display = 'none';
  DOM.dishCountLabel.textContent = `Showing ${dishes.length} gourmet dish${dishes.length > 1 ? 'es' : ''}`;

  dishes.forEach(dish => {
    const isFav = state.favorites.includes(dish.id);
    const card = createDishCardElement(dish, isFav);
    DOM.dishesGrid.appendChild(card);
  });
}

function createDishCardElement(dish, isFav, options = {}) {
  const card = document.createElement('div');
  card.className = 'dish-card';

  // Spice fire icons
  const spiceIcons = '🌶️'.repeat(dish.spiceLevel || 0) || 'Mild';

  // Diet badge formatting
  const dietBadge = dish.diet && dish.diet[0] 
    ? `<span class="diet-pill">${dish.diet[0].replace('-', ' ')}</span>`
    : '';

  // Match badge if from smart suggestions
  const matchBadgeHTML = options.matchPercentage
    ? `<div class="match-badge"><i class="fa-solid fa-sparkles"></i> ${options.matchPercentage}% Match</div>`
    : '';

  card.innerHTML = `
    <div class="dish-media">
      ${matchBadgeHTML}
      <span class="cuisine-tag">${dish.cuisine}</span>
      <button type="button" class="fav-toggle-btn ${isFav ? 'active' : ''}" data-dish-id="${dish.id}" aria-label="Save dish">
        <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
      </button>
      <img src="${dish.image}" alt="${dish.name}" class="dish-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'">
      <div class="dish-media-overlay"></div>
      
      <div class="dish-quick-meta">
        <div class="prep-badge"><i class="fa-regular fa-clock"></i> ${dish.prepTime} min</div>
        <div class="calorie-badge"><i class="fa-solid fa-fire-flame-curved"></i> ${dish.calories} kcal</div>
      </div>
    </div>

    <div class="dish-body">
      <div class="dish-header-row">
        <h3 class="dish-title">${dish.name}</h3>
        <div class="dish-rating">
          <i class="fa-solid fa-star"></i>
          <span>${dish.rating}</span>
        </div>
      </div>

      <p class="dish-tagline">${dish.tagline}</p>

      <div class="dish-pills-row">
        ${dietBadge}
        <span class="spice-pill">${spiceIcons}</span>
      </div>

      <div class="dish-ingredients-preview">
        <strong>Key:</strong> ${dish.ingredients.slice(0, 4).join(', ')}...
      </div>

      ${options.matchReasons ? `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 8px 12px; margin-bottom: 14px; font-size: 0.78rem; color: #a7f3d0;">
          <i class="fa-solid fa-check text-green"></i> ${options.matchReasons[0]}
        </div>
      ` : ''}

      <div class="dish-footer">
        <button type="button" class="btn btn-primary btn-sm view-recipe-btn" data-dish-id="${dish.id}">
          <i class="fa-solid fa-utensils"></i> View Recipe
        </button>
        <button type="button" class="pairing-btn" data-dish-id="${dish.id}" title="Drink Pairing Suggestion">
          <i class="fa-solid fa-wine-glass"></i>
        </button>
      </div>
    </div>
  `;

  // Attach card event listeners
  const favBtn = card.querySelector('.fav-toggle-btn');
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(dish.id, favBtn);
  });

  const viewBtn = card.querySelector('.view-recipe-btn');
  viewBtn.addEventListener('click', () => {
    openDishDetailsModal(dish.id);
  });

  const pairingBtn = card.querySelector('.pairing-btn');
  pairingBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showToast(`🍷 Drink Pairing for ${dish.name}: ${dish.beveragePairing}`, 'info');
  });

  return card;
}

// ==========================================================================
// Active Filter Badges Bar
// ==========================================================================
function renderActiveFilterTags() {
  const f = state.filters;
  const tags = [];

  if (f.search) tags.push({ type: 'search', label: `Search: "${f.search}"` });
  if (f.category !== 'all') {
    const cat = state.categories.find(c => c.id === f.category);
    tags.push({ type: 'category', label: `Category: ${cat ? cat.label : f.category}` });
  }
  if (f.mood !== 'all') {
    const m = state.moods.find(mood => mood.id === f.mood);
    tags.push({ type: 'mood', label: `Mood: ${m ? m.label : f.mood}` });
  }
  if (f.diet !== 'all') tags.push({ type: 'diet', label: `Diet: ${f.diet}` });
  if (f.spiceLevel !== 'all') tags.push({ type: 'spiceLevel', label: `Spice &le; ${f.spiceLevel}🌶️` });
  if (f.maxTime !== 'all') tags.push({ type: 'maxTime', label: `Time &le; ${f.maxTime}m` });

  if (tags.length === 0) {
    DOM.activeFilterTags.style.display = 'none';
    DOM.activeFilterTags.innerHTML = '';
    return;
  }

  DOM.activeFilterTags.style.display = 'flex';
  DOM.activeFilterTags.innerHTML = '<span style="font-size: 0.76rem; color: var(--text-dim); text-transform: uppercase; font-weight:700;">Filters:</span>';

  tags.forEach(t => {
    const tagEl = document.createElement('div');
    tagEl.className = 'active-tag';
    tagEl.innerHTML = `
      <span>${t.label}</span>
      <i class="fa-solid fa-xmark"></i>
    `;
    tagEl.querySelector('i').addEventListener('click', () => {
      removeFilter(t.type);
    });
    DOM.activeFilterTags.appendChild(tagEl);
  });
}

function removeFilter(type) {
  if (type === 'search') {
    state.filters.search = '';
    DOM.globalSearch.value = '';
    DOM.clearSearchBtn.style.display = 'none';
  } else if (type === 'category') {
    state.filters.category = 'all';
    document.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.cat-tab-btn')?.classList.add('active');
  } else if (type === 'mood') {
    state.filters.mood = 'all';
    document.querySelectorAll('.mood-chip-btn').forEach(c => c.classList.remove('active'));
  } else if (type === 'diet') {
    state.filters.diet = 'all';
    DOM.dietSelect.value = 'all';
  } else if (type === 'spiceLevel') {
    state.filters.spiceLevel = 'all';
    DOM.spiceSelect.value = 'all';
  } else if (type === 'maxTime') {
    state.filters.maxTime = 'all';
    DOM.timeChips.forEach(c => c.classList.remove('active'));
    document.querySelector('#time-filter-chips .chip[data-time="all"]')?.classList.add('active');
  }
  fetchDishes();
}

function resetAllFilters() {
  state.filters.category = 'all';
  state.filters.mood = 'all';
  state.filters.diet = 'all';
  state.filters.spiceLevel = 'all';
  state.filters.maxTime = 'all';
  state.filters.search = '';
  state.filters.sortBy = 'rating';

  DOM.globalSearch.value = '';
  DOM.clearSearchBtn.style.display = 'none';
  DOM.dietSelect.value = 'all';
  DOM.spiceSelect.value = 'all';
  DOM.sortSelect.value = 'rating';

  document.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.cat-tab-btn')?.classList.add('active');

  document.querySelectorAll('.mood-chip-btn').forEach(c => c.classList.remove('active'));
  DOM.timeChips.forEach(c => c.classList.remove('active'));
  document.querySelector('#time-filter-chips .chip[data-time="all"]')?.classList.add('active');

  fetchDishes();
  showToast('Filters reset to default', 'info');
}

// ==========================================================================
// Dish Details Modal
// ==========================================================================
async function openDishDetailsModal(dishId) {
  try {
    const res = await fetch(`/api/dishes/${dishId}`);
    if (!res.ok) throw new Error('Dish not found');
    const { dish, related } = await res.json();

    const isFav = state.favorites.includes(dish.id);
    const spiceIcons = '🌶️'.repeat(dish.spiceLevel || 0) || 'None';

    DOM.dishModalContent.innerHTML = `
      <div class="modal-hero">
        <img src="${dish.image}" alt="${dish.name}">
        <div class="modal-hero-gradient"></div>
        <div class="modal-hero-content">
          <div class="modal-badges-row">
            <span class="cuisine-tag">${dish.cuisine}</span>
            <span class="diet-pill">${dish.diet.join(', ')}</span>
            <span class="spice-pill">${spiceIcons} Spice</span>
            <span class="dish-rating"><i class="fa-solid fa-star"></i> ${dish.rating} (${dish.reviewCount} reviews)</span>
          </div>
          <h2 class="modal-title">${dish.name}</h2>
          <p class="modal-tagline">${dish.tagline}</p>
        </div>
      </div>

      <div class="modal-body">
        <!-- Macros Bar -->
        <div class="macros-grid">
          <div class="macro-box">
            <span class="macro-title">Calories</span>
            <span class="macro-value">${dish.calories} kcal</span>
          </div>
          <div class="macro-box">
            <span class="macro-title">Protein</span>
            <span class="macro-value">${dish.macros.protein}</span>
          </div>
          <div class="macro-box">
            <span class="macro-title">Carbs</span>
            <span class="macro-value">${dish.macros.carbs}</span>
          </div>
          <div class="macro-box">
            <span class="macro-title">Fat</span>
            <span class="macro-value">${dish.macros.fat}</span>
          </div>
        </div>

        <!-- Description -->
        <p style="font-size: 1.05rem; line-height: 1.7; color: #cbd5e1; margin-bottom: 24px;">
          ${dish.description}
        </p>

        <!-- Flavor Meters Section -->
        <div class="flavor-meters-section">
          <h4 style="font-size: 1rem; color: #fbbf24;"><i class="fa-solid fa-chart-simple"></i> Flavor Profile</h4>
          <div class="flavor-meter-grid">
            <div class="flavor-item">
              <div class="flavor-item-header">
                <span>Sweet</span>
                <span>${dish.flavorProfile.sweet}%</span>
              </div>
              <div class="meter-track"><div class="meter-fill fill-sweet" style="width: ${dish.flavorProfile.sweet}%"></div></div>
            </div>
            <div class="flavor-item">
              <div class="flavor-item-header">
                <span>Savory</span>
                <span>${dish.flavorProfile.savory}%</span>
              </div>
              <div class="meter-track"><div class="meter-fill fill-savory" style="width: ${dish.flavorProfile.savory}%"></div></div>
            </div>
            <div class="flavor-item">
              <div class="flavor-item-header">
                <span>Spicy</span>
                <span>${dish.flavorProfile.spicy}%</span>
              </div>
              <div class="meter-track"><div class="meter-fill fill-spicy" style="width: ${dish.flavorProfile.spicy}%"></div></div>
            </div>
            <div class="flavor-item">
              <div class="flavor-item-header">
                <span>Richness</span>
                <span>${dish.flavorProfile.richness}%</span>
              </div>
              <div class="meter-track"><div class="meter-fill fill-richness" style="width: ${dish.flavorProfile.richness}%"></div></div>
            </div>
            <div class="flavor-item">
              <div class="flavor-item-header">
                <span>Freshness</span>
                <span>${dish.flavorProfile.freshness}%</span>
              </div>
              <div class="meter-track"><div class="meter-fill fill-freshness" style="width: ${dish.flavorProfile.freshness}%"></div></div>
            </div>
          </div>
        </div>

        <!-- Beverage Pairing Card -->
        <div class="pairing-highlight-card">
          <div class="pairing-icon"><i class="fa-solid fa-martini-glass-citrus"></i></div>
          <div class="pairing-text">
            <h4>Sommelier & Chef Beverage Pairing</h4>
            <p>${dish.beveragePairing}</p>
          </div>
        </div>

        <!-- Ingredients Checklist & Steps -->
        <div class="modal-cooking-grid">
          <div class="ingredients-box">
            <h4 class="sub-heading"><i class="fa-solid fa-list-check"></i> Ingredients Needed</h4>
            <p style="font-size: 0.78rem; color: var(--text-dim); margin-bottom: 12px;">Check off what you have in your kitchen:</p>
            <ul class="ingredient-checklist">
              ${dish.ingredients.map((ing, i) => `
                <li id="ing-item-${i}">
                  <input type="checkbox" id="ing-check-${i}">
                  <label for="ing-check-${i}">${ing}</label>
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="steps-box">
            <h4 class="sub-heading"><i class="fa-solid fa-kitchen-set"></i> Cooking Guide</h4>
            <ol class="steps-list">
              ${dish.recipeSteps.map(step => `<li>${step}</li>`).join('')}
            </ol>
          </div>
        </div>

        <!-- Related Dishes -->
        ${related && related.length > 0 ? `
          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--border-subtle);">
            <h4 style="font-size: 1rem; margin-bottom: 12px; color: var(--text-muted);">Similar Flavors You Might Enjoy</h4>
            <div class="related-dishes-row">
              ${related.map(r => `
                <div class="related-dish-card" data-dish-id="${r.id}">
                  <img src="${r.image}" alt="${r.name}" class="related-dish-img">
                  <div class="related-dish-info">
                    <h5>${r.name}</h5>
                    <span>${r.cuisine} • ${r.prepTime} min</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Bottom Action Bar -->
        <div style="margin-top: 30px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
          <button type="button" class="btn ${isFav ? 'btn-secondary' : 'btn-primary'}" id="modal-fav-btn">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
            <span>${isFav ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
          </button>
          <button type="button" class="btn btn-glass" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Print Recipe
          </button>
        </div>

      </div>
    `;

    // Interactive checklist strike-through
    dish.ingredients.forEach((_, i) => {
      const checkbox = document.getElementById(`ing-check-${i}`);
      const li = document.getElementById(`ing-item-${i}`);
      if (checkbox && li) {
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            li.classList.add('checked');
          } else {
            li.classList.remove('checked');
          }
        });
      }
    });

    // Related dishes clicks
    DOM.dishModalContent.querySelectorAll('.related-dish-card').forEach(item => {
      item.addEventListener('click', () => {
        openDishDetailsModal(item.dataset.dishId);
      });
    });

    // Modal favorite button
    const modalFavBtn = document.getElementById('modal-fav-btn');
    if (modalFavBtn) {
      modalFavBtn.addEventListener('click', () => {
        toggleFavorite(dish.id);
        const nowFav = state.favorites.includes(dish.id);
        modalFavBtn.className = `btn ${nowFav ? 'btn-secondary' : 'btn-primary'}`;
        modalFavBtn.innerHTML = `
          <i class="${nowFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          <span>${nowFav ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
        `;
      });
    }

    // Open modal
    DOM.dishModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

  } catch (err) {
    console.error('Error opening dish modal:', err);
    showToast('Failed to load dish details', 'error');
  }
}

function closeDishModal() {
  DOM.dishModalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ==========================================================================
// Smart Craving Wizard (Concierge)
// ==========================================================================
async function handleWizardSubmit(e) {
  e.preventDefault();

  const mealTypeRadio = document.querySelector('input[name="mealType"]:checked');
  const mealType = mealTypeRadio ? mealTypeRadio.value : 'all';
  const diet = DOM.wizardDietSelect.value;
  const maxTime = DOM.prepTimeRange.value;
  const cravingText = DOM.cravingTextInput.value.trim();
  const fridgeIngredients = state.wizard.fridgeIngredients;
  const mood = state.wizard.mood;

  const payload = {
    mood,
    mealType,
    diet,
    maxTime,
    cravingText,
    fridgeIngredients
  };

  const submitBtn = document.getElementById('submit-suggest-btn');
  const origBtnContent = submitBtn.innerHTML;
  submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Finding Flavor Matches...`;
  submitBtn.disabled = true;

  try {
    const res = await fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    renderSmartSuggestions(data.topPicks);

    // Trigger celebration confetti
    if (window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    showToast(`Found ${data.topPicks.length} tailored dish suggestions!`, 'success');

  } catch (err) {
    console.error('Suggester error:', err);
    showToast('Could not fetch suggestions', 'error');
  } finally {
    submitBtn.innerHTML = origBtnContent;
    submitBtn.disabled = false;
  }
}

function renderSmartSuggestions(topPicks) {
  DOM.suggestedDishesGrid.innerHTML = '';
  DOM.suggestionResultsPanel.style.display = 'block';

  topPicks.forEach(dish => {
    const isFav = state.favorites.includes(dish.id);
    const card = createDishCardElement(dish, isFav, {
      matchPercentage: dish.matchPercentage,
      matchReasons: dish.matchReasons
    });
    DOM.suggestedDishesGrid.appendChild(card);
  });

  // Smooth scroll into results
  DOM.suggestionResultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function addFridgeIngredientTag() {
  const val = DOM.fridgeInput.value.trim();
  if (!val) return;

  if (!state.wizard.fridgeIngredients.includes(val.toLowerCase())) {
    state.wizard.fridgeIngredients.push(val.toLowerCase());
    renderFridgeTags();
  }
  DOM.fridgeInput.value = '';
}

function renderFridgeTags() {
  DOM.fridgeTagsContainer.innerHTML = '';
  state.wizard.fridgeIngredients.forEach((ing, idx) => {
    const tag = document.createElement('span');
    tag.className = 'ingredient-tag';
    tag.innerHTML = `
      <span>${ing}</span>
      <i class="fa-solid fa-xmark remove-tag" data-idx="${idx}"></i>
    `;
    tag.querySelector('.remove-tag').addEventListener('click', () => {
      state.wizard.fridgeIngredients.splice(idx, 1);
      renderFridgeTags();
    });
    DOM.fridgeTagsContainer.appendChild(tag);
  });
}

function resetWizard() {
  state.wizard.mood = '';
  state.wizard.fridgeIngredients = [];
  DOM.cravingTextInput.value = '';
  DOM.fridgeInput.value = '';
  DOM.wizardDietSelect.value = 'all';
  DOM.prepTimeRange.value = 45;
  DOM.timeSliderVal.textContent = '45 mins';
  document.querySelectorAll('.wizard-mood-card').forEach(c => c.classList.remove('selected'));
  renderFridgeTags();
  DOM.suggestionResultsPanel.style.display = 'none';
  showToast('Wizard fields cleared', 'info');
}

// ==========================================================================
// Food Roulette Wheel
// ==========================================================================
function initRouletteWheel() {
  state.wheel.items = state.dishes.length > 0 ? state.dishes.slice(0, 8) : [
    { name: 'Truffle Pasta', cuisine: 'Italian' },
    { name: 'Birria Tacos', cuisine: 'Mexican' },
    { name: 'Garlic Ramen', cuisine: 'Japanese' },
    { name: 'Butter Chicken', cuisine: 'Indian' },
    { name: 'Wagyu Burger', cuisine: 'American' },
    { name: 'Salmon Poke', cuisine: 'Hawaiian' },
    { name: 'Pad Thai', cuisine: 'Thai' },
    { name: 'Margherita Pizza', cuisine: 'Italian' }
  ];
  drawRouletteWheel(state.wheel.currentAngle);
}

function drawRouletteWheel(angle) {
  const canvas = DOM.rouletteCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const items = state.wheel.items;
  const numSegments = items.length;
  const arcSize = (2 * Math.PI) / numSegments;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = centerX - 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const colors = [
    '#ff5a36', '#f59e0b', '#10b981', '#06b6d4',
    '#8b5cf6', '#ec4899', '#3b82f6', '#f97316'
  ];

  for (let i = 0; i < numSegments; i++) {
    const itemAngle = angle + i * arcSize;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, itemAngle, itemAngle + arcSize);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0a0e17';
    ctx.stroke();

    // Text on segment
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(itemAngle + arcSize / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    
    // Shorten label if too long
    const item = items[i];
    const label = item.name.length > 16 ? item.name.slice(0, 14) + '...' : item.name;
    ctx.fillText(label, radius - 20, 5);
    ctx.restore();
  }

  // Draw Center Hub
  ctx.beginPath();
  ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
  ctx.fillStyle = '#0a0e17';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ff5a36';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, centerY, 12, 0, 2 * Math.PI);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
}

function spinRouletteWheel() {
  if (state.wheel.isSpinning) return;
  state.wheel.isSpinning = true;
  DOM.spinWheelBtn.disabled = true;
  DOM.rouletteResultCard.style.display = 'none';

  // Ensure current pool
  state.wheel.items = state.dishes.slice(0, 8);

  const numSegments = state.wheel.items.length;
  const arcSize = (2 * Math.PI) / numSegments;
  
  // Pick random winner
  const winnerIndex = Math.floor(Math.random() * numSegments);
  const fullRotations = 5 + Math.floor(Math.random() * 3);
  
  // The arrow is at top (3 * Math.PI / 2)
  const targetAngle = (3 * Math.PI / 2) - (winnerIndex * arcSize + arcSize / 2);
  const totalRotation = (fullRotations * 2 * Math.PI) + (targetAngle - (state.wheel.currentAngle % (2 * Math.PI)));

  const startAngle = state.wheel.currentAngle;
  const duration = 4000;
  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    state.wheel.currentAngle = startAngle + totalRotation * ease;
    drawRouletteWheel(state.wheel.currentAngle);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      state.wheel.isSpinning = false;
      DOM.spinWheelBtn.disabled = false;
      showRouletteWinner(state.wheel.items[winnerIndex]);
    }
  }

  requestAnimationFrame(animate);
}

function showRouletteWinner(dish) {
  DOM.rouletteDishImg.src = dish.image;
  DOM.rouletteDishName.textContent = dish.name;
  DOM.rouletteDishTagline.textContent = dish.tagline;
  DOM.rouletteResultCard.style.display = 'flex';

  DOM.rouletteViewDishBtn.onclick = () => {
    closeRouletteModal();
    openDishDetailsModal(dish.id);
  };

  if (window.confetti) {
    window.confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 }
    });
  }
}

function openRouletteModal() {
  initRouletteWheel();
  DOM.rouletteResultCard.style.display = 'none';
  DOM.rouletteModalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeRouletteModal() {
  DOM.rouletteModalOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ==========================================================================
// Surprise Me Button
// ==========================================================================
async function handleSurpriseMe() {
  try {
    const res = await fetch('/api/dishes/random');
    const dish = await res.json();
    openDishDetailsModal(dish.id);
    showToast(`🎉 Destiny chose: ${dish.name}!`, 'success');
  } catch (err) {
    console.error('Surprise Me failed:', err);
    showToast('Failed to get a random dish', 'error');
  }
}

// ==========================================================================
// Favorites System
// ==========================================================================
function toggleFavorite(dishId, buttonEl) {
  const idx = state.favorites.indexOf(dishId);
  let isNowFav = false;

  if (idx > -1) {
    state.favorites.splice(idx, 1);
    showToast('Removed from Craving Wishlist', 'info');
  } else {
    state.favorites.push(dishId);
    isNowFav = true;
    showToast('Added to Craving Wishlist ❤️', 'success');
  }

  localStorage.setItem('nibblenest_favorites', JSON.stringify(state.favorites));
  updateFavoritesCount();

  if (buttonEl) {
    buttonEl.classList.toggle('active', isNowFav);
    const icon = buttonEl.querySelector('i');
    if (icon) {
      icon.className = `${isNowFav ? 'fa-solid' : 'fa-regular'} fa-heart`;
    }
  }

  // Also sync any other cards on page
  document.querySelectorAll(`.fav-toggle-btn[data-dish-id="${dishId}"]`).forEach(btn => {
    btn.classList.toggle('active', isNowFav);
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = `${isNowFav ? 'fa-solid' : 'fa-regular'} fa-heart`;
    }
  });

  if (DOM.favoritesDrawer.classList.contains('active')) {
    renderFavoritesList();
  }
}

function updateFavoritesCount() {
  DOM.favoritesBadge.textContent = state.favorites.length;
}

function renderFavoritesList() {
  DOM.favoritesListContainer.innerHTML = '';
  
  if (state.favorites.length === 0) {
    DOM.favoritesListContainer.innerHTML = `
      <div style="text-align: center; padding: 40px 10px; color: var(--text-dim);">
        <i class="fa-regular fa-heart" style="font-size: 2.5rem; margin-bottom: 12px; display:block;"></i>
        <p>No dishes saved yet.</p>
        <p style="font-size: 0.8rem; margin-top: 6px;">Tap the heart on any dish card to keep it handy!</p>
      </div>
    `;
    return;
  }

  state.favorites.forEach(id => {
    const dish = state.dishes.find(d => d.id === id);
    if (!dish) return;

    const item = document.createElement('div');
    item.className = 'favorite-item';
    item.innerHTML = `
      <img src="${dish.image}" alt="${dish.name}" class="fav-thumb">
      <div class="fav-details">
        <h4>${dish.name}</h4>
        <span>${dish.cuisine} • ${dish.prepTime} min</span>
      </div>
      <button type="button" class="remove-fav-btn" title="Remove">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;

    item.querySelector('.fav-details').addEventListener('click', () => {
      closeFavoritesDrawer();
      openDishDetailsModal(dish.id);
    });

    item.querySelector('.remove-fav-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(dish.id);
    });

    DOM.favoritesListContainer.appendChild(item);
  });
}

function openFavoritesDrawer() {
  renderFavoritesList();
  DOM.favoritesDrawer.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeFavoritesDrawer() {
  DOM.favoritesDrawer.classList.remove('active');
  document.body.style.overflow = '';
}

function clearAllFavorites() {
  if (state.favorites.length === 0) return;
  state.favorites = [];
  localStorage.setItem('nibblenest_favorites', JSON.stringify([]));
  updateFavoritesCount();
  renderFavoritesList();
  renderDishes();
  showToast('Craving Wishlist cleared', 'info');
}

// ==========================================================================
// Toast Notification
// ==========================================================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}

// ==========================================================================
// Event Listeners Setup
// ==========================================================================
function setupEventListeners() {
  // Global Search
  let searchTimeout;
  DOM.globalSearch.addEventListener('input', (e) => {
    const val = e.target.value;
    DOM.clearSearchBtn.style.display = val ? 'block' : 'none';
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.search = val;
      fetchDishes();
    }, 250);
  });

  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.globalSearch.value = '';
    state.filters.search = '';
    DOM.clearSearchBtn.style.display = 'none';
    fetchDishes();
  });

  // Sort dropdown
  DOM.sortSelect.addEventListener('change', (e) => {
    state.filters.sortBy = e.target.value;
    fetchDishes();
  });

  // Diet dropdown
  DOM.dietSelect.addEventListener('change', (e) => {
    state.filters.diet = e.target.value;
    fetchDishes();
  });

  // Spice dropdown
  DOM.spiceSelect.addEventListener('change', (e) => {
    state.filters.spiceLevel = e.target.value;
    fetchDishes();
  });

  // Time filter chips
  DOM.timeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      DOM.timeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filters.maxTime = chip.dataset.time;
      fetchDishes();
    });
  });

  // Reset Filters
  DOM.resetFiltersBtn.addEventListener('click', resetAllFilters);
  DOM.emptyResetBtn.addEventListener('click', resetAllFilters);

  // Suggester toggle
  DOM.toggleWizardBtn.addEventListener('click', () => {
    const isHidden = DOM.suggesterBody.style.display === 'none';
    DOM.suggesterBody.style.display = isHidden ? 'block' : 'none';
    DOM.wizardToggleText.textContent = isHidden ? 'Minimize' : 'Expand';
    DOM.wizardToggleIcon.className = `fa-solid fa-chevron-${isHidden ? 'up' : 'down'}`;
  });

  // Slider change
  DOM.prepTimeRange.addEventListener('input', (e) => {
    DOM.timeSliderVal.textContent = `${e.target.value} mins`;
  });

  // Fridge ingredient tags
  DOM.addFridgeBtn.addEventListener('click', addFridgeIngredientTag);
  DOM.fridgeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFridgeIngredientTag();
    }
  });

  // Wizard form submit & reset
  DOM.suggesterForm.addEventListener('submit', handleWizardSubmit);
  DOM.resetWizardBtn.addEventListener('click', resetWizard);
  DOM.closeSuggestionsBtn.addEventListener('click', () => {
    DOM.suggestionResultsPanel.style.display = 'none';
  });

  // Quick nav & hero buttons
  const scrollToSuggester = () => {
    DOM.suggesterBody.style.display = 'block';
    DOM.wizardToggleText.textContent = 'Minimize';
    DOM.wizardToggleIcon.className = 'fa-solid fa-chevron-up';
    DOM.suggesterSection.scrollIntoView({ behavior: 'smooth' });
  };
  DOM.navSuggestBtn.addEventListener('click', scrollToSuggester);
  DOM.heroSuggestBtn.addEventListener('click', scrollToSuggester);
  DOM.heroSurpriseBtn.addEventListener('click', handleSurpriseMe);
  DOM.heroRouletteBtn.addEventListener('click', openRouletteModal);
  DOM.openRouletteBtn.addEventListener('click', openRouletteModal);

  // Roulette controls
  DOM.spinWheelBtn.addEventListener('click', spinRouletteWheel);
  DOM.rouletteSpinAgainBtn.addEventListener('click', spinRouletteWheel);
  DOM.closeRouletteModalBtn.addEventListener('click', closeRouletteModal);
  DOM.rouletteModalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.rouletteModalOverlay) closeRouletteModal();
  });

  // Dish Modal controls
  DOM.closeDishModalBtn.addEventListener('click', closeDishModal);
  DOM.dishModalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.dishModalOverlay) closeDishModal();
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDishModal();
      closeRouletteModal();
      closeFavoritesDrawer();
    }
  });

  // Favorites Drawer controls
  DOM.openFavoritesBtn.addEventListener('click', openFavoritesDrawer);
  DOM.closeFavoritesBtn.addEventListener('click', closeFavoritesDrawer);
  DOM.favoritesDrawerOverlay.addEventListener('click', closeFavoritesDrawer);
  DOM.clearAllFavoritesBtn.addEventListener('click', clearAllFavorites);

  // Footer Filter Links
  document.querySelectorAll('[data-cuisine-filter]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      state.filters.search = a.dataset.cuisineFilter;
      DOM.globalSearch.value = a.dataset.cuisineFilter;
      DOM.clearSearchBtn.style.display = 'block';
      fetchDishes();
      document.getElementById('catalog-section').scrollIntoView({ behavior: 'smooth' });
    });
  });

  document.querySelectorAll('[data-mood-filter]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      state.filters.mood = a.dataset.moodFilter;
      document.querySelectorAll('.mood-chip-btn').forEach(c => c.classList.remove('active'));
      const chip = document.querySelector(`.mood-chip-btn[data-mood-id="${a.dataset.moodFilter}"]`);
      if (chip) chip.classList.add('active');
      fetchDishes();
      document.getElementById('catalog-section').scrollIntoView({ behavior: 'smooth' });
    });
  });

  document.querySelectorAll('[data-diet-filter]').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      state.filters.diet = a.dataset.dietFilter;
      DOM.dietSelect.value = a.dataset.dietFilter;
      fetchDishes();
      document.getElementById('catalog-section').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
