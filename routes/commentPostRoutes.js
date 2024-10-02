import express from 'express';
import Post from '../models/Post.js'; // 게시글 모델
import Comment from '../models/Comment.js'; // 댓글 모델
import asyncHandler from '../middlewares/asyncHandler.js'; // 에러 핸들링 미들웨어

const router = express.Router();
// /api/posts/comments/:postId의 GET, POST리퀘스트의 라우트

// 댓글 등록
router.post('/:postId', asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);

  try {
    const post = await Post.findOne({ postId });

    if (!post) {
      return res.status(400).send({ message: '잘못된 요청입니다' });
    }

    // 댓글 ID 자동 생성
    const lastComment = await Comment.findOne().sort({ commentId: -1 });
    const nextCommentId = lastComment ? lastComment.commentId + 1 : 1;

    // 새로운 댓글 데이터 생성
    const newCommentData = {
      ...req.body,  // 요청 바디의 필드들을 모두 포함
      commentId: nextCommentId,  // 자동 증가된 postId 추가
      // createdAt: new Date(),  // 생성 시간
    };
    

    // 새 게시글 저장
    const newComment = new Comment(newCommentData);
    await newComment.save();

    // 게시글의 comments 배열에 새 게시글 추가
    post.comments.push(nextCommentId);
    await post.save();

    // 응답 데이터 포맷
    const responseData = {
      id: newComment.commentId,
      nickname: newComment.nickname,
      content: newComment.content,
      createdAt: newComment.createdAt,
    };

    res.status(200).send(responseData);
  } catch (error) {
    res.status(400).send({ message: '잘못된 요청입니다' });
  }
}));

// 댓글 목록 조회
router.get('/:postId', asyncHandler(async (req, res) => {
  const postId = Number(req.params.postId);
  const { page = 1, pageSize = 10 } = req.query;

  try {
    // 게시글을 찾습니다.
    const post = await Post.findOne({ postId });

    if (!post) {
      return res.status(400).send({ message: '잘못된 요청입니다' });
    }

    // 게시글의 comments 배열에서 commentId를 가져옵니다.
    const commentIds = post.comments;

    // 검색 및 공개 여부에 따라 필터링
    const filter = {
      commentId: { $in: commentIds },
    };

    // 총 게시글 수를 구합니다.
    const totalItemCount = await Comment.countDocuments(filter);

    // 페이지네이션 적용
    const comments = await Comment.find(filter)
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .select('commentId nickname content createdAt'); // 필요한 필드 선택

    // 응답 데이터 변환
    const responseData = comments.map(comment => ({
      id: comment.commentId, // commentId를 id로 변경
      nickname: comment.nickname,
      content: comment.content,
      createdAt: comment.createdAt,
    }));

    const totalPages = Math.ceil(totalItemCount / pageSize);

    res.status(200).send({
      currentPage: Number(page),
      totalPages,
      totalItemCount,
      data: responseData,
    });
  } catch (error) {
    res.status(400).send({ message: '잘못된 요청입니다' });
  }
}));

export default router;