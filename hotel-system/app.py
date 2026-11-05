"""Utee Hotel pilot. All money is stored in integer kobo; dates are hotel calendar dates."""
import hashlib, hmac, os, secrets, sqlite3, time
from contextlib import contextmanager
from datetime import date
from pathlib import Path
from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

DB = os.getenv('HOTEL_DB', 'hotel.sqlite3')
SECURE = os.getenv('HOTEL_COOKIE_SECURE', 'true').lower() == 'true'
app = FastAPI(title='Utee Hotel Management', docs_url=None, redoc_url=None, openapi_url=None)
SCHEMA = '''
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS hotels(id INTEGER PRIMARY KEY,name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,hotel_id INTEGER REFERENCES hotels(id),email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('owner','manager','receptionist','housekeeping')));
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS rooms(id INTEGER PRIMARY KEY,hotel_id INTEGER REFERENCES hotels(id),number TEXT NOT NULL,type TEXT NOT NULL,rate INTEGER NOT NULL CHECK(rate>0),clean TEXT NOT NULL DEFAULT 'ready',UNIQUE(hotel_id,number));
CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY,hotel_id INTEGER REFERENCES hotels(id),room_id INTEGER REFERENCES rooms(id),guest TEXT NOT NULL,contact TEXT NOT NULL,arrival TEXT NOT NULL,departure TEXT NOT NULL,total INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'reserved');
CREATE INDEX IF NOT EXISTS booking_dates ON bookings(hotel_id,room_id,arrival,departure,status);
CREATE TABLE IF NOT EXISTS payments(id INTEGER PRIMARY KEY,hotel_id INTEGER REFERENCES hotels(id),booking_id INTEGER REFERENCES bookings(id),amount INTEGER NOT NULL CHECK(amount>0),method TEXT NOT NULL,created TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY,hotel_id INTEGER,user_id INTEGER,action TEXT,record_id INTEGER,created INTEGER);
'''
@contextmanager
def db(write=False):
    c=sqlite3.connect(DB,timeout=15);c.row_factory=sqlite3.Row;c.execute('PRAGMA foreign_keys=ON')
    try:
        if write:c.execute('BEGIN IMMEDIATE')
        yield c
        c.commit()
    except Exception:
        c.rollback();raise
    finally:c.close()

def init():
    with db() as c:c.executescript(SCHEMA)

def password_hash(password):
    salt=secrets.token_hex(16)
    return salt+':'+hashlib.scrypt(password.encode(),salt=salt.encode(),n=16384,r=8,p=1).hex()

def password_ok(password,stored):
    salt,digest=stored.split(':')
    return hmac.compare_digest(digest,hashlib.scrypt(password.encode(),salt=salt.encode(),n=16384,r=8,p=1).hex())

def fail(message,code=400):raise HTTPException(code,message)
def user(request:Request):
    token=hashlib.sha256(request.cookies.get('hotel_session','').encode()).hexdigest()
    with db() as c:
        u=c.execute('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?',(token,int(time.time()))).fetchone()
    if not u:fail('Please sign in.',401)
    return dict(u)

def desk(u):
    if u['role']=='housekeeping':fail('This action needs front desk access.',403)

def log(c,u,action,record):c.execute('INSERT INTO audit(hotel_id,user_id,action,record_id,created) VALUES(?,?,?,?,?)',(u['hotel_id'],u['id'],action,record,int(time.time())))

@app.middleware('http')
async def security(request:Request,call_next):
    if request.method=='POST':
        origin=request.headers.get('origin')
        if origin and origin != str(request.base_url).rstrip('/'):
            return Response('Origin not allowed',status_code=403)
        if request.headers.get('sec-fetch-site')=='cross-site':return Response('Cross-site request not allowed',status_code=403)
    res=await call_next(request)
    res.headers['Cache-Control']='no-store' if request.url.path.startswith('/api') else 'no-cache'
    res.headers['X-Content-Type-Options']='nosniff'
    res.headers['Referrer-Policy']='same-origin'
    res.headers['Content-Security-Policy']="default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    return res

class Login(BaseModel):
    email:str=Field(min_length=3,max_length=200)
    password:str=Field(min_length=1,max_length=200)
@app.post('/api/login')
def login(d:Login,request:Request,response:Response):
    email=d.email.strip().lower();key=hashlib.sha256(((request.client.host if request.client else '')+'|'+email).encode()).hexdigest();now=int(time.time())
    # Serialize attempts so parallel requests cannot bypass the throttle.
    with db(True) as c:
        a=c.execute('SELECT * FROM attempts WHERE key=?',(key,)).fetchone()
        if a and a['until']>now and a['count']>=10:fail('Too many attempts. Try again in 15 minutes.',429)
        u=c.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
        valid=password_ok(d.password,u['password'] if u else 'invalid:'+('0'*128))
        if not u or not valid:
            count=a['count']+1 if a and a['until']>now else 1
            c.execute('INSERT OR REPLACE INTO attempts VALUES(?,?,?)',(key,count,now+900))
        else:
            c.execute('DELETE FROM attempts WHERE key=?',(key,));c.execute('DELETE FROM sessions WHERE expires<=?',(now,))
            token=secrets.token_urlsafe(32)
            c.execute('INSERT INTO sessions VALUES(?,?,?)',(hashlib.sha256(token.encode()).hexdigest(),u['id'],now+28800))
    if not u or not valid:fail('Email or password is incorrect.',401)
    response.set_cookie('hotel_session',token,httponly=True,secure=SECURE,samesite='strict',max_age=28800,path='/')
    return {'ok':True}
@app.post('/api/logout')
def logout(request:Request,response:Response):
    with db(True) as c:c.execute('DELETE FROM sessions WHERE token=?',(hashlib.sha256(request.cookies.get('hotel_session','').encode()).hexdigest(),))
    response.delete_cookie('hotel_session',path='/');return {'ok':True}
@app.get('/api/state')
def state(u=Depends(user)):
    with db() as c:
        hotel=dict(c.execute('SELECT * FROM hotels WHERE id=?',(u['hotel_id'],)).fetchone())
        result={'hotel':hotel,'user':{'role':u['role']}}
        for table in ['rooms','bookings','payments']:
            result[table]=[] if u['role']=='housekeeping' and table!='rooms' else [dict(r) for r in c.execute(f'SELECT * FROM {table} WHERE hotel_id=?',(u['hotel_id'],))]
        if u['role']=='housekeeping':
            # Return only occupied room IDs, never guest or billing records.
            result['bookings']=[{'room_id':r['room_id'],'status':'checked_in'} for r in c.execute("SELECT room_id FROM bookings WHERE hotel_id=? AND status='checked_in'",(u['hotel_id'],))]
        result['staff']=[dict(r) for r in c.execute('SELECT id,email,role FROM users WHERE hotel_id=?',(u['hotel_id'],))] if u['role']=='owner' else []
        return result
class Room(BaseModel):
    number:str=Field(min_length=1,max_length=20)
    type:str=Field(min_length=1,max_length=80)
    rate:int=Field(gt=0,le=10000000000,strict=True)
@app.post('/api/rooms')
def add_room(d:Room,u=Depends(user)):
    if u['role'] not in ['owner','manager']:fail('Manager access required.',403)
    if not d.number.strip() or not d.type.strip():fail('Room number and type are required.')
    with db(True) as c:
        if c.execute('SELECT id FROM rooms WHERE hotel_id=? AND number=?',(u['hotel_id'],d.number.strip())).fetchone():fail('Room number already exists.',409)
        rid=c.execute('INSERT INTO rooms(hotel_id,number,type,rate) VALUES(?,?,?,?)',(u['hotel_id'],d.number.strip(),d.type.strip(),d.rate)).lastrowid;log(c,u,'room_created',rid)
    return {'id':rid}
class Booking(BaseModel):
    room_id:int
    guest:str=Field(min_length=1,max_length=120)
    contact:str=Field(default='',max_length=100)
    arrival:date
    departure:date
@app.post('/api/bookings')
def book(d:Booking,u=Depends(user)):
    desk(u);n=(d.departure-d.arrival).days
    if not d.guest.strip() or d.arrival<date.today() or not 1<=n<=365:fail('Use a guest name and a stay of 1–365 nights starting today or later.')
    with db(True) as c:
        r=c.execute('SELECT * FROM rooms WHERE id=? AND hotel_id=?',(d.room_id,u['hotel_id'])).fetchone()
        if not r:fail('Room not found.',404)
        if c.execute("SELECT id FROM bookings WHERE hotel_id=? AND room_id=? AND status IN ('reserved','checked_in') AND arrival<? AND departure>?",(u['hotel_id'],d.room_id,str(d.departure),str(d.arrival))).fetchone():fail('This room is already reserved for those dates.',409)
        bid=c.execute('INSERT INTO bookings(hotel_id,room_id,guest,contact,arrival,departure,total) VALUES(?,?,?,?,?,?,?)',(u['hotel_id'],d.room_id,d.guest.strip(),d.contact,str(d.arrival),str(d.departure),r['rate']*n)).lastrowid;log(c,u,'reservation_created',bid)
    return {'id':bid}
class Payment(BaseModel):
    booking_id:int
    amount:int=Field(gt=0,le=100000000000,strict=True)
    method:str
@app.post('/api/payments')
def payment(d:Payment,u=Depends(user)):
    desk(u)
    if d.method not in ['Cash','Bank transfer','POS']:fail('Unsupported payment method.')
    with db(True) as c:
        b=c.execute('SELECT * FROM bookings WHERE id=? AND hotel_id=?',(d.booking_id,u['hotel_id'])).fetchone()
        if not b:fail('Reservation not found.',404)
        paid=c.execute('SELECT COALESCE(SUM(amount),0) FROM payments WHERE booking_id=?',(b['id'],)).fetchone()[0]
        if b['status']=='cancelled' or d.amount>b['total']-paid:fail('Payment exceeds the outstanding balance.',409)
        pid=c.execute('INSERT INTO payments(hotel_id,booking_id,amount,method,created) VALUES(?,?,?,?,?)',(u['hotel_id'],b['id'],d.amount,d.method,str(date.today()))).lastrowid;log(c,u,'payment_recorded',pid)
    return {'id':pid}
class Action(BaseModel):
    action:str
    id:int
@app.post('/api/actions')
def action(d:Action,u=Depends(user)):
    with db(True) as c:
        if d.action=='clean':
            r=c.execute('SELECT * FROM rooms WHERE id=? AND hotel_id=?',(d.id,u['hotel_id'])).fetchone()
            if not r:fail('Room not found.',404)
            if c.execute("SELECT id FROM bookings WHERE room_id=? AND status='checked_in'",(r['id'],)).fetchone():fail('Room is occupied.',409)
            c.execute('UPDATE rooms SET clean=? WHERE id=?',('dirty' if r['clean']=='ready' else 'ready',r['id']))
        else:
            desk(u);b=c.execute('SELECT * FROM bookings WHERE id=? AND hotel_id=?',(d.id,u['hotel_id'])).fetchone()
            if not b:fail('Reservation not found.',404)
            paid=c.execute('SELECT COALESCE(SUM(amount),0) FROM payments WHERE booking_id=?',(b['id'],)).fetchone()[0]
            if d.action=='checkin':
                r=c.execute('SELECT * FROM rooms WHERE id=?',(b['room_id'],)).fetchone()
                if b['status']!='reserved' or not b['arrival']<=str(date.today())<b['departure']:fail('Check-in is available during the booked stay only.',409)
                if r['clean']!='ready' or c.execute("SELECT id FROM bookings WHERE room_id=? AND status='checked_in'",(r['id'],)).fetchone():fail('Room must be clean and unoccupied.',409)
                status='checked_in'
            elif d.action=='checkout':
                if b['status']!='checked_in' or paid<b['total']:fail('Guest must be checked in and the bill settled.',409)
                status='checked_out';c.execute("UPDATE rooms SET clean='dirty' WHERE id=?",(b['room_id'],))
            elif d.action=='cancel':
                if b['status']!='reserved' or paid:fail('Only unpaid reservations can be cancelled.',409)
                status='cancelled'
            else:fail('Unknown action.')
            c.execute('UPDATE bookings SET status=? WHERE id=?',(status,b['id']))
        log(c,u,d.action,d.id)
    return {'ok':True}
class Staff(Login):
    role:str
@app.post('/api/staff')
def staff(d:Staff,u=Depends(user)):
    if u['role']!='owner':fail('Owner access required.',403)
    if d.role not in ['manager','receptionist','housekeeping'] or len(d.password)<12 or '@' not in d.email:fail('Use a valid role, email and a password of at least 12 characters.')
    with db(True) as c:
        if c.execute('SELECT id FROM users WHERE email=?',(d.email.strip().lower(),)).fetchone():fail('Email already registered.',409)
        uid=c.execute('INSERT INTO users(hotel_id,email,password,role) VALUES(?,?,?,?)',(u['hotel_id'],d.email.strip().lower(),password_hash(d.password),d.role)).lastrowid;log(c,u,'staff_created',uid)
    return {'id':uid}
@app.get('/health')
def health():return {'status':'ok'}
@app.get('/')
def home():return RedirectResponse('/app/')
init()
ROOT=Path(__file__).resolve().parent.parent/'dist'
app.mount('/app',StaticFiles(directory=ROOT/'marketplace/hotel',html=True),name='app')
app.mount('/builds/fonts',StaticFiles(directory=ROOT/'builds/fonts'),name='fonts')
app.mount('/assets',StaticFiles(directory=ROOT/'assets'),name='assets')
