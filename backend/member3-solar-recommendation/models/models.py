

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib

df_panels = pd.read_csv('panels.csv')
df_inverters = pd.read_csv('inverters.csv')
df_batteries = pd.read_csv('batteries.csv')
df_interactions = pd.read_csv('user_interactions.csv')

# Synthetic TOPSIS and CF scores for training
for df in [df_panels, df_inverters, df_batteries]:
    df['TOPSIS_Score'] = np.random.uniform(0.6, 1.0, len(df))  # example
    df['CF_Score'] = np.random.uniform(0.0, 1.0, len(df))      # example

def generate_target(df, feature_cols):
    # Weighted combination of features + some noise
    weights = np.random.uniform(0.2, 0.4, len(feature_cols))
    target = df[feature_cols].values @ weights + np.random.normal(0, 0.05, len(df))
    return target

def train_component_model(df, feature_cols, target_name):
    # Generate target if not exists
    if target_name not in df.columns:
        df[target_name] = generate_target(df, feature_cols)

    X = df[feature_cols]
    y = df[target_name]

    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train RandomForestRegressor
    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X_train_scaled, y_train)

    # Predict & evaluate
    y_pred = model.predict(X_test_scaled)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    print(f"R2 Score: {r2:.3f}, RMSE: {rmse:.3f}")

    # Return model, scaler, and r2 score
    return model, scaler, r2

# Panels
panel_features = ['TOPSIS_Score','CF_Score','Price_USD','Efficiency_%','Warranty_Years']
panel_model, panel_scaler, panel_r2 = train_component_model(df_panels, panel_features, 'Performance_Score')
joblib.dump(panel_model, 'panel_model.pkl')
joblib.dump(panel_scaler, 'panel_scaler.pkl')

# Inverters
inverter_features = ['TOPSIS_Score','CF_Score','Price_USD','Efficiency_%','Warranty_Years']
inverter_model, inverter_scaler, inverter_r2 = train_component_model(df_inverters, inverter_features, 'Performance_Score')
joblib.dump(inverter_model, 'inverter_model.pkl')
joblib.dump(inverter_scaler, 'inverter_scaler.pkl')

# Batteries
battery_features = ['TOPSIS_Score','CF_Score','Price_USD','Capacity_kWh','Warranty_Years']
battery_model, battery_scaler, battery_r2 = train_component_model(df_batteries, battery_features, 'Performance_Score')
joblib.dump(battery_model, 'battery_model.pkl')
joblib.dump(battery_scaler, 'battery_scaler.pkl')

print(f"\nAccuracy (R2 Score) for Panels: {panel_r2:.3f}")
print(f"Accuracy (R2 Score) for Inverters: {inverter_r2:.3f}")
print(f"Accuracy (R2 Score) for Batteries: {battery_r2:.3f}")

