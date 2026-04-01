from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, File, UploadFile, Query, Header
from fastapi.responses import Response as FastAPIResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import razorpay
import requests

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Object Storage Setup
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "perfume-luxury"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple[bytes, str]:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# Razorpay Setup
razorpay_client = razorpay.Client(auth=(os.environ.get("RAZORPAY_KEY_ID"), os.environ.get("RAZORPAY_KEY_SECRET")))

# JWT Setup
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {"sub": user_id, "email": email, "role": role, "exp": datetime.now(timezone.utc) + timedelta(hours=24), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ProductCreate(BaseModel):
    name: str
    brand: str
    price: float
    discount: Optional[float] = 0
    description: str
    gender: str
    mood: List[str]
    season: List[str]
    notes: dict
    stock: int = 100
    images: List[str] = []
    inspired_by: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    discount: Optional[float] = None
    description: Optional[str] = None
    gender: Optional[str] = None
    mood: Optional[List[str]] = None
    season: Optional[List[str]] = None
    notes: Optional[dict] = None
    stock: Optional[int] = None
    images: Optional[List[str]] = None
    inspired_by: Optional[str] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int

class AddressCreate(BaseModel):
    full_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str

class OrderCreate(BaseModel):
    address: AddressCreate
    payment_method: str
    coupon_code: Optional[str] = None

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str

class BlogCreate(BaseModel):
    title: str
    content: str
    category: str
    image_url: Optional[str] = None

class CouponCreate(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    min_purchase: Optional[float] = 0
    max_uses: Optional[int] = None
    expiry_date: Optional[str] = None

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password_hash = hash_password(user_data.password)
    user_doc = {
        "email": email,
        "password_hash": password_hash,
        "name": user_data.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email, "user")
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user_data.name, "role": "user"}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    email = credentials.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email, user.get("role", "user"))
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user.get("name"), "role": user.get("role", "user")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

# Product Routes
@api_router.get("/products")
async def get_products(
    gender: Optional[str] = None,
    mood: Optional[str] = None,
    season: Optional[str] = None,
    note: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort: Optional[str] = "newest",
    page: int = 1,
    limit: int = 12
):
    filters = {}
    if gender:
        filters["gender"] = gender
    if mood:
        filters["mood"] = mood
    if season:
        filters["season"] = season
    if note:
        filters["$or"] = [
            {"notes.top": {"$regex": note, "$options": "i"}},
            {"notes.middle": {"$regex": note, "$options": "i"}},
            {"notes.base": {"$regex": note, "$options": "i"}}
        ]
    if brand:
        filters["brand"] = {"$regex": brand, "$options": "i"}
    if min_price is not None or max_price is not None:
        filters["price"] = {}
        if min_price is not None:
            filters["price"]["$gte"] = min_price
        if max_price is not None:
            filters["price"]["$lte"] = max_price
    if search:
        filters["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    sort_options = {
        "newest": [("created_at", -1)],
        "price_low": [("price", 1)],
        "price_high": [("price", -1)],
        "best_selling": [("sales_count", -1)]
    }
    sort_by = sort_options.get(sort, [("created_at", -1)])
    
    skip = (page - 1) * limit
    products = await db.products.find(filters, {"_id": 0}).sort(sort_by).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(filters)
    
    return {"products": products, "total": total, "page": page, "pages": (total + limit - 1) // limit}

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(100)
    product["reviews"] = reviews
    
    avg_rating = sum([r["rating"] for r in reviews]) / len(reviews) if reviews else 0
    product["average_rating"] = round(avg_rating, 1)
    
    return product

@api_router.get("/products/{product_id}/similar")
async def get_similar_products(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    similar = await db.products.find({
        "id": {"$ne": product_id},
        "$or": [
            {"gender": product["gender"]},
            {"mood": {"$in": product.get("mood", [])}},
            {"brand": product["brand"]}
        ]
    }, {"_id": 0}).limit(4).to_list(4)
    
    return similar

# Cart Routes
@api_router.get("/cart")
async def get_cart(request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not cart:
        return {"items": [], "total": 0}
    
    items_with_details = []
    total = 0
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            item_total = product["price"] * (1 - product.get("discount", 0) / 100) * item["quantity"]
            items_with_details.append({
                **item,
                "product": product,
                "item_total": item_total
            })
            total += item_total
    
    return {"items": items_with_details, "total": total}

@api_router.post("/cart")
async def add_to_cart(item: CartItem, request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    
    product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if not cart:
        await db.carts.insert_one({
            "user_id": user["_id"],
            "items": [{"product_id": item.product_id, "quantity": item.quantity}],
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    else:
        existing_item = next((i for i in cart["items"] if i["product_id"] == item.product_id), None)
        if existing_item:
            existing_item["quantity"] += item.quantity
            await db.carts.update_one(
                {"user_id": user["_id"]},
                {"$set": {"items": cart["items"], "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user["_id"]},
                {"$push": {"items": {"product_id": item.product_id, "quantity": item.quantity}}}
            )
    
    return {"message": "Item added to cart"}

@api_router.put("/cart/{product_id}")
async def update_cart_item(product_id: str, quantity: int, request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    items = cart["items"]
    item = next((i for i in items if i["product_id"] == product_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not in cart")
    
    if quantity <= 0:
        items = [i for i in items if i["product_id"] != product_id]
    else:
        item["quantity"] = quantity
    
    await db.carts.update_one(
        {"user_id": user["_id"]},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, request: Request):
    user = await get_current_user(request)
    await db.carts.update_one(
        {"user_id": user["_id"]},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return {"message": "Item removed from cart"}

# Wishlist Routes
@api_router.get("/wishlist")
async def get_wishlist(request: Request):
    user = await get_current_user(request)
    wishlist = await db.wishlists.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not wishlist:
        return {"items": []}
    
    products = []
    for product_id in wishlist.get("product_ids", []):
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if product:
            products.append(product)
    
    return {"items": products}

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, request: Request):
    user = await get_current_user(request)
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    wishlist = await db.wishlists.find_one({"user_id": user["_id"]})
    if not wishlist:
        await db.wishlists.insert_one({
            "user_id": user["_id"],
            "product_ids": [product_id]
        })
    else:
        if product_id not in wishlist.get("product_ids", []):
            await db.wishlists.update_one(
                {"user_id": user["_id"]},
                {"$push": {"product_ids": product_id}}
            )
    
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, request: Request):
    user = await get_current_user(request)
    await db.wishlists.update_one(
        {"user_id": user["_id"]},
        {"$pull": {"product_ids": product_id}}
    )
    return {"message": "Removed from wishlist"}

# Order Routes
@api_router.post("/orders")
async def create_order(order_data: OrderCreate, request: Request):
    user = await get_current_user(request)
    cart = await db.carts.find_one({"user_id": user["_id"]})
    
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    order_items = []
    total = 0
    for item in cart["items"]:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            price = product["price"] * (1 - product.get("discount", 0) / 100)
            order_items.append({
                "product_id": item["product_id"],
                "product_name": product["name"],
                "quantity": item["quantity"],
                "price": price,
                "total": price * item["quantity"]
            })
            total += price * item["quantity"]
    
    discount = 0
    if order_data.coupon_code:
        coupon = await db.coupons.find_one({"code": order_data.coupon_code})
        if coupon and coupon.get("is_active", True):
            if coupon["discount_type"] == "percentage":
                discount = total * coupon["discount_value"] / 100
            else:
                discount = coupon["discount_value"]
    
    final_total = total - discount
    
    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "user_id": user["_id"],
        "user_email": user["email"],
        "items": order_items,
        "address": order_data.address.model_dump(),
        "subtotal": total,
        "discount": discount,
        "total": final_total,
        "payment_method": order_data.payment_method,
        "payment_status": "pending",
        "order_status": "placed",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    if order_data.payment_method == "razorpay":
        razor_order = razorpay_client.order.create({
            "amount": int(final_total * 100),
            "currency": "INR",
            "receipt": order_id[:40],
            "payment_capture": 1
        })
        order_doc["razorpay_order_id"] = razor_order["id"]
    
    await db.orders.insert_one(order_doc)
    await db.carts.delete_one({"user_id": user["_id"]})
    
    return {"order_id": order_id, "razorpay_order_id": order_doc.get("razorpay_order_id"), "amount": final_total}

@api_router.post("/orders/{order_id}/verify-payment")
async def verify_payment(order_id: str, razorpay_payment_id: str, razorpay_signature: str, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"id": order_id, "user_id": user["_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': order["razorpay_order_id"],
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "payment_status": "completed",
                "razorpay_payment_id": razorpay_payment_id,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        for item in order["items"]:
            await db.products.update_one(
                {"id": item["product_id"]},
                {"$inc": {"stock": -item["quantity"], "sales_count": item["quantity"]}}
            )
        
        return {"message": "Payment verified successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")

@api_router.get("/orders")
async def get_orders(request: Request):
    user = await get_current_user(request)
    orders = await db.orders.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"id": order_id, "user_id": user["_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# Review Routes
@api_router.post("/reviews")
async def create_review(review_data: ReviewCreate, request: Request):
    user = await get_current_user(request)
    
    product = await db.products.find_one({"id": review_data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    review_doc = {
        "id": str(uuid.uuid4()),
        "product_id": review_data.product_id,
        "user_id": user["_id"],
        "user_name": user["name"],
        "rating": review_data.rating,
        "comment": review_data.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_doc)
    
    return {"message": "Review added successfully"}

# Blog Routes
@api_router.get("/blogs")
async def get_blogs(category: Optional[str] = None):
    filters = {}
    if category:
        filters["category"] = category
    blogs = await db.blogs.find(filters, {"_id": 0}).sort("created_at", -1).to_list(100)
    return blogs

@api_router.get("/blogs/{blog_id}")
async def get_blog(blog_id: str):
    blog = await db.blogs.find_one({"id": blog_id}, {"_id": 0})
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blog

# Coupon Routes
@api_router.post("/coupons/validate")
async def validate_coupon(code: str, total: float):
    coupon = await db.coupons.find_one({"code": code.upper()})
    if not coupon or not coupon.get("is_active", True):
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if coupon.get("min_purchase", 0) > total:
        raise HTTPException(status_code=400, detail=f"Minimum purchase of ₹{coupon['min_purchase']} required")
    
    if coupon["discount_type"] == "percentage":
        discount = total * coupon["discount_value"] / 100
    else:
        discount = coupon["discount_value"]
    
    return {"discount": discount, "code": code.upper()}

# Admin Routes - Products
@api_router.post("/admin/products")
async def admin_create_product(product: ProductCreate, request: Request):
    admin = await get_admin_user(request)
    
    product_doc = product.model_dump()
    product_doc["id"] = str(uuid.uuid4())
    product_doc["sales_count"] = 0
    product_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_one(product_doc)
    return {"message": "Product created", "id": product_doc["id"]}

@api_router.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, product: ProductUpdate, request: Request):
    admin = await get_admin_user(request)
    
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, request: Request):
    admin = await get_admin_user(request)
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# Admin Routes - Orders
@api_router.get("/admin/orders")
async def admin_get_orders(request: Request, status: Optional[str] = None):
    admin = await get_admin_user(request)
    filters = {}
    if status:
        filters["order_status"] = status
    orders = await db.orders.find(filters, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return orders

@api_router.put("/admin/orders/{order_id}")
async def admin_update_order(order_id: str, order_status: str, request: Request):
    admin = await get_admin_user(request)
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"order_status": order_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated"}

# Admin Routes - Users
@api_router.get("/admin/users")
async def admin_get_users(request: Request):
    admin = await get_admin_user(request)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for user in users:
        user["id"] = str(user.get("id", ""))
    return users

# Admin Routes - Blogs
@api_router.post("/admin/blogs")
async def admin_create_blog(blog: BlogCreate, request: Request):
    admin = await get_admin_user(request)
    blog_doc = blog.model_dump()
    blog_doc["id"] = str(uuid.uuid4())
    blog_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.blogs.insert_one(blog_doc)
    return {"message": "Blog created", "id": blog_doc["id"]}

@api_router.delete("/admin/blogs/{blog_id}")
async def admin_delete_blog(blog_id: str, request: Request):
    admin = await get_admin_user(request)
    result = await db.blogs.delete_one({"id": blog_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {"message": "Blog deleted"}

# Admin Routes - Coupons
@api_router.post("/admin/coupons")
async def admin_create_coupon(coupon: CouponCreate, request: Request):
    admin = await get_admin_user(request)
    coupon_doc = coupon.model_dump()
    coupon_doc["id"] = str(uuid.uuid4())
    coupon_doc["code"] = coupon_doc["code"].upper()
    coupon_doc["is_active"] = True
    coupon_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.coupons.insert_one(coupon_doc)
    return {"message": "Coupon created"}

@api_router.get("/admin/coupons")
async def admin_get_coupons(request: Request):
    admin = await get_admin_user(request)
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(1000)
    return coupons

# File Upload
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), request: Request = None):
    if request:
        user = await get_admin_user(request)
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    file_doc = {
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result["size"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_doc)
    
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def download_file(path: str, authorization: str = Header(None), auth: str = Query(None)):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    data, content_type = get_object(path)
    return FastAPIResponse(content=data, media_type=record.get("content_type", content_type))

# Startup event
@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    
    await db.users.create_index("email", unique=True)
    
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@gmail.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        password_hash = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": password_hash,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin user created")
    elif not verify_password(admin_password, existing_admin["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info("Admin password updated")
    
    test_user_email = "user@test.com"
    existing_test = await db.users.find_one({"email": test_user_email})
    if not existing_test:
        await db.users.insert_one({
            "email": test_user_email,
            "password_hash": hash_password("user123"),
            "name": "Test User",
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    product_count = await db.products.count_documents({})
    if product_count == 0:
        sample_products = [
            {
                "id": str(uuid.uuid4()), "name": "Midnight Oud", "brand": "Luxury Essence", "price": 8999, "discount": 10,
                "description": "A captivating blend of rich oud and amber, perfect for evening sophistication.",
                "gender": "Men", "mood": ["Party", "Office"], "season": ["Winter"], 
                "notes": {"top": "Bergamot, Saffron", "middle": "Oud, Rose", "base": "Amber, Musk"},
                "stock": 50, "sales_count": 0, "images": ["https://images.pexels.com/photos/3997016/pexels-photo-3997016.jpeg"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "name": "Velvet Rose", "brand": "Elegance Paris", "price": 6499, "discount": 15,
                "description": "Delicate rose petals meet creamy vanilla in this timeless feminine fragrance.",
                "gender": "Women", "mood": ["Party", "Daily"], "season": ["Summer", "Winter"],
                "notes": {"top": "Peony, Litchi", "middle": "Rose, Jasmine", "base": "Vanilla, Patchouli"},
                "stock": 80, "sales_count": 0, "images": ["https://images.pexels.com/photos/6945830/pexels-photo-6945830.jpeg"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "name": "Ocean Breeze", "brand": "Aqua Luxe", "price": 4999, "discount": 0,
                "description": "Fresh aquatic notes with citrus burst, ideal for daily wear and gym sessions.",
                "gender": "Unisex", "mood": ["Daily", "Gym"], "season": ["Summer"],
                "notes": {"top": "Lemon, Sea Salt", "middle": "Marine Accord, Mint", "base": "Cedar, Ambergris"},
                "stock": 100, "sales_count": 0, "images": ["https://images.unsplash.com/photo-1774682060959-efe13b7a12b9"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "name": "Royal Saffron", "brand": "Imperial Scents", "price": 12999, "discount": 5,
                "description": "Luxurious saffron and leather blend inspired by royal heritage.",
                "gender": "Men", "mood": ["Office", "Party"], "season": ["Winter"],
                "notes": {"top": "Saffron, Cardamom", "middle": "Leather, Iris", "base": "Oud, Sandalwood"},
                "stock": 30, "sales_count": 0, "images": ["https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "name": "Cherry Blossom", "brand": "Tokyo Garden", "price": 5499, "discount": 20,
                "description": "Light floral scent with cherry blossom and white tea, perfect for spring.",
                "gender": "Women", "mood": ["Daily", "Office"], "season": ["Summer"],
                "notes": {"top": "Cherry Blossom, Bergamot", "middle": "White Tea, Peony", "base": "Musk, Sandalwood"},
                "stock": 70, "sales_count": 0, "images": ["https://images.pexels.com/photos/6945830/pexels-photo-6945830.jpeg"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "name": "Woody Cedar", "brand": "Forest Essence", "price": 7499, "discount": 10,
                "description": "Earthy cedar and vetiver blend for the modern gentleman.",
                "gender": "Men", "mood": ["Office", "Daily"], "season": ["Winter"],
                "notes": {"top": "Grapefruit, Pepper", "middle": "Cedar, Vetiver", "base": "Tobacco, Leather"},
                "stock": 60, "sales_count": 0, "images": ["https://images.pexels.com/photos/3997016/pexels-photo-3997016.jpeg"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "name": "Amber Nights", "brand": "Desert Dreams", "price": 9999, "discount": 0,
                "description": "Warm amber and spices create an enchanting evening aura.",
                "gender": "Unisex", "mood": ["Party"], "season": ["Winter"],
                "notes": {"top": "Cinnamon, Orange", "middle": "Amber, Incense", "base": "Vanilla, Tonka Bean"},
                "stock": 45, "sales_count": 0, "images": ["https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "name": "Jasmine Noir", "brand": "Midnight Flora", "price": 8499, "discount": 12,
                "description": "Dark jasmine with mysterious undertones for confident women.",
                "gender": "Women", "mood": ["Party"], "season": ["Winter"],
                "notes": {"top": "Gardenia, Green Notes", "middle": "Jasmine, Almond", "base": "Licorice, Tonka Bean"},
                "stock": 55, "sales_count": 0, "images": ["https://images.pexels.com/photos/6945830/pexels-photo-6945830.jpeg"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "name": "Citrus Spark", "brand": "Energy Boost", "price": 3999, "discount": 25,
                "description": "Energizing citrus blend perfect for gym and active lifestyles.",
                "gender": "Unisex", "mood": ["Gym", "Daily"], "season": ["Summer"],
                "notes": {"top": "Lemon, Lime, Grapefruit", "middle": "Ginger, Mint", "base": "White Musk"},
                "stock": 120, "sales_count": 0, "images": ["https://images.unsplash.com/photo-1774682060959-efe13b7a12b9"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "name": "Leather Intensity", "brand": "Bold & Brave", "price": 11499, "discount": 8,
                "description": "Powerful leather and tobacco for the bold individual.",
                "gender": "Men", "mood": ["Party", "Office"], "season": ["Winter"],
                "notes": {"top": "Black Pepper, Nutmeg", "middle": "Leather, Tobacco", "base": "Oud, Patchouli"},
                "stock": 40, "sales_count": 0, "images": ["https://images.pexels.com/photos/3997016/pexels-photo-3997016.jpeg"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "name": "Lavender Dreams", "brand": "Calm Essence", "price": 4499, "discount": 15,
                "description": "Soothing lavender and chamomile for relaxation and sleep.",
                "gender": "Unisex", "mood": ["Daily"], "season": ["Summer", "Winter"],
                "notes": {"top": "Lavender, Bergamot", "middle": "Chamomile, Violet", "base": "Musk, Cedarwood"},
                "stock": 90, "sales_count": 0, "images": ["https://images.unsplash.com/photo-1774682060959-efe13b7a12b9"],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "name": "Peony Paradise", "brand": "Garden Glory", "price": 5999, "discount": 18,
                "description": "Fresh peony and white florals for romantic occasions.",
                "gender": "Women", "mood": ["Party", "Daily"], "season": ["Summer"],
                "notes": {"top": "Peony, Freesia", "middle": "Rose, Lily", "base": "Musk, Amber"},
                "stock": 65, "sales_count": 0, "images": ["https://images.pexels.com/photos/6945830/pexels-photo-6945830.jpeg"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.products.insert_many(sample_products)
        logger.info("Sample products created")
    
    blog_count = await db.blogs.count_documents({})
    if blog_count == 0:
        sample_blogs = [
            {
                "id": str(uuid.uuid4()), "title": "How to Choose the Perfect Perfume",
                "content": "Selecting the right perfume is an art. Consider your personality, the occasion, and the season. Woody notes work best in winter, while fresh citrus is perfect for summer...",
                "category": "Guide", "image_url": "https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "title": "Understanding Fragrance Notes",
                "content": "Perfumes are composed of top, middle, and base notes. Top notes are what you smell first, middle notes form the heart, and base notes provide longevity...",
                "category": "Education", "image_url": "https://images.pexels.com/photos/6945830/pexels-photo-6945830.jpeg",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "title": "Best Perfumes for Office Wear",
                "content": "Office environments require subtle, professional scents. Opt for fresh, clean fragrances with citrus or light floral notes that won't overwhelm...",
                "category": "Tips", "image_url": "https://images.unsplash.com/photo-1774682060959-efe13b7a12b9",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.blogs.insert_many(sample_blogs)
        logger.info("Sample blogs created")
    
    coupon_count = await db.coupons.count_documents({})
    if coupon_count == 0:
        sample_coupons = [
            {
                "id": str(uuid.uuid4()), "code": "WELCOME10", "discount_type": "percentage", "discount_value": 10,
                "min_purchase": 3000, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()), "code": "LUXURY500", "discount_type": "fixed", "discount_value": 500,
                "min_purchase": 5000, "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.coupons.insert_many(sample_coupons)
        logger.info("Sample coupons created")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
