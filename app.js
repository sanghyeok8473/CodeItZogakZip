import express from 'express';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import cors from 'cors';
import groupRoutes from './routes/groupRoutes.js'; // 그룹 라우트 가져오기

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// 그룹 관련 라우터 사용
app.use('/groups', groupRoutes);

app.listen(process.env.PORT || 3000, () => console.log('Server Started'));
mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Connected to DB'));
