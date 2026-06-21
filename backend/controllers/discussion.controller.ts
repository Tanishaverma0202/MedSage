import { Response } from 'express';
import { AuthRequest } from '../middleware/common.middleware';
import { Discussion } from '../models/discussion.model';
import { logger } from '../services/database.service';
import crypto from 'crypto';

// ── Anonymous alias generator ─────────────────────────────────────────────────
const ADJECTIVES = [
  'Calm', 'Bold', 'Bright', 'Swift', 'Gentle', 'Brave', 'Quiet', 'Kind',
  'Wise', 'Eager', 'Lively', 'Fierce', 'Noble', 'Serene', 'Witty', 'Cheerful',
  'Radiant', 'Steady', 'Curious', 'Resilient'
];
const ANIMALS = [
  'Panda', 'Koala', 'Dolphin', 'Owl', 'Fox', 'Hawk', 'Lynx', 'Tiger',
  'Raven', 'Wolf', 'Falcon', 'Bear', 'Otter', 'Deer', 'Crane', 'Finch',
  'Puffin', 'Jaguar', 'Bison', 'Elk'
];

/**
 * Deterministically generate a consistent alias per user per day.
 * Same user gets the same alias within a day, but it changes daily.
 */
function generateAlias(userId: string): string {
  const today = new Date().toISOString().split('T')[0];
  const hash = crypto.createHash('sha256').update(userId + today).digest('hex');
  const adjIdx = parseInt(hash.slice(0, 4), 16) % ADJECTIVES.length;
  const aniIdx = parseInt(hash.slice(4, 8), 16) % ANIMALS.length;
  return `${ADJECTIVES[adjIdx]} ${ANIMALS[aniIdx]}`;
}

/**
 * One-way hash for like deduplication — never store raw userId
 */
function hashUserId(userId: string): string {
  return crypto.createHash('sha256').update(userId + 'like-salt').digest('hex').slice(0, 16);
}

// ── Controller ────────────────────────────────────────────────────────────────

export const discussionController = {

  /** GET /api/v1/discussions?category=&page=&limit= */
  getDiscussions: async (req: AuthRequest, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};
      if (category && category !== 'all') filter.category = category;

      const [discussions, total] = await Promise.all([
        Discussion.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Discussion.countDocuments(filter)
      ]);

      // Strip likedBy from response for privacy
      const cleaned = discussions.map(d => ({
        ...d,
        likedBy: undefined,
        hasLiked: req.user ? d.likedBy.includes(hashUserId(req.user.userId)) : false
      }));

      return res.json({
        success: true,
        data: {
          discussions: cleaned,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        }
      });
    } catch (error) {
      logger.error('getDiscussions error:', error);
      return res.status(500).json({ success: false, error: 'Failed to load discussions' });
    }
  },

  /** POST /api/v1/discussions */
  createDiscussion: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const { category, title, content } = req.body;
      if (!title?.trim() || !content?.trim()) {
        return res.status(400).json({ success: false, error: 'Title and content are required' });
      }

      const discussion = await Discussion.create({
        anonAlias: generateAlias(userId),
        category: category || 'general',
        title: title.trim().slice(0, 300),
        content: content.trim().slice(0, 5000)
      });

      return res.status(201).json({ success: true, data: discussion });
    } catch (error) {
      logger.error('createDiscussion error:', error);
      return res.status(500).json({ success: false, error: 'Failed to create discussion' });
    }
  },

  /** POST /api/v1/discussions/:id/like */
  likeDiscussion: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const userHash = hashUserId(userId);
      const discussion = await Discussion.findById(req.params.id);
      if (!discussion) return res.status(404).json({ success: false, error: 'Not found' });

      const alreadyLiked = discussion.likedBy.includes(userHash);
      if (alreadyLiked) {
        discussion.likedBy = discussion.likedBy.filter(h => h !== userHash);
        discussion.likes = Math.max(0, discussion.likes - 1);
      } else {
        discussion.likedBy.push(userHash);
        discussion.likes += 1;
      }
      await discussion.save();

      return res.json({ success: true, data: { likes: discussion.likes, hasLiked: !alreadyLiked } });
    } catch (error) {
      logger.error('likeDiscussion error:', error);
      return res.status(500).json({ success: false, error: 'Failed to like discussion' });
    }
  },

  /** POST /api/v1/discussions/:id/replies */
  addReply: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const { content } = req.body;
      if (!content?.trim()) {
        return res.status(400).json({ success: false, error: 'Reply content is required' });
      }

      const discussion = await Discussion.findById(req.params.id);
      if (!discussion) return res.status(404).json({ success: false, error: 'Not found' });

      discussion.replies.push({
        anonAlias: generateAlias(userId),
        content: content.trim().slice(0, 2000),
        likes: 0
      } as any);

      await discussion.save();
      return res.json({ success: true, data: discussion.replies[discussion.replies.length - 1] });
    } catch (error) {
      logger.error('addReply error:', error);
      return res.status(500).json({ success: false, error: 'Failed to add reply' });
    }
  }
};
