import express from 'express';
import Group from '../models/Group.js';
import Post from '../models/Post.js'; // 게시글 모델
import upload from '../upload.js'; // multer 설정
import asyncHandler from '../middlewares/asyncHandler.js'; // 에러 핸들링 미들웨어

const router = express.Router();
// /api/posts/:groupId/posts의 GET, POST리퀘스트의 라우트
// post는 그룹의 내부에 있는 개념이기 때문에, Group의 코드를 그대로 사용하기에는 무리가 있음.
// 먼저, Group 스키마에 Post라는 형식을 추가하고, 여기에 넣는 개념으로 가야함.

// 게시글 목록 조회
router.get('/:groupId', asyncHandler(async (req, res) => {
  const posts = await Post.find();
  res.send(posts);
}));

// 게시글 생성
router.post('/:groupId', upload.single('postImg'), asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  
  try {
    const group = await Group.findOne({ groupId });
    if (!group) {
      return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
    }

    const lastPost = await Post.findOne().sort({ postId: -1 });
    const nextPostId = lastPost ? lastPost.postId + 1 : 1;

    // 비밀번호가 없으면 에러 반환
    if (!req.body.password) {
      return res.status(400).send({ message: 'Password is required for creating a post.' });
    }

    const newPostData = {
      ...req.body,
      postId: nextPostId,
      postImg: req.file ? req.file.location : '', // S3에서 반환된 이미지 URL
      groupId: groupId, // 해당 그룹의 ID 추가
    };
    
    // 새 게시글 생성
    const newPost = new Post(newPostData);
    await newPost.save();

    // 그룹의 posts 배열에 새 게시글 추가
    group.posts.push(nextPostId); // 다음 게시글 ID 추가
    await group.save();

    res.status(201).send(newPost);
  } catch (error) {
    res.status(500).send({ message: error.message+1 });
  }
}));

export default router;