// PUT DELETE GET 리퀘스트 추가
// 게시글 수정, 삭제, 상세 정보 조회

import express from 'express';
import Group from '../models/Group.js';
import Post from '../models/Post.js'; // 게시글 모델
import upload from '../upload.js'; // multer 설정
import asyncHandler from '../middlewares/asyncHandler.js'; // 에러 핸들링 미들웨어

const router = express.Router();
// /api/posts/:postId의 GET, PUT, DELETE 리퀘스트의 라우트

// 게시글 상세 정보 조회
// 각 게시글의 닉네임, 추억 공개 여부, 제목, 이미지, 태그, 장소, 추억의 순간(createdAt), 추억 공감수, 댓글수가 표시됨
router.get('/:postId', asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);

  try {
    // postId를 기준으로 게시글 조회, 특정 필드 제외
    const post = await Post.findOne(
      { postId }, // postId가 일치하는 게시글 조회
      { _id: 0, postPassword: 0, updatedAt: 0, __v: 0 } // 제외할 필드들을 명시
    );

    if (!post) {
      return res.status(404).send({ message: '주어진 postId를 찾을 수 없습니다.' });
    }

    const responseData = {
      id: post.postId, // postId를 id로 변경
      groupId: post.groupId,
      nickname: post.nickname,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      tags: post.tags,
      location: post.location,
      moment: post.moment,
      isPublic: post.isPublic,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
    };

    res.status(200).send(responseData);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
}));

// 게시글 수정
router.put('/:postId', asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);
  const post = await Post.findOne({ postId });

  if (!post) {
    return res.status(404).send({ message: '존재하지 않습니다' });
  }

  const { postPassword } = req.body;

  if (!postPassword) {
    return res.status(400).send({ message: '잘못된 요청입니다' });
  }

  // 해시된 비밀번호와 입력된 비밀번호 비교
  const isMatch = await post.comparePassword(postPassword);
  if (!isMatch) {
    return res.status(403).send({ message: '비밀번호가 틀렸습니다.' });
  }

  // 비밀번호는 업데이트 대상에서 제외
  Object.keys(req.body).forEach((key) => {
    if (key !== 'postPassword') {
      post[key] = req.body[key];
    }
  });

  await post.save();

  // 응답 데이터 변환
  const responseData = {
    id: post.postId, // postId를 id로 변경
    groupId: post.groupId,
    nickname: post.nickname,
    title: post.title,
    content: post.content,
    imageUrl: post.imageUrl,
    tags: post.tags,
    location: post.location,
    moment: post.moment,
    isPublic: post.isPublic,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    createdAt: post.createdAt,
  };

  res.send(responseData);
}));


// 게시글 삭제
router.delete('/:postId', asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);
  const post = await Post.findOne({ postId });

  if (!post) {
    return res.status(404).send({ message: '존재하지 않습니다' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).send({ message: '잘못된 요청입니다' });
  }

  // 비밀번호 검증
  const isMatch = await post.comparePassword(password);
  if (!isMatch) {
    return res.status(403).send({ message: '비밀번호가 틀렸습니다.' });
  }

  await Post.deleteOne({ postId });
  res.status(200).send({ message: '게시글 삭제 성공' });
}));

export default router;