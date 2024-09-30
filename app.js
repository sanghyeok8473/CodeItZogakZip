import express from 'express';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import cors from 'cors';
import groupRoutes from './routes/groupRoutes.js';
import groupPostRoutes from './routes/groupPostRoutes.js';
import postIdRoutes from './routes/postIdRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/groups', groupRoutes); // 그룹 관련 라우터 사용
app.use('/groups/posts', groupPostRoutes); // 게시글 등록 및 조회 라우트
app.use('/posts', postIdRoutes); // postId 기반 게시글 라우트

app.listen(process.env.PORT || 3000, () => console.log('Server Started'));
mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Connected to DB'));
