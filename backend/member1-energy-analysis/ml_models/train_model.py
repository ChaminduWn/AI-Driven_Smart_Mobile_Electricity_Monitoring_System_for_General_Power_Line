"""
Train Household Consumption Prediction Model
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from preprocess_data import preprocess_household_data

def train_model(X, y, feature_names):
    """
    Train and evaluate consumption prediction model
    """
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    print("=" * 70)
    print("🚀 TRAINING HOUSEHOLD CONSUMPTION PREDICTOR")
    print("=" * 70)
    print(f"\n📊 Dataset Split:")
    print(f"   Training samples: {len(X_train)}")
    print(f"   Testing samples:  {len(X_test)}")
    
    # ========== Model 1: Random Forest ==========
    print("\n" + "=" * 70)
    print("🌲 Training Random Forest Regressor")
    print("=" * 70)
    
    rf_model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_split=3,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    
    rf_model.fit(X_train, y_train)
    
    # Evaluate Random Forest
    y_pred_rf = rf_model.predict(X_test)
    
    rf_mae = mean_absolute_error(y_test, y_pred_rf)
    rf_rmse = np.sqrt(mean_squared_error(y_test, y_pred_rf))
    rf_r2 = r2_score(y_test, y_pred_rf)
    
    print(f"\n📈 Random Forest Performance:")
    print(f"   MAE:  {rf_mae:.2f} kWh")
    print(f"   RMSE: {rf_rmse:.2f} kWh")
    print(f"   R²:   {rf_r2:.3f}")
    
    # Cross-validation
    cv_scores = cross_val_score(rf_model, X, y, cv=5, scoring='r2', n_jobs=-1)
    print(f"\n🔄 5-Fold Cross-Validation:")
    print(f"   R² scores: {[f'{s:.3f}' for s in cv_scores]}")
    print(f"   Mean R²:   {cv_scores.mean():.3f} (± {cv_scores.std():.3f})")
    
    # ========== Model 2: Gradient Boosting ==========
    print("\n" + "=" * 70)
    print("📈 Training Gradient Boosting Regressor")
    print("=" * 70)
    
    gb_model = GradientBoostingRegressor(
        n_estimators=150,
        learning_rate=0.1,
        max_depth=5,
        min_samples_split=3,
        random_state=42
    )
    
    gb_model.fit(X_train, y_train)
    
    # Evaluate Gradient Boosting
    y_pred_gb = gb_model.predict(X_test)
    
    gb_mae = mean_absolute_error(y_test, y_pred_gb)
    gb_rmse = np.sqrt(mean_squared_error(y_test, y_pred_gb))
    gb_r2 = r2_score(y_test, y_pred_gb)
    
    print(f"\n📈 Gradient Boosting Performance:")
    print(f"   MAE:  {gb_mae:.2f} kWh")
    print(f"   RMSE: {gb_rmse:.2f} kWh")
    print(f"   R²:   {gb_r2:.3f}")
    
    # ========== Choose Best Model ==========
    if rf_r2 > gb_r2:
        best_model = rf_model
        best_name = "Random Forest"
        best_r2 = rf_r2
        best_mae = rf_mae
        y_pred = y_pred_rf
    else:
        best_model = gb_model
        best_name = "Gradient Boosting"
        best_r2 = gb_r2
        best_mae = gb_mae
        y_pred = y_pred_gb
    
    print("\n" + "=" * 70)
    print(f"🏆 Best Model: {best_name}")
    print("=" * 70)
    print(f"   R²:  {best_r2:.3f}")
    print(f"   MAE: {best_mae:.2f} kWh")
    
    # ========== Feature Importance ==========
    print("\n📊 Top 10 Most Important Features:")
    print("-" * 70)
    
    feature_importance = pd.DataFrame({
        'feature': feature_names,
        'importance': best_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    for idx, row in feature_importance.head(10).iterrows():
        print(f"   {row['feature']:.<30} {row['importance']:.4f}")
    
    # ========== Save Model ==========
    print("\n" + "=" * 70)
    print("💾 Saving Model")
    print("=" * 70)
    
    model_data = {
        'model': best_model,
        'model_name': best_name,
        'feature_names': feature_names,
        'metrics': {
            'r2': best_r2,
            'mae': best_mae,
            'rmse': gb_rmse if best_name == "Gradient Boosting" else rf_rmse
        },
        'feature_importance': feature_importance.to_dict('records')
    }
    
    joblib.dump(model_data, 'trained_models/consumption_predictor.pkl')
    print("   ✅ Model saved: trained_models/consumption_predictor.pkl")
    
    # ========== Prediction Examples ==========
    print("\n" + "=" * 70)
    print("🔮 Sample Predictions")
    print("=" * 70)
    
    for i in range(min(5, len(X_test))):
        actual = y_test.iloc[i]
        predicted = y_pred[i]
        error = abs(actual - predicted)
        
        print(f"\n   Sample {i+1}:")
        print(f"      Actual:    {actual:.1f} kWh")
        print(f"      Predicted: {predicted:.1f} kWh")
        print(f"      Error:     {error:.1f} kWh ({error/actual*100:.1f}%)")
    
    print("\n" + "=" * 70)
    print("✅ TRAINING COMPLETE!")
    print("=" * 70)
    
    return best_model, feature_importance


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("🏠 HOUSEHOLD CONSUMPTION PREDICTION MODEL TRAINING")
    print("=" * 70)
    
    # Load and preprocess data
    print("\n📂 Loading data...")
    X, y, feature_names, encoders = preprocess_household_data('data/household_data.csv')
    
    # Save encoders
    joblib.dump(encoders, 'trained_models/encoders.pkl')
    print("✅ Encoders saved\n")
    
    # Train model
    model, feature_importance = train_model(X, y, feature_names)
    
    print("\n🎉 All done! Model ready for deployment.\n")