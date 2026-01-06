from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import warnings
import traceback
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app) 

print("Loading datasets...")
df_panels = pd.read_csv('CSVs/panels.csv')
df_inverters = pd.read_csv('CSVs/inverters.csv')
df_batteries = pd.read_csv('CSVs/batteries.csv')
df_installers = pd.read_csv('CSVs/installers.csv')
df_interactions = pd.read_csv('CSVs/user_interactions.csv')

print("Loading ML models and scalers...")
try:
    panel_model = joblib.load('models/panel_model.pkl')
    panel_scaler = joblib.load('models/panel_scaler.pkl')
    
    inverter_model = joblib.load('models/inverter_model.pkl')
    inverter_scaler = joblib.load('models/inverter_scaler.pkl')
    
    battery_model = joblib.load('models/battery_model.pkl')
    battery_scaler = joblib.load('models/battery_scaler.pkl')
    
    models_loaded = True
    print(" ML models loaded successfully")
except FileNotFoundError as e:
    print(f"  Warning: ML models not found ({e}). Will use TOPSIS + CF only.")
    models_loaded = False


panel_features = ['Power_W', 'Efficiency_%', 'Warranty_Years', 'Price_USD', 'Degradation_%perYear']
inverter_features = ['Efficiency_%', 'Warranty_Years', 'Price_USD']
battery_features = ['Capacity_kWh', 'Cycles', 'Warranty_Years', 'Price_USD']


def filter_components(user, df_panels, df_inverters, df_batteries, df_installers):
    """Filter components based on user constraints"""
    
    panels_f = df_panels[df_panels['Price_USD'] <= user['Budget_LKR'] * 0.5].copy()
    
    if user.get('Preferred_Brand'):
        preferred = panels_f[panels_f['Brand'] == user['Preferred_Brand']]
        if len(preferred) > 0:
            panels_f = pd.concat([preferred, panels_f[panels_f['Brand'] != user['Preferred_Brand']]])
    
    inverters_f = df_inverters[df_inverters['Price_USD'] <= user['Budget_LKR'] * 0.3].copy()
    batteries_f = df_batteries[df_batteries['Price_USD'] <= user['Budget_LKR'] * 0.4].copy()
    installers_f = df_installers[df_installers['Location'] == user['Location']].copy()
    
    # Relaxation logic
    if len(panels_f) == 0:
        panels_f = df_panels.copy()
    if len(inverters_f) == 0:
        inverters_f = df_inverters.copy()
    if len(batteries_f) == 0:
        batteries_f = df_batteries.copy()
    if len(installers_f) == 0:
        installers_f = df_installers.copy()
    
    return panels_f, inverters_f, batteries_f, installers_f


def topsis_ranking(df, criteria, weights, beneficial=None):
    """TOPSIS multi-criteria decision making"""
    if len(df) == 0:
        return df
    
    df = df.copy()
    
    if beneficial is None:
        beneficial = [False if 'Price' in c or 'Cost' in c else True for c in criteria]
    
    matrix = df[criteria].values.astype(float)
    norm_matrix = matrix / np.sqrt((matrix**2).sum(axis=0))
    weighted_matrix = norm_matrix * weights
    
    ideal = np.zeros(len(criteria))
    neg_ideal = np.zeros(len(criteria))
    
    for i, is_beneficial in enumerate(beneficial):
        if is_beneficial:
            ideal[i] = weighted_matrix[:, i].max()
            neg_ideal[i] = weighted_matrix[:, i].min()
        else:
            ideal[i] = weighted_matrix[:, i].min()
            neg_ideal[i] = weighted_matrix[:, i].max()
    
    dist_ideal = np.sqrt(((weighted_matrix - ideal)**2).sum(axis=1))
    dist_neg_ideal = np.sqrt(((weighted_matrix - neg_ideal)**2).sum(axis=1))
    
    topsis_score = dist_neg_ideal / (dist_ideal + dist_neg_ideal + 1e-10)
    df['TOPSIS_Score'] = topsis_score
    
    return df.sort_values('TOPSIS_Score', ascending=False)

def cf_predict(user_id, df_interactions, df_components, component_type):
    """Calculate CF scores based on user ratings"""
    
    id_map = {
        'Panel': 'Panel_ID',
        'Inverter': 'Inverter_ID',
        'Battery': 'Battery_ID',
        'Installer': 'Installer_ID'
    }
    comp_id_col = id_map.get(component_type)
    
    if comp_id_col is None or comp_id_col not in df_components.columns:
        df = df_components.copy()
        df['CF_Score'] = 0.5
        return df
    
    ratings = df_interactions[df_interactions['Component_Type'] == component_type]
    
    if len(ratings) == 0:
        df = df_components.copy()
        df['CF_Score'] = 0.5
        return df
    
    avg_ratings = ratings.groupby('Component_ID')['Rating'].mean()
    avg_ratings = (avg_ratings - 1) / 4
    
    df = df_components.copy()
    df['CF_Score'] = df[comp_id_col].map(avg_ratings).fillna(avg_ratings.mean() if len(avg_ratings) > 0 else 0.5)
    
    return df

def predict_ml(df, feature_cols, model, scaler):
    """Predict scores using trained ML model"""
    
    if len(df) == 0:
        return df
    
    df = df.copy()
    
    try:
        missing_cols = [col for col in feature_cols if col not in df.columns]
        if missing_cols:
            df['ML_Score'] = 0.5
            return df
        
        X = df[feature_cols].values
        X_scaled = scaler.transform(X)
        predictions = model.predict(X_scaled)
        
        if predictions.max() > predictions.min():
            predictions = (predictions - predictions.min()) / (predictions.max() - predictions.min())
        else:
            predictions = np.ones_like(predictions) * 0.5
        
        df['ML_Score'] = predictions
        
    except Exception as e:
        df['ML_Score'] = 0.5
    
    return df


def hybrid_fusion(df, use_ml=True):
    """Hybrid ranking using TOPSIS, CF, and ML scores"""
    
    df = df.copy()
    
    if 'TOPSIS_Score' in df.columns:
        topsis_vals = df['TOPSIS_Score'].values
        if topsis_vals.max() > topsis_vals.min():
            df['TOPSIS_Score_Norm'] = (topsis_vals - topsis_vals.min()) / (topsis_vals.max() - topsis_vals.min())
        else:
            df['TOPSIS_Score_Norm'] = 0.5
    else:
        df['TOPSIS_Score_Norm'] = 0.5
    
    if 'CF_Score' not in df.columns:
        df['CF_Score'] = 0.5
    
    if 'ML_Score' not in df.columns or not use_ml:
        df['ML_Score'] = 0.5
    
    df['Final_Hybrid'] = (
        0.4 * df['TOPSIS_Score_Norm'] +
        0.3 * df['CF_Score'] +
        0.3 * df['ML_Score']
    )
    
    return df.sort_values('Final_Hybrid', ascending=False)







def format_recommendations(df, comp_type, top_n=5):
    """Format recommendations as JSON-friendly list"""
    
    if len(df) == 0:
        return []
    
    id_col_map = {
        'Panels': 'Panel_ID',
        'Inverters': 'Inverter_ID',
        'Batteries': 'Battery_ID',
        'Installers': 'Installer_ID'
    }
    comp_id_col = id_col_map.get(comp_type)
    
    recommendations = []
    
    for idx, (i, row) in enumerate(df.head(top_n).iterrows(), 1):
        rec = {
            'rank': idx,
            'id': row[comp_id_col],
            'brand': row.get('Brand', row.get('Company', 'N/A')),
            'scores': {
                'topsis': round(float(row.get('TOPSIS_Score', 0)), 3),
                'cf': round(float(row.get('CF_Score', 0)), 3),
                'ml': round(float(row.get('ML_Score', 0)), 3),
                'final_hybrid': round(float(row['Final_Hybrid']), 3)
            }
        }
        

        if comp_type == 'Panels':
            rec['details'] = {
                'model': row.get('Model', 'N/A'),
                'power_w': float(row['Power_W']),
                'efficiency_percent': float(row['Efficiency_%']),
                'warranty_years': int(row['Warranty_Years']),
                'price_usd': float(row['Price_USD']),
                'degradation_percent_per_year': float(row['Degradation_%perYear'])
            }
        elif comp_type == 'Inverters':
            rec['details'] = {
                'type': row['Type'],
                'efficiency_percent': float(row['Efficiency_%']),
                'hybrid': bool(row['Hybrid']),
                'warranty_years': int(row['Warranty_Years']),
                'price_usd': float(row['Price_USD'])
            }
        elif comp_type == 'Batteries':
            rec['details'] = {
                'capacity_kwh': float(row['Capacity_kWh']),
                'cycles': int(row['Cycles']),
                'warranty_years': int(row['Warranty_Years']),
                'price_usd': float(row['Price_USD'])
            }
        elif comp_type == 'Installers':
            rec['details'] = {
                'rating': float(row['Rating']),
                'experience_years': int(row['Experience_Years']),
                'location': row['Location'],
                'cost_usd': float(row['Cost_USD'])
            }
        
        recommendations.append(rec)
    
    return recommendations










@app.route('/', methods=['GET'])
def home():
    """API home endpoint"""
    return jsonify({
        'message': 'Solar PV Recommendation System API',
        'version': '1.0',
        'endpoints': {
            '/recommend': 'POST - Get recommendations',
            '/health': 'GET - Check API health',
            '/components': 'GET - Get available components',
            '/locations': 'GET - Get available locations'
        }
    })


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': models_loaded,
        'datasets': {
            'panels': len(df_panels),
            'inverters': len(df_inverters),
            'batteries': len(df_batteries),
            'installers': len(df_installers),
            'interactions': len(df_interactions)
        }
    })


@app.route('/locations', methods=['GET'])
def get_locations():
    """Get available installation locations"""
    locations = df_installers['Location'].unique().tolist()
    return jsonify({
        'locations': locations
    })


@app.route('/components', methods=['GET'])
def get_components():
    """Get summary of available components"""
    return jsonify({
        'panels': {
            'count': len(df_panels),
            'brands': df_panels['Brand'].unique().tolist(),
            'price_range': {
                'min': float(df_panels['Price_USD'].min()),
                'max': float(df_panels['Price_USD'].max())
            }
        },
        'inverters': {
            'count': len(df_inverters),
            'brands': df_inverters['Brand'].unique().tolist(),
            'types': df_inverters['Type'].unique().tolist(),
            'price_range': {
                'min': float(df_inverters['Price_USD'].min()),
                'max': float(df_inverters['Price_USD'].max())
            }
        },
        'batteries': {
            'count': len(df_batteries),
            'brands': df_batteries['Brand'].unique().tolist(),
            'price_range': {
                'min': float(df_batteries['Price_USD'].min()),
                'max': float(df_batteries['Price_USD'].max())
            }
        },
        'installers': {
            'count': len(df_installers),
            'companies': df_installers['Company'].unique().tolist(),
            'locations': df_installers['Location'].unique().tolist()
        }
    })


@app.route('/recommend', methods=['POST'])
def recommend():
    """Main recommendation endpoint"""
    try:
        data = request.get_json()
        
        required_fields = ['Budget_LKR', 'Roof_Size_m2', 'Location', 'Energy_Usage_kWhPerDay']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing': missing_fields,
                'required_fields': required_fields
            }), 400
        user_input = {
            'User_ID': data.get('User_ID', 'API_User'),
            'Budget_LKR': float(data['Budget_LKR']),
            'Roof_Size_m2': float(data['Roof_Size_m2']),
            'Location': data['Location'],
            'Preferred_Brand': data.get('Preferred_Brand', None),
            'Energy_Usage_kWhPerDay': float(data['Energy_Usage_kWhPerDay'])
        }
        
        # Validate ranges
        if user_input['Budget_LKR'] <= 0:
            return jsonify({'error': 'Budget must be positive'}), 400
        if user_input['Roof_Size_m2'] <= 0:
            return jsonify({'error': 'Roof size must be positive'}), 400
        if user_input['Energy_Usage_kWhPerDay'] <= 0:
            return jsonify({'error': 'Energy usage must be positive'}), 400
        
        # Get recommendations
        result = get_recommendations(user_input)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Internal server error',
            'message': str(e),
            'traceback': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print(" SOLAR PV RECOMMENDATION SYSTEM API")
    print("="*60)
    print(f" Datasets loaded: {len(df_panels)} panels, {len(df_inverters)} inverters")
    print(f" ML Models: {'Loaded' if models_loaded else 'Not loaded (TOPSIS+CF only)'}")
    print("\n Starting Flask server...")
    print("="*60 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)