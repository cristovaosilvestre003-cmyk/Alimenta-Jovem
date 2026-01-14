import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Auth Context
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/api/auth/me`, {
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

// Main App Component
function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

function MainApp() {
  const { user, token, loading } = useAuth();
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
      {/* Ad Banner - Free Version */}
      {!user?.is_premium && (
        <div className="ad-banner">
          <span>📢 Publicidade</span>
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
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Início</span>
        </button>
        <button 
          className={currentView === 'scanner' ? 'active' : ''}
          onClick={() => setCurrentView('scanner')}
        >
          <span className="nav-icon">📷</span>
          <span className="nav-label">Scanner</span>
        </button>
        <button 
          className={currentView === 'tips' ? 'active' : ''}
          onClick={() => setCurrentView('tips')}
        >
          <span className="nav-icon">💡</span>
          <span className="nav-label">Dicas</span>
        </button>
        <button 
          className={currentView === 'profile' ? 'active' : ''}
          onClick={() => setCurrentView('profile')}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Perfil</span>
        </button>
      </nav>
    </div>
  );
}

// Auth Screen
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
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
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

// Home Screen
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
        axios.get(`${API_URL}/api/meals`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/water-log`, {
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
        `${API_URL}/api/water-log`,
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
          <h1>Olá, {user?.name}! 👋</h1>
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
            <span className="streak-icon">🔥</span>
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
          <span>💧 Água hoje</span>
          <button className="btn-secondary-small" onClick={logWater}>
            + Copo
          </button>
        </div>
        <div className="water-glasses">
          {[...Array(waterLog.target)].map((_, i) => (
            <span 
              key={i} 
              className={`water-glass ${i < waterLog.glasses_count ? 'filled' : ''}`}
            >
              💧
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
                  + Adicionar
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

// Add Meal Modal
function AddMealModal({ mealType, onClose, onSuccess }) {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [foodDatabase, setFoodDatabase] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFoodDatabase();
  }, []);

  const loadFoodDatabase = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/food-database`);
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

  const handleAddMeal = async (food) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/meals`,
        {
          meal_type: mealType,
          food_name: food.name,
          calories: food.calories,
          carbs: food.carbs,
          protein: food.protein,
          fat: food.fat,
          portion_size: food.portion
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Adicionar Alimento</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <input
          type="text"
          placeholder="Buscar alimento..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="food-list">
          {filteredFoods.map((food, index) => (
            <div key={index} className="food-item" onClick={() => handleAddMeal(food)}>
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
      </div>
    </div>
  );
}

// Scanner Screen
function ScannerScreen() {
  const { token } = useAuth();
  const [mode, setMode] = useState('camera'); // 'camera', 'upload', 'barcode'
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
        `${API_URL}/api/analyze-food`,
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
          `${API_URL}/api/meals`,
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
          📷 Câmera
        </button>
        <button 
          className={mode === 'upload' ? 'active' : ''}
          onClick={() => setMode('upload')}
        >
          🖼️ Upload
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
              {analyzing ? 'Analisando...' : '📸 Capturar'}
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

// Tips Screen
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
        axios.get(`${API_URL}/api/tips`),
        axios.get(`${API_URL}/api/goals`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/badges`, {
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

  const completeGoal = async (goalId) => {
    try {
      await axios.put(
        `${API_URL}/api/goals/${goalId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadTipsAndGoals();
    } catch (error) {
      console.error('Error completing goal:', error);
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
          💡 Dicas
        </button>
        <button 
          className={activeTab === 'badges' ? 'active' : ''}
          onClick={() => setActiveTab('badges')}
        >
          🏆 Conquistas
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
            <span className="streak-icon-large">🔥</span>
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

// Profile Screen
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
          <span className="avatar-icon">👤</span>
        </div>
        <h2 className="profile-name">{user?.name}</h2>
        <p className="profile-email">{user?.email}</p>
      </div>

      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-icon">🔥</span>
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

// Premium Screen (Mock)
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