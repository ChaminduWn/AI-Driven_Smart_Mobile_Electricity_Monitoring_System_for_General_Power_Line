"""
Data Preprocessing for Household Consumption Prediction
Converts raw household data into ML-ready format
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import joblib
import re

def extract_appliances(appliance_string):
    """Extract boolean features for major appliances"""
    if pd.isna(appliance_string):
        return {}
    
    appliance_string = str(appliance_string).lower()
    
    return {
        'has_ac': int('air conditioner' in appliance_string or 'ac' in appliance_string),
        'has_tv': int('tv' in appliance_string or 'television' in appliance_string),
        'has_refrigerator': int('refrigerator' in appliance_string or 'freezer' in appliance_string),
        'has_washing_machine': int('washing machine' in appliance_string),
        'has_water_heater': int('water heater' in appliance_string or 'geyser' in appliance_string),
        'has_electric_oven': int('electric oven' in appliance_string or 'microwave' in appliance_string),
        'has_rice_cooker': int('rice cooker' in appliance_string),
        'has_iron': int('electric iron' in appliance_string or 'iron' in appliance_string),
        'has_desktop': int('desktop computer' in appliance_string or 'computer' in appliance_string),
        'has_water_pump': int('water pump' in appliance_string),
        'has_ceiling_fan': int('ceiling fan' in appliance_string),
    }


def preprocess_household_data(csv_path):
    """
    Preprocess household data for ML training
    
    Args:
        csv_path: Path to household_data.csv
        
    Returns:
        X: Feature matrix
        y: Target vector (consumption)
        feature_names: List of feature names
        encoders: Dictionary of encoders
    """
    # Load data
    df = pd.read_csv(csv_path)
    
    print(f"✅ Loaded {len(df)} household records")
    print(f"📊 Columns: {df.columns.tolist()}\n")
    
    # Rename columns for easier access
    df.columns = df.columns.str.strip()
    column_mapping = {
        'Type of House': 'house_type',
        'Total Number of People in Your Household': 'total_people',
        'Number of Males': 'num_males',
        'Number of females': 'num_females',
        'Children aged 4 to 17 year': 'num_children_4_17',
        'Preschool (Children aged 3 to 5 )': 'num_preschool',
        'Toddlers (Children below 3 years)': 'num_toddlers',
        'Elderly (Above 60 years)': 'num_elderly',
        'Monthly Electricity Consumption (Units / kWh)': 'consumption_kwh',
        'Major Electrical Appliances in Your Home': 'appliances'
    }
    
    df = df.rename(columns=column_mapping)
    
    # Extract appliance features
    print("🔧 Extracting appliance features...")
    appliance_features = df['appliances'].apply(extract_appliances)
    appliance_df = pd.DataFrame(appliance_features.tolist())
    
    # Combine with household features
    df = pd.concat([df, appliance_df], axis=1)
    
    # Create derived features
    print("🔧 Creating derived features...")
    df['total_children'] = (
        df['num_children_4_17'].fillna(0) + 
        df['num_preschool'].fillna(0) + 
        df['num_toddlers'].fillna(0)
    )
    
    df['adults'] = df['total_people'] - df['total_children']
    df['people_per_adult'] = df['total_people'] / (df['adults'] + 1)  # +1 to avoid division by zero
    
    # Count total appliances
    appliance_cols = [col for col in df.columns if col.startswith('has_')]
    df['total_appliances'] = df[appliance_cols].sum(axis=1)
    
    # Encode house type
    print("🔧 Encoding categorical features...")
    le_house = LabelEncoder()
    df['house_type_encoded'] = le_house.fit_transform(df['house_type'].fillna('Single-story house'))
    
    # Select features for model
    feature_columns = [
        # Household composition
        'total_people',
        'num_males',
        'num_females',
        'total_children',
        'num_elderly',
        'adults',
        'people_per_adult',
        
        # House type
        'house_type_encoded',
        
        # Appliances (boolean features)
        'has_ac',
        'has_tv',
        'has_refrigerator',
        'has_washing_machine',
        'has_water_heater',
        'has_electric_oven',
        'has_rice_cooker',
        'has_iron',
        'has_desktop',
        'has_water_pump',
        'has_ceiling_fan',
        'total_appliances'
    ]
    
    # Prepare X and y
    X = df[feature_columns].fillna(0)
    y = df['consumption_kwh']
    
    # Remove outliers (optional but recommended)
    print("🔧 Removing outliers...")
    Q1 = y.quantile(0.05)
    Q3 = y.quantile(0.95)
    IQR = Q3 - Q1
    outlier_mask = (y >= Q1 - 1.5 * IQR) & (y <= Q3 + 1.5 * IQR)
    
    X = X[outlier_mask]
    y = y[outlier_mask]
    
    print(f"✅ Final dataset: {len(X)} samples, {len(feature_columns)} features")
    print(f"📊 Consumption range: {y.min():.1f} - {y.max():.1f} kWh")
    print(f"📊 Mean consumption: {y.mean():.1f} kWh\n")
    
    # Save encoders
    encoders = {
        'house_type': le_house,
        'feature_names': feature_columns
    }
    
    return X, y, feature_columns, encoders


if __name__ == "__main__":
    # Test preprocessing
    X, y, features, encoders = preprocess_household_data('data/household_data.csv')
    
    print("✅ Preprocessing complete!")
    print(f"Feature names: {features}")
    print(f"\nSample data:")
    print(X.head())