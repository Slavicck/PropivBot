require('dotenv').config();
const mysql = require('mysql');

module.exports = mysql.createConnection({
    host: process.env.DB_HOST,//Хост
    port: process.env.DB_PORT,
    user: process.env.DB_USER,//Пользователь
    password: process.env.DB_PASSWORD,//Пароль
    database: process.env.DB_NAME //Название бд
});