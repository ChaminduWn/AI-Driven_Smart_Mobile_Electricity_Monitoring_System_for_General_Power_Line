/*
 * EnergyIQ Smart Meter — Final Version
 * Hardware: ESP32 DevKit V1 + PZEM-004T v3.0
 * Broker: HiveMQ public broker (free, no install)
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <PZEM004Tv30.h>
#include <ArduinoJson.h>

// ══════════════════════════════════════════════
//  CHANGE ONLY THESE 3 LINES
// ══════════════════════════════════════════════
const char* WIFI_SSID      = "SLT_FIBER_X4YcU";
const char* WIFI_PASS      = "P772nTZC";
const char* ACCOUNT_NUMBER = "4120239802";
// ══════════════════════════════════════════════

const char* MQTT_HOST = "broker.hivemq.com";
const int   MQTT_PORT = 1883;

#define READ_INTERVAL 5000

char TOPIC_LIVE[64];
char TOPIC_STATUS[64];
char TOPIC_APPLIANCE[64];
char TOPIC_CMD[64];

// FIX 1: Swapped pins 17,16 based on confirmed working wiring
PZEM004Tv30  pzem(Serial2, 17, 16);
WiFiClient   espClient;
PubSubClient mqtt(espClient);

unsigned long lastReadTime    = 0;
float         sessionStartKwh = -1;
String        lastAppliance   = "";
int           readCount       = 0;

// Forward declarations
void connectWiFi();
void connectMQTT();
void readAndPublish();
void publishApplianceChange(String from, String to, float watts);
String detectAppliance(float w);
float estimateCost(float kwh);
float round1(float v);
float round2(float v);
float round3(float v);
void onCommand(char* topic, byte* payload, unsigned int len);

void setup() {
  Serial.begin(115200);
  delay(500);

  // FIX 1: Swapped pins to match confirmed working wiring
  Serial2.begin(9600, SERIAL_8N1, 17, 16);

  Serial.println("\n===============================");
  Serial.println("  EnergyIQ Smart Meter");
  Serial.println("  Using HiveMQ public broker");
  Serial.println("===============================");

  snprintf(TOPIC_LIVE,      sizeof(TOPIC_LIVE),      "energyiq/%s/live",      ACCOUNT_NUMBER);
  snprintf(TOPIC_STATUS,    sizeof(TOPIC_STATUS),    "energyiq/%s/status",    ACCOUNT_NUMBER);
  snprintf(TOPIC_APPLIANCE, sizeof(TOPIC_APPLIANCE), "energyiq/%s/appliance", ACCOUNT_NUMBER);
  snprintf(TOPIC_CMD,       sizeof(TOPIC_CMD),       "energyiq/%s/cmd",       ACCOUNT_NUMBER);

  Serial.printf("Account : %s\n",    ACCOUNT_NUMBER);
  Serial.printf("Topic   : %s\n",    TOPIC_LIVE);
  Serial.printf("Broker  : %s:%d\n", MQTT_HOST, MQTT_PORT);

  connectWiFi();

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onCommand);
  mqtt.setKeepAlive(60);
  mqtt.setBufferSize(512);

  connectMQTT();

  delay(1000);
  float initE = pzem.energy();
  if (!isnan(initE)) {
    sessionStartKwh = initE;
    Serial.printf("Baseline energy: %.3f kWh\n", sessionStartKwh);
  }

  Serial.println("\nRunning — sending every 5s to HiveMQ");
  Serial.println("===============================\n");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost — reconnecting...");
    connectWiFi();
  }

  if (!mqtt.connected()) {
    connectMQTT();
  }
  mqtt.loop();

  if (millis() - lastReadTime >= READ_INTERVAL) {
    lastReadTime = millis();
    readAndPublish();
  }
}

void readAndPublish() {
  readCount++;

  float voltage   = pzem.voltage();
  float current   = pzem.current();
  float power     = pzem.power();
  float energy    = pzem.energy();
  float frequency = pzem.frequency();
  float pf        = pzem.pf();

  if (isnan(voltage) || voltage < 50) {
    Serial.printf("[%d] PZEM not responding\n", readCount);
    return;
  }

  if (isnan(current))   current   = 0.0;
  if (isnan(power))     power     = 0.0;
  if (isnan(energy))    energy    = 0.0;
  if (isnan(frequency)) frequency = 50.0;
  if (isnan(pf))        pf        = 1.0;

  if (sessionStartKwh < 0) sessionStartKwh = energy;
  float sessionKwh  = max(0.0f, energy - sessionStartKwh);
  float sessionCost = estimateCost(sessionKwh);

  String appliance = detectAppliance(power);

  if (appliance != lastAppliance && lastAppliance != "") {
    publishApplianceChange(lastAppliance, appliance, power);
  }
  lastAppliance = appliance;

  String anomaly = "";
  if      (voltage < 207)              anomaly = "LOW_VOLTAGE:"      + String((int)voltage);
  else if (voltage > 253)              anomaly = "HIGH_VOLTAGE:"     + String((int)voltage);
  else if (pf < 0.6 && current > 0.5) anomaly = "LOW_POWER_FACTOR:" + String(pf, 2);

  Serial.printf("[%d] %.1fV | %.3fA | %.1fW | %.3fkWh | PF:%.2f | %s\n",
    readCount, voltage, current, power, energy, pf, appliance.c_str());
  if (anomaly.length() > 0)
    Serial.printf("  ANOMALY: %s\n", anomaly.c_str());

  // FIX 2: JsonDocument instead of StaticJsonDocument (ArduinoJson v7)
  JsonDocument doc;
  doc["account_number"]     = ACCOUNT_NUMBER;
  doc["voltage"]            = round1(voltage);
  doc["current"]            = round3(current);
  doc["power"]              = round1(power);
  doc["energy"]             = round3(energy);
  doc["frequency"]          = round1(frequency);
  doc["power_factor"]       = round2(pf);
  doc["session_kwh"]        = round3(sessionKwh);
  doc["session_cost_rs"]    = sessionCost;
  doc["detected_appliance"] = appliance;
  doc["anomaly"]            = anomaly;
  doc["read_count"]         = readCount;
  doc["uptime_ms"]          = millis();
  doc["wifi_rssi"]          = WiFi.RSSI();

  char buf[512];
  serializeJson(doc, buf);

  if (mqtt.publish(TOPIC_LIVE, buf, false)) {
    Serial.println("  → published to HiveMQ ✓");
  } else {
    Serial.println("  → publish FAILED");
  }
}

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
  JsonDocument doc; // FIX 2
  doc["account_number"] = ACCOUNT_NUMBER;
  doc["event"]          = "appliance_change";
  doc["from"]           = from;
  doc["to"]             = to;
  doc["watts"]          = round1(watts);
  doc["uptime_ms"]      = millis();

  char buf[256];
  serializeJson(doc, buf);
  mqtt.publish(TOPIC_APPLIANCE, buf, false);
  Serial.printf("  Appliance: %s → %s\n", from.c_str(), to.c_str());
}

float estimateCost(float kwh) {
  if (kwh <= 0) return 0;
  float cost = 30.0, rem = kwh, s;
  s = min(rem,30.0f); cost += s*4.50;  rem -= s;
  s = min(rem,30.0f); cost += s*10.00; rem -= s;
  s = min(rem,60.0f); cost += s*15.00; rem -= s;
  s = min(rem,30.0f); cost += s*22.00; rem -= s;
  if (rem > 0) cost += rem * 28.00;
  return round(cost);
}

float round1(float v) { return round(v * 10.0)   / 10.0; }
float round2(float v) { return round(v * 100.0)  / 100.0; }
float round3(float v) { return round(v * 1000.0) / 1000.0; }

void onCommand(char* topic, byte* payload, unsigned int len) {
  String msg = "";
  for (unsigned int i = 0; i < len; i++) msg += (char)payload[i];
  Serial.printf("CMD: %s\n", msg.c_str());

  JsonDocument doc; // FIX 2
  if (deserializeJson(doc, msg) == DeserializationError::Ok) {
    const char* cmd = doc["cmd"];
    if (cmd && strcmp(cmd, "reset_energy") == 0) {
      pzem.resetEnergy();
      sessionStartKwh = -1;
      Serial.println("Energy counter reset");
    }
  }
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.printf("Connecting to WiFi: %s", WIFI_SSID);
  int t = 0;
  while (WiFi.status() != WL_CONNECTED && t < 40) {
    delay(500); Serial.print("."); t++;
  }
  if (WiFi.status() == WL_CONNECTED)
    Serial.printf("\nWiFi OK — IP: %s\n", WiFi.localIP().toString().c_str());
  else
    Serial.println("\nWiFi FAILED — retrying in loop");
}

void connectMQTT() {
  if (mqtt.connected()) return;
  if (WiFi.status() != WL_CONNECTED) return;

  int tries = 0;
  while (!mqtt.connected() && tries < 5) {
    char cid[48];
    snprintf(cid, sizeof(cid), "energyiq-%s-%04X",
             ACCOUNT_NUMBER, (unsigned int)(millis() & 0xFFFF));

    Serial.printf("Connecting to HiveMQ...");

    if (mqtt.connect(cid)) {
      Serial.println(" Connected!");

      char status[128];
      snprintf(status, sizeof(status),
        "{\"status\":\"online\",\"account\":\"%s\"}", ACCOUNT_NUMBER);
      mqtt.publish(TOPIC_STATUS, status, true);
      mqtt.subscribe(TOPIC_CMD);
      Serial.printf("Listening on: %s\n", TOPIC_CMD);

    } else {
      Serial.printf(" Failed rc=%d — retry in 3s\n", mqtt.state());
      delay(3000);
      tries++;
    }
  }
}