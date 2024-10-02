import express from 'express';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import cors from 'cors';
import groupRoutes from './routes/groupRoutes.js';
import groupPostRoutes from './routes/groupPostRoutes.js';
import postIdRoutes from './routes/postIdRoutes.js';
import commentPostRoutes from './routes/commentPostRoutes.js';
import commentRoutes from './routes/commentRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/groups', groupRoutes); // 그룹 목록 조회, 그룹 상세 정보 조회, 등록, 수정, 삭제 관련 라우터
app.use('/groups/posts', groupPostRoutes); // 게시글 목록 조회, 게시글 등록 라우터
app.use('/posts', postIdRoutes); // postId 기반 게시글 상세 정보 조회, 수정, 삭제 라우터
app.use('/posts/comments', commentPostRoutes); // 댓글 등록, 댓글 목록 조회 라우터
app.use('/comments', commentRoutes); // 댓글 수정, 삭제 라우터

app.listen(process.env.PORT || 3000, () => console.log('Server Started'));
mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Connected to DB'));
