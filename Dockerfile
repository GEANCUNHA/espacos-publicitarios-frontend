# Etapa 1: imagem base
FROM nginx:alpine

# Etapa 2: copiar os arquivos estáticos para a pasta padrão do Nginx
COPY . /usr/share/nginx/html

# Nginx já roda na porta 80 por padrão
EXPOSE 80
