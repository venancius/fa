FROM mysql

WORKDIR /code
ENV MYSQL_ROOT_PASSWORD dev

COPY . .

CMD ["--default-authentication-plugin=mysql_native_password"]
