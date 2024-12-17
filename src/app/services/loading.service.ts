import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingState = new Map<string, BehaviorSubject<boolean>>();

  showLoading(key: string) {
    if (!this.loadingState.has(key)) {
      this.loadingState.set(key, new BehaviorSubject<boolean>(true));
    } else {
      this.loadingState.get(key)!.next(true);
    }
  }

  hideLoading(key: string) {
    if (this.loadingState.has(key)) {
      this.loadingState.get(key)!.next(false);
    }
  }

  isLoading(key: string) {
    return this.loadingState.has(key)
      ? this.loadingState.get(key)!.asObservable()
      : new BehaviorSubject<boolean>(false).asObservable();
  }
}
