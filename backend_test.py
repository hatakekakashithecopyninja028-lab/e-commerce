import requests
import sys
import json
from datetime import datetime

class LuxuryPerfumeAPITester:
    def __init__(self, base_url="https://essence-vault-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_session = requests.Session()
        self.user_session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.test_product_id = None
        self.test_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, session=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        # Use provided session or default session
        test_session = session or self.session

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = test_session.get(url, headers=test_headers)
            elif method == 'POST':
                response = test_session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = test_session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = test_session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass

            return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@gmail.com", "password": "admin123"},
            session=self.admin_session
        )
        if success and 'id' in response:
            print(f"Admin logged in: {response.get('email')} - Role: {response.get('role')}")
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": "user@test.com", "password": "user123"},
            session=self.user_session
        )
        if success and 'id' in response:
            print(f"User logged in: {response.get('email')} - Role: {response.get('role')}")
            return True
        return False

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@test.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": test_email, "password": "test123", "name": "Test User"}
        )
        return success

    def test_get_products(self):
        """Test getting products"""
        success, response = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        if success and 'products' in response:
            products = response['products']
            print(f"Found {len(products)} products")
            if products:
                self.test_product_id = products[0]['id']
                print(f"Test product ID: {self.test_product_id}")
            return True
        return False

    def test_get_product_detail(self):
        """Test getting product detail"""
        if not self.test_product_id:
            print("❌ No test product ID available")
            return False
        
        success, response = self.run_test(
            "Get Product Detail",
            "GET",
            f"products/{self.test_product_id}",
            200
        )
        return success

    def test_product_filters(self):
        """Test product filtering"""
        filters = [
            ("gender=Men", "Gender Filter"),
            ("mood=Office", "Mood Filter"),
            ("season=Winter", "Season Filter"),
            ("note=Oud", "Note Filter"),
            ("min_price=5000&max_price=10000", "Price Range Filter")
        ]
        
        all_passed = True
        for filter_param, filter_name in filters:
            success, response = self.run_test(
                filter_name,
                "GET",
                f"products?{filter_param}",
                200
            )
            if not success:
                all_passed = False
        
        return all_passed

    def test_admin_create_product(self):
        """Test admin product creation"""
        product_data = {
            "name": "Test Perfume",
            "brand": "Test Brand",
            "price": 5999,
            "discount": 10,
            "description": "A test perfume for API testing",
            "gender": "Unisex",
            "mood": ["Daily", "Office"],
            "season": ["Summer"],
            "notes": {"top": "Citrus", "middle": "Floral", "base": "Musk"},
            "stock": 50,
            "images": ["https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg"]
        }
        
        success, response = self.run_test(
            "Admin Create Product",
            "POST",
            "admin/products",
            200,
            data=product_data,
            session=self.admin_session
        )
        return success

    def test_admin_get_orders(self):
        """Test admin get orders"""
        success, response = self.run_test(
            "Admin Get Orders",
            "GET",
            "admin/orders",
            200,
            session=self.admin_session
        )
        return success

    def test_admin_get_users(self):
        """Test admin get users"""
        success, response = self.run_test(
            "Admin Get Users",
            "GET",
            "admin/users",
            200,
            session=self.admin_session
        )
        return success

    def test_cart_operations(self):
        """Test cart operations"""
        if not self.test_product_id:
            print("❌ No test product ID for cart testing")
            return False

        # Test add to cart
        success1, _ = self.run_test(
            "Add to Cart",
            "POST",
            "cart",
            200,
            data={"product_id": self.test_product_id, "quantity": 2},
            session=self.user_session
        )

        # Test get cart
        success2, cart_response = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200,
            session=self.user_session
        )

        # Test update cart
        success3, _ = self.run_test(
            "Update Cart",
            "PUT",
            f"cart/{self.test_product_id}?quantity=3",
            200,
            session=self.user_session
        )

        # Test remove from cart
        success4, _ = self.run_test(
            "Remove from Cart",
            "DELETE",
            f"cart/{self.test_product_id}",
            200,
            session=self.user_session
        )

        return all([success1, success2, success3, success4])

    def test_wishlist_operations(self):
        """Test wishlist operations"""
        if not self.test_product_id:
            print("❌ No test product ID for wishlist testing")
            return False

        # Test add to wishlist
        success1, _ = self.run_test(
            "Add to Wishlist",
            "POST",
            f"wishlist/{self.test_product_id}",
            200,
            session=self.user_session
        )

        # Test get wishlist
        success2, _ = self.run_test(
            "Get Wishlist",
            "GET",
            "wishlist",
            200,
            session=self.user_session
        )

        # Test remove from wishlist
        success3, _ = self.run_test(
            "Remove from Wishlist",
            "DELETE",
            f"wishlist/{self.test_product_id}",
            200,
            session=self.user_session
        )

        return all([success1, success2, success3])

    def test_order_creation(self):
        """Test order creation"""
        if not self.test_product_id:
            print("❌ No test product ID for order testing")
            return False

        # First add item to cart
        self.run_test(
            "Add to Cart for Order",
            "POST",
            "cart",
            200,
            data={"product_id": self.test_product_id, "quantity": 1},
            session=self.user_session
        )

        # Create order
        order_data = {
            "address": {
                "full_name": "Test User",
                "phone": "9876543210",
                "address_line1": "123 Test Street",
                "city": "Test City",
                "state": "Test State",
                "pincode": "123456"
            },
            "payment_method": "cod"
        }

        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data,
            session=self.user_session
        )

        if success and 'order_id' in response:
            self.test_order_id = response['order_id']
            print(f"Created order: {self.test_order_id}")

        return success

    def test_get_orders(self):
        """Test get user orders"""
        success, response = self.run_test(
            "Get User Orders",
            "GET",
            "orders",
            200,
            session=self.user_session
        )
        return success

    def test_blogs(self):
        """Test blog endpoints"""
        success1, _ = self.run_test(
            "Get Blogs",
            "GET",
            "blogs",
            200
        )

        success2, _ = self.run_test(
            "Get Blogs by Category",
            "GET",
            "blogs?category=Guide",
            200
        )

        return all([success1, success2])

    def test_coupon_validation(self):
        """Test coupon validation"""
        success, _ = self.run_test(
            "Validate Coupon",
            "POST",
            "coupons/validate?code=WELCOME10&total=5000",
            200
        )
        return success

def main():
    print("🚀 Starting Luxury Perfume E-commerce API Tests")
    print("=" * 60)
    
    tester = LuxuryPerfumeAPITester()
    
    # Test authentication
    print("\n📋 AUTHENTICATION TESTS")
    admin_login_success = tester.test_admin_login()
    user_login_success = tester.test_user_login()
    registration_success = tester.test_user_registration()
    
    if not user_login_success:
        print("❌ User login failed, skipping user-specific tests")
        return 1
    
    # Test product operations
    print("\n📋 PRODUCT TESTS")
    products_success = tester.test_get_products()
    product_detail_success = tester.test_get_product_detail()
    filters_success = tester.test_product_filters()
    
    # Test user operations
    print("\n📋 USER OPERATION TESTS")
    cart_success = tester.test_cart_operations()
    wishlist_success = tester.test_wishlist_operations()
    order_success = tester.test_order_creation()
    orders_success = tester.test_get_orders()
    
    # Test admin operations (if admin login worked)
    print("\n📋 ADMIN TESTS")
    if admin_login_success:
        admin_products_success = tester.test_admin_create_product()
        admin_orders_success = tester.test_admin_get_orders()
        admin_users_success = tester.test_admin_get_users()
    else:
        print("❌ Admin login failed, skipping admin tests")
        admin_products_success = admin_orders_success = admin_users_success = False
    
    # Test other features
    print("\n📋 OTHER FEATURE TESTS")
    blogs_success = tester.test_blogs()
    coupon_success = tester.test_coupon_validation()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    print("=" * 60)
    
    # Detailed results
    results = {
        "Authentication": [admin_login_success, user_login_success, registration_success],
        "Products": [products_success, product_detail_success, filters_success],
        "User Operations": [cart_success, wishlist_success, order_success, orders_success],
        "Admin Operations": [admin_products_success, admin_orders_success, admin_users_success],
        "Other Features": [blogs_success, coupon_success]
    }
    
    for category, tests in results.items():
        passed = sum(tests)
        total = len(tests)
        status = "✅" if passed == total else "⚠️" if passed > 0 else "❌"
        print(f"{status} {category}: {passed}/{total}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())