import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import axios from 'axios';
import './App.css';
import { StatisticsScreen, MealPlansScreen, BarcodeSearchModal, NotificationsSettings } from './AdvancedComponents';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Auth Context
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Theme Context
const ThemeContext = createContext(null);

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => useContext(ThemeContext);

// SVG Icons
const Icons = {
  Home: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Camera: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Lightbulb: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18h6M10 22h4M15 7a5 5 0 1 0-6 4.9V14a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2.1A5 5 0 0 0 15 7z"/>
    </svg>
  ),
  User: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Sun: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Droplet: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  Flame: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  X: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Chart: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

// Main App Component
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}

function MainApp() {
  const { user, token, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState('home');

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!token) {
    return <AuthScreen />;
  }

  return (
    <div className="app-container">
      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={toggleTheme} title="Alternar tema">
        {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
      </button>

      {/* Ad Banner - Free Version */}
      {!user?.is_premium && (
        <div className="ad-banner">
          <span>Publicidade</span>
          <button className="upgrade-btn" onClick={() => setCurrentView('premium')}>
            Remover Anúncios
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {currentView === 'home' && <HomeScreen />}
        {currentView === 'scanner' && <ScannerScreen />}
        {currentView === 'tips' && <TipsScreen />}
        {currentView === 'profile' && <ProfileScreen />}
        {currentView === 'premium' && <PremiumScreen />}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={currentView === 'home' ? 'active' : ''}
          onClick={() => setCurrentView('home')}
        >
          <Icons.Home />
          <span className="nav-label">Início</span>
        </button>
        <button 
          className={currentView === 'scanner' ? 'active' : ''}
          onClick={() => setCurrentView('scanner')}
        >
          <Icons.Camera />
          <span className="nav-label">Scanner</span>
        </button>
        <button 
          className={currentView === 'tips' ? 'active' : ''}
          onClick={() => setCurrentView('tips')}
        >
          <Icons.Lightbulb />
          <span className="nav-label">Dicas</span>
        </button>
        <button 
          className={currentView === 'profile' ? 'active' : ''}
          onClick={() => setCurrentView('profile')}
        >
          <Icons.User />
          <span className="nav-label">Perfil</span>
        </button>
      </nav>
    </div>
  );
}

// Auth Screen (unchanged)
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    activity_level: 'moderate',
    goal: 'healthy_eating'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await axios.post(`${API_URL}${endpoint}`, formData);
      login(response.data.access_token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="brand-title">Alimenta Jovem</h1>
          <p className="brand-subtitle">Sua jornada para uma alimentação saudável</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(true)}
          >
            Entrar
          </button>
          <button 
            className={!isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(false)}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input
              type="text"
              placeholder="Nome"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <input
            type="password"
            placeholder="Senha"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />

          {!isLogin && (
            <>
              <div className="form-row">
                <input
                  type="number"
                  placeholder="Idade"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                />
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
              </div>

              <div className="form-row">
                <input
                  type="number"
                  placeholder="Peso (kg)"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Altura (cm)"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: e.target.value})}
                />
              </div>

              <select
                value={formData.activity_level}
                onChange={(e) => setFormData({...formData, activity_level: e.target.value})}
              >
                <option value="sedentary">Sedentário</option>
                <option value="light">Levemente Ativo</option>
                <option value="moderate">Moderadamente Ativo</option>
                <option value="active">Muito Ativo</option>
                <option value="very_active">Extremamente Ativo</option>
              </select>

              <select
                value={formData.goal}
                onChange={(e) => setFormData({...formData, goal: e.target.value})}
              >
                <option value="healthy_eating">Alimentação Saudável</option>
                <option value="lose_weight">Perder Peso</option>
                <option value="gain_weight">Ganhar Peso</option>
                <option value="save_money">Economizar</option>
              </select>
            </>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>
      </div>
    </div>
  );
}

// Home Screen with quantity selector
function HomeScreen() {
  const { user, token } = useAuth();
  const [meals, setMeals] = useState([]);
  const [totals, setTotals] = useState({ calories: 0, carbs: 0, protein: 0, fat: 0 });
  const [dailyTarget, setDailyTarget] = useState(2000);
  const [waterLog, setWaterLog] = useState({ glasses_count: 0, target: 8 });
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [mealType, setMealType] = useState('breakfast');

  useEffect(() => {
    loadDailyData();
  }, []);

  const loadDailyData = async () => {
    try {
      const [mealsRes, waterRes] = await Promise.all([
        axios.get(`${API_URL}/meals`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/water-log`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setMeals(mealsRes.data.meals);
      setTotals(mealsRes.data.totals);
      setDailyTarget(mealsRes.data.daily_target);
      setWaterLog(waterRes.data);
    } catch (error) {
      console.error('Error loading daily data:', error);
    }
  };

  const logWater = async () => {
    try {
      await axios.post(
        `${API_URL}/water-log`,
        { glasses: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadDailyData();
    } catch (error) {
      console.error('Error logging water:', error);
    }
  };

  const getMealsByType = (type) => {
    return meals.filter(meal => meal.meal_type === type);
  };

  const caloriesPercent = (totals.calories / dailyTarget) * 100;

  return (
    <div className="home-screen">
      <header className="screen-header">
        <div>
          <h1>Olá, {user?.name}!</h1>
          <p>O que você vai comer hoje?</p>
        </div>
      </header>

      {/* Daily Progress */}
      <div className="card progress-card">
        <div className="progress-header">
          <div>
            <h3>Progresso Diário</h3>
            <p className="calories-count">
              {Math.round(totals.calories)} / {Math.round(dailyTarget)} kcal
            </p>
          </div>
          <div className="streak-badge">
            <Icons.Flame />
            <span className="streak-count">{user?.streak_count || 0}</span>
          </div>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${Math.min(caloriesPercent, 100)}%` }}
          ></div>
        </div>
        <div className="macros-grid">
          <div className="macro-item">
            <span className="macro-label">Carbs</span>
            <span className="macro-value">{Math.round(totals.carbs)}g</span>
          </div>
          <div className="macro-item">
            <span className="macro-label">Proteína</span>
            <span className="macro-value">{Math.round(totals.protein)}g</span>
          </div>
          <div className="macro-item">
            <span className="macro-label">Gordura</span>
            <span className="macro-value">{Math.round(totals.fat)}g</span>
          </div>
        </div>
      </div>

      {/* Water Tracker */}
      <div className="card water-card">
        <div className="water-header">
          <span className="water-title">
            <Icons.Droplet />
            Água hoje
          </span>
          <button className="btn-secondary-small" onClick={logWater}>
            <Icons.Plus /> Copo
          </button>
        </div>
        <div className="water-glasses">
          {[...Array(waterLog.target)].map((_, i) => (
            <span 
              key={i} 
              className={`water-glass ${i < waterLog.glasses_count ? 'filled' : ''}`}
            >
              <Icons.Droplet />
            </span>
          ))}
        </div>
      </div>

      {/* Meals */}
      <div className="meals-section">
        <h2>Refeições de Hoje</h2>
        
        {['breakfast', 'lunch', 'dinner', 'snack'].map(type => {
          const typeMeals = getMealsByType(type);
          const typeLabels = {
            breakfast: 'Café da Manhã',
            lunch: 'Almoço',
            dinner: 'Jantar',
            snack: 'Lanche'
          };

          return (
            <div key={type} className="meal-card">
              <div className="meal-header">
                <h3>{typeLabels[type]}</h3>
                <button 
                  className="btn-add"
                  onClick={() => {
                    setMealType(type);
                    setShowAddMeal(true);
                  }}
                >
                  <Icons.Plus /> Adicionar
                </button>
              </div>
              {typeMeals.length > 0 ? (
                <div className="meal-items">
                  {typeMeals.map(meal => (
                    <div key={meal.meal_id} className="meal-item">
                      <div className="meal-info">
                        <span className="meal-name">{meal.food_name}</span>
                        <span className="meal-portion">{meal.portion_size}</span>
                      </div>
                      <span className="meal-calories">{Math.round(meal.calories)} kcal</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-meal">Nenhuma refeição registrada</p>
              )}
            </div>
          );
        })}
      </div>

      {showAddMeal && (
        <AddMealModal 
          mealType={mealType}
          onClose={() => setShowAddMeal(false)}
          onSuccess={() => {
            setShowAddMeal(false);
            loadDailyData();
          }}
        />
      )}
    </div>
  );
}

// Add Meal Modal with Quantity Selector
function AddMealModal({ mealType, onClose, onSuccess }) {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [foodDatabase, setFoodDatabase] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFoodDatabase();
  }, [selectedCategory]);

  const loadFoodDatabase = async () => {
    try {
      const params = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      const response = await axios.get(`${API_URL}/food-database`, { params });
      setFoodDatabase(response.data.foods);
    } catch (error) {
      console.error('Error loading food database:', error);
    }
  };

  const filteredFoods = searchTerm
    ? foodDatabase.filter(food => 
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : foodDatabase;

  const handleSelectFood = (food) => {
    setSelectedFood(food);
  };

  const calculateNutrition = (food, qty) => {
    const multiplier = qty / 100;
    return {
      calories: food.calories * multiplier,
      carbs: food.carbs * multiplier,
      protein: food.protein * multiplier,
      fat: food.fat * multiplier
    };
  };

  const handleAddMeal = async () => {
    if (!selectedFood) return;
    
    setLoading(true);
    try {
      const nutrition = calculateNutrition(selectedFood, quantity);
      await axios.post(
        `${API_URL}/meals`,
        {
          meal_type: mealType,
          food_name: selectedFood.name,
          calories: nutrition.calories,
          carbs: nutrition.carbs,
          protein: nutrition.protein,
          fat: nutrition.fat,
          portion_size: `${quantity}g`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Erro ao adicionar refeição');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'Todos' },
    { value: 'carboidratos', label: 'Carboidratos' },
    { value: 'proteinas', label: 'Proteínas' },
    { value: 'frutas', label: 'Frutas' },
    { value: 'laticinios', label: 'Laticínios' },
    { value: 'bebidas', label: 'Bebidas' },
    { value: 'merendas', label: 'Merendas' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Adicionar Alimento</h2>
          <button className="btn-close" onClick={onClose}><Icons.X /></button>
        </div>

        {!selectedFood ? (
          <>
            <div className="search-container">
              <Icons.Search />
              <input
                type="text"
                placeholder="Buscar alimento..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="category-filter">
              {categories.map(cat => (
                <button
                  key={cat.value}
                  className={`category-btn ${selectedCategory === cat.value ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="food-list">
              {filteredFoods.map((food, index) => (
                <div key={index} className="food-item" onClick={() => handleSelectFood(food)}>
                  <div className="food-info">
                    <span className="food-name">{food.name}</span>
                    <span className="food-portion">{food.portion}</span>
                  </div>
                  <div className="food-nutrition">
                    <span className="food-calories">{food.calories} kcal</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="quantity-selector">
            <div className="selected-food-info">
              <h3>{selectedFood.name}</h3>
              <p className="food-base-info">{selectedFood.portion} = {selectedFood.calories} kcal</p>
            </div>

            <div className="quantity-control">
              <label>Quantidade (gramas):</label>
              <div className="quantity-input-group">
                <button 
                  className="quantity-btn"
                  onClick={() => setQuantity(Math.max(10, quantity - 10))}
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(10, parseInt(e.target.value) || 10))}
                  min="10"
                  max="1000"
                />
                <button 
                  className="quantity-btn"
                  onClick={() => setQuantity(Math.min(1000, quantity + 10))}
                >
                  +
                </button>
              </div>
              <div className="quantity-presets">
                {[50, 100, 150, 200, 300].map(preset => (
                  <button
                    key={preset}
                    className="preset-btn"
                    onClick={() => setQuantity(preset)}
                  >
                    {preset}g
                  </button>
                ))}
              </div>
            </div>

            <div className="nutrition-preview">
              <h4>Valores Nutricionais ({quantity}g):</h4>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="nutrition-label">Calorias:</span>
                  <span className="nutrition-value">{Math.round(calculateNutrition(selectedFood, quantity).calories)} kcal</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Carboidratos:</span>
                  <span className="nutrition-value">{Math.round(calculateNutrition(selectedFood, quantity).carbs)}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Proteínas:</span>
                  <span className="nutrition-value">{Math.round(calculateNutrition(selectedFood, quantity).protein)}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Gorduras:</span>
                  <span className="nutrition-value">{Math.round(calculateNutrition(selectedFood, quantity).fat)}g</span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelectedFood(null)}>
                Voltar
              </button>
              <button className="btn-primary" onClick={handleAddMeal} disabled={loading}>
                {loading ? 'Adicionando...' : 'Adicionar Refeição'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Scanner Screen (unchanged core functionality)
function ScannerScreen() {
  const { token } = useAuth();
  const [mode, setMode] = useState('camera');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Não foi possível acessar a câmera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
    analyzeFood(imageBase64);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageBase64 = event.target.result.split(',')[1];
      analyzeFood(imageBase64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFood = async (imageBase64) => {
    setAnalyzing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image_base64', imageBase64);

      const response = await axios.post(
        `${API_URL}/analyze-food`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      if (response.data.success) {
        setResult(response.data.analysis);
      } else {
        alert('Erro ao analisar imagem. Tente novamente.');
      }
    } catch (error) {
      console.error('Error analyzing food:', error);
      alert('Erro ao analisar alimento. Verifique sua conexão.');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeals = async () => {
    if (!result || !result.foods) return;

    try {
      for (const food of result.foods) {
        await axios.post(
          `${API_URL}/meals`,
          {
            meal_type: result.meal_type_suggestion || 'snack',
            food_name: food.name,
            calories: food.calories,
            carbs: food.carbs,
            protein: food.protein,
            fat: food.fat,
            portion_size: food.portion_size
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      alert('Refeições salvas com sucesso!');
      setResult(null);
    } catch (error) {
      console.error('Error saving meals:', error);
      alert('Erro ao salvar refeições');
    }
  };

  return (
    <div className="scanner-screen">
      <header className="screen-header">
        <h1>Scanner de Alimentos</h1>
        <p>Tire foto ou faça upload</p>
      </header>

      <div className="scanner-modes">
        <button 
          className={mode === 'camera' ? 'active' : ''}
          onClick={() => setMode('camera')}
        >
          <Icons.Camera /> Câmera
        </button>
        <button 
          className={mode === 'upload' ? 'active' : ''}
          onClick={() => setMode('upload')}
        >
          Upload
        </button>
      </div>

      <div className="scanner-container">
        {mode === 'camera' && (
          <>
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              className="camera-video"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <button 
              className="btn-capture"
              onClick={capturePhoto}
              disabled={analyzing}
            >
              {analyzing ? 'Analisando...' : 'Capturar'}
            </button>
          </>
        )}

        {mode === 'upload' && (
          <div className="upload-area">
            <label htmlFor="file-upload" className="upload-label">
              <div className="upload-icon">📁</div>
              <p>Clique para selecionar uma imagem</p>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}

        {analyzing && (
          <div className="analyzing-overlay">
            <div className="loading-spinner"></div>
            <p>Analisando alimento...</p>
          </div>
        )}

        {result && (
          <div className="result-card">
            <h2>Resultado da Análise</h2>
            
            <div className="result-totals">
              <div className="result-total-item">
                <span className="result-label">Calorias Totais</span>
                <span className="result-value">{Math.round(result.total_calories)} kcal</span>
              </div>
            </div>

            <div className="result-macros">
              <div className="result-macro">
                <span className="macro-label">Carboidratos</span>
                <span className="macro-value">{Math.round(result.total_carbs)}g</span>
              </div>
              <div className="result-macro">
                <span className="macro-label">Proteínas</span>
                <span className="macro-value">{Math.round(result.total_protein)}g</span>
              </div>
              <div className="result-macro">
                <span className="macro-label">Gorduras</span>
                <span className="macro-value">{Math.round(result.total_fat)}g</span>
              </div>
            </div>

            <h3>Alimentos Identificados:</h3>
            <div className="result-foods">
              {result.foods.map((food, index) => (
                <div key={index} className="result-food-item">
                  <div className="food-name">{food.name}</div>
                  <div className="food-details">
                    <span>{food.portion_size}</span>
                    <span>{Math.round(food.calories)} kcal</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="result-actions">
              <button className="btn-primary" onClick={saveMeals}>
                Salvar Refeições
              </button>
              <button className="btn-secondary" onClick={() => setResult(null)}>
                Nova Análise
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Tips and Badges Screen (unchanged)
function TipsScreen() {
  const { token, user } = useAuth();
  const [tips, setTips] = useState([]);
  const [goals, setGoals] = useState([]);
  const [badges, setBadges] = useState([]);
  const [activeTab, setActiveTab] = useState('tips');

  useEffect(() => {
    loadTipsAndGoals();
  }, []);

  const loadTipsAndGoals = async () => {
    try {
      const [tipsRes, goalsRes, badgesRes] = await Promise.all([
        axios.get(`${API_URL}/tips`),
        axios.get(`${API_URL}/goals`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/badges`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setTips(tipsRes.data.tips);
      setGoals(goalsRes.data.goals);
      setBadges(badgesRes.data.badges);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  return (
    <div className="tips-screen">
      <header className="screen-header">
        <h1>Dicas & Metas</h1>
        <p>Aprenda e conquiste!</p>
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'tips' ? 'active' : ''}
          onClick={() => setActiveTab('tips')}
        >
          Dicas
        </button>
        <button 
          className={activeTab === 'badges' ? 'active' : ''}
          onClick={() => setActiveTab('badges')}
        >
          Conquistas
        </button>
      </div>

      {activeTab === 'tips' && (
        <div className="tips-list">
          {tips.map(tip => (
            <div key={tip.id} className="tip-card">
              <div className="tip-icon">{tip.icon}</div>
              <div className="tip-content">
                <div className="tip-category">{tip.category}</div>
                <h3 className="tip-title">{tip.title}</h3>
                <p className="tip-description">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'badges' && (
        <>
          <div className="streak-display">
            <Icons.Flame />
            <div className="streak-info">
              <h2>{user?.streak_count || 0} dias</h2>
              <p>Sequência atual</p>
            </div>
          </div>

          <div className="badges-grid">
            {badges.map(badge => (
              <div 
                key={badge.id} 
                className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}
              >
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-name">{badge.name}</div>
                <div className="badge-description">{badge.description}</div>
                {badge.earned && <div className="badge-earned-mark">✓</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Profile Screen with theme toggle (unchanged)
function ProfileScreen() {
  const { user, logout } = useAuth();

  const goalLabels = {
    healthy_eating: 'Alimentação Saudável',
    lose_weight: 'Perder Peso',
    gain_weight: 'Ganhar Peso',
    save_money: 'Economizar'
  };

  const activityLabels = {
    sedentary: 'Sedentário',
    light: 'Levemente Ativo',
    moderate: 'Moderadamente Ativo',
    active: 'Muito Ativo',
    very_active: 'Extremamente Ativo'
  };

  return (
    <div className="profile-screen">
      <header className="screen-header">
        <h1>Meu Perfil</h1>
      </header>

      <div className="profile-card">
        <div className="profile-avatar">
          <Icons.User />
        </div>
        <h2 className="profile-name">{user?.name}</h2>
        <p className="profile-email">{user?.email}</p>
      </div>

      <div className="profile-stats">
        <div className="stat-item">
          <Icons.Flame />
          <div className="stat-info">
            <span className="stat-value">{user?.streak_count || 0}</span>
            <span className="stat-label">dias de sequência</span>
          </div>
        </div>
        <div className="stat-item">
          <span className="stat-icon">🏆</span>
          <div className="stat-info">
            <span className="stat-value">{user?.badges?.length || 0}</span>
            <span className="stat-label">conquistas</span>
          </div>
        </div>
      </div>

      <div className="profile-info-card">
        <h3>Informações</h3>
        <div className="info-row">
          <span className="info-label">Idade:</span>
          <span className="info-value">{user?.age || '-'} anos</span>
        </div>
        <div className="info-row">
          <span className="info-label">Peso:</span>
          <span className="info-value">{user?.weight || '-'} kg</span>
        </div>
        <div className="info-row">
          <span className="info-label">Altura:</span>
          <span className="info-value">{user?.height || '-'} cm</span>
        </div>
        <div className="info-row">
          <span className="info-label">Nível de Atividade:</span>
          <span className="info-value">{activityLabels[user?.activity_level] || '-'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Objetivo:</span>
          <span className="info-value">{goalLabels[user?.goal] || '-'}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Meta Diária:</span>
          <span className="info-value">{Math.round(user?.daily_calories_target || 0)} kcal</span>
        </div>
      </div>

      <button className="btn-logout" onClick={logout}>
        Sair da Conta
      </button>
    </div>
  );
}

// Premium Screen (unchanged)
function PremiumScreen() {
  return (
    <div className="premium-screen">
      <div className="premium-header">
        <h1>⭐ Versão Premium</h1>
        <p>Aproveite todos os recursos sem anúncios!</p>
      </div>

      <div className="premium-features">
        <div className="feature-item">
          <span className="feature-icon">🚫</span>
          <div className="feature-text">
            <h3>Sem Anúncios</h3>
            <p>Experiência completamente limpa</p>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📊</span>
          <div className="feature-text">
            <h3>Relatórios Avançados</h3>
            <p>Análises detalhadas da sua alimentação</p>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🎯</span>
          <div className="feature-text">
            <h3>Metas Personalizadas</h3>
            <p>Crie metas ilimitadas</p>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📱</span>
          <div className="feature-text">
            <h3>Suporte Prioritário</h3>
            <p>Atendimento exclusivo</p>
          </div>
        </div>
      </div>

      <div className="premium-price">
        <h2>R$ 9,90 / mês</h2>
        <p>Cancele quando quiser</p>
      </div>

      <button className="btn-primary">
        Assinar Agora (Em Breve)
      </button>

      <p className="premium-note">
        * Esta é uma simulação. A integração de pagamentos será implementada em breve.
      </p>
    </div>
  );
}

export default App;