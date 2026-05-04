from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import sqlite3
import hashlib
import secrets
import json
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

import json as _json
import math as _math

class _SafeJSONProvider(app.json_provider_class):
    def _sanitise(self, obj):
        if isinstance(obj, float):
            return None if (_math.isnan(obj) or _math.isinf(obj)) else obj
        if isinstance(obj, dict):
            return {k: self._sanitise(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [self._sanitise(v) for v in obj]
        try:
            import numpy as _np
            if isinstance(obj, (_np.floating,)):
                f = float(obj)
                return None if (_math.isnan(f) or _math.isinf(f)) else f
            if isinstance(obj, (_np.integer,)):
                return int(obj)
            if isinstance(obj, _np.ndarray):
                return self._sanitise(obj.tolist())
        except ImportError:
            pass
        return obj

    def dumps(self, obj, **kwargs):
        return _json.dumps(self._sanitise(obj), **kwargs)

    def loads(self, s, **kwargs):
        return _json.loads(s, **kwargs)

app.json_provider_class = _SafeJSONProvider
app.json = _SafeJSONProvider(app)



DB_FILE = os.path.join(os.path.dirname(__file__), 'solar_app.db')

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Create tables if they don't exist."""
    conn = get_db()
    cur = conn.cursor()

    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            email     TEXT    UNIQUE NOT NULL,
            password  TEXT    NOT NULL,
            created   TEXT    DEFAULT (datetime('now'))
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            token     TEXT    PRIMARY KEY,
            user_id   INTEGER NOT NULL,
            created   TEXT    DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            created         TEXT    DEFAULT (datetime('now')),
            location        TEXT,
            budget_lkr      REAL,
            roof_size_m2    REAL,
            energy_kwh_day  REAL,
            preferred_brand TEXT,
            capacity_kw     REAL,
            total_cost_lkr  REAL,
            monthly_savings REAL,
            payback_years   TEXT,
            within_budget   INTEGER,
            result_json     TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    conn.commit()
    conn.close()
    print("  Database initialised (solar_app.db)")


def hash_password(password: str) -> str:
    """SHA-256 hash with a fixed salt prefix."""
    salted = f"solarpv_salt_{password}"
    return hashlib.sha256(salted.encode()).hexdigest()


def create_token() -> str:
    return secrets.token_hex(32)


def get_user_from_token(token: str):
    """Return user row if token is valid, else None."""
    if not token:
        return None
    conn = get_db()
    row = conn.execute(
        'SELECT u.* FROM users u JOIN sessions s ON u.id = s.user_id WHERE s.token = ?',
        (token,)
    ).fetchone()
    conn.close()
    return row


def auth_required():
    """Extract and validate bearer token from request headers."""
    auth = request.headers.get('Authorization', '')
    token = auth.replace('Bearer ', '').strip() if auth.startswith('Bearer ') else None
    return get_user_from_token(token), token




MODEL_FILE = os.path.join(os.path.dirname(__file__), 'solar_ml_models.pkl')

models = {}
encoders = {}
scaler = None
feature_cols = []
panels_df = pd.DataFrame()
inverters_df = pd.DataFrame()
climate_df = pd.DataFrame()


def load_models():
    global models, encoders, scaler, feature_cols, panels_df, inverters_df
    if not os.path.exists(MODEL_FILE):
        raise FileNotFoundError(
            f"Model file '{MODEL_FILE}' not found. "
            "Please run Testing_system.py first to train and save models."
        )
    print(f" Loading models from {MODEL_FILE}...")
    data = joblib.load(MODEL_FILE)
    models       = data['models']
    encoders     = data['encoders']
    scaler       = data['scaler']
    feature_cols = data['feature_cols']
    panels_df    = data['panels_df']
    inverters_df = data['inverters_df']
    print("    Models loaded successfully!")
    print(f"   Available models: {list(models.keys())}")


def load_climate_data():
    global climate_df
    print("  Loading embedded climate database...")
    climate_df = pd.DataFrame([
        ["Colombo",      5.2, 5.0, 4.8, 5.1, 28.5, 2390, "Low",      "Low"],
        ["Kandy",        4.8, 4.6, 4.4, 4.7, 24.0, 1900, "Medium",   "Medium"],
        ["Galle",        5.1, 4.9, 4.7, 5.0, 27.5, 2300, "Low",      "Low"],
        ["Jaffna",       5.8, 5.6, 5.4, 5.7, 30.0, 1000, "High",     "Medium"],
        ["Anuradhapura", 5.5, 5.3, 5.1, 5.4, 30.5,  900, "Medium",   "Low"],
        ["Kurunegala",   5.2, 5.0, 4.8, 5.1, 29.0, 1500, "Medium",   "Low"],
        ["Batticaloa",   5.4, 5.2, 5.0, 5.3, 29.5, 1650, "High",     "Medium"],
        ["Badulla",      4.5, 4.3, 4.1, 4.4, 20.0, 2100, "High",     "High"],
        ["Ratnapura",    4.6, 4.4, 4.2, 4.5, 26.0, 3700, "Medium",   "High"],
        ["Hambantota",   5.9, 6.0, 6.2, 5.1, 33.5, 1100, "Very High","Very Low"],
        ["Gampaha",      5.4, 4.6, 4.8, 4.3, 32.0, 2100, "Medium",   "High"],
        ["Kalutara",     5.2, 4.3, 4.5, 4.1, 30.5, 3200, "High",     "Very High"],
        ["Matale",       4.9, 4.3, 4.5, 4.1, 30.2, 1800, "Low",      "Medium"],
        ["Nuwara Eliya", 4.2, 3.7, 3.5, 3.4, 15.8, 2500, "Med-High", "Very High"],
        ["Matara",       5.2, 4.4, 4.5, 4.2, 30.5, 2400, "High",     "High"],
    ], columns=['District', 'Jan_Mar_GHI', 'Apr_Jun_GHI', 'Jul_Sep_GHI', 'Oct_Dec_GHI',
                'Avg_Temp', 'Annual_Rain', 'Wind_Stress', 'Weather_Impact'])
    
    climate_df['Avg_GHI'] = climate_df[
        ['Jan_Mar_GHI', 'Apr_Jun_GHI', 'Jul_Sep_GHI', 'Oct_Dec_GHI']
    ].mean(axis=1)
    
    print(f"   ✓ Climate data loaded: {len(climate_df)} districts")




def resolve_location(location_str: str) -> str | None:
    location_str = str(location_str).strip()
    if '(' in location_str and ')' in location_str:
        city = location_str[location_str.index('(') + 1: location_str.index(')')]
        city = city.strip().title()
    else:
        city = location_str.title()

    if not climate_df[climate_df['District'] == city].empty:
        return city

    for district in climate_df['District'].tolist():
        if district.lower() in location_str.lower():
            return district
    return None




def find_best_panel(capacity, brand, loc):
    if panels_df.empty:
        return {'Brand/Model': 'Generic', 'Company': 'N/A', 'Size_KW': capacity, 'Warranty_Years': 10, 'Price_LKR': capacity * 100000}
    suitable = panels_df[(panels_df['Size_KW'] >= capacity * 0.5) & (panels_df['Size_KW'] <= capacity * 1.5)].copy()
    if suitable.empty:
        suitable = panels_df.copy()
    if brand:
        brand_match = suitable[suitable['Company'].str.contains(brand, case=False, na=False)]
        if not brand_match.empty:
            suitable = brand_match
    suitable['Value_Score'] = (suitable['Size_KW'] * loc['Avg_GHI'] * 1000 / suitable['Price_LKR']) * np.log1p(suitable['Warranty_Years'].fillna(5))
    valid = suitable['Value_Score'].notna()
    if valid.any():
        return suitable.loc[suitable.loc[valid, 'Value_Score'].idxmax()].to_dict()
    return suitable.iloc[0].to_dict()


def find_best_inverter(capacity, loc):
    if inverters_df.empty:
        return {'Brand/Model': 'Generic', 'Company': 'N/A', 'Size_KW': capacity, 'Warranty_Years': 5, 'Price_LKR': capacity * 60000}
    suitable = inverters_df[inverters_df['Size_KW'] >= capacity * 0.8].copy()
    if suitable.empty:
        suitable = inverters_df.copy()
    suitable['Value'] = suitable['Warranty_Years'].fillna(5) / suitable['Price_LKR']
    valid = suitable['Value'].notna()
    if valid.any():
        return suitable.loc[suitable.loc[valid, 'Value'].idxmax()].to_dict()
    return suitable.iloc[0].to_dict()


def predict(budget, roof_size, daily_kwh, location, preferred_brand=None):
    district = resolve_location(location)
    if district is None:
        return None, f"Location '{location}' not found in climate database."

    loc_row = climate_df[climate_df['District'] == district]
    loc = loc_row.iloc[0]

    try:
        city_enc = encoders['city'].transform([district])[0]
    except ValueError:
        city_enc = float(np.mean(encoders['city'].transform(encoders['city'].classes_)))

    try:
        wind_enc = encoders['wind'].transform([loc['Wind_Stress']])[0] if pd.notna(loc['Wind_Stress']) else 1
    except ValueError:
        wind_enc = 1

    try:
        weather_enc = encoders['weather'].transform([loc['Weather_Impact']])[0] if pd.notna(loc['Weather_Impact']) else 1
    except ValueError:
        weather_enc = 1

    input_features = {
        'Roof_Size_m2': roof_size, 'Daily_KWH': daily_kwh,
        'City_Enc': city_enc, 'Avg_GHI': loc['Avg_GHI'],
        'Avg_Temp': loc['Avg_Temp'], 'Annual_Rain': loc['Annual_Rain'],
        'Wind_Enc': wind_enc, 'Weather_Enc': weather_enc,
        'Jan_Mar_GHI': loc['Jan_Mar_GHI'], 'Apr_Jun_GHI': loc['Apr_Jun_GHI'],
        'Jul_Sep_GHI': loc['Jul_Sep_GHI'], 'Oct_Dec_GHI': loc['Oct_Dec_GHI'],
    }

    X_input = pd.DataFrame([input_features])[feature_cols]
    X_scaled = scaler.transform(X_input)

    ml_capacity = float(models['capacity'].predict(X_scaled)[0])
    ml_capacity = max(1.0, min(30.0, ml_capacity))
    pred_capacity = ml_capacity

    PERFORMANCE_RATIO = 0.75
    SAFETY_MARGIN     = 1.10
    avg_ghi_val = float(loc['Avg_GHI']) if float(loc['Avg_GHI']) > 0 else 4.5
    physics_min = (daily_kwh * SAFETY_MARGIN) / (avg_ghi_val * PERFORMANCE_RATIO)

    max_cap_roof   = roof_size / 5.5
    max_cap_budget = budget / 100000
    required_capacity    = max(ml_capacity, physics_min)
    recommended_capacity = max(1, round(min(required_capacity, max_cap_roof, max_cap_budget)))

    pred_brand_enc = models['panel_brand'].predict(X_scaled)[0]
    try:
        recommended_brand = encoders['brand'].inverse_transform([pred_brand_enc])[0]
    except Exception:
        recommended_brand = 'Generic'

    effective_brand = preferred_brand if preferred_brand else recommended_brand
    pred_price = models['price'].predict(X_scaled)[0]

    best_panel    = find_best_panel(recommended_capacity, effective_brand, loc)
    best_inverter = find_best_inverter(recommended_capacity, loc)

    panel_price = best_panel.get('Price_LKR') or 0
    inv_price   = best_inverter.get('Price_LKR') or 0
    panel_price = 0 if (isinstance(panel_price, float) and (np.isnan(panel_price) or np.isinf(panel_price))) else float(panel_price)
    inv_price   = 0 if (isinstance(inv_price, float) and (np.isnan(inv_price) or np.isinf(inv_price))) else float(inv_price)
    total_cost  = panel_price + inv_price

    temp_factor     = 1 - max(0, (loc['Avg_Temp'] - 25)) * 0.004
    monthly_gen     = recommended_capacity * loc['Avg_GHI'] * 30 * temp_factor * 0.85
    monthly_demand  = daily_kwh * 30
    monthly_savings = min(monthly_gen, monthly_demand) * 40
    payback         = total_cost / (monthly_savings * 12) if monthly_savings > 0 else float('inf')

    def _safe_val(v):
        try:
            if isinstance(v, (np.floating,)):
                f = float(v)
                return None if (np.isnan(f) or np.isinf(f)) else f
            if isinstance(v, (np.integer,)):
                return int(v)
        except Exception:
            pass
        if isinstance(v, float) and (np.isnan(v) or np.isinf(v)):
            return None
        return v

    def clean(d):
        return {k: _safe_val(v) for k, v in d.items()}

    results = {
        'district': district,
        'ml_predictions': {
            'predicted_capacity_kw':   round(float(pred_capacity), 1),
            'physics_min_capacity_kw': round(physics_min, 2),
            'constrained_capacity_kw': int(recommended_capacity),
            'predicted_brand':         recommended_brand,
            'predicted_price_lkr':     round(float(pred_price), 0),
        },
        'selected_products': {
            'panel':          clean(best_panel),
            'inverter':       clean(best_inverter),
            'total_cost_lkr': round(float(total_cost), 0),
        },
        'financials': {
            'daily_demand_kwh':        round(float(daily_kwh), 1),
            'monthly_demand_kwh':      round(float(monthly_demand), 0),
            'monthly_generation_kwh':  round(float(monthly_gen), 0),
            'coverage_pct':            min(100.0, round(float(monthly_gen / monthly_demand * 100), 1)) if monthly_demand > 0 else 0.0,
            'monthly_savings_lkr':     round(float(monthly_savings), 0),
            'payback_years':           round(float(payback), 1) if payback < 50 else ">50",
            'within_budget':           bool(total_cost <= budget),
        },
        'climate': {
            'district':       district,
            'avg_ghi':        round(float(loc['Avg_GHI']), 2),
            'avg_temp_c':     float(loc['Avg_Temp']),
            'annual_rain_mm': float(loc['Annual_Rain']),
            'wind_stress':    str(loc['Wind_Stress']),
            'weather_impact': str(loc['Weather_Impact']),
        },
    }

    return results, None




@app.route('/auth/register', methods=['POST'])
def register():
    body = request.get_json(force=True)
    email    = (body.get('email') or '').strip().lower()
    password = (body.get('password') or '').strip()

    if not email or '@' not in email:
        return jsonify({'error': 'Valid email is required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    conn = get_db()
    try:
        conn.execute('INSERT INTO users (email, password) VALUES (?, ?)',
                     (email, hash_password(password)))
        conn.commit()
        user = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        token = create_token()
        conn.execute('INSERT INTO sessions (token, user_id) VALUES (?, ?)', (token, user['id']))
        conn.commit()
        return jsonify({'token': token, 'email': email, 'user_id': user['id']}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already registered'}), 409
    finally:
        conn.close()


@app.route('/auth/login', methods=['POST'])
def login():
    body = request.get_json(force=True)
    email    = (body.get('email') or '').strip().lower()
    password = (body.get('password') or '').strip()

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE email = ? AND password = ?',
                        (email, hash_password(password))).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'Invalid email or password'}), 401

    token = create_token()
    conn.execute('INSERT INTO sessions (token, user_id) VALUES (?, ?)', (token, user['id']))
    conn.commit()
    conn.close()
    return jsonify({'token': token, 'email': email, 'user_id': user['id']}), 200


@app.route('/auth/logout', methods=['POST'])
def logout():
    user, token = auth_required()
    if token:
        conn = get_db()
        conn.execute('DELETE FROM sessions WHERE token = ?', (token,))
        conn.commit()
        conn.close()
    return jsonify({'ok': True}), 200




@app.route('/predictions', methods=['GET'])
def get_predictions():
    user, _ = auth_required()
    if not user:
        return jsonify({'error': 'Authentication required'}), 401

    conn = get_db()
    rows = conn.execute(
        'SELECT * FROM predictions WHERE user_id = ? ORDER BY created DESC',
        (user['id'],)
    ).fetchall()
    conn.close()

    result = []
    for row in rows:
        result.append({
            'id':             row['id'],
            'created':        row['created'],
            'location':       row['location'],
            'budget_lkr':     row['budget_lkr'],
            'roof_size_m2':   row['roof_size_m2'],
            'energy_kwh_day': row['energy_kwh_day'],
            'capacity_kw':    row['capacity_kw'],
            'total_cost_lkr': row['total_cost_lkr'],
            'monthly_savings':row['monthly_savings'],
            'payback_years':  row['payback_years'],
            'within_budget':  bool(row['within_budget']),
        })
    return jsonify({'predictions': result}), 200




@app.route('/recommend', methods=['POST'])
def recommend():
    body = request.get_json(force=True)
    required = ['Budget_LKR', 'Roof_Size_m2', 'Location', 'Energy_Usage_kWhPerDay']
    missing = [f for f in required if f not in body or body[f] in (None, '')]
    if missing:
        return jsonify({'error': f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        budget          = float(body['Budget_LKR'])
        roof_size       = float(body['Roof_Size_m2'])
        daily_kwh       = float(body['Energy_Usage_kWhPerDay'])
        location        = str(body['Location'])
        preferred_brand = body.get('Preferred_Brand') or None
    except (ValueError, TypeError) as e:
        return jsonify({'error': f"Invalid input value: {e}"}), 400

    results, error = predict(budget, roof_size, daily_kwh, location, preferred_brand)
    if error:
        return jsonify({'error': error}), 404

    panel = results['selected_products']['panel']
    inv   = results['selected_products']['inverter']
    ml    = results['ml_predictions']
    fin   = results['financials']
    clim  = results['climate']

    recommended_configuration = {
        'capacity_kw':           results['selected_products']['panel'].get('Size_KW') or ml['constrained_capacity_kw'],
        'panel_brand_model':     f"{panel.get('Company', '')} — {panel.get('Brand/Model', '')}",
        'panel_size_kw':         panel.get('Size_KW'),
        'panel_warranty_yrs':    panel.get('Warranty_Years'),
        'panel_price_lkr':       panel.get('Price_LKR'),
        'inverter_brand_model':  f"{inv.get('Company', '')} — {inv.get('Brand/Model', '')}",
        'inverter_size_kw':      inv.get('Size_KW'),
        'inverter_warranty_yrs': inv.get('Warranty_Years'),
        'inverter_price_lkr':    inv.get('Price_LKR'),
        'total_cost_lkr':        results['selected_products']['total_cost_lkr'],
        'within_budget':         fin['within_budget'],
    }

    recommendations = {
        'user_id':    body.get('User_ID', 'N/A'),
        'location':   results['district'],
        'ml_predictions': ml,
        'financial_analysis': {
            'monthly_generation_kwh': fin['monthly_generation_kwh'],
            'monthly_savings_lkr':    fin['monthly_savings_lkr'],
            'payback_years':          fin['payback_years'],
        },
        'climate_data': clim,
        'products': {'panel': panel, 'inverter': inv},
    }

    
    user, _ = auth_required()
    if user:
        try:
            conn = get_db()
            conn.execute('''
                INSERT INTO predictions
                    (user_id, location, budget_lkr, roof_size_m2, energy_kwh_day,
                     preferred_brand, capacity_kw, total_cost_lkr, monthly_savings,
                     payback_years, within_budget, result_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                user['id'],
                results['district'],
                budget, roof_size, daily_kwh,
                preferred_brand or '',
                recommended_configuration['capacity_kw'],
                recommended_configuration['total_cost_lkr'],
                fin['monthly_savings_lkr'],
                str(fin['payback_years']),
                int(fin['within_budget']),
                json.dumps({'recommended_configuration': recommended_configuration,
                            'recommendations': recommendations}),
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"  Warning: could not save prediction to DB: {e}")

    return jsonify({
        'recommended_configuration': recommended_configuration,
        'recommendations':           recommendations,
    })




@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'models': list(models.keys()), 'climate_districts': len(climate_df)})


@app.route('/locations', methods=['GET'])
def locations():
    return jsonify({'districts': sorted(climate_df['District'].tolist())})




if __name__ == '__main__':
    print("=" * 60)
    print("  SOLAR PV RECOMMENDATION — FLASK BACKEND")
    print("=" * 60)

    init_db()
    load_models()
    load_climate_data()

    print("\n Starting Flask server on http://localhost:5000")
 
    print()

    app.run(host='0.0.0.0', port=5000, debug=False)