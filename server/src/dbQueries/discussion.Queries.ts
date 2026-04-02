import { prisma } from '../lib/prisma.js';

export const createDiscussion = async (data: {
  title: string;
  content: string;
  authorId?: string;
  authorWallet?: string;
  tags?: string[];
}) => {
  return prisma.discussion.create({
    data: {
      title: data.title,
      content: data.content,
      authorId: data.authorId,
      authorWallet: data.authorWallet,
      tags: data.tags || [],
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          stellarWallet: true,
          role: true,
          supplierProfile: { select: { name: true, isVerified: true } }
        }
      }
    }
  });
};

export const getDiscussions = async (filters?: { tag?: string; search?: string }) => {
  const where: any = {};
  if (filters?.tag) where.tags = { has: filters.tag };
  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { content: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.discussion.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          email: true,
          stellarWallet: true,
          role: true,
          supplierProfile: { select: { name: true, isVerified: true } }
        }
      },
      _count: { select: { comments: true } }
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getDiscussionById = async (id: string) => {
  return prisma.discussion.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          stellarWallet: true,
          role: true,
          supplierProfile: { select: { name: true, isVerified: true } }
        }
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              email: true,
              stellarWallet: true,
              role: true,
              supplierProfile: { select: { name: true, isVerified: true } }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
};

export const addComment = async (data: {
  discussionId: string;
  authorId?: string;
  authorWallet?: string;
  content: string;
}) => {
  return prisma.comment.create({
    data: {
      discussionId: data.discussionId,
      authorId: data.authorId,
      authorWallet: data.authorWallet,
      content: data.content,
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          stellarWallet: true,
          role: true,
          supplierProfile: { select: { name: true, isVerified: true } }
        }
      }
    }
  });
};
