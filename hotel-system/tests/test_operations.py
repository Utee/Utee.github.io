import os, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
os.environ['HOTEL_DB']=tempfile.mktemp(suffix='.sqlite3')
os.environ['HOTEL_COOKIE_SECURE']='false'
import app as hotel
from fastapi.testclient import TestClient
import pytest

@pytest.fixture(autouse=True)
def reset():
    with hotel.db(True) as c:
        for t in ['sessions','attempts','payments','bookings','rooms','users','hotels','audit']:c.execute('DELETE FROM '+t)
        for hid in [1,2]:
            c.execute('INSERT INTO hotels VALUES(?,?)',(hid,'Hotel '+str(hid)))
            c.execute("INSERT INTO rooms VALUES(?,?,'101','Classic',1000000,'ready')",(hid,hid))
            c.execute('INSERT INTO users VALUES(?,?,?,?,?)',(hid,hid,f'owner{hid}@test.com',hotel.password_hash('Password-12345'),'owner'))
        c.execute('INSERT INTO users VALUES(3,1,?,?,?)',('cleaner@test.com',hotel.password_hash('Password-12345'),'housekeeping'))

def client(email='owner1@test.com'):
    c=TestClient(hotel.app)
    assert c.post('/api/login',json={'email':email,'password':'Password-12345'}).status_code==200
    return c

def booking(room=1):return {'guest':'Test Guest','room_id':room,'arrival':str(date.today()),'departure':str(date.today()+timedelta(days=2))}

def test_auth_tenant_isolation_and_csrf():
    assert TestClient(hotel.app).get('/api/state').status_code==401
    a,b=client(),client('owner2@test.com')
    assert a.post('/api/bookings',json=booking(2)).status_code==404
    bid=a.post('/api/bookings',json=booking()).json()['id']
    assert b.get('/api/state').json()['bookings']==[]
    assert b.post('/api/actions',json={'action':'cancel','id':bid}).status_code==404
    assert a.post('/api/bookings',json=booking(),headers={'Origin':'https://evil.test'}).status_code==403

def test_concurrent_reservations_and_adjacent_dates():
    a,b=client(),client()
    with ThreadPoolExecutor(2) as pool:codes=list(pool.map(lambda c:c.post('/api/bookings',json=booking()).status_code,[a,b]))
    assert sorted(codes)==[200,409]
    d=booking();d['arrival']=d['departure'];d['departure']=str(date.today()+timedelta(days=3))
    assert a.post('/api/bookings',json=d).status_code==200

def test_billing_checkin_checkout_and_cleaning():
    c=client();bid=c.post('/api/bookings',json=booking()).json()['id']
    assert c.post('/api/actions',json={'action':'checkin','id':bid}).status_code==200
    assert c.post('/api/actions',json={'action':'checkout','id':bid}).status_code==409
    assert c.post('/api/payments',json={'booking_id':bid,'amount':2000001,'method':'Cash'}).status_code==409
    assert c.post('/api/payments',json={'booking_id':bid,'amount':2000000,'method':'Cash'}).status_code==200
    assert c.post('/api/actions',json={'action':'checkout','id':bid}).status_code==200
    assert c.get('/api/state').json()['rooms'][0]['clean']=='dirty'
    cleaner=client('cleaner@test.com')
    assert cleaner.post('/api/actions',json={'action':'clean','id':1}).status_code==200
    assert cleaner.get('/api/state').json()['payments']==[]
    assert cleaner.get('/api/state').json()['bookings']==[]
    assert cleaner.post('/api/bookings',json=booking()).status_code==403
    assert cleaner.post('/api/staff',json={'email':'x@x.com','password':'Password-12345','role':'manager'}).status_code==403

def test_invalid_dates_amounts_and_login_throttle():
    c=client();d=booking();d['departure']=d['arrival']
    assert c.post('/api/bookings',json=d).status_code==400
    assert c.post('/api/payments',json={'booking_id':1,'amount':1.2,'method':'Cash'}).status_code==422
    bad=TestClient(hotel.app)
    for _ in range(10):assert bad.post('/api/login',json={'email':'no@test.com','password':'wrong'}).status_code==401
    assert bad.post('/api/login',json={'email':'no@test.com','password':'wrong'}).status_code==429
