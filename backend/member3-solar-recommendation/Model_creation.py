


import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_absolute_error
import warnings
import traceback
import joblib
import os
warnings.filterwarnings('ignore')

print("="*80)
print("🤖 ML-BASED SOLAR RECOMMENDATION SYSTEM")
print("="*80)

def load_and_prepare_data():
    """Load all data and prepare ML features"""

    print("\n📊 LOADING DATA...")

    # 1. Climate Data
    CLIMATE_FILE = 'Climate Impact Ffor solar recomendation System.xlsx'
    if os.path.exists(CLIMATE_FILE):
        print(f"   ✓ Loading climate data from {CLIMATE_FILE}")
        climate_df = pd.read_excel(CLIMATE_FILE)
        climate_df = climate_df.dropna(how='all')
        if str(climate_df.iloc[0, 0]) == 'District':
            climate_df = climate_df.iloc[1:].reset_index(drop=True)
        climate_df.columns = ['District', 'Jan_Mar_GHI', 'Apr_Jun_GHI', 'Jul_Sep_GHI',
                              'Oct_Dec_GHI', 'Avg_Temp', 'Annual_Rain', 'Wind_Stress', 'Weather_Impact']
    else:
        print("   ✓ Loading embedded climate database (Excel not found)")
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

    for col in ['Jan_Mar_GHI', 'Apr_Jun_GHI', 'Jul_Sep_GHI', 'Oct_Dec_GHI', 'Avg_Temp', 'Annual_Rain']:
        climate_df[col] = pd.to_numeric(climate_df[col], errors='coerce')

    climate_df['Avg_GHI'] = climate_df[['Jan_Mar_GHI', 'Apr_Jun_GHI', 'Jul_Sep_GHI', 'Oct_Dec_GHI']].mean(axis=1)
    climate_df['District'] = climate_df['District'].astype(str).str.strip().str.title()

    print(f"   ✓ Climate data: {len(climate_df)} districts")

    # 2. Products Data
    PRODUCTS_FILE = 'Panel & Inverter details.xlsx'
    if os.path.exists(PRODUCTS_FILE):
        products_excel = pd.read_excel(PRODUCTS_FILE, sheet_name=None)
        product_frames = []
        for sheet_name, df in products_excel.items():
            df = df.dropna(how='all')
            if df.empty: continue
            df['Type'] = 'Inverter' if 'Inverter' in sheet_name or 'Phase Type' in df.columns else 'Panel'
            product_frames.append(df)
        products_df = pd.concat(product_frames, ignore_index=True) if product_frames else pd.DataFrame()
    else:
        print(f"   ⚠️  Warning: {PRODUCTS_FILE} not found. System will use limited logic.")
        products_df = pd.DataFrame(columns=['Company', 'Brand/Model', 'Type', 'Size', 'Warranty (Years)', 'Price (LKR/Est.)'])

    if not products_df.empty:
        if 'Size' in products_df.columns:
            products_df['Size_KW'] = pd.to_numeric(products_df['Size'].astype(str).str.extract(r'(\d+)')[0], errors='coerce')
        if 'Warranty (Years)' in products_df.columns:
            products_df['Warranty_Years'] = pd.to_numeric(products_df['Warranty (Years)'], errors='coerce')
        if 'Price (LKR/Est.)' in products_df.columns:
            products_df['Price_LKR'] = pd.to_numeric(products_df['Price (LKR/Est.)'], errors='coerce')

        products_df['Product_ID'] = products_df['Company'].astype(str) + "_" + products_df['Brand/Model'].astype(str)
        products_df['Product_ID'] = products_df['Product_ID'].str.replace(' ', '_')

    panels_df    = products_df[products_df['Type'] == 'Panel'].copy()
    inverters_df = products_df[products_df['Type'] == 'Inverter'].copy()

    print(f"   ✓ Products: {len(panels_df)} panels, {len(inverters_df)} inverters")

    # 3. Sales Data - TRAINING DATA
    SALES_FILE = 'Sales user details.xlsx'
    if os.path.exists(SALES_FILE):
        sales_df = pd.read_excel(SALES_FILE)
        sales_df = sales_df.dropna(how='all')
        if not sales_df.empty and str(sales_df.iloc[0, 0]) == 'ID':
            sales_df = sales_df.iloc[1:].reset_index(drop=True)
    else:
        print(f"   ⚠️  Warning: {SALES_FILE} not found. Cannot train new models without data.")
        sales_df = pd.DataFrame(columns=['ID', 'City', 'Brand', 'Capacity_KW', 'Roof_Size_m2', 'Price_LKR'])

    if not sales_df.empty:
        sales_df.columns = ['ID', 'City', 'Brand', 'Capacity_KW', 'Roof_Size_m2', 'Price_LKR']
        sales_df['Capacity_KW']  = pd.to_numeric(sales_df['Capacity_KW'].astype(str).str.extract(r'(\d+)')[0], errors='coerce')
        sales_df['Roof_Size_m2'] = pd.to_numeric(sales_df['Roof_Size_m2'].astype(str).str.extract(r'(\d+)')[0], errors='coerce')
        sales_df['Price_LKR']    = pd.to_numeric(sales_df['Price_LKR'].astype(str).str.replace(r'[^\d]', '', regex=True), errors='coerce')
        sales_df['City']         = sales_df['City'].astype(str).str.strip().str.title()
        sales_df['Brand']        = sales_df['Brand'].astype(str).str.strip()

        sales_df = sales_df.dropna(subset=['Capacity_KW', 'Price_LKR', 'Brand'])
        sales_df['Roof_Size_m2'] = sales_df['Roof_Size_m2'].fillna(sales_df['Capacity_KW'] * 5.5)

    print(f"   ✓ Sales records: {len(sales_df)} transactions")


    print("\n🔗 MERGING SALES WITH CLIMATE DATA...")
    if not sales_df.empty:
        training_df = sales_df.merge(climate_df, left_on='City', right_on='District', how='left')
        training_df = training_df.dropna(subset=['Avg_GHI', 'Avg_Temp'])

        if not training_df.empty:
            temp_factor = 1 - (training_df['Avg_Temp'] - 25).clip(lower=0) * 0.004
            training_df['Monthly_KWH'] = (
                training_df['Capacity_KW'] * training_df['Avg_GHI'] * 30 * temp_factor * 0.85
            )
            training_df['Daily_KWH'] = training_df['Monthly_KWH'] / 30
    else:
        training_df = pd.DataFrame()

    print(f"   ✓ Training samples: {len(training_df)} (after merging with climate)")
    if not training_df.empty:
        print(f"   ✓ Daily_KWH range: {training_df['Daily_KWH'].min():.1f} – {training_df['Daily_KWH'].max():.1f} kWh/day")

    return climate_df, panels_df, inverters_df, training_df




class MLRecommendationEngine:

    def __init__(self, training_df, panels_df, inverters_df):
        self.training_df  = training_df
        self.panels_df    = panels_df
        self.inverters_df = inverters_df
        self.models   = {}
        self.encoders = {}
        self.scaler   = None

    def prepare_features(self, df):
        """Create feature matrix from raw data — now includes energy usage."""

        self.encoders['city']    = LabelEncoder()
        self.encoders['brand']   = LabelEncoder()
        self.encoders['wind']    = LabelEncoder()
        self.encoders['weather'] = LabelEncoder()

        df['City_Enc']    = self.encoders['city'].fit_transform(df['City'])
        df['Brand_Enc']   = self.encoders['brand'].fit_transform(df['Brand'])
        df['Wind_Enc']    = self.encoders['wind'].fit_transform(df['Wind_Stress'].fillna('Medium'))
        df['Weather_Enc'] = self.encoders['weather'].fit_transform(df['Weather_Impact'].fillna('Medium'))

        df['Price_per_KW']    = df['Price_LKR'] / df['Capacity_KW']
        df['Roof_Utilization'] = df['Roof_Size_m2'] / (df['Capacity_KW'] * 5.5)

      
        feature_cols = [
            'Roof_Size_m2',
            'Daily_KWH',        
            'City_Enc',
            'Avg_GHI',
            'Avg_Temp',
            'Annual_Rain',
            'Wind_Enc',
            'Weather_Enc',
            'Jan_Mar_GHI',
            'Apr_Jun_GHI',
            'Jul_Sep_GHI',
            'Oct_Dec_GHI',
        ]

        X = df[feature_cols].fillna(df[feature_cols].mean())
        return X, df, feature_cols

    def train(self):
        """Train all ML models"""

        print("\n🤖 TRAINING MACHINE LEARNING MODELS...")

        X, df, feature_cols = self.prepare_features(self.training_df)
        self.feature_cols = feature_cols

        self.scaler  = StandardScaler()
        X_scaled     = self.scaler.fit_transform(X)

        
        print("   Training Capacity Predictor (Random Forest Regressor)...")
        y_capacity = df['Capacity_KW'].values
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_capacity, test_size=0.2, random_state=42)

        self.models['capacity'] = RandomForestRegressor(
            n_estimators=200, max_depth=15, min_samples_split=5, random_state=42, n_jobs=-1
        )
        self.models['capacity'].fit(X_train, y_train)

        train_score = self.models['capacity'].score(X_train, y_train)
        test_score  = self.models['capacity'].score(X_test, y_test)
        mae         = mean_absolute_error(y_test, self.models['capacity'].predict(X_test))
        print(f"      ✓ R² (train): {train_score:.3f}, R² (test): {test_score:.3f}, MAE: {mae:.2f} kW")

      
        print("   Training Panel Brand Predictor (Random Forest Classifier)...")
        y_panel = df['Brand_Enc'].values
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_panel, test_size=0.2, random_state=42)

        self.models['panel_brand'] = RandomForestClassifier(
            n_estimators=200, max_depth=15, min_samples_split=5, random_state=42, n_jobs=-1
        )
        self.models['panel_brand'].fit(X_train, y_train)

        train_acc = accuracy_score(y_train, self.models['panel_brand'].predict(X_train))
        test_acc  = accuracy_score(y_test,  self.models['panel_brand'].predict(X_test))
        print(f"      ✓ Accuracy (train): {train_acc:.3f}, (test): {test_acc:.3f}")

       
        print("   Training Price Predictor (Random Forest Regressor)...")
        y_price = df['Price_LKR'].values
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_price, test_size=0.2, random_state=42)

        self.models['price'] = RandomForestRegressor(
            n_estimators=200, max_depth=15, min_samples_split=5, random_state=42, n_jobs=-1
        )
        self.models['price'].fit(X_train, y_train)

        price_mae = mean_absolute_error(y_test, self.models['price'].predict(X_test))
        print(f"      ✓ Price MAE: Rs. {price_mae:,.0f}")

        print("\n   ✅ All models trained successfully!")
        return self

    def save_models(self, filepath='solar_ml_models.pkl'):
        print(f"\n💾 Saving models to {filepath}...")
        joblib.dump({
            'models':       self.models,
            'encoders':     self.encoders,
            'scaler':       self.scaler,
            'feature_cols': self.feature_cols,
            'panels_df':    self.panels_df,
            'inverters_df': self.inverters_df,
        }, filepath)
        print(f"   ✅ Saved! ({os.path.getsize(filepath)/1024:.1f} KB)")

    def load_models(self, filepath='solar_ml_models.pkl'):
        if not os.path.exists(filepath):
            return False
        print(f"\n📂 Loading models from {filepath}...")
        try:
            data = joblib.load(filepath)
            self.models       = data['models']
            self.encoders     = data['encoders']
            self.scaler       = data['scaler']
            self.feature_cols = data['feature_cols']
            self.panels_df    = data['panels_df']
            self.inverters_df = data['inverters_df']
            print("   ✅ Models loaded successfully!")
            return True
        except Exception as e:
            print(f"   ⚠️  Error loading models: {e}")
            return False

    PERFORMANCE_RATIO = 0.75
    SAFETY_MARGIN     = 1.10   

    def physics_capacity(self, daily_kwh: float, avg_ghi: float) -> float:
        """
        Pure-physics minimum capacity needed to cover daily_kwh consumption.

        required_kw = (daily_kwh × safety_margin) / (avg_ghi × PR)
        """
        if avg_ghi <= 0:
            avg_ghi = 4.5 
        return (daily_kwh * self.SAFETY_MARGIN) / (avg_ghi * self.PERFORMANCE_RATIO)

    def predict(self, budget, roof_size, daily_kwh, location, climate_df):
        """
        Make ML-based predictions for a new customer.
        daily_kwh  : user's average daily electricity consumption (kWh/day)
        """

        loc_data = climate_df[climate_df['District'] == location]
        if loc_data.empty:
            return None, f"Location '{location}' not found"

        loc = loc_data.iloc[0]

       
        try:
            city_enc = self.encoders['city'].transform([location])[0]
        except ValueError:
            city_enc = float(np.mean(
                self.encoders['city'].transform(self.encoders['city'].classes_)
            ))

        wind_enc = (
            self.encoders['wind'].transform([loc['Wind_Stress']])[0]
            if pd.notna(loc['Wind_Stress']) else 1
        )
        weather_enc = (
            self.encoders['weather'].transform([loc['Weather_Impact']])[0]
            if pd.notna(loc['Weather_Impact']) else 1
        )

        
        input_features = {
            'Roof_Size_m2':  roof_size,
            'Daily_KWH':     daily_kwh,      
            'City_Enc':      city_enc,
            'Avg_GHI':       loc['Avg_GHI'],
            'Avg_Temp':      loc['Avg_Temp'],
            'Annual_Rain':   loc['Annual_Rain'],
            'Wind_Enc':      wind_enc,
            'Weather_Enc':   weather_enc,
            'Jan_Mar_GHI':   loc['Jan_Mar_GHI'],
            'Apr_Jun_GHI':   loc['Apr_Jun_GHI'],
            'Jul_Sep_GHI':   loc['Jul_Sep_GHI'],
            'Oct_Dec_GHI':   loc['Oct_Dec_GHI'],
        }

        X_input  = pd.DataFrame([input_features])[self.feature_cols]
        X_scaled = self.scaler.transform(X_input)

        # ── PREDICTION 1: ML capacity ─────────────────────────────────
        ml_capacity = float(self.models['capacity'].predict(X_scaled)[0])
        ml_capacity = max(1.0, min(30.0, ml_capacity))

        # ── PHYSICS minimum: size needed to actually cover consumption ─
        physics_min = self.physics_capacity(daily_kwh, float(loc['Avg_GHI']))

        # ── Constraint ceiling: roof space & budget ───────────────────
        max_cap_roof   = roof_size / 5.5          # ~5.5 m² per kW
        max_cap_budget = budget / 100_000          # rough Rs.100k per kW

        # Final capacity: take the LARGER of ML vs physics (never under-size),
        # then cap at roof/budget limits.
        required_capacity    = max(ml_capacity, physics_min)
        recommended_capacity = max(1, round(min(required_capacity, max_cap_roof, max_cap_budget)))

        # ── PREDICTION 2: Best Panel Brand ────────────────────────────
        pred_brand_enc = self.models['panel_brand'].predict(X_scaled)[0]
        try:
            recommended_brand = self.encoders['brand'].inverse_transform([pred_brand_enc])[0]
        except Exception:
            recommended_brand = None

        # ── PREDICTION 3: Expected Price ─────────────────────────────
        pred_price = float(self.models['price'].predict(X_scaled)[0])

        # ── Select actual products ────────────────────────────────────
        best_panel    = self._find_best_panel(recommended_capacity, recommended_brand, loc)
        best_inverter = self._find_best_inverter(recommended_capacity, loc)

        # ── Financial analysis ────────────────────────────────────────
        total_cost      = best_panel['Price_LKR'] + best_inverter['Price_LKR']
        temp_factor     = 1 - max(0, (float(loc['Avg_Temp']) - 25)) * 0.004
        monthly_gen     = recommended_capacity * float(loc['Avg_GHI']) * 30 * temp_factor * self.PERFORMANCE_RATIO
        monthly_demand  = daily_kwh * 30
        monthly_savings = min(monthly_gen, monthly_demand) * 40   # Rs.40 per kWh
        payback         = total_cost / (monthly_savings * 12) if monthly_savings > 0 else float('inf')

        # Coverage ratio: what % of daily demand the system covers
        daily_gen_from_system = monthly_gen / 30
        coverage_pct = min(100.0, round(daily_gen_from_system / daily_kwh * 100, 1)) if daily_kwh > 0 else 0.0

        results = {
            'ml_predictions': {
                'predicted_capacity':  round(ml_capacity, 1),
                'physics_min_capacity': round(physics_min, 2),
                'constrained_capacity': recommended_capacity,
                'predicted_brand':     recommended_brand,
                'predicted_price':     round(pred_price, 0),
            },
            'selected_products': {
                'panel':      best_panel,
                'inverter':   best_inverter,
                'total_cost': round(total_cost, 0),
            },
            'financials': {
                'daily_demand_kwh':    round(daily_kwh, 1),
                'monthly_demand_kwh':  round(monthly_demand, 0),
                'monthly_generation':  round(monthly_gen, 0),
                'coverage_pct':        coverage_pct,
                'monthly_savings':     round(monthly_savings, 0),
                'payback_years':       round(payback, 1) if payback < 50 else ">50",
                'within_budget':       total_cost <= budget,
            },
            'location_data': loc.to_dict(),
        }

        return results, None

    def _find_best_panel(self, capacity, brand, loc):
        if self.panels_df.empty:
            return {'Brand/Model': 'Generic', 'Company': 'N/A', 'Size_KW': capacity,
                    'Warranty_Years': 10, 'Price_LKR': capacity * 100_000}

        suitable = self.panels_df[
            (self.panels_df['Size_KW'] >= capacity * 0.5) &
            (self.panels_df['Size_KW'] <= capacity * 1.5)
        ].copy()
        if suitable.empty:
            suitable = self.panels_df.copy()

        if brand:
            brand_match = suitable[suitable['Company'].str.contains(brand, case=False, na=False)]
            if not brand_match.empty:
                suitable = brand_match

        suitable['Value_Score'] = (
            suitable['Size_KW'] * loc['Avg_GHI'] * 1000 / suitable['Price_LKR']
        ) * np.log1p(suitable['Warranty_Years'].fillna(5))

        valid = suitable['Value_Score'].notna()
        return suitable.loc[suitable.loc[valid, 'Value_Score'].idxmax()].to_dict() if valid.any() else suitable.iloc[0].to_dict()

    def _find_best_inverter(self, capacity, loc):
        if self.inverters_df.empty:
            return {'Brand/Model': 'Generic', 'Company': 'N/A', 'Size_KW': capacity,
                    'Warranty_Years': 5, 'Price_LKR': capacity * 60_000}

        suitable = self.inverters_df[self.inverters_df['Size_KW'] >= capacity * 0.8].copy()
        if suitable.empty:
            suitable = self.inverters_df.copy()

        suitable['Value'] = suitable['Warranty_Years'].fillna(5) / suitable['Price_LKR']

        valid = suitable['Value'].notna()
        return suitable.loc[suitable.loc[valid, 'Value'].idxmax()].to_dict() if valid.any() else suitable.iloc[0].to_dict()


def print_recommendation(results, location):
    ml       = results['ml_predictions']
    products = results['selected_products']
    fin      = results['financials']
    loc      = results['location_data']

    print(f"\n{'='*80}")
    print(f"🤖 ML RECOMMENDATION FOR {location.upper()}")
    print(f"{'='*80}")

    print(f"\n📊 MACHINE LEARNING PREDICTIONS:")
    print(f"   ML predicted capacity:      {ml['predicted_capacity']} kW")
    print(f"   Physics minimum capacity:   {ml['physics_min_capacity']} kW  ← from daily usage")
    print(f"   Final recommended capacity: {ml['constrained_capacity']} kW  (constrained by roof/budget)")
    print(f"   ML-recommended brand:       {ml['predicted_brand']}")
    print(f"   Predicted price:            Rs. {ml['predicted_price']:,.0f}")

    print(f"\n🔧 SELECTED PRODUCTS:")
    panel = products['panel']
    inv   = products['inverter']
    print(f"   Panel:    {panel['Brand/Model']} ({panel['Company']})")
    print(f"             {panel['Size_KW']} kW | {panel['Warranty_Years']} yrs | Rs. {panel['Price_LKR']:,.0f}")
    print(f"   Inverter: {inv['Brand/Model']} ({inv['Company']})")
    print(f"             {inv['Size_KW']} kW | {inv['Warranty_Years']} yrs | Rs. {inv['Price_LKR']:,.0f}")
    print(f"   TOTAL COST:    Rs. {products['total_cost']:,.0f}")
    print(f"   Within Budget: {'✅ YES' if fin['within_budget'] else '❌ NO'}")

    print(f"\n💰 FINANCIAL ANALYSIS:")
    print(f"   Daily demand:       {fin['daily_demand_kwh']} kWh/day")
    print(f"   Monthly demand:     {fin['monthly_demand_kwh']} kWh")
    print(f"   Monthly generation: {fin['monthly_generation']} kWh  ({fin['coverage_pct']}% of demand covered)")
    print(f"   Monthly savings:    Rs. {fin['monthly_savings']:,.0f}")
    print(f"   Payback period:     {fin['payback_years']} years")

    print(f"\n🌍 CLIMATE DATA FOR {location}:")
    print(f"   Avg GHI:        {loc['Avg_GHI']:.2f} kWh/m²/day")
    print(f"   Temperature:    {loc['Avg_Temp']}°C")
    print(f"   Rainfall:       {loc['Annual_Rain']} mm")
    print(f"   Weather Impact: {loc['Weather_Impact']}")
    print(f"{'='*80}")


def main():
    MODEL_FILE = 'solar_ml_models.pkl'

    try:
        print("🔍 Checking for saved models...")
        climate_df, panels_df, inverters_df, training_df = load_and_prepare_data()

        engine = MLRecommendationEngine(training_df, panels_df, inverters_df)

        if engine.load_models(MODEL_FILE):
            
            if 'Daily_KWH' not in engine.feature_cols:
                print("\n⚠️  Saved model is outdated (missing Daily_KWH feature). Retraining...")
                engine.train()
                engine.save_models(MODEL_FILE)
                mode = "RETRAINED"
            else:
                print("   🚀 Using pre-trained models (fast startup)")
                mode = "LOADED"
        else:
            print("   📝 No saved models found. Training new models...")
            engine.train()
            engine.save_models(MODEL_FILE)
            mode = "TRAINED"

        print("\n" + "="*80)
        print(f"🚀 ML SYSTEM READY ({mode})")
        print("="*80)
        print("Commands: 'q'=quit | 'retrain'=force retrain | 'save'=force save")

        while True:
            try:
                print("\n" + "-"*80)
                budget_input = input("💰 Budget (LKR): ").strip()

                if budget_input.lower() == 'q':
                    break
                elif budget_input.lower() == 'retrain':
                    print("\n🔄 Retraining models...")
                    engine.train()
                    engine.save_models(MODEL_FILE)
                    print("✅ Retraining complete!")
                    continue
                elif budget_input.lower() == 'save':
                    engine.save_models(MODEL_FILE)
                    continue

                budget   = float(budget_input)
                roof     = float(input("🏠 Roof size (m²): ").strip())
                daily_kwh = float(input("⚡ Daily usage (kWh/day): ").strip())
                location = input("📍 District: ").strip().title()

                results, error = engine.predict(budget, roof, daily_kwh, location, climate_df)

                if error:
                    print(f"\n❌ {error}")
                else:
                    print_recommendation(results, location)

            except ValueError as e:
                print(f"❌ Invalid input: {e}")
            except KeyboardInterrupt:
                print("\n\nExiting...")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
                traceback.print_exc()

    except Exception as e:
        print(f"\n❌ System error: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    main()