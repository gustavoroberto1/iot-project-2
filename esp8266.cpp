#include <WiFi.h>              // ESP8266? use <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURE =====
const char* WIFI_SSID = "SUA_REDE";
const char* WIFI_PASS = "SUA_SENHA";
const char* MQTT_HOST = "192.168.0.10";
const uint16_t MQTT_PORT = 1883;

const char* DEVICE_MODEL = "ESP32";
const char* DEVICE_LOC   = "SALA";

// LEDs (ajuste se quiser)
const uint8_t LED1 = 2, LED2 = 4, LED3 = 5;

// ===== OBJETOS =====
WiFiClient net;
PubSubClient mqtt(net);

// ===== VARS =====
String devId, tInfo, tState, tCmd;
bool s1=false, s2=false, s3=false;

// ===== SIMPLE HELPERS =====
void setLed(uint8_t n, bool on){
  if (n==1){ s1=on; digitalWrite(LED1, on); }
  else if (n==2){ s2=on; digitalWrite(LED2, on); }
  else if (n==3){ s3=on; digitalWrite(LED3, on); }
}

void publishInfo(){
  StaticJsonDocument<256> doc;
  doc["model"]       = DEVICE_MODEL;
  doc["ip_address"]  = WiFi.localIP().toString();
  doc["mac_address"] = WiFi.macAddress();
  doc["location"]    = DEVICE_LOC;

  char buf[256];
  size_t n = serializeJson(doc, buf, sizeof(buf));
  mqtt.publish(tInfo.c_str(), buf, n, true); // retain=true
}

void publishState(){
  StaticJsonDocument<128> doc;
  doc["led1"] = s1 ? "on" : "off";
  doc["led2"] = s2 ? "on" : "off";
  doc["led3"] = s3 ? "on" : "off";

  char buf[128];
  size_t n = serializeJson(doc, buf, sizeof(buf));
  mqtt.publish(tState.c_str(), buf, n, true); // retain=true
}

// ===== CORE =====
void connectWiFi(){
  if (WiFi.status()==WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (uint8_t i=0; i<40 && WiFi.status()!=WL_CONNECTED; i++){ delay(250); }
}

void connectMQTT(){
  if (mqtt.connected() || WiFi.status()!=WL_CONNECTED) return;
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  String cid = "esp32-" + WiFi.macAddress(); cid.replace(":","");
  for (uint8_t i=0; i<10 && !mqtt.connected(); i++){
    mqtt.connect(cid.c_str());
    if (!mqtt.connected()) delay(1000);
  }
  if (mqtt.connected()){
    mqtt.subscribe(tCmd.c_str(), 1);
    publishInfo();
    publishState();
  }
}

// Payload esperado: {"target":"led1","state":"on"}
void onMqtt(char* topic, byte* payload, unsigned int len){
  StaticJsonDocument<128> doc;
  if (deserializeJson(doc, payload, len)) return;

  const char* target = doc["target"];
  const char* state  = doc["state"];
  if (!target || !state) return;

  uint8_t which = (!strcmp(target,"led1"))?1:(!strcmp(target,"led2"))?2:(!strcmp(target,"led3"))?3:0;
  if (!which) return;

  bool turnOn = !strcmp(state,"on");
  setLed(which, turnOn);
  publishState(); // confirma novo estado
}

void setup(){
  Serial.begin(115200);
  pinMode(LED1, OUTPUT); pinMode(LED2, OUTPUT); pinMode(LED3, OUTPUT);
  setLed(1,false); setLed(2,false); setLed(3,false);

  devId = WiFi.macAddress(); devId.replace(":","");
  tInfo  = "device/" + devId + "/info";
  tState = "device/" + devId + "/state";
  tCmd   = "device/" + devId + "/cmd";

  mqtt.setCallback(onMqtt);

  connectWiFi();
  connectMQTT();
}

void loop(){
  if (WiFi.status()!=WL_CONNECTED) connectWiFi();
  if (!mqtt.connected())           connectMQTT();
  mqtt.loop();

  // publica state a cada 10s (simples)
  static unsigned long last=0;
  if (mqtt.connected() && millis()-last > 10000){
    last = millis();
    publishState();
  }
}
