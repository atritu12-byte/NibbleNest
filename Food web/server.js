import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { DISHES, CATEGORIES, MOODS, DIETARY_OPTIONS } from './data/dishes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API: Metadata
app.get('/api/meta', (req, res) => {
  const cuisines = [...new Set(DISHES.map(d => d.cuisine))].sort();
  res.json({
    totalDishes: DISHES.length,
    categories: CATEGORIES,
    moods: MOODS,
    dietaryOptions: DIETARY_OPTIONS,
    cuisines
  });
});

// API: Get dishes with multi-dimensional filtering
app.get('/api/dishes', (req, res) => {
  const {
    search,
    category,
    mood,
    mealType,
    diet,
    maxTime,
    maxCalories,
    spiceLevel,
    cuisine,
    sortBy
  } = req.query;

  let results = [...DISHES];

  // Search query (name, cuisine, ingredients, tags, description)
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    results = results.filter(dish =>
      dish.name.toLowerCase().includes(q) ||
      dish.cuisine.toLowerCase().includes(q) ||
      dish.category.toLowerCase().includes(q) ||
      dish.description.toLowerCase().includes(q) ||
      dish.tags.some(t => t.toLowerCase().includes(q)) ||
      dish.ingredients.some(ing => ing.toLowerCase().includes(q))
    );
  }

  // Category filter
  if (category && category !== 'all') {
    results = results.filter(dish => {
      const catLower = dish.category.toLowerCase();
      const tags = dish.tags.map(t => t.toLowerCase());
      if (category === 'pasta') return catLower.includes('pasta') || catLower.includes('pizza') || tags.includes('pasta') || tags.includes('pizza');
      if (category === 'burgers') return catLower.includes('burger') || catLower.includes('sandwiches') || tags.includes('burger');
      if (category === 'soups') return catLower.includes('soup') || catLower.includes('noodles') || tags.includes('ramen') || tags.includes('soup') || tags.includes('pho');
      if (category === 'curries') return catLower.includes('curries') || catLower.includes('rice') || tags.includes('curry') || tags.includes('biryani');
      if (category === 'tacos') return catLower.includes('tacos') || catLower.includes('street') || tags.includes('tacos') || tags.includes('wings');
      if (category === 'bowls') return catLower.includes('bowl') || catLower.includes('healthy') || tags.includes('bowl') || tags.includes('salad');
      if (category === 'desserts') return catLower.includes('dessert') || catLower.includes('sweet') || tags.includes('dessert') || tags.includes('cheesecake') || tags.includes('cake');
      return true;
    });
  }

  // Mood filter
  if (mood && mood !== 'all') {
    results = results.filter(dish => dish.moods.includes(mood));
  }

  // Meal Type filter
  if (mealType && mealType !== 'all') {
    results = results.filter(dish => dish.mealTypes.includes(mealType));
  }

  // Diet filter
  if (diet && diet !== 'all') {
    results = results.filter(dish => dish.diet.includes(diet));
  }

  // Cuisine filter
  if (cuisine && cuisine !== 'all') {
    results = results.filter(dish => dish.cuisine.toLowerCase().includes(cuisine.toLowerCase()));
  }

  // Max Time filter
  if (maxTime && !isNaN(Number(maxTime))) {
    results = results.filter(dish => dish.prepTime <= Number(maxTime));
  }

  // Max Calories filter
  if (maxCalories && !isNaN(Number(maxCalories))) {
    results = results.filter(dish => dish.calories <= Number(maxCalories));
  }

  // Spice Level filter
  if (spiceLevel !== undefined && spiceLevel !== 'all' && !isNaN(Number(spiceLevel))) {
    results = results.filter(dish => dish.spiceLevel <= Number(spiceLevel));
  }

  // Sorting
  if (sortBy === 'rating') {
    results.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'time-asc') {
    results.sort((a, b) => a.prepTime - b.prepTime);
  } else if (sortBy === 'calories-asc') {
    results.sort((a, b) => a.calories - b.calories);
  } else if (sortBy === 'calories-desc') {
    results.sort((a, b) => b.calories - a.calories);
  } else if (sortBy === 'name') {
    results.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Default smart sort: highest rating
    results.sort((a, b) => b.rating - a.rating);
  }

  res.json({
    total: results.length,
    dishes: results
  });
});

// API: Surprise Me / Random Dish
app.get('/api/dishes/random', (req, res) => {
  const { diet, mood } = req.query;
  let pool = [...DISHES];

  if (diet && diet !== 'all') {
    pool = pool.filter(d => d.diet.includes(diet));
  }
  if (mood && mood !== 'all') {
    pool = pool.filter(d => d.moods.includes(mood));
  }

  if (pool.length === 0) {
    pool = DISHES;
  }

  const randomDish = pool[Math.floor(Math.random() * pool.length)];
  res.json(randomDish);
});

// API: Single Dish Details
app.get('/api/dishes/:id', (req, res) => {
  const dish = DISHES.find(d => d.id === req.params.id);
  if (!dish) {
    return res.status(404).json({ error: 'Dish not found' });
  }

  // Related dishes from same cuisine or mood
  const related = DISHES
    .filter(d => d.id !== dish.id && (d.cuisine === dish.cuisine || d.moods.some(m => dish.moods.includes(m))))
    .slice(0, 3);

  res.json({
    dish,
    related
  });
});

// API: Smart AI Food Suggestion Engine
app.post('/api/suggest', (req, res) => {
  const {
    mood,
    mealType,
    diet,
    maxTime,
    cravingText = '',
    fridgeIngredients = []
  } = req.body;

  const cravingKeywords = cravingText
    .toLowerCase()
    .split(/[\s,]+/)
    .map(w => w.trim())
    .filter(w => w.length > 2);

  const fridgeClean = (Array.isArray(fridgeIngredients) ? fridgeIngredients : [])
    .map(i => i.trim().toLowerCase())
    .filter(Boolean);

  const scoredDishes = DISHES.map(dish => {
    let score = 50; // base score
    const matchReasons = [];

    // Diet match (critical)
    if (diet && diet !== 'all') {
      if (dish.diet.includes(diet)) {
        score += 30;
        matchReasons.push(`Matches your ${diet.replace('-', ' ')} diet preference`);
      } else {
        score -= 40; // penalized if not matching diet
      }
    }

    // Mood match
    if (mood && mood !== 'all') {
      if (dish.moods.includes(mood)) {
        score += 35;
        matchReasons.push(`Fits your ${mood.replace('-', ' ')} mood perfectly`);
      }
    }

    // Meal type
    if (mealType && mealType !== 'all') {
      if (dish.mealTypes.includes(mealType)) {
        score += 15;
        matchReasons.push(`Ideal for ${mealType}`);
      }
    }

    // Prep time
    if (maxTime && !isNaN(Number(maxTime))) {
      if (dish.prepTime <= Number(maxTime)) {
        score += 15;
        matchReasons.push(`Quick prep (${dish.prepTime} mins)`);
      } else {
        score -= 15;
      }
    }

    // Fridge ingredients match
    if (fridgeClean.length > 0) {
      let matchedIngredients = [];
      dish.ingredients.forEach(ing => {
        const ingLower = ing.toLowerCase();
        fridgeClean.forEach(userIng => {
          if (ingLower.includes(userIng)) {
            matchedIngredients.push(userIng);
          }
        });
      });

      matchedIngredients = [...new Set(matchedIngredients)];
      if (matchedIngredients.length > 0) {
        score += matchedIngredients.length * 15;
        matchReasons.push(`Uses ingredients from your fridge: ${matchedIngredients.join(', ')}`);
      }
    }

    // Free text craving match
    if (cravingKeywords.length > 0) {
      let textMatches = 0;
      const haystack = `${dish.name} ${dish.cuisine} ${dish.description} ${dish.tags.join(' ')}`.toLowerCase();
      cravingKeywords.forEach(kw => {
        if (haystack.includes(kw)) {
          textMatches++;
        }
      });
      if (textMatches > 0) {
        score += textMatches * 18;
        matchReasons.push(`Hits your taste cravings directly`);
      }
    }

    // Normalize match percentage (max 99%, min 45%)
    const matchPercentage = Math.min(99, Math.max(45, Math.round((score / 150) * 100)));

    return {
      ...dish,
      matchPercentage,
      matchReasons: matchReasons.length > 0 ? matchReasons : ['Highly recommended based on current culinary trend and top ratings']
    };
  });

  // Sort by match percentage and rating
  scoredDishes.sort((a, b) => b.matchPercentage - a.matchPercentage || b.rating - a.rating);

  res.json({
    promptSummary: {
      mood: mood || 'Any',
      mealType: mealType || 'Any',
      diet: diet || 'Any',
      craving: cravingText || 'None specified'
    },
    topPicks: scoredDishes.slice(0, 6)
  });
});

// Fallback to index.html for SPA feel
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🍽️ NibbleNest Food Suggestion Server is running at http://localhost:${PORT}`);
});
