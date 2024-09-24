import express from 'express';
import Group from '../models/Group.js';
import Post from '../models/Post.js'; // 게시글 모델
import upload from '../upload.js'; // multer 설정
import asyncHandler from '../middlewares/asyncHandler.js'; // 에러 핸들링 미들웨어

const router = express.Router();
// /api/posts/:groupId/posts의 GET, POST리퀘스트의 라우트

// 게시글 목록 조회
router.get('/:groupId', asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);

  try {
    // 그룹을 찾습니다.
    const group = await Group.findOne({ groupId });

    if (!group) {
      return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
    }

    // 그룹의 posts 배열에서 postId를 가져옵니다.
    const postIds = group.posts;

    // postId들을 이용하여 필요한 필드만 가져옵니다.
    const posts = await Post.find(
      { postId: { $in: postIds } }, // postId가 그룹의 posts 배열에 포함된 것만 조회
      'postId name public title postImg tag place likes comments' // 필요한 필드만 선택
    );

    res.status(200).send(posts);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
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
      return res.status(400).send({ message: '게시글을 등록할 때에는 비밀번호가 필요합니다.' });
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