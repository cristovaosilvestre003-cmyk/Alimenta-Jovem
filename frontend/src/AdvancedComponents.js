// Advanced Components for Alimenta Jovem
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Statistics Screen with Charts
export function StatisticsScreen({ token }) {
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const [weeklyRes, monthlyRes] = await Promise.all([
        axios.get(`${API_URL}/api/statistics/weekly`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/statistics/monthly`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setWeeklyData(weeklyRes.data.weekly_data);
      setMonthlyData(monthlyRes.data.monthly_data);
      setStats({
        weekly: weeklyRes.data,
        monthly: monthlyRes.data
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading statistics:', error);
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    const element = document.getElementById('statistics-content');
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('relatorio-alimenta-jovem.pdf');
  };

  if (loading) {
    return <div className="loading-spinner"></div>;
  }

  return (
    <div className="statistics-screen">
      <header className="screen-header">
        <h1>Estatísticas</h1>
        <button className="btn-secondary-small" onClick={exportPDF}>
          Exportar PDF
        </button>
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'weekly' ? 'active' : ''}
          onClick={() => setActiveTab('weekly')}
        >
          Semanal
        </button>
        <button 
          className={activeTab === 'monthly' ? 'active' : ''}
          onClick={() => setActiveTab('monthly')}
        >
          Mensal
        </button>
      </div>

      <div id="statistics-content" className="statistics-content">
        {activeTab === 'weekly' && (
          <>
            <div className="stats-summary">
              <div className="stat-card">
                <span className="stat-label">Média Diária</span>
                <span className="stat-value">{Math.round(stats.weekly.avg_calories)} kcal</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Meta</span>
                <span className="stat-value">{Math.round(stats.weekly.target_calories)} kcal</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Semanal</span>
                <span className="stat-value">{Math.round(stats.weekly.total_calories)} kcal</span>
              </div>
            </div>

            <div className="chart-container">
              <h3>Calorias por Dia</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="calories" stroke="#4CAF50" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3>Macronutrientes</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="carbs" fill="#FF9800" name="Carboidratos" />
                  <Bar dataKey="protein" fill="#4CAF50" name="Proteínas" />
                  <Bar dataKey="fat" fill="#F44336" name="Gorduras" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === 'monthly' && (
          <>
            <div className="stats-summary">
              <div className="stat-card">
                <span className="stat-label">Total de Refeições</span>
                <span className="stat-value">{stats.monthly.total_meals}</span>
              </div>
            </div>

            <div className="chart-container">
              <h3>Calorias por Semana</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="calories" fill="#4CAF50" name="Calorias" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Meal Plans Screen
export function MealPlansScreen({ token, user }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadMealPlans();
  }, []);

  const loadMealPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/meal-plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Error loading meal plans:', error);
    }
  };

  const generateNewPlan = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/meal-plans/generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSelectedPlan(response.data.plan);
      loadMealPlans();
    } catch (error) {
      console.error('Error generating plan:', error);
      alert('Erro ao gerar plano de refeições');
    } finally {
      setGenerating(false);
    }
  };

  const sharePlan = async () => {
    if (!selectedPlan) return;

    const shareText = `Confira meu plano de refeições semanal no Alimenta Jovem!\n\nMeta: ${Math.round(selectedPlan.target_calories)} kcal/dia`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Plano de Refeições',
          text: shareText
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Texto copiado para área de transferência!');
    }
  };

  return (
    <div className="meal-plans-screen">
      <header className="screen-header">
        <h1>Planos de Refeição</h1>
        <p>Organize sua semana alimentar</p>
      </header>

      {!selectedPlan ? (
        <div className="plans-list">
          <button 
            className="btn-primary generate-btn"
            onClick={generateNewPlan}
            disabled={generating}
          >
            {generating ? 'Gerando...' : '🎯 Gerar Plano Semanal'}
          </button>

          <div className="saved-plans">
            <h3>Planos Salvos</h3>
            {plans.length > 0 ? (
              plans.map(plan => (
                <div key={plan.plan_id} className="plan-card" onClick={() => setSelectedPlan(plan)}>
                  <h4>{plan.name}</h4>
                  <p>Meta: {Math.round(plan.target_calories)} kcal/dia</p>
                  <span className="plan-date">
                    {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-state">Nenhum plano salvo ainda</p>
            )}
          </div>
        </div>
      ) : (
        <div className="plan-details">
          <div className="plan-header">
            <button className="btn-back" onClick={() => setSelectedPlan(null)}>
              ← Voltar
            </button>
            <button className="btn-secondary-small" onClick={sharePlan}>
              Compartilhar
            </button>
          </div>

          <h2>{selectedPlan.name}</h2>
          <p className="plan-target">Meta: {Math.round(selectedPlan.target_calories)} kcal/dia</p>

          <div className="days-list">
            {selectedPlan.days.map(day => (
              <div key={day.day} className="day-card">
                <h3>{day.day_label}</h3>
                
                {Object.entries(day.meals).map(([mealType, foods]) => {
                  const mealLabels = {
                    breakfast: 'Café da Manhã',
                    lunch: 'Almoço',
                    dinner: 'Jantar',
                    snack: 'Lanche'
                  };

                  return (
                    <div key={mealType} className="meal-section">
                      <h4>{mealLabels[mealType]}</h4>
                      <ul>
                        {foods.map((food, idx) => (
                          <li key={idx}>
                            {food.name} - {food.calories} kcal
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Barcode Scanner with Open Food Facts
export function BarcodeSearchModal({ onClose, onSelectProduct, token }) {
  const [barcode, setBarcode] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);

  const searchBarcode = async () => {
    if (!barcode || barcode.length < 8) {
      alert('Digite um código de barras válido (mínimo 8 dígitos)');
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/barcode/search/${barcode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setResult(response.data.product);
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error('Error searching barcode:', error);
      alert('Erro ao buscar produto');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content barcode-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Buscar por Código de Barras</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="barcode-search">
          <input
            type="text"
            placeholder="Digite o código de barras"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="barcode-input"
          />
          <button 
            className="btn-primary"
            onClick={searchBarcode}
            disabled={searching}
          >
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {result && (
          <div className="barcode-result">
            {result.image_url && (
              <img src={result.image_url} alt={result.name} className="product-image" />
            )}
            <h3>{result.name}</h3>
            {result.brand && <p className="product-brand">{result.brand}</p>}
            
            <div className="nutrition-info">
              <div className="nutrition-row">
                <span>Calorias:</span>
                <span>{result.calories} kcal</span>
              </div>
              <div className="nutrition-row">
                <span>Carboidratos:</span>
                <span>{result.carbs}g</span>
              </div>
              <div className="nutrition-row">
                <span>Proteínas:</span>
                <span>{result.protein}g</span>
              </div>
              <div className="nutrition-row">
                <span>Gorduras:</span>
                <span>{result.fat}g</span>
              </div>
            </div>

            <p className="source-info">Fonte: {result.source}</p>

            <button 
              className="btn-primary"
              onClick={() => onSelectProduct(result)}
            >
              Adicionar às Refeições
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Notifications Manager
export function NotificationsSettings({ token }) {
  const [preferences, setPreferences] = useState({
    water_reminders: true,
    meal_reminders: true,
    reminder_times: ['08:00', '12:00', '18:00']
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
    requestNotificationPermission();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      await axios.post(
        `${API_URL}/api/notifications/preferences`,
        preferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Preferências salvas!');
      
      // Schedule notifications
      scheduleNotifications();
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  const scheduleNotifications = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // This is a simplified version. In production, use service workers
      console.log('Notifications scheduled for:', preferences.reminder_times);
    }
  };

  return (
    <div className="notifications-settings">
      <h3>Notificações</h3>
      
      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={preferences.water_reminders}
            onChange={(e) => setPreferences({...preferences, water_reminders: e.target.checked})}
          />
          <span>Lembretes de Água</span>
        </label>
      </div>

      <div className="setting-item">
        <label>
          <input
            type="checkbox"
            checked={preferences.meal_reminders}
            onChange={(e) => setPreferences({...preferences, meal_reminders: e.target.checked})}
          />
          <span>Lembretes de Refeições</span>
        </label>
      </div>

      <button 
        className="btn-primary"
        onClick={savePreferences}
        disabled={saving}
      >
        {saving ? 'Salvando...' : 'Salvar Preferências'}
      </button>
    </div>
  );
}
