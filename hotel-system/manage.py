"""Provision a hotel workspace without a public registration endpoint."""
import getpass
from app import db, password_hash

def main():
    name=input('Hotel name: ').strip();email=input('Owner email: ').strip().lower();password=getpass.getpass('Owner password (12+ characters): ')
    if not name or '@' not in email or len(password)<12:raise SystemExit('Hotel, valid email and 12-character password required.')
    with db(True) as c:
        hid=c.execute('INSERT INTO hotels(name) VALUES(?)',(name,)).lastrowid
        c.execute("INSERT INTO users(hotel_id,email,password,role) VALUES(?,?,?,'owner')",(hid,email,password_hash(password)))
    print('Hotel workspace created. Sign in and add rooms in the Rooms section.')
if __name__=='__main__':main()
