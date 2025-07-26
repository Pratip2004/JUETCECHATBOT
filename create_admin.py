import asyncio
from database import users_collection
from models.user import User, UserRole
from auth import get_password_hash

async def create_admin():
    # Check if admin already exists
    admin = await users_collection.find_one({"role": UserRole.ADMIN})
    if admin:
        print("Admin user already exists")
        return

    # Create admin user
    admin_user = User(
        username="admin",
        email="admin@example.com",
        password="admin123",  # Change this to a secure password
        role=UserRole.ADMIN
    )

    # Hash the password
    admin_dict = admin_user.dict()
    admin_dict["password"] = get_password_hash(admin_dict["password"])

    # Insert the admin
    result = await users_collection.insert_one(admin_dict)
    print(f"Admin user created with ID: {result.inserted_id}")

if __name__ == "__main__":
    asyncio.run(create_admin()) 