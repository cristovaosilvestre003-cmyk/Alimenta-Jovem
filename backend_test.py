#!/usr/bin/env python3
"""
Teste completo do backend do aplicativo Alimenta Jovem
Testa todas as APIs seguindo as prioridades definidas no review request
"""

import requests
import json
import base64
import os
from datetime import datetime
from PIL import Image
import io

# Configuração da URL do backend
BACKEND_URL = "https://meal-planner-380.preview.emergentagent.com/api"

class AlimentaJovemTester:
    def __init__(self):
        self.token = None
        self.user_data = None
        self.test_results = []
        
    def log_result(self, test_name, success, details="", error=""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Detalhes: {details}")
        if error:
            print(f"   Erro: {error}")
        print()

    def create_test_food_image(self):
        """Cria uma imagem de teste com alimentos brasileiros"""
        # Criar uma imagem simples com texto simulando alimentos
        img = Image.new('RGB', (400, 300), color='white')
        
        # Simular uma imagem de prato com arroz e feijão
        # Adicionar algumas formas coloridas para simular alimentos
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        
        # Simular arroz (branco)
        draw.rectangle([50, 50, 150, 100], fill='white', outline='gray')
        
        # Simular feijão (marrom escuro)
        draw.rectangle([160, 50, 260, 100], fill='brown', outline='black')
        
        # Simular carne (marrom)
        draw.rectangle([50, 120, 150, 170], fill='darkred', outline='black')
        
        # Simular salada (verde)
        draw.rectangle([160, 120, 260, 170], fill='green', outline='darkgreen')
        
        # Converter para base64
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return img_base64

    def test_health_check(self):
        """Teste básico de conectividade"""
        try:
            response = requests.get(f"{BACKEND_URL}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Health Check", True, f"Status: {data.get('status')}")
                return True
            else:
                self.log_result("Health Check", False, error=f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, error=str(e))
            return False

    def test_user_registration(self):
        """Teste de registro de usuário"""
        try:
            user_data = {
                "email": "joao.silva@email.com",
                "password": "senha123456",
                "name": "João Silva",
                "age": 22,
                "weight": 70.5,
                "height": 175.0,
                "gender": "male",
                "activity_level": "moderate",
                "goal": "healthy_eating"
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.user_data = data.get("user")
                
                # Verificar se calculou calorias diárias
                daily_calories = self.user_data.get("daily_calories_target")
                if daily_calories and daily_calories > 0:
                    self.log_result("Registro de Usuário", True, 
                                  f"Usuário criado com meta de {daily_calories} calorias/dia")
                    return True
                else:
                    self.log_result("Registro de Usuário", False, 
                                  error="Cálculo de calorias diárias falhou")
                    return False
            else:
                # Tentar login se usuário já existe
                return self.test_user_login()
                
        except Exception as e:
            self.log_result("Registro de Usuário", False, error=str(e))
            return False

    def test_user_login(self):
        """Teste de login de usuário"""
        try:
            login_data = {
                "email": "joao.silva@email.com",
                "password": "senha123456"
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.user_data = data.get("user")
                self.log_result("Login de Usuário", True, "Login realizado com sucesso")
                return True
            else:
                self.log_result("Login de Usuário", False, 
                              error=f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Login de Usuário", False, error=str(e))
            return False

    def test_get_user_profile(self):
        """Teste de obtenção do perfil do usuário"""
        if not self.token:
            self.log_result("Perfil do Usuário", False, error="Token não disponível")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Perfil do Usuário", True, 
                              f"Perfil obtido: {data.get('name')} - {data.get('email')}")
                return True
            else:
                self.log_result("Perfil do Usuário", False, 
                              error=f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Perfil do Usuário", False, error=str(e))
            return False

    def test_food_analysis(self):
        """Teste CRÍTICO - Análise de Imagens com GPT-4o"""
        if not self.token:
            self.log_result("Análise de Imagens GPT-4o", False, error="Token não disponível")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Criar imagem de teste
            image_base64 = self.create_test_food_image()
            
            data = {"image_base64": image_base64}
            
            response = requests.post(f"{BACKEND_URL}/analyze-food", 
                                   headers=headers, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    analysis = result.get("analysis", {})
                    foods = analysis.get("foods", [])
                    total_calories = analysis.get("total_calories", 0)
                    
                    self.log_result("Análise de Imagens GPT-4o", True, 
                                  f"Análise bem-sucedida: {len(foods)} alimentos identificados, "
                                  f"{total_calories} calorias totais")
                    return True
                else:
                    self.log_result("Análise de Imagens GPT-4o", False, 
                                  error=f"Análise falhou: {result.get('error')}")
                    return False
            else:
                self.log_result("Análise de Imagens GPT-4o", False, 
                              error=f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Análise de Imagens GPT-4o", False, error=str(e))
            return False

    def test_meals_system(self):
        """Teste do Sistema de Refeições (CRUD)"""
        if not self.token:
            self.log_result("Sistema de Refeições", False, error="Token não disponível")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Teste 1: Criar refeição
            meal_data = {
                "meal_type": "breakfast",
                "food_name": "Pão francês com manteiga",
                "calories": 250.0,
                "carbs": 45.0,
                "protein": 8.0,
                "fat": 6.0,
                "portion_size": "2 fatias"
            }
            
            response = requests.post(f"{BACKEND_URL}/meals", 
                                   headers=headers, json=meal_data, timeout=10)
            
            if response.status_code != 200:
                self.log_result("Sistema de Refeições - Criar", False, 
                              error=f"Falha ao criar refeição: {response.status_code}")
                return False
            
            # Teste 2: Listar refeições do dia
            response = requests.get(f"{BACKEND_URL}/meals", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                meals = data.get("meals", [])
                totals = data.get("totals", {})
                
                self.log_result("Sistema de Refeições", True, 
                              f"Refeições criadas e listadas: {len(meals)} refeições, "
                              f"{totals.get('calories', 0)} calorias totais")
                
                # Teste 3: Histórico de refeições
                response = requests.get(f"{BACKEND_URL}/meals/history?days=7", 
                                      headers=headers, timeout=10)
                
                if response.status_code == 200:
                    history_data = response.json()
                    self.log_result("Sistema de Refeições - Histórico", True, 
                                  f"Histórico obtido: {len(history_data.get('history', {}))} dias")
                    return True
                else:
                    self.log_result("Sistema de Refeições - Histórico", False, 
                                  error=f"Status code: {response.status_code}")
                    return False
            else:
                self.log_result("Sistema de Refeições", False, 
                              error=f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Sistema de Refeições", False, error=str(e))
            return False

    def test_gamification_system(self):
        """Teste do Sistema de Gamificação (Streaks e Badges)"""
        if not self.token:
            self.log_result("Sistema de Gamificação", False, error="Token não disponível")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Criar algumas refeições para acionar badges
            meal_types = ["lunch", "dinner", "snack"]
            foods = ["Arroz com feijão", "Frango grelhado", "Banana"]
            
            for i, (meal_type, food) in enumerate(zip(meal_types, foods)):
                meal_data = {
                    "meal_type": meal_type,
                    "food_name": food,
                    "calories": 200.0 + (i * 50),
                    "carbs": 30.0,
                    "protein": 15.0,
                    "fat": 5.0,
                    "portion_size": "1 porção"
                }
                
                requests.post(f"{BACKEND_URL}/meals", 
                            headers=headers, json=meal_data, timeout=10)
            
            # Verificar badges
            response = requests.get(f"{BACKEND_URL}/badges", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                badges = data.get("badges", [])
                streak_count = data.get("streak_count", 0)
                
                earned_badges = [b for b in badges if b.get("earned")]
                
                self.log_result("Sistema de Gamificação", True, 
                              f"Badges funcionando: {len(earned_badges)} badges conquistados, "
                              f"streak de {streak_count} dias")
                return True
            else:
                self.log_result("Sistema de Gamificação", False, 
                              error=f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Sistema de Gamificação", False, error=str(e))
            return False

    def test_water_tracking(self):
        """Teste do Rastreador de Água"""
        if not self.token:
            self.log_result("Rastreador de Água", False, error="Token não disponível")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Registrar copos de água
            water_data = {"glasses": 3}
            
            response = requests.post(f"{BACKEND_URL}/water-log", 
                                   headers=headers, json=water_data, timeout=10)
            
            if response.status_code != 200:
                self.log_result("Rastreador de Água - Registrar", False, 
                              error=f"Status code: {response.status_code}")
                return False
            
            # Buscar consumo do dia
            response = requests.get(f"{BACKEND_URL}/water-log", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                glasses_count = data.get("glasses_count", 0)
                target = data.get("target", 8)
                
                self.log_result("Rastreador de Água", True, 
                              f"Água registrada: {glasses_count}/{target} copos")
                return True
            else:
                self.log_result("Rastreador de Água", False, 
                              error=f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Rastreador de Água", False, error=str(e))
            return False

    def test_food_database(self):
        """Teste do Banco de Dados de Alimentos"""
        try:
            # Teste sem busca
            response = requests.get(f"{BACKEND_URL}/food-database", timeout=10)
            
            if response.status_code != 200:
                self.log_result("Banco de Dados de Alimentos", False, 
                              error=f"Status code: {response.status_code}")
                return False
            
            data = response.json()
            foods = data.get("foods", [])
            
            # Teste com busca
            response = requests.get(f"{BACKEND_URL}/food-database?search=arroz", timeout=10)
            
            if response.status_code == 200:
                search_data = response.json()
                search_foods = search_data.get("foods", [])
                
                self.log_result("Banco de Dados de Alimentos", True, 
                              f"Database funcionando: {len(foods)} alimentos totais, "
                              f"{len(search_foods)} encontrados para 'arroz'")
                return True
            else:
                self.log_result("Banco de Dados de Alimentos", False, 
                              error=f"Busca falhou: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Banco de Dados de Alimentos", False, error=str(e))
            return False

    def test_tips(self):
        """Teste das Dicas Nutricionais"""
        try:
            response = requests.get(f"{BACKEND_URL}/tips", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                tips = data.get("tips", [])
                
                self.log_result("Dicas Nutricionais", True, 
                              f"Dicas carregadas: {len(tips)} dicas disponíveis")
                return True
            else:
                self.log_result("Dicas Nutricionais", False, 
                              error=f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Dicas Nutricionais", False, error=str(e))
            return False

    def test_barcode_scanner(self):
        """Teste do Scanner de Código de Barras"""
        if not self.token:
            self.log_result("Scanner de Código de Barras", False, error="Token não disponível")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Teste com código válido (Nescau)
            data = {"barcode": "7891000100103"}
            
            response = requests.post(f"{BACKEND_URL}/scan-barcode", 
                                   headers=headers, data=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    product = result.get("product", {})
                    self.log_result("Scanner de Código de Barras - Válido", True, 
                                  f"Produto encontrado: {product.get('name')}")
                else:
                    self.log_result("Scanner de Código de Barras - Válido", False, 
                                  error="Produto não encontrado")
                    return False
            else:
                self.log_result("Scanner de Código de Barras - Válido", False, 
                              error=f"Status code: {response.status_code}")
                return False
            
            # Teste com código inválido
            data = {"barcode": "1234567890123"}
            
            response = requests.post(f"{BACKEND_URL}/scan-barcode", 
                                   headers=headers, data=data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if not result.get("success"):
                    self.log_result("Scanner de Código de Barras", True, 
                                  "Scanner funcionando: código válido encontrado, inválido rejeitado")
                    return True
                else:
                    self.log_result("Scanner de Código de Barras", False, 
                                  error="Código inválido deveria falhar")
                    return False
            else:
                self.log_result("Scanner de Código de Barras", False, 
                              error=f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Scanner de Código de Barras", False, error=str(e))
            return False

    def test_goals_system(self):
        """Teste do Sistema de Metas"""
        if not self.token:
            self.log_result("Sistema de Metas", False, error="Token não disponível")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Criar meta
            goal_data = {
                "goal_type": "daily_calories",
                "target_value": 2000.0,
                "current_value": 0.0,
                "description": "Consumir 2000 calorias por dia"
            }
            
            response = requests.post(f"{BACKEND_URL}/goals", 
                                   headers=headers, json=goal_data, timeout=10)
            
            if response.status_code != 200:
                self.log_result("Sistema de Metas - Criar", False, 
                              error=f"Status code: {response.status_code}")
                return False
            
            goal_result = response.json()
            goal_id = goal_result.get("goal_id")
            
            # Listar metas
            response = requests.get(f"{BACKEND_URL}/goals", headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_result("Sistema de Metas - Listar", False, 
                              error=f"Status code: {response.status_code}")
                return False
            
            goals_data = response.json()
            goals = goals_data.get("goals", [])
            
            # Marcar meta como completa
            if goal_id:
                response = requests.put(f"{BACKEND_URL}/goals/{goal_id}/complete", 
                                      headers=headers, timeout=10)
                
                if response.status_code == 200:
                    self.log_result("Sistema de Metas", True, 
                                  f"Metas funcionando: {len(goals)} metas criadas e completadas")
                    return True
                else:
                    self.log_result("Sistema de Metas - Completar", False, 
                                  error=f"Status code: {response.status_code}")
                    return False
            else:
                self.log_result("Sistema de Metas", False, error="Goal ID não retornado")
                return False
                
        except Exception as e:
            self.log_result("Sistema de Metas", False, error=str(e))
            return False

    def run_all_tests(self):
        """Executa todos os testes na ordem de prioridade"""
        print("🚀 INICIANDO TESTES DO BACKEND - ALIMENTA JOVEM")
        print("=" * 60)
        
        # Testes básicos
        if not self.test_health_check():
            print("❌ FALHA CRÍTICA: Backend não está respondendo")
            return
        
        # Autenticação (PRIORIDADE ALTA)
        if not self.test_user_registration():
            print("❌ FALHA CRÍTICA: Não foi possível autenticar")
            return
            
        self.test_get_user_profile()
        
        # Análise de Imagens (CRÍTICO)
        self.test_food_analysis()
        
        # Sistema de Refeições (PRIORIDADE ALTA)
        self.test_meals_system()
        
        # Gamificação (PRIORIDADE MÉDIA)
        self.test_gamification_system()
        
        # Rastreador de Água (PRIORIDADE MÉDIA)
        self.test_water_tracking()
        
        # Banco de Dados de Alimentos (já testado como working: true)
        self.test_food_database()
        
        # Dicas Nutricionais (já testado como working: true)
        self.test_tips()
        
        # Scanner de Código de Barras (PRIORIDADE MÉDIA)
        self.test_barcode_scanner()
        
        # Sistema de Metas (PRIORIDADE MÉDIA)
        self.test_goals_system()
        
        # Resumo final
        self.print_summary()

    def print_summary(self):
        """Imprime resumo dos testes"""
        print("\n" + "=" * 60)
        print("📊 RESUMO DOS TESTES")
        print("=" * 60)
        
        passed = sum(1 for r in self.test_results if r["success"])
        total = len(self.test_results)
        
        print(f"Total de testes: {total}")
        print(f"Testes aprovados: {passed}")
        print(f"Testes falharam: {total - passed}")
        print(f"Taxa de sucesso: {(passed/total)*100:.1f}%")
        
        print("\n📋 DETALHES:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            if result["error"]:
                print(f"   Erro: {result['error']}")

if __name__ == "__main__":
    tester = AlimentaJovemTester()
    tester.run_all_tests()