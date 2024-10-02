import express from 'express';
import Comment from '../models/Comment.js'; // 댓글 모델
import Post from '../models/Post.js'; // 게시글 모델
import asyncHandler from '../middlewares/asyncHandler.js'; // 에러 핸들링 미들웨어

const router = express.Router();
// /api/comments/:commentId의 PUT, DELETE리퀘스트의 라우트

// 댓글 수정
router.put('/:commentId', asyncHandler(async (req, res) => {
  const commentId = Number(req.params.commentId);
  const comment = await Comment.findOne({ commentId });

  if (!comment) {
    return res.status(404).send({ message: '존재하지 않습니다' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).send({ message: '잘못된 요청입니다' });
  }

  // 해시된 비밀번호와 입력된 비밀번호 비교
  const isMatch = await comment.comparePassword(password);
  if (!isMatch) {
    return res.status(403).send({ message: '비밀번호가 틀렸습니다.' });
  }

  // 비밀번호는 업데이트 대상에서 제외
  Object.keys(req.body).forEach((key) => {
    if (key !== 'password') {
      comment[key] = req.body[key];
    }
  });

  await comment.save();

  // 응답 데이터 변환
  const responseData = {
    id: comment.commentId, // commentId를 id로 변경
    nickname: comment.nickname,
    content: comment.content,
    createdAt: comment.createdAt,
  };

  res.send(responseData);
  }));

// 댓글 삭제
router.delete('/:commentId', asyncHandler(async (req, res) => {
  const commentId = Number(req.params.commentId);
  const comment = await Comment.findOne({ commentId });

  if (!comment) {
    return res.status(404).send({ message: '존재하지 않습니다' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).send({ message: '잘못된 요청입니다' });
  }

  // 비밀번호 검증
  const isMatch = await comment.comparePassword(password);
  if (!isMatch) {
    return res.status(403).send({ message: '비밀번호가 틀렸습니다' });
  }

  await Comment.deleteOne({ commentId });

  // 게시글에서 comments 배열 업데이트 (해당 게시글의 commentId 제거)
  const post = await Post.findOne({ comments: commentId });
  if (post) {
    post.comments = post.comments.filter((id) => id !== commentId);
    await post.save();
  }

  res.status(200).send({ message: '답글 삭제 성공' });
}));

export default router;