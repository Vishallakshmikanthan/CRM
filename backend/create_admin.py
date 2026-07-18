import asyncio
from app.core.database import async_session_maker
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from sqlalchemy import select

async def create_admin():
    async with async_session_maker() as db:
        # Check if admin exists
        result = await db.execute(select(User).where(User.email == 'admin@example.com'))
        user = result.scalar_one_or_none()
        if user:
            print('Admin user already exists')
            return
        
        # Create admin user
        admin = User(
            email='admin@example.com',
            hashed_password=get_password_hash('admin123'),
            full_name='Admin User',
            role=UserRole.ADMIN,
            is_active=True,
            is_superuser=True
        )
        db.add(admin)
        await db.commit()
        print('Admin user created successfully')

asyncio.run(create_admin())
