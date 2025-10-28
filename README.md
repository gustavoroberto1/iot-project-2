## NO POWERSHELL (CRIA USUARIO MOSQUITTO)

```docker run --rm -it -v "$PWD/mosquitto/config:/mosquitto/config" eclipse-mosquitto:latest mosquitto_passwd -c -b /mosquitto/config/passwd aluno aluno123```