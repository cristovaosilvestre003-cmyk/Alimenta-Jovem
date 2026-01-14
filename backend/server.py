from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import jwt
import os
import uuid
import base64
import asyncio
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import json

load_dotenv()

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGINS", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "alimenta_jovem_db")
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
security = HTTPBearer()

# LLM Configuration
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")

# =========================
# MODELS
# =========================

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    name: str
    age: Optional[int] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = "moderate"
    goal: Optional[str] = "healthy_eating"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class MealCreate(BaseModel):
    meal_type: str
    food_name: str
    calories: float
    carbs: Optional[float] = 0
    protein: Optional[float] = 0
    fat: Optional[float] = 0
    portion_size: Optional[str] = ""
    image_base64: Optional[str] = None

class GoalCreate(BaseModel):
    goal_type: str
    target_value: float
    current_value: Optional[float] = 0
    description: Optional[str] = ""

class WaterLog(BaseModel):
    glasses: int = 1

# =========================
# UTILITIES
# =========================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"user_id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def calculate_daily_calories(weight: float, height: float, age: int, gender: str, activity_level: str, goal: str) -> float:
    """Calculate daily calorie needs using Mifflin-St Jeor Equation"""
    if gender.lower() == "male":
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    else:
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    
    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    
    tdee = bmr * activity_multipliers.get(activity_level, 1.55)
    
    if goal == "lose_weight":
        return tdee - 500
    elif goal == "gain_weight":
        return tdee + 500
    else:
        return tdee

# =========================
# AUTHENTICATION ENDPOINTS
# =========================

@app.post("/api/auth/register")
async def register(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(user.password)
    
    daily_calories = None
    if user.weight and user.height and user.age and user.gender:
        daily_calories = calculate_daily_calories(
            user.weight, user.height, user.age, user.gender, 
            user.activity_level or "moderate", user.goal or "healthy_eating"
        )
    
    user_data = {
        "user_id": user_id,
        "email": user.email,
        "password": hashed_pwd,
        "name": user.name,
        "age": user.age,
        "weight": user.weight,
        "height": user.height,
        "gender": user.gender,
        "activity_level": user.activity_level,
        "goal": user.goal,
        "daily_calories_target": daily_calories,
        "streak_count": 0,
        "last_activity_date": None,
        "badges": [],
        "is_premium": False,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_data)
    
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user_id,
            "email": user.email,
            "name": user.name,
            "daily_calories_target": daily_calories
        }
    }

@app.post("/api/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": db_user["user_id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": db_user["user_id"],
            "email": db_user["email"],
            "name": db_user["name"],
            "daily_calories_target": db_user.get("daily_calories_target")
        }
    }

@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "age": current_user.get("age"),
        "weight": current_user.get("weight"),
        "height": current_user.get("height"),
        "gender": current_user.get("gender"),
        "activity_level": current_user.get("activity_level"),
        "goal": current_user.get("goal"),
        "daily_calories_target": current_user.get("daily_calories_target"),
        "streak_count": current_user.get("streak_count", 0),
        "badges": current_user.get("badges", []),
        "is_premium": current_user.get("is_premium", False)
    }

# =========================
# FOOD ANALYSIS ENDPOINTS
# =========================

@app.post("/api/analyze-food")
async def analyze_food(image_base64: str = Form(...), current_user: dict = Depends(get_current_user)):
    """Analyze food image using GPT-4o"""
    try:
        if not EMERGENT_LLM_KEY:
            raise HTTPException(status_code=500, detail="LLM key not configured")
        
        # Create LLM chat instance
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"food-analysis-{uuid.uuid4()}",
            system_message="You are a nutrition expert. Analyze food images and provide detailed nutritional information."
        ).with_model("openai", "gpt-4o")
        
        # Create image content
        image_content = ImageContent(image_base64=image_base64)
        
        # Create user message
        user_message = UserMessage(
            text="""Analyze this food image and provide a detailed nutritional breakdown in JSON format.
            
            Please identify all foods visible and return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
            {
                "foods": [
                    {
                        "name": "food name in Portuguese",
                        "portion_size": "estimated portion (e.g., '1 prato', '200g')",
                        "calories": number,
                        "carbs": number in grams,
                        "protein": number in grams,
                        "fat": number in grams
                    }
                ],
                "total_calories": number,
                "total_carbs": number,
                "total_protein": number,
                "total_fat": number,
                "meal_type_suggestion": "breakfast, lunch, dinner, or snack"
            }
            
            Be accurate with Brazilian food portions and names.""",
            file_contents=[image_content]
        )
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        try:
            # Clean response - remove markdown code blocks if present
            response_text = response.strip()
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                response_text = "\n".join(lines[1:-1]) if len(lines) > 2 else response_text
                response_text = response_text.replace("```json", "").replace("```", "")
            
            nutrition_data = json.loads(response_text)
            return {
                "success": True,
                "analysis": nutrition_data
            }
        except json.JSONDecodeError as e:
            return {
                "success": False,
                "error": "Failed to parse nutrition data",
                "raw_response": response[:500]
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Food analysis failed: {str(e)}")

@app.post("/api/scan-barcode")
async def scan_barcode(barcode: str = Form(...), current_user: dict = Depends(get_current_user)):
    """Mock barcode scanner - returns food data for common Brazilian products"""
    
    # Mock database of Brazilian products
    products_db = {
        "7891000100103": {"name": "Nescau", "calories": 90, "carbs": 18, "protein": 3, "fat": 1.5, "portion": "200ml"},
        "7891000244753": {"name": "Leite Ninho", "calories": 150, "carbs": 12, "protein": 8, "fat": 8, "portion": "200ml"},
        "7891000253595": {"name": "Neston", "calories": 130, "carbs": 23, "protein": 4, "fat": 2, "portion": "30g"},
        "7896004707532": {"name": "Arroz Tio João", "calories": 130, "carbs": 28, "protein": 2.5, "fat": 0.5, "portion": "100g"},
        "7891000100004": {"name": "Chocolate Bis", "calories": 110, "carbs": 14, "protein": 1.5, "fat": 5.5, "portion": "unidade"},
    }
    
    product = products_db.get(barcode)
    
    if product:
        return {
            "success": True,
            "product": product
        }
    else:
        return {
            "success": False,
            "message": "Produto não encontrado. Tire uma foto do alimento para análise!"
        }

# =========================
# MEALS ENDPOINTS
# =========================

@app.post("/api/meals")
async def create_meal(meal: MealCreate, current_user: dict = Depends(get_current_user)):
    meal_id = str(uuid.uuid4())
    meal_data = {
        "meal_id": meal_id,
        "user_id": current_user["user_id"],
        "meal_type": meal.meal_type,
        "food_name": meal.food_name,
        "calories": meal.calories,
        "carbs": meal.carbs,
        "protein": meal.protein,
        "fat": meal.fat,
        "portion_size": meal.portion_size,
        "image_base64": meal.image_base64,
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "timestamp": datetime.utcnow()
    }
    
    await db.meals.insert_one(meal_data)
    
    # Update streak
    await update_user_streak(current_user["user_id"])
    
    # Check for new badges
    await check_and_award_badges(current_user["user_id"])
    
    return {"success": True, "meal_id": meal_id, "message": "Refeição registrada com sucesso!"}

@app.get("/api/meals")
async def get_meals(date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["user_id"]}
    
    if date:
        query["date"] = date
    else:
        query["date"] = datetime.utcnow().strftime("%Y-%m-%d")
    
    meals = await db.meals.find(query).sort("timestamp", -1).to_list(100)
    
    # Convert ObjectId to string
    for meal in meals:
        meal["_id"] = str(meal["_id"])
    
    # Calculate totals
    total_calories = sum(meal.get("calories", 0) for meal in meals)
    total_carbs = sum(meal.get("carbs", 0) for meal in meals)
    total_protein = sum(meal.get("protein", 0) for meal in meals)
    total_fat = sum(meal.get("fat", 0) for meal in meals)
    
    return {
        "meals": meals,
        "totals": {
            "calories": total_calories,
            "carbs": total_carbs,
            "protein": total_protein,
            "fat": total_fat
        },
        "daily_target": current_user.get("daily_calories_target", 2000)
    }

@app.get("/api/meals/history")
async def get_meals_history(days: int = 7, current_user: dict = Depends(get_current_user)):
    """Get meal history for the last N days"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    meals = await db.meals.find({
        "user_id": current_user["user_id"],
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }).sort("timestamp", -1).to_list(500)
    
    # Group by date
    history = {}
    for meal in meals:
        date = meal["date"]
        if date not in history:
            history[date] = {"meals": [], "total_calories": 0}
        
        meal["_id"] = str(meal["_id"])
        history[date]["meals"].append(meal)
        history[date]["total_calories"] += meal.get("calories", 0)
    
    return {"history": history}

# =========================
# FOOD DATABASE
# =========================

@app.get("/api/food-database")
async def get_food_database(search: Optional[str] = None):
    """Get Brazilian food database"""
    
    # Brazilian foods database
    brazilian_foods = [
        {"name": "Arroz branco", "calories": 130, "carbs": 28, "protein": 2.5, "fat": 0.3, "portion": "100g"},
        {"name": "Feijão preto", "calories": 77, "carbs": 14, "protein": 4.5, "fat": 0.5, "portion": "100g"},
        {"name": "Frango grelhado", "calories": 165, "carbs": 0, "protein": 31, "fat": 3.6, "portion": "100g"},
        {"name": "Carne bovina", "calories": 250, "carbs": 0, "protein": 26, "fat": 17, "portion": "100g"},
        {"name": "Ovo cozido", "calories": 155, "carbs": 1.1, "protein": 13, "fat": 11, "portion": "unidade"},
        {"name": "Banana", "calories": 89, "carbs": 23, "protein": 1.1, "fat": 0.3, "portion": "unidade"},
        {"name": "Maçã", "calories": 52, "carbs": 14, "protein": 0.3, "fat": 0.2, "portion": "unidade"},
        {"name": "Pão francês", "calories": 300, "carbs": 58, "protein": 9, "fat": 3.5, "portion": "unidade"},
        {"name": "Batata doce", "calories": 86, "carbs": 20, "protein": 1.6, "fat": 0.1, "portion": "100g"},
        {"name": "Macarrão", "calories": 131, "carbs": 25, "protein": 5, "fat": 1.1, "portion": "100g"},
        {"name": "Leite integral", "calories": 61, "carbs": 4.7, "protein": 3.2, "fat": 3.3, "portion": "200ml"},
        {"name": "Iogurte natural", "calories": 61, "carbs": 4.7, "protein": 3.5, "fat": 3.3, "portion": "100g"},
        {"name": "Queijo minas", "calories": 264, "carbs": 3.5, "protein": 17, "fat": 21, "portion": "100g"},
        {"name": "Tapioca", "calories": 152, "carbs": 37, "protein": 0.2, "fat": 0.1, "portion": "unidade"},
        {"name": "Açaí", "calories": 70, "carbs": 6.2, "protein": 1.5, "fat": 5, "portion": "100g"},
    ]
    
    if search:
        search_lower = search.lower()
        filtered = [food for food in brazilian_foods if search_lower in food["name"].lower()]
        return {"foods": filtered}
    
    return {"foods": brazilian_foods}

# =========================
# GOALS & TRACKING
# =========================

@app.post("/api/goals")
async def create_goal(goal: GoalCreate, current_user: dict = Depends(get_current_user)):
    goal_id = str(uuid.uuid4())
    goal_data = {
        "goal_id": goal_id,
        "user_id": current_user["user_id"],
        "goal_type": goal.goal_type,
        "target_value": goal.target_value,
        "current_value": goal.current_value,
        "description": goal.description,
        "completed": False,
        "created_at": datetime.utcnow()
    }
    
    await db.goals.insert_one(goal_data)
    return {"success": True, "goal_id": goal_id}

@app.get("/api/goals")
async def get_goals(current_user: dict = Depends(get_current_user)):
    goals = await db.goals.find({"user_id": current_user["user_id"]}).to_list(100)
    
    for goal in goals:
        goal["_id"] = str(goal["_id"])
    
    return {"goals": goals}

@app.put("/api/goals/{goal_id}/complete")
async def complete_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.goals.update_one(
        {"goal_id": goal_id, "user_id": current_user["user_id"]},
        {"$set": {"completed": True, "completed_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    return {"success": True, "message": "Meta completada!"}

# =========================
# WATER TRACKING
# =========================

@app.post("/api/water-log")
async def log_water(water: WaterLog, current_user: dict = Depends(get_current_user)):
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Find or create today's water log
    existing_log = await db.water_logs.find_one({
        "user_id": current_user["user_id"],
        "date": today
    })
    
    if existing_log:
        new_count = existing_log["glasses_count"] + water.glasses
        await db.water_logs.update_one(
            {"_id": existing_log["_id"]},
            {"$set": {"glasses_count": new_count}}
        )
    else:
        await db.water_logs.insert_one({
            "user_id": current_user["user_id"],
            "date": today,
            "glasses_count": water.glasses,
            "timestamp": datetime.utcnow()
        })
    
    return {"success": True, "message": "Água registrada!"}

@app.get("/api/water-log")
async def get_water_log(date: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if not date:
        date = datetime.utcnow().strftime("%Y-%m-%d")
    
    log = await db.water_logs.find_one({
        "user_id": current_user["user_id"],
        "date": date
    })
    
    glasses_count = log["glasses_count"] if log else 0
    
    return {
        "date": date,
        "glasses_count": glasses_count,
        "target": 8
    }

# =========================
# TIPS
# =========================

@app.get("/api/tips")
async def get_tips():
    tips = [
        {
            "id": "1",
            "category": "Hidratação",
            "title": "Beba pelo menos 2 litros de água por dia",
            "description": "A água ajuda na digestão e mantém seu corpo hidratado.",
            "icon": "💧"
        },
        {
            "id": "2",
            "category": "Carboidratos",
            "title": "Escolha carboidratos integrais",
            "description": "Arroz integral, pão integral e aveia são ótimas opções.",
            "icon": "🌾"
        },
        {
            "id": "3",
            "category": "Bebidas",
            "title": "Evite bebidas açucaradas",
            "description": "Refrigerantes e sucos industrializados têm muito açúcar.",
            "icon": "🥤"
        },
        {
            "id": "4",
            "category": "Proteínas",
            "title": "Inclua proteínas em cada refeição",
            "description": "Frango, ovos, feijão e peixes são excelentes fontes.",
            "icon": "🍗"
        },
        {
            "id": "5",
            "category": "Frutas",
            "title": "Coma pelo menos 3 frutas por dia",
            "description": "Frutas são ricas em vitaminas e fibras.",
            "icon": "🍎"
        },
        {
            "id": "6",
            "category": "Horários",
            "title": "Não pule refeições",
            "description": "Faça pelo menos 3 refeições principais por dia.",
            "icon": "⏰"
        },
        {
            "id": "7",
            "category": "Lanches",
            "title": "Prepare lanches saudáveis",
            "description": "Castanhas, frutas e iogurte são ótimas opções.",
            "icon": "🥜"
        },
        {
            "id": "8",
            "category": "Economia",
            "title": "Planeje suas compras",
            "description": "Fazer lista de compras evita desperdício e economiza.",
            "icon": "💰"
        }
    ]
    
    return {"tips": tips}

# =========================
# GAMIFICATION
# =========================

async def update_user_streak(user_id: str):
    """Update user's streak count"""
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        return
    
    today = datetime.utcnow().date()
    last_activity = user.get("last_activity_date")
    
    if last_activity:
        last_activity_date = datetime.fromisoformat(last_activity).date() if isinstance(last_activity, str) else last_activity.date()
        days_diff = (today - last_activity_date).days
        
        if days_diff == 1:
            # Consecutive day
            new_streak = user.get("streak_count", 0) + 1
        elif days_diff == 0:
            # Same day, don't change streak
            new_streak = user.get("streak_count", 0)
        else:
            # Streak broken
            new_streak = 1
    else:
        new_streak = 1
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"streak_count": new_streak, "last_activity_date": today.isoformat()}}
    )

async def check_and_award_badges(user_id: str):
    """Check and award badges based on user activity"""
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        return
    
    current_badges = user.get("badges", [])
    new_badges = []
    
    # Badge: First meal logged
    meal_count = await db.meals.count_documents({"user_id": user_id})
    if meal_count >= 1 and "first_meal" not in current_badges:
        new_badges.append("first_meal")
    
    # Badge: 7 day streak
    if user.get("streak_count", 0) >= 7 and "week_streak" not in current_badges:
        new_badges.append("week_streak")
    
    # Badge: 30 day streak
    if user.get("streak_count", 0) >= 30 and "month_streak" not in current_badges:
        new_badges.append("month_streak")
    
    # Badge: 10 meals logged
    if meal_count >= 10 and "ten_meals" not in current_badges:
        new_badges.append("ten_meals")
    
    # Badge: 50 meals logged
    if meal_count >= 50 and "fifty_meals" not in current_badges:
        new_badges.append("fifty_meals")
    
    if new_badges:
        await db.users.update_one(
            {"user_id": user_id},
            {"$push": {"badges": {"$each": new_badges}}}
        )

@app.get("/api/badges")
async def get_badges(current_user: dict = Depends(get_current_user)):
    badges_info = {
        "first_meal": {"name": "Primeira Refeição", "description": "Registrou sua primeira refeição!", "icon": "🍽️"},
        "week_streak": {"name": "Semana Completa", "description": "7 dias consecutivos registrando refeições!", "icon": "🔥"},
        "month_streak": {"name": "Mês Dedicado", "description": "30 dias consecutivos! Incrível!", "icon": "⭐"},
        "ten_meals": {"name": "10 Refeições", "description": "Registrou 10 refeições!", "icon": "📊"},
        "fifty_meals": {"name": "50 Refeições", "description": "Registrou 50 refeições! Você é dedicado!", "icon": "🏆"},
    }
    
    user_badges = current_user.get("badges", [])
    
    badges_list = []
    for badge_id, badge_info in badges_info.items():
        badges_list.append({
            "id": badge_id,
            "name": badge_info["name"],
            "description": badge_info["description"],
            "icon": badge_info["icon"],
            "earned": badge_id in user_badges
        })
    
    return {
        "badges": badges_list,
        "streak_count": current_user.get("streak_count", 0)
    }

# =========================
# HEALTH CHECK
# =========================

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)