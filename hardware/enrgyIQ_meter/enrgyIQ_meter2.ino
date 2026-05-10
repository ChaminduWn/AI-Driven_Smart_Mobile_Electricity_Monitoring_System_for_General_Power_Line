/*
 * EnergyIQ Smart Meter — Standalone Research Device
 * ===================================================
 * VERSION: No account number — works for anyone, anywhere
 * IDENTITY: Uses ESP32 MAC address (unique per chip, automatic)
 *
 * Hardware: ESP32 DevKit V1 + PZEM-004T v3.0 + DHT22 + LCD1602 I2C
 *
 * Power (NO USB after upload):
 *   5V adapter (+) → VIN pin
 *   5V adapter (-) → GND pin
 *   PZEM VCC       → same 5V line
 *   PZEM GND       → same GND
 *
 * Wiring (PZEM):
 *   PZEM TX → GPIO17
 *   PZEM RX → GPIO16
 *   Extension board Live    → PZEM AC terminal L
 *   Extension board Neutral → PZEM AC terminal N
 *   CT clamp → around Live wire only
 *
 * Wiring (LCD1602 I2C 4-pin adapter):
 *   GND (LCD) → GND (ESP32)
 *   VCC (LCD) → VIN/5V (ESP32)
 *   SDA (LCD) → GPIO21 (ESP32)
 *   SCL (LCD) → GPIO22 (ESP32)
 *
 * Wiring (DHT22):
 *   VCC  → 3.3V or 5V
 *   GND  → GND
 *   DATA → GPIO4  (with 10kΩ pull-up resistor to VCC)
 *
 * MQTT: HiveMQ public broker — free, no setup
 *
 * Libraries needed (Tools → Manage Libraries):
 *   1. PZEM-004T v3.0        by Olexa Prokopenko
 *   2. PubSubClient           by Nick O'Leary
 *   3. ArduinoJson            by Benoit Blanchon (v6 or v7)
 *   4. DHT sensor library     by Adafruit
 *   5. Adafruit Unified Sensor by Adafruit
 *   6. LiquidCrystal_I2C      by Frank de Brabander
 *
 * HOW IT WORKS:
 *   - Device boots, reads its own MAC address as unique ID
 *   - Sends readings every 5s to HiveMQ on topic: energyiq/device/{MAC}/live
 *   - LCD cycles through screens every 3s showing live data
 *   - DHT22 readings (temp/humidity) included in MQTT payload
 *   - Your backend subscribes to energyiq/device/+/live
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <PZEM004Tv30.h>
#include <ArduinoJson.h>
#include <esp_wifi.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// ══════════════════════════════════════════════
//  CHANGE ONLY THESE 2 LINES
// ══════════════════════════════════════════════
const char* WIFI_SSID = "Galaxy M22 ";
const char* WIFI_PASS = "18517Wn*";
// ══════════════════════════════════════════════

// HiveMQ public broker
const char* MQTT_HOST = "broker.hivemq.com";
const int   MQTT_PORT = 1883;

// Reading interval (ms)
#define READ_INTERVAL    5000
#define LCD_CYCLE_INTERVAL 3000   // How often LCD screen cycles (ms)

// ── DHT22 ──────────────────────────────────────
#define DHT_PIN   4               // GPIO4 (D4)
#define DHT_TYPE  DHT22
DHT dht(DHT_PIN, DHT_TYPE);

// ── LCD1602 I2C ────────────────────────────────
// Default I2C address is 0x27 — if screen is blank try 0x3F
#define LCD_I2C_ADDR  0x27
#define LCD_COLS      16
#define LCD_ROWS      2
LiquidCrystal_I2C lcd(LCD_I2C_ADDR, LCD_COLS, LCD_ROWS);

// Topic strings (built from MAC address at startup)
char DEVICE_ID[20];
char TOPIC_LIVE[80];
char TOPIC_STATUS[80];
char TOPIC_APPLIANCE[80];
char TOPIC_CMD[80];

// Hardware
PZEM004Tv30  pzem(Serial2, 17, 16);
WiFiClient   espClient;
PubSubClient mqtt(espClient);

// State
unsigned long lastReadTime      = 0;
unsigned long lastLcdTime       = 0;
unsigned long lastDhtTime       = 0;   // DHT22 needs min 2s between reads
unsigned long sessionStartTime  = 0;
float         sessionStartKwh   = -1;
String        lastAppliance     = "";
int           readCount         = 0;
int           lcdScreen         = 0;   // Which LCD screen is currently shown

// Extended research metrics
float peakPower   = 0;
float peakVoltage = 0;
float minVoltage  = 999;
float totalPfSum  = 0;
int   pfCount     = 0;

// Latest readings (for LCD access between MQTT publishes)
float lastVoltage    = 0;
float lastCurrent    = 0;
float lastPower      = 0;
float lastPF         = 0;
float lastFrequency  = 0;
float lastSessionKwh = 0;
float lastSessionCost= 0;
float lastTemp       = NAN;
float lastHumidity   = NAN;
String lastDetectedAppliance = "---";

// Forward declarations
void connectWiFi();
void connectMQTT();
void readAndPublish();
void updateLCD();
void publishApplianceChange(String from, String to, float watts);
String detectAppliance(float w);
float estimateCost(float kwh);
float computePowerQualityScore(float voltage, float pf, float freq);
float round1(float v);
float round2(float v);
float round3(float v);
void onCommand(char* topic, byte* payload, unsigned int len);
String getMacAddress();


// ─────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  // ── Init LCD ──────────────────────────────
  Wire.begin(21, 22);           // SDA=GPIO21, SCL=GPIO22
  delay(100);                   // Let I2C bus settle
  lcd.init();                   // PCF8574 chip init
  delay(50);
  lcd.begin(16, 2);             // Some library versions need both init() + begin()
  delay(50);
  lcd.backlight();
  delay(100);
  lcd.clear();
  delay(50);
  lcd.setCursor(0, 0);
  lcd.print("EnergyIQ Booting");
  lcd.setCursor(0, 1);
  lcd.print("Please wait...");

  // ── Init DHT22 ────────────────────────────
  dht.begin();
  delay(2500);                  // DHT22 mandatory warm-up before first read

  // ── Get MAC → Device ID ───────────────────
  String mac = getMacAddress();
  mac.replace(":", "");
  mac.toUpperCase();
  mac.toCharArray(DEVICE_ID, sizeof(DEVICE_ID));

  // Build MQTT topics
  snprintf(TOPIC_LIVE,      sizeof(TOPIC_LIVE),      "energyiq/device/%s/live",      DEVICE_ID);
  snprintf(TOPIC_STATUS,    sizeof(TOPIC_STATUS),    "energyiq/device/%s/status",    DEVICE_ID);
  snprintf(TOPIC_APPLIANCE, sizeof(TOPIC_APPLIANCE), "energyiq/device/%s/appliance", DEVICE_ID);
  snprintf(TOPIC_CMD,       sizeof(TOPIC_CMD),       "energyiq/device/%s/cmd",       DEVICE_ID);

  // Start PZEM
  Serial2.begin(9600, SERIAL_8N1, 17, 16);
  delay(500);

  Serial.println("\n================================");
  Serial.println("  EnergyIQ — Research Device");
  Serial.println("  Standalone Appliance Tester");
  Serial.println("================================");
  Serial.printf("Device ID : %s\n", DEVICE_ID);
  Serial.printf("WiFi      : %s\n", WIFI_SSID);
  Serial.printf("Broker    : %s:%d\n", MQTT_HOST, MQTT_PORT);
  Serial.printf("Topic     : %s\n", TOPIC_LIVE);
  Serial.println("================================\n");

  // ── WiFi + MQTT ───────────────────────────
  lcd.setCursor(0, 1);
  lcd.print("WiFi connecting.");
  connectWiFi();

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onCommand);
  mqtt.setKeepAlive(60);
  mqtt.setBufferSize(1200);      // Increased for extra DHT fields

  lcd.setCursor(0, 1);
  lcd.print("MQTT connecting.");
  connectMQTT();

  // Session start
  sessionStartTime = millis();
  delay(1000);
  float initE = pzem.energy();
  if (!isnan(initE)) {
    sessionStartKwh = initE;
    Serial.printf("Baseline energy : %.3f kWh\n", sessionStartKwh);
  }

  // Show device ID on LCD briefly
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ID:");
  lcd.print(String(DEVICE_ID).substring(0, 13));
  lcd.setCursor(0, 1);
  lcd.print("Ready!        ");
  delay(2000);

  Serial.println("\nRunning — publishing every 5s");
  Serial.println("================================\n");
}


// ─────────────────────────────────────────────
//  MAIN LOOP
// ─────────────────────────────────────────────
void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (!mqtt.connected()) connectMQTT();
  mqtt.loop();

  // Sensor read + MQTT publish
  if (millis() - lastReadTime >= READ_INTERVAL) {
    lastReadTime = millis();
    readAndPublish();
  }

  // LCD cycle (independent of MQTT interval)
  if (millis() - lastLcdTime >= LCD_CYCLE_INTERVAL) {
    lastLcdTime = millis();
    updateLCD();
  }
}


// ─────────────────────────────────────────────
//  LCD SCREEN CYCLING
//  Screen 0: Voltage / Current
//  Screen 1: Power / Power Factor
//  Screen 2: Temp / Humidity (DHT22)
//  Screen 3: Session kWh / Cost
//  Screen 4: Appliance detected
//  Screen 5: WiFi RSSI / Freq
// ─────────────────────────────────────────────
void updateLCD() {
  lcd.clear();
  switch (lcdScreen) {
    case 0:
      lcd.setCursor(0, 0);
      lcd.printf("Volt: %6.1f V   ", lastVoltage);
      lcd.setCursor(0, 1);
      lcd.printf("Curr: %6.3f A   ", lastCurrent);
      break;
    case 1:
      lcd.setCursor(0, 0);
      lcd.printf("Pwr:  %6.1f W   ", lastPower);
      lcd.setCursor(0, 1);
      lcd.printf("PF:      %5.2f  ", lastPF);
      break;
    case 2:
      lcd.setCursor(0, 0);
      if (!isnan(lastTemp))
        lcd.printf("Temp: %5.1f C   ", lastTemp);
      else
        lcd.print("Temp: --- C     ");
      lcd.setCursor(0, 1);
      if (!isnan(lastHumidity))
        lcd.printf("Humi: %5.1f %%  ", lastHumidity);
      else
        lcd.print("Humi: --- %     ");
      break;
    case 3:
      lcd.setCursor(0, 0);
      lcd.printf("Sess: %.4f kWh", lastSessionKwh);
      lcd.setCursor(0, 1);
      lcd.printf("Cost: Rs.%6.0f ", lastSessionCost);
      break;
    case 4:
      lcd.setCursor(0, 0);
      lcd.print("Appliance:      ");
      lcd.setCursor(0, 1);
      // Truncate to 16 chars
      {
        String a = lastDetectedAppliance;
        if (a.length() > 16) a = a.substring(0, 16);
        while (a.length() < 16) a += " ";
        lcd.print(a);
      }
      break;
    case 5:
      lcd.setCursor(0, 0);
      lcd.printf("Freq: %5.2f Hz  ", lastFrequency);
      lcd.setCursor(0, 1);
      lcd.printf("RSSI: %4d dBm  ", WiFi.RSSI());
      break;
  }
  lcdScreen = (lcdScreen + 1) % 6;   // Advance to next screen
}


// ─────────────────────────────────────────────
//  READ PZEM + DHT22 + PUBLISH
// ─────────────────────────────────────────────
void readAndPublish() {
  readCount++;

  // ── PZEM readings ────────────────────────
  float voltage   = pzem.voltage();
  float current   = pzem.current();
  float power     = pzem.power();
  float energy    = pzem.energy();
  float frequency = pzem.frequency();
  float pf        = pzem.pf();

  if (isnan(voltage) || voltage < 50) {
    Serial.printf("[%d] PZEM not responding — check wiring\n", readCount);

    // Still update DHT on LCD even if PZEM fails
    if (millis() - lastDhtTime >= 2500) {
      lastDhtTime = millis();
      float t = dht.readTemperature();
      float h = dht.readHumidity();
      if (!isnan(t)) lastTemp     = t;
      if (!isnan(h)) lastHumidity = h;
    }
    return;
  }

  // Safe defaults
  if (isnan(current))   current   = 0.0;
  if (isnan(power))     power     = 0.0;
  if (isnan(energy))    energy    = 0.0;
  if (isnan(frequency)) frequency = 50.0;
  if (isnan(pf))        pf        = 1.0;

  // ── DHT22 readings (min 2500ms between reads) ───────────────────────
  float temperature = NAN;
  float humidity    = NAN;
  float heatIndex   = NAN;

  if (millis() - lastDhtTime >= 2500) {
    lastDhtTime = millis();
    temperature = dht.readTemperature();
    humidity    = dht.readHumidity();

    if (!isnan(temperature) && !isnan(humidity)) {
      heatIndex = dht.computeHeatIndex(temperature, humidity, false);
      lastTemp     = temperature;
      lastHumidity = humidity;
    } else {
      // Keep last known good values on LCD, but log failure
      temperature = NAN;
      humidity    = NAN;
      Serial.println("  DHT22 read failed — retrying next cycle");
    }
  } else {
    // Use cached values between reads
    temperature = lastTemp;
    humidity    = lastHumidity;
    if (!isnan(temperature) && !isnan(humidity))
      heatIndex = dht.computeHeatIndex(temperature, humidity, false);
  }

  // ── Extended / derived measurements ──────
  float apparentPower = voltage * current;
  float reactivePower = 0.0;
  if (apparentPower > power)
    reactivePower = sqrt(sq(apparentPower) - sq(power));

  float resistance       = (current > 0.01) ? (voltage / current) : 0.0;
  float powerQualityScore = computePowerQualityScore(voltage, pf, frequency);

  if (sessionStartKwh < 0) sessionStartKwh = energy;
  float sessionKwh     = max(0.0f, energy - sessionStartKwh);
  float sessionCost    = estimateCost(sessionKwh);
  float sessionMinutes = (millis() - sessionStartTime) / 60000.0;
  float avgPower       = (sessionMinutes > 0 && sessionKwh > 0)
                          ? (sessionKwh * 60000.0 / sessionMinutes) : power;

  if (power > peakPower)     peakPower   = power;
  if (voltage > peakVoltage) peakVoltage = voltage;
  if (voltage < minVoltage)  minVoltage  = voltage;
  if (pf > 0) { totalPfSum += pf; pfCount++; }
  float avgPf = (pfCount > 0) ? (totalPfSum / pfCount) : pf;

  float voltageDeviation    = voltage - 230.0;
  float voltageDeviationPct = (voltageDeviation / 230.0) * 100.0;

  String efficiencyClass = "Unknown";
  if      (pf >= 0.95) efficiencyClass = "Excellent";
  else if (pf >= 0.85) efficiencyClass = "Good";
  else if (pf >= 0.70) efficiencyClass = "Fair";
  else                 efficiencyClass = "Poor";

  String appliance = detectAppliance(power);
  if (appliance != lastAppliance && lastAppliance != "")
    publishApplianceChange(lastAppliance, appliance, power);
  lastAppliance = appliance;

  String anomaly = "";
  if      (voltage < 207)              anomaly = "LOW_VOLTAGE:"      + String((int)voltage);
  else if (voltage > 253)              anomaly = "HIGH_VOLTAGE:"     + String((int)voltage);
  else if (pf < 0.6 && current > 0.5) anomaly = "LOW_POWER_FACTOR:" + String(pf, 2);
  else if (frequency < 49.0)          anomaly = "LOW_FREQUENCY:"    + String(frequency, 1);
  else if (frequency > 51.0)          anomaly = "HIGH_FREQUENCY:"   + String(frequency, 1);

  // Cache latest values for LCD
  lastVoltage           = voltage;
  lastCurrent           = current;
  lastPower             = power;
  lastPF                = pf;
  lastFrequency         = frequency;
  lastSessionKwh        = sessionKwh;
  lastSessionCost       = sessionCost;
  lastDetectedAppliance = appliance;

  // ── Serial output ─────────────────────────
  Serial.printf("\n[%d] ─────────────────────────────────\n", readCount);
  Serial.printf("  Voltage      : %.1f V  (dev: %+.1f%%)\n", voltage, voltageDeviationPct);
  Serial.printf("  Current      : %.3f A\n", current);
  Serial.printf("  Active Power : %.1f W\n", power);
  Serial.printf("  Apparent Pwr : %.1f VA\n", apparentPower);
  Serial.printf("  Reactive Pwr : %.1f VAR\n", reactivePower);
  Serial.printf("  Power Factor : %.2f  (%s)\n", pf, efficiencyClass.c_str());
  Serial.printf("  Frequency    : %.2f Hz\n", frequency);
  Serial.printf("  Energy       : %.3f kWh\n", energy);
  Serial.printf("  Session kWh  : %.4f kWh\n", sessionKwh);
  Serial.printf("  Session Cost : Rs. %.0f\n", sessionCost);
  Serial.printf("  Session Time : %.1f min\n", sessionMinutes);
  Serial.printf("  Peak Power   : %.1f W\n", peakPower);
  Serial.printf("  Avg Power    : %.1f W\n", avgPower);
  Serial.printf("  Avg PF       : %.2f\n", avgPf);
  Serial.printf("  Resistance   : %.1f Ω\n", resistance);
  Serial.printf("  PQ Score     : %.1f/100\n", powerQualityScore);
  Serial.printf("  Appliance    : %s\n", appliance.c_str());
  Serial.printf("  Temperature  : %.1f °C\n", isnan(temperature) ? -99 : temperature);
  Serial.printf("  Humidity     : %.1f %%\n", isnan(humidity) ? -99 : humidity);
  if (!isnan(heatIndex))
    Serial.printf("  Heat Index   : %.1f °C\n", heatIndex);
  Serial.printf("  WiFi RSSI    : %d dBm\n", WiFi.RSSI());
  if (anomaly.length() > 0)
    Serial.printf("  !! ANOMALY   : %s\n", anomaly.c_str());

  // ── Build JSON payload ────────────────────
  JsonDocument doc;

  doc["device_id"]           = DEVICE_ID;
  doc["device_ip"]           = WiFi.localIP().toString();
  doc["wifi_rssi"]           = WiFi.RSSI();
  doc["read_count"]          = readCount;
  doc["uptime_ms"]           = millis();

  // Core electrical
  doc["voltage"]             = round1(voltage);
  doc["current"]             = round3(current);
  doc["power"]               = round1(power);
  doc["energy"]              = round3(energy);
  doc["frequency"]           = round2(frequency);
  doc["power_factor"]        = round2(pf);

  // Extended / derived
  doc["apparent_power"]      = round1(apparentPower);
  doc["reactive_power"]      = round1(reactivePower);
  doc["resistance_ohm"]      = round1(resistance);
  doc["voltage_deviation"]   = round2(voltageDeviation);
  doc["voltage_dev_pct"]     = round2(voltageDeviationPct);
  doc["power_quality_score"] = round1(powerQualityScore);
  doc["efficiency_class"]    = efficiencyClass;

  // Session
  doc["session_kwh"]         = round3(sessionKwh);
  doc["session_cost_rs"]     = sessionCost;
  doc["session_minutes"]     = round1(sessionMinutes);
  doc["avg_power_w"]         = round1(avgPower);
  doc["peak_power_w"]        = round1(peakPower);
  doc["peak_voltage"]        = round1(peakVoltage);
  doc["min_voltage"]         = round1(minVoltage);
  doc["avg_power_factor"]    = round2(avgPf);

  // Detection
  doc["detected_appliance"]  = appliance;
  doc["anomaly"]             = anomaly;

  // DHT22 environmental
  if (!isnan(temperature))
    doc["temperature_c"]     = round2(temperature);
  else
    doc["temperature_c"]     = nullptr;

  if (!isnan(humidity))
    doc["humidity_pct"]      = round2(humidity);
  else
    doc["humidity_pct"]      = nullptr;

  if (!isnan(heatIndex))
    doc["heat_index_c"]      = round2(heatIndex);
  else
    doc["heat_index_c"]      = nullptr;

  char buf[1200];
  serializeJson(doc, buf);

  if (mqtt.publish(TOPIC_LIVE, buf, false))
    Serial.println("  → HiveMQ published ✓");
  else
    Serial.println("  → HiveMQ FAILED");
}


// ─────────────────────────────────────────────
//  POWER QUALITY SCORE (0-100)
// ─────────────────────────────────────────────
float computePowerQualityScore(float voltage, float pf, float freq) {
  float vDev = abs(voltage - 230.0) / 230.0 * 100.0;
  float vScore = (vDev > 10) ? max(0.0f, 100.0f - (vDev - 10) * 10) : 100.0 - vDev * 2;
  float pfScore = pf * 100.0;
  float fDev = abs(freq - 50.0);
  float fScore = max(0.0f, 100.0f - fDev * 20);
  return round1((vScore * 0.4) + (pfScore * 0.4) + (fScore * 0.2));
}


// ─────────────────────────────────────────────
//  APPLIANCE DETECTION
// ─────────────────────────────────────────────
String detectAppliance(float w) {
  if      (w < 5)    return "Standby / Off";
  else if (w < 15)   return "Phone Charger";
  else if (w < 25)   return "LED Bulb";
  else if (w < 60)   return "Fan (Low)";
  else if (w < 85)   return "Fan (High)";
  else if (w < 130)  return "Laptop";
  else if (w < 200)  return "Television";
  else if (w < 500)  return "Fan + TV";
  else if (w < 820)  return "Rice Cooker (Warm)";
  else if (w < 1000) return "Rice Cooker (Cooking)";
  else if (w < 1300) return "Microwave (Low)";
  else if (w < 1600) return "Microwave / Iron";
  else if (w < 1900) return "AC (Low)";
  else if (w < 2300) return "AC (High)";
  else if (w < 3000) return "Water Heater";
  else               return "Heavy Load";
}

void publishApplianceChange(String from, String to, float watts) {
  JsonDocument doc;
  doc["device_id"] = DEVICE_ID;
  doc["event"]     = "appliance_change";
  doc["from"]      = from;
  doc["to"]        = to;
  doc["watts"]     = round1(watts);
  doc["uptime_ms"] = millis();
  char buf[256];
  serializeJson(doc, buf);
  mqtt.publish(TOPIC_APPLIANCE, buf, false);
}


// ─────────────────────────────────────────────
//  CEB TARIFF ESTIMATE
// ─────────────────────────────────────────────
float estimateCost(float kwh) {
  if (kwh <= 0) return 0;
  float cost = 30.0, rem = kwh, s;
  s = min(rem, 30.0f); cost += s * 4.50;  rem -= s;
  s = min(rem, 30.0f); cost += s * 10.00; rem -= s;
  s = min(rem, 60.0f); cost += s * 15.00; rem -= s;
  s = min(rem, 30.0f); cost += s * 22.00; rem -= s;
  if (rem > 0) cost += rem * 28.00;
  return round(cost);
}


// ─────────────────────────────────────────────
//  ROUNDING HELPERS
// ─────────────────────────────────────────────
float round1(float v) { return round(v * 10.0)   / 10.0; }
float round2(float v) { return round(v * 100.0)  / 100.0; }
float round3(float v) { return round(v * 1000.0) / 1000.0; }


// ─────────────────────────────────────────────
//  MAC ADDRESS
// ─────────────────────────────────────────────
String getMacAddress() {
  uint8_t mac[6];
  esp_wifi_get_mac(WIFI_IF_STA, mac);
  char buf[18];
  snprintf(buf, sizeof(buf), "%02X:%02X:%02X:%02X:%02X:%02X",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(buf);
}


// ─────────────────────────────────────────────
//  INCOMING COMMANDS
// ─────────────────────────────────────────────
void onCommand(char* topic, byte* payload, unsigned int len) {
  String msg = "";
  for (unsigned int i = 0; i < len; i++) msg += (char)payload[i];
  Serial.printf("CMD: %s\n", msg.c_str());

  JsonDocument doc;
  if (deserializeJson(doc, msg) == DeserializationError::Ok) {
    const char* cmd = doc["cmd"];
    if (cmd && strcmp(cmd, "reset_energy") == 0) {
      pzem.resetEnergy();
      sessionStartKwh  = -1;
      sessionStartTime = millis();
      peakPower = 0; peakVoltage = 0; minVoltage = 999;
      totalPfSum = 0; pfCount = 0;
      Serial.println("Session reset");

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Session Reset!  ");
      lcd.setCursor(0, 1);
      lcd.print("kWh zeroed.     ");
      delay(1500);
    }
  }
}


// ─────────────────────────────────────────────
//  WIFI
// ─────────────────────────────────────────────
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("WiFi connecting: %s", WIFI_SSID);
  int t = 0;
  while (WiFi.status() != WL_CONNECTED && t < 40) {
    delay(500); Serial.print("."); t++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nWiFi OK — IP: %s\n", WiFi.localIP().toString().c_str());
    lcd.setCursor(0, 1);
    lcd.print("WiFi OK!        ");
    delay(500);
  } else {
    Serial.println("\nWiFi FAILED");
    lcd.setCursor(0, 1);
    lcd.print("WiFi FAILED!    ");
  }
}


// ─────────────────────────────────────────────
//  MQTT
// ─────────────────────────────────────────────
void connectMQTT() {
  if (mqtt.connected()) return;
  if (WiFi.status() != WL_CONNECTED) return;

  int tries = 0;
  while (!mqtt.connected() && tries < 5) {
    char cid[64];
    snprintf(cid, sizeof(cid), "energyiq-device-%s-%04X",
             DEVICE_ID, (unsigned int)(millis() & 0xFFFF));

    Serial.print("MQTT connecting...");
    if (mqtt.connect(cid)) {
      Serial.println(" OK");

      char status[200];
      snprintf(status, sizeof(status),
        "{\"status\":\"online\",\"device_id\":\"%s\",\"ip\":\"%s\"}",
        DEVICE_ID, WiFi.localIP().toString().c_str());
      mqtt.publish(TOPIC_STATUS, status, true);
      mqtt.subscribe(TOPIC_CMD);

      lcd.setCursor(0, 1);
      lcd.print("MQTT OK!        ");
      delay(500);
    } else {
      Serial.printf(" Failed rc=%d\n", mqtt.state());
      lcd.setCursor(0, 1);
      lcd.print("MQTT retry...   ");
      delay(3000); tries++;
    }
  }
}
