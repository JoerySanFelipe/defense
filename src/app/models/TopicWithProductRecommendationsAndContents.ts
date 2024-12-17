import { Contents, Topic } from './Topic';
import { Products } from './products';

export interface TopicWithContents {
  topic: Topic;
  contents: Contents[];
  recommended: Products[];

  notRecommended: Products[];
}
