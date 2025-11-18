import cors from 'cors';
import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';

const app=express();
dotenv.config();
app.use(cors());
app.use(express.json());

const db=mysql.createPool({
    host: proccess.env.env.DB_HOST || 'localhost',
    user: proccess.env.env.DB_USER || 'root',
    password: proccess.env.env.DB_PASSWORD || '',
    database: proccess.env.env.DB_NAME ||'muvwatch',
    port: proccess.env.env.DB_PORT || '3306'
});
const port= proccess.env.env.PORT || 5000;