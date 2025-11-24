import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { Observable } from 'rxjs';

@Injectable()
export class AnalystGuard implements CanActivate {


  constructor(private authService: AuthService, private _router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    if(!this.authService.getAccessToken()){
      alert("Youre not allowed")
      this._router.navigate(['/login']);
      return false;
    }else if(this.authService.hasRole("analyst")){
      this._router.navigate(['/dashboard']);
      return true;
    }

    return true;
  }

}