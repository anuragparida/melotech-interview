#!/usr/bin/env python3
"""
Setup script for MeloTech Backend with Mailgun integration
"""

import os
import subprocess
import sys

def install_dependencies():
    """Install required Python packages"""
    print("📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def create_env_file():
    """Create .env file from template"""
    env_file = ".env"
    env_example = ".env.example"
    
    if os.path.exists(env_file):
        print(f"⚠️  {env_file} already exists. Skipping creation.")
        return True
    
    if not os.path.exists(env_example):
        print(f"❌ {env_example} not found. Creating basic .env file...")
        env_content = """# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Mailgun Configuration
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_FROM_EMAIL=noreply@your_mailgun_domain

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret_key
"""
        with open(env_file, "w") as f:
            f.write(env_content)
    else:
        # Copy from example
        with open(env_example, "r") as f:
            content = f.read()
        with open(env_file, "w") as f:
            f.write(content)
    
    print(f"✅ Created {env_file} file")
    print("⚠️  Please update the .env file with your actual credentials!")
    return True

def check_env_variables():
    """Check if environment variables are properly configured"""
    print("\n🔍 Checking environment configuration...")
    
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY", 
        "MAILGUN_API_KEY",
        "MAILGUN_DOMAIN",
        "MAILGUN_FROM_EMAIL",
        "WEBHOOK_SECRET"
    ]
    
    missing_vars = []
    for var in required_vars:
        value = os.getenv(var)
        if not value or value.startswith("your_"):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing or incomplete environment variables: {', '.join(missing_vars)}")
        print("Please update your .env file with actual values.")
        return False
    else:
        print("✅ All environment variables are configured!")
        return True

def main():
    """Main setup function"""
    print("🚀 MeloTech Backend Setup")
    print("=" * 40)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Setup failed at dependency installation")
        return False
    
    # Create .env file
    if not create_env_file():
        print("❌ Setup failed at .env file creation")
        return False
    
    # Check environment variables
    check_env_variables()
    
    print("\n" + "=" * 40)
    print("🎉 Setup completed!")
    print("\nNext steps:")
    print("1. Update your .env file with actual credentials")
    print("2. Configure Supabase webhook in your dashboard")
    print("3. Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print("4. Test with: python test_webhook.py")
    print("\n📁 Project Structure:")
    print("   - main.py: Application entry point")
    print("   - config.py: Configuration management")
    print("   - services/: Business logic (mailgun, supabase)")
    print("   - handlers/: Request processing")
    print("   - routes/: API endpoints")
    print("   - models/: Data models")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
