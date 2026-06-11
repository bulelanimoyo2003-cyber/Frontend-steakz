#!/usr/bin/env python3
import sqlite3
import os

db_path = r"C:\Users\bulel\OneDrive\Desktop\Steakz\backend\prisma\dev.db"

# Check if database exists
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("PRAGMA table_info(Order)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'paymentStatus' in columns:
        print("✓ paymentStatus column already exists")
    else:
        print("Adding paymentStatus column...")
        cursor.execute('ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT \'UNPAID\'')
        conn.commit()
        print("✓ paymentStatus column added successfully")
    
    # Verify the column was added
    cursor.execute("PRAGMA table_info(Order)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Current Order table columns: {columns}")
    
    conn.close()
    print("\n✓ Database updated successfully!")
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)
