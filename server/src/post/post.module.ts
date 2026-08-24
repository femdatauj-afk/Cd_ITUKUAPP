import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GroupPostService } from './group-post.service';
import { PagePostService } from './page-post.service';
import { GroupPostController } from './group-post.controller';
import { PagePostController } from './page-post.controller';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';

@Module({
  imports: [PrismaModule],
  providers: [PostService, GroupPostService, PagePostService, CommentService],
  controllers: [
    PostController,
    GroupPostController,
    PagePostController,
    CommentController,
  ],
  exports: [PostService, GroupPostService, PagePostService, CommentService],
})
export class PostModule {}
