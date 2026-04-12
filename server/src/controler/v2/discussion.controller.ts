import { Request, Response } from 'express';
import { asyncHandler } from '../../util/asyncHandler.util.js';
import { ApiResponse } from '../../util/apiResponse.util.js';
import * as DiscussionQueries from '../../dbQueries/discussion.Queries.js';
import { cacheGet, cacheSet, cacheDel, cacheDelPattern } from '../../util/redis.util.js';

export const createDiscussion = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, authorId, authorWallet, tags } = req.body;
  
  if (!title || !content || (!authorId && !authorWallet)) {
    return res.status(400).json(new ApiResponse(400, null, 'Title, content, and either authorId or authorWallet are required'));
  }

  const discussion = await DiscussionQueries.createDiscussion({ title, content, authorId, authorWallet, tags });
  await cacheDelPattern('discussions:*');
  
  return res.status(201).json(new ApiResponse(201, discussion, 'Discussion created successfully'));
});

export const getDiscussions = asyncHandler(async (req: Request, res: Response) => {
  const { tag, search } = req.query;
  const cacheKey = `discussions:tag_${tag}:srch_${search}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(new ApiResponse(200, cached, 'Discussions fetched (cached)'));

  const discussions = await DiscussionQueries.getDiscussions({ 
    tag: tag as string, 
    search: search as string 
  });

  await cacheSet(cacheKey, discussions, 300);
  return res.json(new ApiResponse(200, discussions, 'Discussions fetched successfully'));
});

export const getDiscussionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `discussion:${id}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(new ApiResponse(200, cached, 'Discussion fetched (cached)'));

  const discussion = await DiscussionQueries.getDiscussionById(id as string);
  if (!discussion) {
    return res.status(404).json(new ApiResponse(404, null, 'Discussion not found'));
  }

  await cacheSet(cacheKey, discussion, 300);
  return res.json(new ApiResponse(200, discussion, 'Discussion fetched successfully'));
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const { discussionId, authorId, authorWallet, content } = req.body;

  if (!discussionId || (!authorId && !authorWallet) || !content) {
    return res.status(400).json(new ApiResponse(400, null, 'DiscussionId, content, and either authorId or authorWallet are required'));
  }

  const comment = await DiscussionQueries.addComment({ discussionId, authorId, authorWallet, content });
  await cacheDel(`discussion:${discussionId}`);
  
  return res.status(201).json(new ApiResponse(201, comment, 'Comment added successfully'));
});
