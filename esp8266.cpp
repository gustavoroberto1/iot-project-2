#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "iotdesi";
const char* WIFI_PASSWORD = "iotdesi2025";

const uint16_t MQTT_PORT = 1883;
const char* MQTT_SERVER = "192.168.0.2";
const char* MQTT_USER = "aluno";
const char* MQTT_PASS = "aluno123";
const char* MQTT_TOPIC_INFO = "device/ESP8266-GUSTAVO/info";
const char* MQTT_TOPIC_STATE = "device/ESP8266-GUSTAVO/state";
const char* MQTT_TOPIC_CMD = "device/ESP8266-GUSTAVO/cmd";

bool led1_state = false, led2_state = false, led3_state = false;
WiFiClient espClient;
PubSubClient mqtt(espClient);

void publishInfo() {
  Serial.printf("Enviando info topic: %s", MQTT_TOPIC_INFO);
  Serial.println();

  StaticJsonDocument<256> payload;
  payload["model"] = "ESP8266";
  payload["location"] = "LAB IOT";
  payload["ip_address"] = WiFi.localIP().toString();
  payload["mac_address"] = WiFi.macAddress();

  char buffer[256];
  size_t data = serializeJson(payload, buffer, sizeof(buffer));
  mqtt.publish(MQTT_TOPIC_INFO, buffer, data);
  Serial.println("Enviado!!");
}

void publishState() {
  Serial.printf("Enviando info topic: %s", MQTT_TOPIC_STATE);
  Serial.println();
  StaticJsonDocument<128> payload;
  payload["led1"] = led1_state ? "on" : "off";



  char buffer[128];
  size_t data = serializeJson(payload, buffer, sizeof(buffer));
  mqtt.publish(MQTT_TOPIC_STATE, buffer, data);
  Serial.println("Enviado!!");
}

void connectWifi() {
  if(WiFi.status() == WL_CONNECTED){
    return;
  }

  Serial.printf("Conectando ao Wi-Fi: %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  uint8_t tentativas = 0;
  while(WiFi.status() != WL_CONNECTED && tentativas < 20){
    delay(500);
    Serial.print(".");
    tentativas++;
  }

  if(WiFi.status() == WL_CONNECTED) {
    Serial.print("Wifi conectado! IP: ");
    Serial.print(WiFi.localIP());
  }else {
    Serial.print("Falha ao conectar no WIFI.");
  }
}

void connectMqtt() {
  if(mqtt.connected()){
    return;
  }

  Serial.print("Conectando ao MQTT..");
  while(!mqtt.connected() && WiFi.status() == WL_CONNECTED){
    String clientId = "esp8266-" + String(WiFi.macAddress());
    if(mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)){
      Serial.print("Conectado ao MQTT...");
      mqtt.subscribe(MQTT_TOPIC_CMD);
      publishInfo();
      publishState();
    }else {
      Serial.print("Tentando conectar em 3s....");
      Serial.print("\n");
      delay(3000);
    }
  }
}

// { target: "led1", state: "ON/OFF"}
void subscribeCmd(char* topic, byte* payload, unsigned int lenght) {
  StaticJsonDocument<128> document;
  if(deserializeJson(document, payload, lenght)) return;

  const char* target = document["target"];
  const char* state = document["state"];

  bool isOn = (strcasecmp(state, "on") == 0);
  if(strcmp(target, "led1") == 0){
    led1_state = isOn;
    Serial.print(isOn);
    digitalWrite(LED_BUILTIN, !isOn);
  }else if(strcmp(target, "led2") == 0){
    led2_state = isOn;
  }else if(strcmp(target, "led3") == 0){
    led3_state = isOn;
  }

  publishState();
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
  WiFi.mode(WIFI_STA);
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.setCallback(subscribeCmd);
  connectWifi();
  connectMqtt();
}

void loop() {
  if(WiFi.status() != WL_CONNECTED) connectWifi();
  if(!mqtt.connected()) connectMqtt();
  mqtt.loop();

  // static unsigned long lastUpdate = 0;
  // if(mqtt.connected() && millis() - lastUpdate > 10000){
  //   lastUpdate = millis();
  //   publishState();
  // }
}



