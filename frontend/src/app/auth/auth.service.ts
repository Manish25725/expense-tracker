import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isAuth: boolean = false;
  private token!: any;
  private expireTokenTime: any;
  private userId: any;
  private emailAddress:any;
  constructor(
    public http: HttpClient,
    public _snackBar: MatSnackBar,
    public route: Router
  ) {}

  authAfterReferesh(isAuth:boolean,token:any){
    this.isAuth=isAuth;
    this.token=token;
  }
  getToken() {
    return this.token;
  }

  getIsAuth() {
    return this.isAuth;
  }
  getUSerId(){
    return this.userId;
  }
  
  getEmail(){
    return this.emailAddress;
  }

  setEmail(email:any){
    localStorage.setItem('user_email',email);
    this.emailAddress=email;
  }

  onSignUp(values: any):Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
    let body = {
      name: values.name,
      username: values.username,
      email: values.gmail,
      password: values.password,
      categories: ['Transportation','Groceries','Entertainment','Unassigned'],
    };
    this.http.post(this.apiUrl + 'api/v1/users/register', body).subscribe(
      (res: any) => {
        if (res) {
          this._snackBar.open(
            'Expense Tracker Account Created SuccessFully',
            '',
            { duration: 4000 }
          );
          this.token = res.data.accessToken;
          this.userId = res.data.user._id;
          this.setEmail(values.gmail);
          this.isAuth = true;
          this.saveAuthDataonLocalStorage(res.data.accessToken, res.data.user._id);
          this.route.navigate(['dashboard']);
          resolve(true);
        }
      },
      (error) => {
        const errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this._snackBar.open(errorMessage, '', {
          duration: 5000,
        });
        this.isAuth = false;
        reject(error);
      }
    );
    });
  }

  onLogin(body: any): Promise<boolean>  {
    return new Promise<boolean>((resolve, reject) => {
    // Convert gmail to email for new API
    const loginBody = {
      email: body.gmail,
      password: body.password
    };
    this.http.post(this.apiUrl + 'api/v1/users/login', loginBody).subscribe(
      (res: any) => {
        this._snackBar.open(res.message, '', { duration: 3000 });
        this.token = res.data.accessToken;
        this.userId = res.data.user._id;
        this.isAuth = true;
        this.setEmail(res.data.user.email);
        this.saveAuthDataonLocalStorage(res.data.accessToken, res.data.user._id);
        this.route.navigate(['dashboard']);
        resolve(true);
      },
      (error) => {
        this._snackBar.open(error.error.message, '', { duration: 3000 });
        this.isAuth = false;
        reject(error);
      });
    });
  }

  onLogout() {
    this.token = null;
    this.isAuth = false;
    this.route.navigate(['welcome']);
    clearTimeout(this.expireTokenTime);
    sessionStorage.removeItem('LEAD_ID');
    sessionStorage.removeItem('Id');
    localStorage.removeItem('LEAD_ID');
    localStorage.removeItem('Id');
  }

  private saveAuthDataonLocalStorage(token: any, userId: any) {
    const formattedUserId = "954854384ubbbfhf9489r34r34fnnn " + userId + " id";
    sessionStorage.setItem('LEAD_ID', token);
    sessionStorage.setItem('Id', formattedUserId);
    localStorage.setItem('LEAD_ID', token);
    localStorage.setItem('Id', formattedUserId);
  }

  deleteUserAccount(){
    const token = sessionStorage.getItem('LEAD_ID') || localStorage.getItem('LEAD_ID');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    return this.http.delete(this.apiUrl+'api/v1/users/delete-account', { headers });
  }

  onGetAppVersion(){
    return this.http.get(this.apiUrl+'api/v1/users/app-version');
  }
  
  private onCollectSource(body:any){
    return this.http.post(this.apiUrl+'USER/USER_SOURCE/',body);
  }

  saveSource(email:string,action:string,source:string){
    let body={
      email:email,
      source:source,
      action:action,
      createdAt:new Date(),
    };
    this.onCollectSource(body).subscribe((res:any)=>{
      // Source tracking saved
    }),(error:any)=>{
      console.error(error);
    };
  }

  onProvideFeedback(body:any){
    return this.http.post(this.apiUrl+'USER/USER_FEEDBACK/',body)
  }

  onConfirmAccess(body:any){
    return this.http.post(this.apiUrl+'USER/CONFIRM_ACCESS/',body);
  }

  updateUserData(id:string,body:any){
    // For now, just log the update - this can be implemented if needed
    console.log('User data update requested:', id, body);
  }

}
