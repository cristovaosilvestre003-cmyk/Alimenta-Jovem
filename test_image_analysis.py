#!/usr/bin/env python3
"""
Test específico para análise de imagens
"""

import requests
import base64
from PIL import Image
import io

def create_test_image():
    """Cria uma imagem de teste mais realista"""
    img = Image.new('RGB', (400, 300), color='white')
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    
    # Simular arroz (branco)
    draw.rectangle([50, 50, 150, 100], fill='white', outline='gray')
    draw.text((60, 110), "Arroz", fill='black')
    
    # Simular feijão (marrom escuro)
    draw.rectangle([160, 50, 260, 100], fill='brown', outline='black')
    draw.text((170, 110), "Feijão", fill='black')
    
    # Converter para base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    return img_base64

def test_image_analysis():
    """Teste específico da análise de imagens"""
    
    # Primeiro fazer login
    login_data = {
        "email": "joao.silva@email.com",
        "password": "senha123456"
    }
    
    try:
        response = requests.post("https://meal-planner-380.preview.emergentagent.com/api/auth/login", 
                               json=login_data, timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Login falhou: {response.status_code}")
            return
        
        token = response.json().get("access_token")
        print("✅ Login realizado com sucesso")
        
        # Testar análise de imagem
        headers = {"Authorization": f"Bearer {token}"}
        image_base64 = create_test_image()
        
        print("🔍 Testando análise de imagem...")
        
        # Usar form data como esperado pela API
        data = {"image_base64": image_base64}
        
        response = requests.post("https://meal-planner-380.preview.emergentagent.com/api/analyze-food", 
                               headers=headers, data=data, timeout=60)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Análise de imagem bem-sucedida!")
            print(f"Resultado: {result}")
        else:
            print(f"❌ Análise falhou: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro: {e}")

if __name__ == "__main__":
    test_image_analysis()