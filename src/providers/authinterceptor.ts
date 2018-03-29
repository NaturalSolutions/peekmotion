import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from "@angular/common/http";
import { Observable } from 'rxjs';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = JSON.parse(localStorage.getItem("peekmotionCurrentUser"));
    if (token && req.withCredentials !== true) {  
      const cloned = req.clone({
        headers: req.headers.set('Authorization', 'Bearer' + token)
      });
      return next.handle(cloned)
        .catch((error, caught) => {
          return this.errorHandler(error, caught);
        });
    }
    else { 
      return next.handle(req)
        .catch((error, caught) => {
          return this.errorHandler(error, caught);
        });
    }
  }
  errorHandler(error, caught) {
    return Observable.throw(error);
  }
}