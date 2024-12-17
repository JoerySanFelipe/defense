import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateConverterService {
  constructor() {}
  convertTimestamp(timestamp: any) {
    const date = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    );
    return date.toLocaleDateString();
  }
}
