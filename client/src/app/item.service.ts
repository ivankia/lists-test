import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getItems(filter: string, offset: number, limit: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/items?filter=${filter}&offset=${offset}&limit=${limit}`);
  }

  getSelected(filter: string, offset: number, limit: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/selected?filter=${filter}&offset=${offset}&limit=${limit}`);
  }

  addItem(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, { id });
  }

  selectItem(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/select`, { id });
  }

  reorderItems(order: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/reorder`, { order });
  }
}