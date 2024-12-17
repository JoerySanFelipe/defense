import { NewsLetter } from 'src/app/models/newsletter';

export interface INewsletterState {
  isLoading: boolean;
  newsletters: NewsLetter[];
  errors: string | null;
}
