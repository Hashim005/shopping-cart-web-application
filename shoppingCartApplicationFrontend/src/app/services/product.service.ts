import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private http: HttpClient,
     @Inject(PLATFORM_ID)
    private platformId: Object) { }


   productCreation(postObj: any): Observable<object> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(environment.baseUrl + 'api/product/product-creation', postObj, { headers });
  }
  getProducts(): Observable<object> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.get(environment.baseUrl + 'api/product/products', { headers });
  }
   getSepecificProduct(postObj: any): Observable<object> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(environment.baseUrl + 'api/product/specif-product', postObj, { headers });
  }
  // servGetAllIssueTracker(): Observable<object>{
  //   return this.http.get(environment.apiBaseUrl + 'heads-on/issue-trackers')
  // }
// cart details
  addToCart(postObj: any): Observable<object> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(environment.baseUrl + 'api/product/cart/add', postObj, { headers });
  }
  /**
   * Fetch cart items for a user
   * Assumption: backend supports GET /api/product/cart?userId=<id>
   */
  getCart(userObj: any): Observable<object> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(environment.baseUrl + 'api/product/cart/details', userObj, { headers });
  }
  productRemoveFromCart(postObj: any): Observable<object> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(environment.baseUrl + 'api/product/cart/remove', postObj, { headers });
  }
  createOrders(postObj: any): Observable<object> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(environment.baseUrl + 'api/order/create', postObj, { headers });
  }
  searchUsersOrder(postObj: any): Observable<object> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(environment.baseUrl + 'api/order/search', postObj, { headers });
  }
  getSpecificOrderUser(postObj: any): Observable<object> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(environment.baseUrl + 'api/order/details', postObj, { headers });
  }
  updateUserOrder(postObj: any): Observable<object> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(environment.baseUrl + 'api/order/update', postObj, { headers });
  }
  removedUserOrder(postObj: any): Observable<object> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(environment.baseUrl + 'api/order/remove', postObj, { headers });
  }

}
